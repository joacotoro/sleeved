import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { CardRow } from "../components/cards/CardRow.jsx";
import { CardDetail } from "../components/cards/CardDetail.jsx";
import { LoadingScreen } from "../components/ui/Spinner.jsx";
import { Button } from "../components/ui/Button.jsx";

export function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadCards = () => {
    setLoading(true);
    api
      .getCards()
      .then((data) => { setCards(data); setSelected(new Set()); })
      .finally(() => setLoading(false));
  };

  useEffect(loadCards, []);

  const filtered = cards.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const toDelete = cards.filter((c) => selected.has(c.id) && c.quantity_assigned === 0);
    const skipped = cards.filter((c) => selected.has(c.id) && c.quantity_assigned > 0);

    if (toDelete.length === 0) {
      alert(
        `All selected cards are assigned to decks and cannot be deleted:\n\n${skipped.map((c) => c.name).join("\n")}`
      );
      return;
    }

    let msg = `Delete ${toDelete.length} card${toDelete.length > 1 ? "s" : ""}?`;
    if (skipped.length > 0) {
      msg += `\n\nSkipping ${skipped.length} card${skipped.length > 1 ? "s" : ""} assigned to decks:\n${skipped.map((c) => `• ${c.name}`).join("\n")}`;
    }
    if (!confirm(msg)) return;

    setDeleting(true);
    await Promise.all(toDelete.map((c) => api.deleteCard(c.id).catch(() => null)));
    setDeleting(false);
    loadCards();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">My cards</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cards.length} cards in the system</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected} disabled={deleting}>
              {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
            </Button>
          )}
          <input
            type="text"
            placeholder="Filter by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 w-56"
          />
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-400">
            {search ? `No results for "${search}"` : "No cards in the system yet."}
          </p>
          {!search && (
            <p className="text-gray-500 text-sm mt-2">
              Cards appear here when you assign them to a deck.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                    title={allFilteredSelected ? "Deselect all" : "Select all"}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-12">
                  Img
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Set
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Owned
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Assigned
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Free
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Decks
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  selected={selected.has(card.id)}
                  onToggle={() => toggleOne(card.id)}
                  onClick={() => setSelectedCardId(card.id)}
                  onUpdated={loadCards}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CardDetail
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
        onUpdated={loadCards}
      />
    </div>
  );
}
