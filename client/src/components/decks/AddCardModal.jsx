import { useState } from "react";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { CardSearch } from "../cards/CardSearch.jsx";
import { api } from "../../api/client.js";

export function AddCardModal({ open, onClose, deckId, onAdded }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSideboard, setIsSideboard] = useState(false);
  const [quantityOwned, setQuantityOwned] = useState("");
  const [isNewCard, setIsNewCard] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelectCard = async (scryfallCard) => {
    setError(null);
    setSelectedCard(scryfallCard);

    // Check if card already exists in DB
    try {
      const allCards = await api.getCards();
      const existing = allCards.find((c) => c.scryfall_id === scryfallCard.scryfall_id);
      if (existing) {
        setIsNewCard(false);
        setSelectedCard({ ...scryfallCard, db_id: existing.id, quantity_owned: existing.quantity_owned });
      } else {
        setIsNewCard(true);
        setQuantityOwned("");
      }
    } catch {
      setIsNewCard(true);
    }
  };

  const handleSave = async () => {
    if (!selectedCard) return;
    setSaving(true);
    setError(null);

    try {
      let cardId = selectedCard.db_id;

      if (isNewCard) {
        const qty = parseInt(quantityOwned, 10);
        if (!qty || qty < 1) {
          setError("Enter how many copies you own in total");
          setSaving(false);
          return;
        }
        const created = await api.createCard({
          scryfall_id: selectedCard.scryfall_id,
          name: selectedCard.name,
          set_code: selectedCard.set_code,
          set_name: selectedCard.set_name,
          collector_number: selectedCard.collector_number,
          image_uri: selectedCard.image_uri,
          image_uri_small: selectedCard.image_uri_small,
          quantity_owned: qty,
        });
        cardId = created.id;
      }

      await api.createAssignment({
        deck_id: deckId,
        card_id: cardId,
        quantity: Number(quantity),
        is_sideboard: isSideboard,
      });

      onAdded?.();
      handleClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedCard(null);
    setQuantity(1);
    setIsSideboard(false);
    setQuantityOwned("");
    setIsNewCard(false);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add card to deck" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">Search card</label>
          <CardSearch onSelect={handleSelectCard} />
        </div>

        {selectedCard && (
          <>
            <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
              {selectedCard.image_uri_small && (
                <img src={selectedCard.image_uri_small} alt={selectedCard.name} className="w-10 h-14 object-cover rounded" />
              )}
              <div>
                <p className="font-medium text-gray-100">{selectedCard.name}</p>
                <p className="text-xs text-gray-400">{selectedCard.set_name}</p>
                {!isNewCard && (
                  <p className="text-xs text-green-400 mt-0.5">
                    Already in your collection · {selectedCard.quantity_owned} owned
                  </p>
                )}
              </div>
            </div>

            {isNewCard && (
              <Input
                label="How many copies do you own in total?"
                type="number"
                min={1}
                value={quantityOwned}
                onChange={(e) => setQuantityOwned(e.target.value)}
                placeholder="ej: 4"
              />
            )}

            <Input
              label="Quantity to assign"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSideboard}
                onChange={(e) => setIsSideboard(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-gray-300">Sideboard</span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Add card"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
