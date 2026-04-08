import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { Spinner } from "../ui/Spinner.jsx";

export function CardSearch({ onSelect, placeholder = "Search card on Scryfall..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    api
      .searchScryfall(debouncedQuery)
      .then((r) => {
        setResults(r.data ?? []);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (card) => {
    onSelect(card);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-8 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {results.map((card) => (
            <li key={`${card.scryfall_id}-${card.set_code}`}>
              <button
                type="button"
                onClick={() => handleSelect(card)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
              >
                {card.image_uri_small ? (
                  <img
                    src={card.image_uri_small}
                    alt={card.name}
                    className="w-8 h-11 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-11 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">?</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-100">{card.name}</p>
                  <p className="text-xs text-gray-400">
                    {card.set_name} · #{card.collector_number}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}
