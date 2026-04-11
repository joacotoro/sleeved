import { Router } from "express";
import { db } from "../db/index.js";
import { cards, deck_cards, decks } from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function deckBelongsToUser(deckId: number, userId: number) {
  return db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.user_id, userId))).get();
}

// POST /api/assignments
router.post("/", async (req, res) => {
  const userId = (req as AuthRequest).user.userId;
  const { deck_id, card_id, quantity, is_sideboard } = req.body;

  if (!deck_id || !card_id || !quantity) {
    return res.status(400).json({ error: "Faltan campos: deck_id, card_id, quantity" });
  }
  if (quantity < 1) {
    return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
  }

  try {
    if (!deckBelongsToUser(deck_id, userId)) {
      return res.status(404).json({ error: "Deck no encontrado" });
    }

    const existing = db
      .select()
      .from(deck_cards)
      .where(
        and(
          eq(deck_cards.deck_id, deck_id),
          eq(deck_cards.card_id, card_id),
          eq(deck_cards.is_sideboard, !!is_sideboard)
        )
      )
      .get();

    if (existing) {
      return res.status(409).json({
        error: "La carta ya está asignada en ese deck/sección. Usá PUT para editar la cantidad.",
        assignment_id: existing.id,
      });
    }

    const [inserted] = db
      .insert(deck_cards)
      .values({ deck_id, card_id, quantity, is_sideboard: !!is_sideboard })
      .returning()
      .all();

    res.status(201).json(inserted);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/assignments/:id
router.put("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  const { quantity } = req.body;

  if (quantity == null || quantity < 1) {
    return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
  }

  try {
    const existing = db.select().from(deck_cards).where(eq(deck_cards.id, id)).get();
    if (!existing) return res.status(404).json({ error: "Asignación no encontrada" });

    if (!deckBelongsToUser(existing.deck_id, userId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const [updated] = db.update(deck_cards).set({ quantity }).where(eq(deck_cards.id, id)).returning().all();
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/assignments/:id
router.delete("/:id", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  try {
    const existing = db.select().from(deck_cards).where(eq(deck_cards.id, id)).get();
    if (!existing) return res.status(404).json({ error: "Asignación no encontrada" });

    if (!deckBelongsToUser(existing.deck_id, userId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    db.delete(deck_cards).where(eq(deck_cards.id, id)).run();
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/assignments/:id/yield
// Re-inserts the assignment with a new (higher) id, giving priority to lower-id assignments
router.post("/:id/yield", async (req, res) => {
  const userId = (req as unknown as AuthRequest).user.userId;
  const id = Number(req.params.id);
  try {
    const existing = db.select().from(deck_cards).where(eq(deck_cards.id, id)).get();
    if (!existing) return res.status(404).json({ error: "Asignación no encontrada" });

    if (!deckBelongsToUser(existing.deck_id, userId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    db.delete(deck_cards).where(eq(deck_cards.id, id)).run();
    const [reinserted] = db
      .insert(deck_cards)
      .values({ deck_id: existing.deck_id, card_id: existing.card_id, quantity: existing.quantity, is_sideboard: existing.is_sideboard })
      .returning()
      .all();

    res.json({ ok: true, assignment: reinserted });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/assignments/move
router.post("/move", async (req, res) => {
  const userId = (req as AuthRequest).user.userId;
  const { from_assignment_id, to_deck_id, quantity, is_sideboard } = req.body;
  if (!from_assignment_id || !to_deck_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Faltan campos: from_assignment_id, to_deck_id, quantity" });
  }

  try {
    const from = db.select().from(deck_cards).where(eq(deck_cards.id, from_assignment_id)).get();
    if (!from) return res.status(404).json({ error: "Asignación de origen no encontrada" });

    if (!deckBelongsToUser(from.deck_id, userId) || !deckBelongsToUser(to_deck_id, userId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const toSubtract = Math.min(quantity, from.quantity);

    if (from.quantity - toSubtract <= 0) {
      db.delete(deck_cards).where(eq(deck_cards.id, from_assignment_id)).run();
    } else {
      db.update(deck_cards)
        .set({ quantity: from.quantity - toSubtract })
        .where(eq(deck_cards.id, from_assignment_id))
        .run();
    }

    const sideboardVal = !!is_sideboard;
    const existing = db.select().from(deck_cards)
      .where(and(eq(deck_cards.deck_id, to_deck_id), eq(deck_cards.card_id, from.card_id), eq(deck_cards.is_sideboard, sideboardVal)))
      .get();

    if (existing) {
      db.update(deck_cards).set({ quantity: existing.quantity + toSubtract }).where(eq(deck_cards.id, existing.id)).run();
    } else {
      db.insert(deck_cards).values({ deck_id: to_deck_id, card_id: from.card_id, quantity: toSubtract, is_sideboard: sideboardVal }).run();
    }

    res.json({ ok: true, moved: toSubtract });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
