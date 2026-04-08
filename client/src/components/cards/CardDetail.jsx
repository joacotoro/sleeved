import { useState, useEffect } from "react";
import { api } from "../../api/client.js";
import { Modal } from "../ui/Modal.jsx";
import { Badge, FormatBadge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { LoadingScreen } from "../ui/Spinner.jsx";
import { useNavigate } from "react-router-dom";

export function CardDetail({ cardId, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    api
      .getCardDecks(cardId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cardId]);

  const handleSaveQty = async () => {
    const qty = parseInt(newQty, 10);
    if (!qty || qty < 1) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCard(cardId, { quantity_owned: qty });
      const refreshed = await api.getCardDecks(cardId);
      setData(refreshed);
      setEditMode(false);
      onUpdated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!cardId} onClose={onClose} title="Card details" size="lg">
      {loading && <LoadingScreen />}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="space-y-5">
          <div className="flex gap-4">
            {data.card.image_uri ? (
              <img
                src={data.card.image_uri}
                alt={data.card.name}
                className="w-36 rounded-xl shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-36 h-48 bg-vault-raised rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-vault-faint text-sm">No image</span>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-vault-cream">{data.card.name}</h3>
              <p className="text-sm text-vault-muted">
                {data.card.set_name} · #{data.card.collector_number}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-xs text-vault-faint uppercase tracking-wide">Owned</p>
                  {editMode ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={1}
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        className="w-20"
                      />
                      <Button size="sm" onClick={handleSaveQty} disabled={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-vault-gold">{data.card.quantity_owned}</p>
                      <button
                        onClick={() => { setEditMode(true); setNewQty(String(data.card.quantity_owned)); }}
                        className="text-vault-faint hover:text-vault-muted transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-vault-faint uppercase tracking-wide">Assigned</p>
                  <p className="text-2xl font-bold text-vault-cream">{data.quantity_assigned}</p>
                </div>
                <div>
                  <p className="text-xs text-vault-faint uppercase tracking-wide">Free</p>
                  <p className={`text-2xl font-bold ${data.quantity_free > 0 ? "text-vault-gold" : "text-red-400"}`}>
                    {data.quantity_free}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-vault-muted uppercase tracking-wide mb-3">
              En {data.decks.length} {data.decks.length === 1 ? "deck" : "decks"}
            </h4>
            {data.decks.length === 0 ? (
              <p className="text-vault-faint text-sm">This card is not assigned to any deck.</p>
            ) : (
              <ul className="space-y-2">
                {data.decks.map((d) => (
                  <li
                    key={d.deck_card_id}
                    className="flex items-center justify-between bg-vault-raised rounded-lg px-4 py-3 cursor-pointer hover:bg-vault-card transition-colors"
                    onClick={() => { onClose(); navigate(`/decks/${d.deck_id}`); }}
                  >
                    <div>
                      <p className="font-medium text-vault-cream">{d.deck_name}</p>
                      <p className="text-xs text-vault-faint">
                        {d.is_sideboard ? "Sideboard" : "Main deck"} · {d.format ?? "No format"}
                      </p>
                    </div>
                    <Badge variant="info">×{d.quantity}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
