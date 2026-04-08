import { useNavigate } from "react-router-dom";
import { FormatBadge, Badge } from "../ui/Badge.jsx";

export function DeckCard({ deck }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/decks/${deck.id}`)}
      className="card-hover group w-full text-left bg-vault-card border border-vault-border rounded-xl p-5 gold-top-accent"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-cinzel font-semibold text-vault-cream text-sm tracking-wide group-hover:text-vault-gold transition-colors duration-150 line-clamp-2">
          {deck.name}
        </h3>
        {deck.format && <FormatBadge format={deck.format} />}
      </div>
      {deck.description && (
        <p className="text-xs text-vault-faint mb-3 line-clamp-2 leading-relaxed">{deck.description}</p>
      )}
      <div className="flex items-center gap-2 mt-auto">
        <Badge variant="default">
          <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {deck.card_count} cards
        </Badge>
      </div>
    </button>
  );
}
