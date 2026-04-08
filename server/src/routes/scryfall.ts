import { Router } from "express";
import type { ScryfallCard } from "../../../shared/types.js";

const router = Router();

const SCRYFALL_BASE = "https://api.scryfall.com";
const USER_AGENT = "MTGTracker/1.0";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DELAY_MS = 100; // max 10 req/s

const searchCache = new Map<string, { data: unknown; ts: number }>();

let lastRequestTime = 0;

async function scryfallFetch(url: string): Promise<unknown> {
  // Rate limiting
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { details?: string };
    throw new Error(err.details ?? `Scryfall error ${res.status}`);
  }

  return res.json();
}

function normalizeScryfallCard(raw: ScryfallCard) {
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

// GET /api/scryfall/search?q=
router.get("/search", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q || q.length < 2) {
    return res.json({ data: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const url = `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=name`;
    const raw = (await scryfallFetch(url)) as { data: ScryfallCard[] };
    const data = raw.data.map(normalizeScryfallCard);
    const result = { data };
    searchCache.set(cacheKey, { data: result, ts: Date.now() });
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    // Scryfall returns 404 when no results found
    if (message.includes("No cards found") || message.includes("404")) {
      return res.json({ data: [] });
    }
    return res.status(502).json({ error: message });
  }
});

// GET /api/scryfall/card/:id
router.get("/card/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const url = `${SCRYFALL_BASE}/cards/${id}`;
    const raw = (await scryfallFetch(url)) as ScryfallCard;
    return res.json(normalizeScryfallCard(raw));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return res.status(502).json({ error: message });
  }
});

// GET /api/scryfall/named?name=
router.get("/named", async (req, res) => {
  const name = (req.query.name as string | undefined)?.trim();
  if (!name) {
    return res.status(400).json({ error: "Se requiere el parámetro name" });
  }

  try {
    const url = `${SCRYFALL_BASE}/cards/named?exact=${encodeURIComponent(name)}`;
    const raw = (await scryfallFetch(url)) as ScryfallCard;
    return res.json(normalizeScryfallCard(raw));
  } catch {
    // Try fuzzy search
    try {
      const url = `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`;
      const raw = (await scryfallFetch(url)) as ScryfallCard;
      return res.json(normalizeScryfallCard(raw));
    } catch (err2: unknown) {
      const message = err2 instanceof Error ? err2.message : "Error desconocido";
      return res.status(404).json({ error: `Carta no encontrada: ${name}. ${message}` });
    }
  }
});

export default router;
