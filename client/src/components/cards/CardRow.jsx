import { useState } from "react";
import { Badge } from "../ui/Badge.jsx";
import { api } from "../../api/client.js";

const supportsHover = window.matchMedia("(hover: hover)").matches;

export function CardRow({ card, onClick, selected, onToggle, onUpdated }) {
  const isFree = card.quantity_free > 0;
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(String(card.quantity_owned));
  const [saving, setSaving] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  const handleQtyClick = (e) => {
    e.stopPropagation();
    setQtyValue(String(card.quantity_owned));
    setEditingQty(true);
  };

  const handleQtySave = async (e) => {
    e.stopPropagation();
    const qty = parseInt(qtyValue, 10);
    if (!qty || qty < 1 || qty === card.quantity_owned) {
      setEditingQty(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateCard(card.id, { quantity_owned: qty });
      onUpdated?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
      setEditingQty(false);
    }
  };

  const handleQtyKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") handleQtySave(e);
    if (e.key === "Escape") setEditingQty(false);
  };

  return (
    <tr
      className={`group border-b border-vault-border transition-colors ${
        selected ? "bg-vault-gold/10" : "hover:bg-vault-raised/50"
      }`}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 accent-vault-gold cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={onClick}>
        <span
          onMouseEnter={supportsHover ? (e) => setMousePos({ x: e.clientX, y: e.clientY }) : undefined}
          onMouseMove={supportsHover ? (e) => setMousePos({ x: e.clientX, y: e.clientY }) : undefined}
          onMouseLeave={supportsHover ? () => setMousePos(null) : undefined}
          className="font-medium text-vault-cream text-sm group-hover:text-vault-gold transition-colors"
        >
          {card.name}
        </span>
        <p className="text-xs text-vault-faint">{card.set_name ?? card.set_code ?? "—"}</p>
        {mousePos && card.image_uri_small && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: Math.min(mousePos.x + 36, window.innerWidth - 300),
              top: mousePos.y - 120,
            }}
          >
            <img
              src={card.image_uri ?? card.image_uri_small}
              alt={card.name}
              className="w-64 rounded-lg shadow-2xl border border-vault-border"
            />
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        {editingQty ? (
          <div className="flex items-center justify-center gap-1">
            <input
              autoFocus
              type="number"
              min={card.quantity_assigned || 1}
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              onKeyDown={handleQtyKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-14 bg-vault-dark border border-vault-gold rounded px-1.5 py-0.5 text-center text-sm text-vault-cream focus:outline-none"
            />
            <button
              onClick={handleQtySave}
              disabled={saving}
              className="text-vault-gold hover:text-vault-gold-light"
              title="Save"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingQty(false); }}
              className="text-vault-faint hover:text-vault-muted"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleQtyClick}
            className="text-vault-cream font-medium hover:text-vault-gold transition-colors tabular-nums"
            title="Click to edit"
          >
            {card.quantity_owned}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-vault-muted">{card.quantity_assigned}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`font-medium ${isFree ? "text-vault-gold" : "text-vault-faint"}`}>
          {card.quantity_free}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant={card.deck_count > 0 ? "info" : "default"}>
          {card.deck_count} {card.deck_count === 1 ? "deck" : "decks"}
        </Badge>
      </td>
    </tr>
  );
}
