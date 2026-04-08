import { Router } from "express";
import { db } from "../db/index.js";
import { cards, deck_cards, decks } from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/cards
router.get("/", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  try {
    const rows = db
      .select({
        id: cards.id,
        scryfall_id: cards.scryfall_id,
        name: cards.name,
        set_code: cards.set_code,
        set_name: cards.set_name,
        collector_number: cards.collector_number,
        image_uri: cards.image_uri,
        image_uri_small: cards.image_uri_small,
        quantity_owned: cards.quantity_owned,
        created_at: cards.created_at,
        quantity_assigned: sql<number>`COALESCE(SUM(${deck_cards.quantity}), 0)`,
        deck_count: sql<number>`COUNT(DISTINCT ${deck_cards.deck_id})`,
      })
      .from(cards)
      .leftJoin(deck_cards, eq(deck_cards.card_id, cards.id))
      .where(eq(cards.user_id, userId))
      .groupBy(cards.id)
      .all();

    const result = rows.map((r) => ({
      ...r,
      quantity_assigned: Number(r.quantity_assigned),
      deck_count: Number(r.deck_count),
      quantity_free: r.quantity_owned - Number(r.quantity_assigned),
    }));

    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/cards
router.post("/", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const { scryfall_id, name, set_code, set_name, collector_number, image_uri, image_uri_small, quantity_owned } =
    req.body;

  if (!scryfall_id || !name || quantity_owned == null) {
    return res.status(400).json({ error: "Faltan campos requeridos: scryfall_id, name, quantity_owned" });
  }

  if (quantity_owned < 1) {
    return res.status(400).json({ error: "quantity_owned debe ser al menos 1" });
  }

  try {
    const existing = db.select().from(cards)
      .where(and(eq(cards.scryfall_id, scryfall_id), eq(cards.user_id, userId)))
      .get();
    if (existing) {
      return res.status(409).json({ error: "La carta ya existe en el sistema", card: existing });
    }

    const [inserted] = db
      .insert(cards)
      .values({ user_id: userId, scryfall_id, name, set_code, set_name, collector_number, image_uri, image_uri_small, quantity_owned })
      .returning()
      .all();

    res.status(201).json(inserted);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/cards/:id
router.put("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  const { quantity_owned } = req.body;

  if (quantity_owned == null || quantity_owned < 0) {
    return res.status(400).json({ error: "quantity_owned inválido" });
  }

  try {
    const card = db.select().from(cards).where(and(eq(cards.id, id), eq(cards.user_id, userId))).get();
    if (!card) return res.status(404).json({ error: "Carta no encontrada" });

    const assignedRow = db
      .select({ total: sql<number>`COALESCE(SUM(${deck_cards.quantity}), 0)` })
      .from(deck_cards)
      .where(eq(deck_cards.card_id, id))
      .get();

    const assigned = Number(assignedRow?.total ?? 0);
    if (assigned > quantity_owned) {
      return res.status(400).json({
        error: `No podés reducir a ${quantity_owned}: ya tenés ${assigned} copias asignadas a decks.`,
      });
    }

    const [updated] = db.update(cards).set({ quantity_owned }).where(eq(cards.id, id)).returning().all();
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/cards/:id
router.delete("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);

  try {
    const card = db.select().from(cards).where(and(eq(cards.id, id), eq(cards.user_id, userId))).get();
    if (!card) return res.status(404).json({ error: "Carta no encontrada" });

    const assignment = db.select().from(deck_cards).where(eq(deck_cards.card_id, id)).get();
    if (assignment) {
      return res.status(400).json({ error: "No se puede eliminar: la carta está asignada a uno o más decks." });
    }

    db.delete(cards).where(eq(cards.id, id)).run();
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/cards/:id/decks
router.get("/:id/decks", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);

  try {
    const card = db.select().from(cards).where(and(eq(cards.id, id), eq(cards.user_id, userId))).get();
    if (!card) return res.status(404).json({ error: "Carta no encontrada" });

    const rows = db
      .select({
        deck_card_id: deck_cards.id,
        deck_id: decks.id,
        deck_name: decks.name,
        format: decks.format,
        quantity: deck_cards.quantity,
        is_sideboard: deck_cards.is_sideboard,
      })
      .from(deck_cards)
      .innerJoin(decks, eq(decks.id, deck_cards.deck_id))
      .where(eq(deck_cards.card_id, id))
      .all();

    const totalAssigned = rows.reduce((s, r) => s + r.quantity, 0);
    res.json({
      card,
      quantity_assigned: totalAssigned,
      quantity_free: card.quantity_owned - totalAssigned,
      decks: rows,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
