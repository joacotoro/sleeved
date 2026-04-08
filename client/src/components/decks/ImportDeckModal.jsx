import { useState } from "react";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input, Select, Textarea } from "../ui/Input.jsx";
import { api } from "../../api/client.js";
import { useNavigate } from "react-router-dom";

const FORMATS = ["Standard", "Pioneer", "Modern", "Legacy", "Vintage", "Commander", "Pauper", "Draft"];

export function ImportDeckModal({ open, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = form, 2 = quantities
  const [deckName, setDeckName] = useState("");
  const [format, setFormat] = useState("");
  const [description, setDescription] = useState("");
  const [deckList, setDeckList] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newCards, setNewCards] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [pendingPayload, setPendingPayload] = useState(null);
  const [resolvedCards, setResolvedCards] = useState(null);

  const handleImport = async () => {
    if (!deckName.trim()) {
      setError("Deck name is required");
      return;
    }
    if (!deckList.trim()) {
      setError("Card list is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = { name: deckName, format: format || null, description: description || null, deck_list: deckList };
      const result = await api.importDeck(payload);

      if (result.status === "needs_quantities") {
        setNewCards(result.new_cards);
        setResolvedCards(result.resolved_cards);
        const initQty = {};
        for (const c of result.new_cards) {
          initQty[c.scryfall_id] = c.quantity_in_deck;
        }
        setQuantities(initQty);
        setPendingPayload(payload);
        setStep(2);
      } else {
        // Done
        onClose();
        navigate(`/decks/${result.deck.id}`, { state: { blocked: result.blocked ?? [] } });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmQuantities = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.importDeck({ ...pendingPayload, quantities, resolved_cards: resolvedCards });
      onClose();
      navigate(`/decks/${result.deck.id}`, { state: { blocked: result.blocked ?? [] } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setDeckName("");
    setFormat("");
    setDescription("");
    setDeckList("");
    setError(null);
    setNewCards([]);
    setQuantities({});
    setPendingPayload(null);
    setResolvedCards(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import deck" size="lg">
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Deck name *"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="ej: RB Aggro"
          />

          <Select label="Formato" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">No format</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deck description"
          />

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">
              Card list *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Format: "4 Lightning Bolt" per line. For sideboard, add "// Sideboard" before it.
            </p>
            <Textarea
              value={deckList}
              onChange={(e) => setDeckList(e.target.value)}
              rows={12}
              placeholder={"4 Lightning Bolt\n2 Counterspell\n4 Island\n\n// Sideboard\n2 Tormod's Crypt"}
              className="font-mono text-xs"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "Processing..." : "Import deck"}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            The following cards are new to your collection. Enter how many physical copies you own of each.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {newCards.map((card) => (
              <div key={card.scryfall_id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                {card.image_uri_small && (
                  <img src={card.image_uri_small} alt={card.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 text-sm truncate">{card.name}</p>
                  <p className="text-xs text-gray-400">{card.quantity_in_deck} in deck</p>
                </div>
                <Input
                  type="number"
                  min={card.quantity_in_deck}
                  value={quantities[card.scryfall_id] ?? ""}
                  onChange={(e) =>
                    setQuantities((prev) => ({ ...prev, [card.scryfall_id]: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-20 flex-shrink-0"
                  placeholder="Total"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleConfirmQuantities} disabled={loading}>
              {loading ? "Creating deck..." : "Confirm and create deck"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
