import { Router } from "express";
import { db } from "../db/index.js";
import { cards, deck_cards, decks } from "../db/schema.js";
import { eq, sql, inArray, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/decks
router.get("/", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  try {
    const rows = db
      .select({
        id: decks.id,
        name: decks.name,
        format: decks.format,
        description: decks.description,
        created_at: decks.created_at,
        card_count: sql<number>`COALESCE(SUM(${deck_cards.quantity}), 0)`,
      })
      .from(decks)
      .leftJoin(deck_cards, eq(deck_cards.deck_id, decks.id))
      .where(eq(decks.user_id, userId))
      .groupBy(decks.id)
      .orderBy(sql`${decks.created_at} DESC`)
      .all();

    res.json(rows.map((r) => ({ ...r, card_count: Number(r.card_count) })));
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/decks
router.post("/", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const { name, format, description } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "El nombre del deck es requerido" });
  }
  try {
    const [inserted] = db
      .insert(decks)
      .values({ user_id: userId, name: name.trim(), format: format ?? null, description: description ?? null })
      .returning()
      .all();
    res.status(201).json(inserted);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/decks/:id
router.put("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  const { name, format, description } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "El nombre del deck es requerido" });
  }
  try {
    const deck = db.select().from(decks).where(and(eq(decks.id, id), eq(decks.user_id, userId))).get();
    if (!deck) return res.status(404).json({ error: "Deck no encontrado" });

    const [updated] = db
      .update(decks)
      .set({ name: name.trim(), format: format ?? null, description: description ?? null })
      .where(eq(decks.id, id))
      .returning()
      .all();
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/decks/:id
router.delete("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  try {
    const deck = db.select().from(decks).where(and(eq(decks.id, id), eq(decks.user_id, userId))).get();
    if (!deck) return res.status(404).json({ error: "Deck no encontrado" });

    db.delete(decks).where(eq(decks.id, id)).run();
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/decks/:id/cards
router.get("/:id/cards", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  try {
    const deck = db.select().from(decks).where(and(eq(decks.id, id), eq(decks.user_id, userId))).get();
    if (!deck) return res.status(404).json({ error: "Deck no encontrado" });

    const rows = db
      .select({
        id: deck_cards.id,
        deck_id: deck_cards.deck_id,
        card_id: deck_cards.card_id,
        quantity: deck_cards.quantity,
        is_sideboard: deck_cards.is_sideboard,
        card_scryfall_id: cards.scryfall_id,
        card_name: cards.name,
        card_set_code: cards.set_code,
        card_set_name: cards.set_name,
        card_collector_number: cards.collector_number,
        card_image_uri: cards.image_uri,
        card_image_uri_small: cards.image_uri_small,
        card_quantity_owned: cards.quantity_owned,
      })
      .from(deck_cards)
      .innerJoin(cards, eq(cards.id, deck_cards.card_id))
      .where(eq(deck_cards.deck_id, id))
      .all();

    // Get ALL assignments for these cards across ALL decks (for physical location priority)
    const cardIds = rows.map((r) => r.card_id);
    const allAssignments = cardIds.length > 0
      ? db.select({
          id: deck_cards.id,
          card_id: deck_cards.card_id,
          deck_id: deck_cards.deck_id,
          deck_name: decks.name,
          quantity: deck_cards.quantity,
        })
        .from(deck_cards)
        .innerJoin(decks, eq(decks.id, deck_cards.deck_id))
        .where(inArray(deck_cards.card_id, cardIds))
        .all()
        .sort((a, b) => a.id - b.id)
      : [];

    const result = rows.map((r) => {
      const cardAssignments = allAssignments.filter((a) => a.card_id === r.card_id);
      let remaining = r.card_quantity_owned;
      const conflicts: typeof allAssignments = [];

      for (const a of cardAssignments) {
        if (a.deck_id === id) break;
        const taken = Math.min(a.quantity, remaining);
        remaining -= taken;
        if (taken > 0) conflicts.push(a);
      }

      const hasPhysical = remaining >= r.quantity;

      return {
        id: r.id,
        deck_id: r.deck_id,
        card_id: r.card_id,
        quantity: r.quantity,
        is_sideboard: r.is_sideboard,
        has_physical: hasPhysical,
        conflicts,
        card: {
          id: r.card_id,
          scryfall_id: r.card_scryfall_id,
          name: r.card_name,
          set_code: r.card_set_code,
          set_name: r.card_set_name,
          collector_number: r.card_collector_number,
          image_uri: r.card_image_uri,
          image_uri_small: r.card_image_uri_small,
          quantity_owned: r.card_quantity_owned,
        },
      };
    });

    res.json({ deck, cards: result });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
