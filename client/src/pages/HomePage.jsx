import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { LoadingScreen } from "../components/ui/Spinner.jsx";
import { FormatBadge } from "../components/ui/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, icon, delay = "" }) {
  return (
    <div className={`animate-fade-up ${delay} relative overflow-hidden rounded-xl border border-vault-border bg-vault-card p-5`}>
      {/* Gold top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-vault-gold to-transparent opacity-60" />
      <p className="text-vault-cream/60 text-xs font-cinzel tracking-[0.18em] uppercase mb-4">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-cinzel font-semibold text-white">{value}</p>
        <span className="text-2xl opacity-30">{icon}</span>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCards(), api.getDecks()])
      .then(([c, d]) => { setCards(c); setDecks(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  const recentDecks = [...decks].slice(0, 6);
  const totalOwned = cards.reduce((s, c) => s + c.quantity_owned, 0);
  const totalFree  = cards.reduce((s, c) => s + Math.max(0, c.quantity_free), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-vault-faint text-xs font-cinzel tracking-[0.2em] uppercase mb-2">Welcome back</p>
        <h1 className="font-cinzel text-3xl font-semibold text-vault-cream tracking-wide">
          {user?.name ?? "Collector"}
        </h1>
        <p className="text-vault-muted text-sm mt-1">Your Magic: The Gathering collection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Unique cards" value={cards.length} icon="🃏" delay="stagger-1" />
        <StatCard label="Active decks" value={decks.length} icon="📚" delay="stagger-2" />
        <StatCard label="Total owned"  value={totalOwned}   icon="📦" delay="stagger-3" />
        <StatCard label="Unsleeved"    value={totalFree}    icon="✨" delay="stagger-4" />
      </div>

      {/* Recent decks */}
      <div className="animate-fade-up stagger-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cinzel text-xs font-semibold text-vault-cream tracking-[0.2em] uppercase">
            Recent decks
          </h2>
          <button
            onClick={() => navigate("/decks")}
            className="text-vault-gold hover:text-vault-gold-light text-xs font-cinzel tracking-widest transition-colors"
          >
            VIEW ALL →
          </button>
        </div>

        {recentDecks.length === 0 ? (
          <div className="border border-vault-border border-dashed rounded-xl p-12 text-center">
            <p className="text-vault-faint font-cinzel text-sm tracking-wide mb-4">No decks yet</p>
            <button
              onClick={() => navigate("/decks")}
              className="text-vault-gold hover:text-vault-gold-light text-xs font-cinzel tracking-widest transition-colors"
            >
              CREATE OR IMPORT A DECK →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDecks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => navigate(`/decks/${deck.id}`)}
                className="card-hover group bg-vault-card border border-vault-border rounded-xl p-4 text-left gold-top-accent"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-cinzel font-semibold text-vault-cream text-sm tracking-wide group-hover:text-vault-gold transition-colors">
                    {deck.name}
                  </p>
                  {deck.format && <FormatBadge format={deck.format} />}
                </div>
                <p className="text-xs text-vault-muted">{deck.card_count} cards</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
