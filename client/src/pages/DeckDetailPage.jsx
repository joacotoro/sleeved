import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import { Button } from "../components/ui/Button.jsx";
import { Input, Select } from "../components/ui/Input.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, FormatBadge } from "../components/ui/Badge.jsx";
import { AddCardModal } from "../components/decks/AddCardModal.jsx";
import { CardDetail } from "../components/cards/CardDetail.jsx";
import { LoadingScreen } from "../components/ui/Spinner.jsx";

const FORMATS = ["Standard", "Pioneer", "Modern", "Legacy", "Vintage", "Commander", "Pauper", "Draft"];

function BlockedCards({ blocked, deckId, onMoved }) {
  const [moving, setMoving] = useState(null);

  const handleMove = async (card, conflict) => {
    setMoving(`${card.scryfall_id}-${conflict.assignment_id}`);
    try {
      await api.moveAssignmentTo({
        from_assignment_id: conflict.assignment_id,
        to_deck_id: deckId,
        quantity: card.quantity_wanted,
        is_sideboard: card.is_sideboard,
      });
      onMoved(card.scryfall_id);
    } catch (e) {
      alert(e.message);
    } finally {
      setMoving(null);
    }
  };

  return (
    <div className="bg-vault-gold/5 border border-vault-gold/25 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-vault-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-sm font-cinzel text-vault-gold tracking-wide">
          {blocked.length} card{blocked.length > 1 ? "s" : ""} already in another deck
        </h3>
      </div>
      <div className="space-y-2">
        {blocked.map((card) => (
          <div key={card.scryfall_id} className="bg-vault-dark rounded-lg p-3 flex items-center gap-3 border border-vault-border">
            {card.image_uri_small && (
              <img src={card.image_uri_small} alt={card.name} className="w-8 h-11 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-vault-cream text-sm">{card.name}</p>
              <p className="text-xs text-vault-muted">×{card.quantity_wanted} · {card.is_sideboard ? "Sideboard" : "Main"}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {card.in_decks.map((conflict) => (
                <div key={conflict.assignment_id} className="flex items-center gap-2">
                  <span className="text-xs text-vault-gold">In: {conflict.deck_name}</span>
                  <Button size="sm" onClick={() => handleMove(card, conflict)}
                    disabled={moving === `${card.scryfall_id}-${conflict.assignment_id}`}>
                    {moving === `${card.scryfall_id}-${conflict.assignment_id}` ? "Moving..." : "Move here"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhysicalLocation({ dc, onMoved }) {
  const [moving, setMoving] = useState(false);

  if (dc.has_physical) {
    return <span className="text-xs text-green-400 font-medium">Here</span>;
  }

  const conflict = dc.conflicts[0];
  if (!conflict) return null;

  const handleMove = async () => {
    setMoving(true);
    try {
      await api.deleteAssignment(conflict.id);
      onMoved();
    } catch (e) {
      alert(e.message);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-vault-gold whitespace-nowrap">In: {conflict.deck_name}</span>
      <button
        onClick={handleMove}
        disabled={moving}
        className="text-xs bg-vault-gold/10 hover:bg-vault-gold/20 text-vault-gold px-2 py-0.5 rounded transition-colors whitespace-nowrap disabled:opacity-50 border border-vault-gold/20"
      >
        {moving ? "..." : "Move here"}
      </button>
    </div>
  );
}

function DeckCardRow({ dc, onRemove, onEditQty, onCardClick, onMoved }) {
  const [editMode, setEditMode] = useState(false);
  const [qty, setQty] = useState(dc.quantity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onEditQty(dc.id, Number(qty));
      setEditMode(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-vault-border hover:bg-vault-raised/30 transition-colors group">
      {/* Quantity first */}
      <td className="px-4 py-3 text-center w-20">
        {editMode ? (
          <div className="flex items-center gap-1 justify-center">
            <input
              type="number" min={1} value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-14 bg-vault-dark border border-vault-border rounded px-2 py-1 text-center text-sm text-vault-cream focus:outline-none focus:border-vault-gold"
            />
            <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button onClick={() => { setEditMode(false); setQty(dc.quantity); setError(null); }}
              className="text-vault-faint hover:text-vault-muted p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)}
            className="text-vault-cream font-medium hover:text-vault-gold transition-colors text-sm">
            ×{dc.quantity}
          </button>
        )}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </td>
      {/* Card name */}
      <td className="px-4 py-3">
        <button className="text-left" onClick={() => onCardClick(dc.card.id)}>
          <span
            onMouseEnter={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setMousePos(null)}
            className="font-medium text-vault-cream text-sm group-hover:text-vault-gold transition-colors"
          >
            {dc.card.name}
          </span>
          <p className="text-xs text-vault-faint">{dc.card.set_name}</p>
        </button>
        {mousePos && dc.card.image_uri_small && createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: Math.min(mousePos.x + 36, window.innerWidth - 300),
              top: mousePos.y - 120,
            }}
          >
            <img
              src={dc.card.image_uri ?? dc.card.image_uri_small}
              alt={dc.card.name}
              className="w-64 rounded-lg shadow-2xl border border-vault-border"
            />
          </div>,
          document.body
        )}
      </td>
      <td className="px-4 py-3">
        <PhysicalLocation dc={dc} onMoved={onMoved} />
      </td>
      <td className="px-4 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onRemove(dc.id)}
          className="text-vault-faint hover:text-red-400 p-1 transition-colors" title="Remove from deck">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function CardSection({ title, cards, onRemove, onEditQty, onCardClick, onMoved }) {
  if (cards.length === 0) return null;
  const total = cards.reduce((s, c) => s + c.quantity, 0);
  const conflictCount = cards.filter((c) => !c.has_physical).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-1">
        <h3 className="font-cinzel font-semibold text-vault-cream text-sm tracking-wide">{title}</h3>
        <Badge variant="default">{total} cards</Badge>
        {conflictCount > 0 && <Badge variant="warning">{conflictCount} in another deck</Badge>}
      </div>
      <div className="bg-vault-card border border-vault-border rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vault-border rounded-t-xl">
              <th className="px-4 py-2 text-center text-xs text-vault-muted font-cinzel tracking-widest uppercase w-20 rounded-tl-xl">Qty</th>
              <th className="px-4 py-2 text-left text-xs text-vault-muted font-cinzel tracking-widest uppercase">Card</th>
              <th className="px-4 py-2 text-left text-xs text-vault-muted font-cinzel tracking-widest uppercase">Location</th>
              <th className="px-4 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {cards.map((dc) => (
              <DeckCardRow key={dc.id} dc={dc} onRemove={onRemove}
                onEditQty={onEditQty} onCardClick={onCardClick} onMoved={onMoved} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [blocked, setBlocked] = useState(location.state?.blocked ?? []);
  const [deck, setDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const loadDeck = useCallback(() => {
    api.getDeckCards(id)
      .then(({ deck, cards }) => { setDeck(deck); setDeckCards(cards); })
      .catch(() => navigate("/decks"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(loadDeck, [loadDeck]);

  const handleRemove = async (assignmentId) => {
    if (!confirm("Remove this card from the deck?")) return;
    await api.deleteAssignment(assignmentId);
    loadDeck();
  };

  const handleEditQty = async (assignmentId, quantity) => {
    await api.updateAssignment(assignmentId, { quantity });
    loadDeck();
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) { setEditError("Name is required"); return; }
    setSaving(true);
    setEditError(null);
    try {
      await api.updateDeck(id, { name: editName, format: editFormat || null, description: editDesc || null });
      setShowEdit(false);
      loadDeck();
    } catch (e) {
      setEditError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await api.deleteDeck(id);
    navigate("/decks");
  };

  if (loading) return <LoadingScreen />;
  if (!deck) return null;

  const main = deckCards.filter((dc) => !dc.is_sideboard);
  const sideboard = deckCards.filter((dc) => dc.is_sideboard);
  const totalMain = main.reduce((s, c) => s + c.quantity, 0);

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="font-cinzel text-2xl font-semibold text-vault-cream tracking-wide">{deck.name}</h1>
            {deck.format && <FormatBadge format={deck.format} />}
          </div>
          {deck.description && (
            <p className="text-vault-muted text-sm mt-1">{deck.description}</p>
          )}
          <p className="text-xs text-vault-faint mt-1">
            {totalMain} cards in main · {sideboard.reduce((s, c) => s + c.quantity, 0)} in sideboard
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={() => {
            setEditName(deck.name);
            setEditFormat(deck.format ?? "");
            setEditDesc(deck.description ?? "");
            setShowEdit(true);
          }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Add card */}
      <Button onClick={() => setShowAdd(true)}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add card
      </Button>

      {deckCards.length === 0 ? (
        <div className="border border-vault-border border-dashed rounded-xl p-10 text-center">
          <p className="text-vault-faint font-cinzel text-sm tracking-wide">This deck has no cards yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {blocked.length > 0 && (
            <BlockedCards blocked={blocked} deckId={Number(id)}
              onMoved={(movedScryfall) => {
                setBlocked((prev) => prev.filter((b) => b.scryfall_id !== movedScryfall));
                loadDeck();
              }} />
          )}
          <CardSection title="Main Deck" cards={main} onRemove={handleRemove}
            onEditQty={handleEditQty} onCardClick={setSelectedCardId} onMoved={loadDeck} />
          <CardSection title="Sideboard" cards={sideboard} onRemove={handleRemove}
            onEditQty={handleEditQty} onCardClick={setSelectedCardId} onMoved={loadDeck} />
        </div>
      )}

      <AddCardModal open={showAdd} onClose={() => setShowAdd(false)}
        deckId={Number(id)} onAdded={loadDeck} />

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit deck">
        <div className="space-y-4">
          <Input label="Name *" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Select label="Format" value={editFormat} onChange={(e) => setEditFormat(e.target.value)}>
            <option value="">No format</option>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Input label="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          {editError && <p className="text-red-400 text-sm">{editError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete deck" size="sm">
        <div className="space-y-4">
          <p className="text-vault-muted text-sm">
            Are you sure you want to delete{" "}
            <strong className="text-vault-cream">"{deck.name}"</strong>?{" "}
            All card assignments will be released.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete deck</Button>
          </div>
        </div>
      </Modal>
    </div>
    <CardDetail cardId={selectedCardId} onClose={() => setSelectedCardId(null)} onUpdated={loadDeck} />
    </>
  );
}
