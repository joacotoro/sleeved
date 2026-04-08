import { useState } from "react";
import { Badge } from "../ui/Badge.jsx";
import { api } from "../../api/client.js";

export function CardRow({ card, onClick, selected, onToggle, onUpdated }) {
  const isFree = card.quantity_free > 0;
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(String(card.quantity_owned));
  const [saving, setSaving] = useState(false);

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
      className={`border-b border-gray-800 transition-colors ${
        selected ? "bg-amber-500/10" : "hover:bg-gray-800/50"
      }`}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 accent-amber-500 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={onClick}>
        {card.image_uri_small ? (
          <img
            src={card.image_uri_small}
            alt={card.name}
            className="w-8 h-11 object-cover rounded shadow"
          />
        ) : (
          <div className="w-8 h-11 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-gray-500 text-xs">MTG</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={onClick}>
        <p className="font-medium text-gray-100 text-sm">{card.name}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {card.set_name ?? card.set_code ?? "—"}
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
              className="w-14 bg-gray-700 border border-amber-500 rounded px-1.5 py-0.5 text-center text-sm text-gray-100 focus:outline-none"
            />
            <button
              onClick={handleQtySave}
              disabled={saving}
              className="text-green-400 hover:text-green-300"
              title="Save"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingQty(false); }}
              className="text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleQtyClick}
            className="text-gray-100 font-medium hover:text-amber-400 transition-colors tabular-nums"
            title="Click to edit"
          >
            {card.quantity_owned}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-gray-300">{card.quantity_assigned}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`font-medium ${isFree ? "text-green-400" : "text-red-400"}`}>
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
