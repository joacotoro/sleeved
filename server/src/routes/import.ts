import { Router } from "express";
import { db } from "../db/index.js";
import { cards, deck_cards, decks } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import type { ImportLine } from "../../../shared/types.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const SCRYFALL_BASE = "https://api.scryfall.com";
const USER_AGENT = "MTGTracker/1.0";
const COLLECTION_BATCH = 75;

type ScryfallData = {
  scryfall_id: string;
  name: string;
  set_code: string | null;
  set_name: string | null;
  collector_number: string | null;
  image_uri: string | null;
  image_uri_small: string | null;
};

type ScryfallRaw = {
  id: string; name: string; set: string; set_name: string; collector_number: string;
  image_uris?: { normal: string; small: string };
  card_faces?: Array<{ image_uris?: { normal: string; small: string } }>;
};

function parseScryfallCard(raw: ScryfallRaw): ScryfallData {
  const imageUris = raw.image_uris ?? raw.card_faces?.[0]?.image_uris;
  return {
    scryfall_id: raw.id,
    name: raw.name,
    set_code: raw.set,
    set_name: raw.set_name,
    collector_number: raw.collector_number,
    image_uri: imageUris?.normal ?? null,
    image_uri_small: imageUris?.small ?? null,
  };
}

async function resolveCardNames(names: string[]): Promise<{
  found: Map<string, ScryfallData>;
  notFound: string[];
}> {
  const uniqueNames = [...new Set(names)];
  const found = new Map<string, ScryfallData>();
  const notFound: string[] = [];

  for (let i = 0; i < uniqueNames.length; i += COLLECTION_BATCH) {
    const batch = uniqueNames.slice(i, i + COLLECTION_BATCH);
    const res = await fetch(`${SCRYFALL_BASE}/cards/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    });

    if (!res.ok) {
      batch.forEach((n) => notFound.push(n));
      continue;
    }

    const body = (await res.json()) as { data: ScryfallRaw[]; not_found: Array<{ name: string }> };
    for (const raw of body.data) found.set(raw.name.toLowerCase(), parseScryfallCard(raw));
    for (const nf of body.not_found ?? []) notFound.push(nf.name);

    if (i + COLLECTION_BATCH < uniqueNames.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { found, notFound };
}

function parseDeckList(text: string): ImportLine[] {
  const lines = text.split("\n");
  const result: ImportLine[] = [];
  let isSideboard = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\/\/\s*sideboard/i.test(line) || /^sideboard$/i.test(line)) { isSideboard = true; continue; }
    if (line.startsWith("//")) continue;
    const match = line.match(/^(\d+)\s*x?\s+(.+)$/i);
    if (match) {
      result.push({ quantity: parseInt(match[1], 10), name: match[2].trim(), is_sideboard: isSideboard });
    }
  }
  return result;
}

type ResolvedLine = ImportLine & { scryfall_data: ScryfallData };

type BlockedCard = {
  scryfall_id: string;
  name: string;
  image_uri_small: string | null;
  quantity_wanted: number;
  is_sideboard: boolean;
  in_decks: Array<{ assignment_id: number; deck_id: number; deck_name: string; quantity: number }>;
};

function createDeckAndAssignments(
  userId: number,
  name: string,
  format: string | null,
  description: string | null,
  resolved: ResolvedLine[],
  quantities: Record<string, number>,
  newCardsNeeded: ScryfallData[]
) {
  const errors: string[] = [];
  const blocked: BlockedCard[] = [];

  // Insert new cards
  for (const nc of newCardsNeeded) {
    const qty = quantities[nc.scryfall_id];
    if (!qty || qty < 1) { errors.push(`Falta la cantidad owned para: ${nc.name}`); continue; }
    const existing = db.select().from(cards)
      .where(and(eq(cards.scryfall_id, nc.scryfall_id), eq(cards.user_id, userId)))
      .get();
    if (!existing) {
      db.insert(cards).values({
        user_id: userId,
        scryfall_id: nc.scryfall_id, name: nc.name, set_code: nc.set_code,
        set_name: nc.set_name, collector_number: nc.collector_number,
        image_uri: nc.image_uri, image_uri_small: nc.image_uri_small, quantity_owned: qty,
      }).run();
    }
  }

  // Create deck
  const [deck] = db.insert(decks).values({ user_id: userId, name: name.trim(), format, description }).returning().all();

  // Aggregate by scryfall_id + sideboard
  const aggregated = new Map<string, { scryfall_id: string; quantity: number; is_sideboard: boolean; scryfall_data: ScryfallData }>();
  for (const r of resolved) {
    const key = `${r.scryfall_data.scryfall_id}:${r.is_sideboard}`;
    const existing = aggregated.get(key);
    if (existing) existing.quantity += r.quantity;
    else aggregated.set(key, { scryfall_id: r.scryfall_data.scryfall_id, quantity: r.quantity, is_sideboard: r.is_sideboard, scryfall_data: r.scryfall_data });
  }

  for (const entry of aggregated.values()) {
    const card = db.select().from(cards)
      .where(and(eq(cards.scryfall_id, entry.scryfall_id), eq(cards.user_id, userId)))
      .get();
    if (!card) { errors.push(`No se pudo encontrar en DB: ${entry.scryfall_id}`); continue; }

    db.insert(deck_cards).values({
      deck_id: deck.id, card_id: card.id,
      quantity: entry.quantity, is_sideboard: !!entry.is_sideboard,
    }).run();
  }

  return { deck, errors, blocked };
}

// POST /api/decks/import
router.post("/", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const { name, format, description, deck_list, quantities, resolved_cards } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "El nombre del deck es requerido" });
  if (!deck_list?.trim()) return res.status(400).json({ error: "La lista de cartas es requerida" });

  const lines = parseDeckList(deck_list);
  if (lines.length === 0) return res.status(400).json({ error: "No se encontraron cartas en la lista" });

  // SECOND PASS: use cached resolved_cards, no Scryfall calls
  if (quantities != null && resolved_cards != null) {
    const resolvedMap = new Map<string, ScryfallData>(
      (resolved_cards as ScryfallData[]).map((c) => [c.name.toLowerCase(), c])
    );
    const resolved: ResolvedLine[] = [];
    for (const line of lines) {
      const sd = resolvedMap.get(line.name.toLowerCase());
      if (sd) resolved.push({ ...line, scryfall_data: sd });
    }
    const newCardsNeeded = (resolved_cards as ScryfallData[]).filter(
      (c) => !db.select().from(cards).where(and(eq(cards.scryfall_id, c.scryfall_id), eq(cards.user_id, userId))).get()
    );
    const { deck, errors, blocked } = createDeckAndAssignments(
      userId, name, format ?? null, description ?? null, resolved, quantities, newCardsNeeded
    );
    return res.status(201).json({ status: "ok", deck, errors, blocked });
  }

  // FIRST PASS: resolve via Scryfall
  const errors: string[] = [];
  const resolved: ResolvedLine[] = [];

  const { found, notFound } = await resolveCardNames(lines.map((l) => l.name));
  for (const name_ of notFound) errors.push(`Carta no encontrada en Scryfall: "${name_}"`);
  for (const line of lines) {
    const sd = found.get(line.name.toLowerCase());
    if (sd) resolved.push({ ...line, scryfall_data: sd });
  }

  if (resolved.length === 0) return res.status(400).json({ error: "Ninguna carta pudo resolverse", errors });

  // Find new cards (not yet in this user's collection)
  const newCardsNeeded: Array<ScryfallData & { quantity_in_deck: number }> = [];
  for (const r of resolved) {
    const existing = db.select().from(cards)
      .where(and(eq(cards.scryfall_id, r.scryfall_data.scryfall_id), eq(cards.user_id, userId)))
      .get();
    if (!existing) {
      const already = newCardsNeeded.find((c) => c.scryfall_id === r.scryfall_data.scryfall_id);
      if (already) already.quantity_in_deck += r.quantity;
      else newCardsNeeded.push({ ...r.scryfall_data, quantity_in_deck: r.quantity });
    }
  }

  if (newCardsNeeded.length > 0) {
    return res.status(200).json({
      status: "needs_quantities",
      new_cards: newCardsNeeded,
      resolved_cards: resolved.map((r) => r.scryfall_data),
      errors,
    });
  }

  // All cards in DB already — create directly
  const { deck, errors: assignErrors, blocked } = createDeckAndAssignments(
    userId, name, format ?? null, description ?? null, resolved, {}, []
  );
  return res.status(201).json({ status: "ok", deck, errors: [...errors, ...assignErrors], blocked });
});

export default router;
