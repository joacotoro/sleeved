import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { DeckCard } from "../components/decks/DeckCard.jsx";
import { ImportDeckModal } from "../components/decks/ImportDeckModal.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input, Select } from "../components/ui/Input.jsx";
import { LoadingScreen } from "../components/ui/Spinner.jsx";
import { useNavigate } from "react-router-dom";

const FORMATS = ["Standard", "Pioneer", "Modern", "Legacy", "Vintage", "Commander", "Pauper", "Draft"];

export function DeckListPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckFormat, setNewDeckFormat] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadDecks = () => {
    api.getDecks().then(setDecks).finally(() => setLoading(false));
  };

  useEffect(loadDecks, []);

  const handleCreate = async () => {
    if (!newDeckName.trim()) {
      setCreateError("Name is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const deck = await api.createDeck({ name: newDeckName, format: newDeckFormat || null });
      setShowCreate(false);
      setNewDeckName("");
      setNewDeckFormat("");
      navigate(`/decks/${deck.id}`);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl font-semibold text-vault-cream tracking-wide">My decks</h1>
          <p className="text-sm text-vault-muted mt-0.5">{decks.length} decks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import deck
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create deck
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : decks.length === 0 ? (
        <div className="border border-vault-border border-dashed rounded-xl p-12 text-center space-y-4">
          <p className="text-vault-faint font-cinzel text-sm tracking-wide">You don't have any decks yet.</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowImport(true)}>Import deck</Button>
            <Button onClick={() => setShowCreate(true)}>Create deck</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}

      <ImportDeckModal
        open={showImport}
        onClose={() => { setShowImport(false); loadDecks(); }}
      />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create new deck">
        <div className="space-y-4">
          <Input
            label="Deck name *"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="ej: RB Aggro"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Select
            label="Formato"
            value={newDeckFormat}
            onChange={(e) => setNewDeckFormat(e.target.value)}
          >
            <option value="">No format</option>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create deck"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
