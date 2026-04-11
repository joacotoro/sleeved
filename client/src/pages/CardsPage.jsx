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

  const loadCards = (silent = false) => {
    if (!silent) setLoading(true);
    api
      .getCards()
      .then((data) => { setCards(data); if (!silent) setSelected(new Set()); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => loadCards(), []);

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
          <h1 className="font-cinzel text-2xl font-semibold text-vault-cream tracking-wide">My cards</h1>
          <p className="text-sm text-vault-muted mt-0.5">{cards.length} cards in the system</p>
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
            className="input-vault rounded-lg px-3 py-2 text-sm w-56"
          />
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <div className="border border-vault-border border-dashed rounded-xl p-12 text-center">
          <p className="text-vault-faint font-cinzel text-sm tracking-wide">
            {search ? `No results for "${search}"` : "No cards in the system yet."}
          </p>
          {!search && (
            <p className="text-vault-muted text-sm mt-2">
              Cards appear here when you assign them to a deck.
            </p>
          )}
        </div>
      ) : (
        <div className="border border-vault-border rounded-xl overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vault-border bg-vault-card">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-vault-gold cursor-pointer"
                    title={allFilteredSelected ? "Deselect all" : "Select all"}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-cinzel font-medium text-vault-muted uppercase tracking-widest">
                  Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-cinzel font-medium text-vault-muted uppercase tracking-widest">
                  Owned
                </th>
                <th className="px-4 py-3 text-center text-xs font-cinzel font-medium text-vault-muted uppercase tracking-widest">
                  Assigned
                </th>
                <th className="px-4 py-3 text-center text-xs font-cinzel font-medium text-vault-muted uppercase tracking-widest">
                  Free
                </th>
                <th className="px-4 py-3 text-center text-xs font-cinzel font-medium text-vault-muted uppercase tracking-widest">
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
                  onUpdated={() => loadCards(true)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CardDetail
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
        onUpdated={() => loadCards(true)}
      />
    </div>
  );
}
