import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/client.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { Spinner } from "../ui/Spinner.jsx";

export function CardSearch({ onSelect, placeholder = "Search card on Scryfall..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-vault w-full rounded-lg px-3 py-2.5 pr-8 text-sm"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {open && dropdownPos && results.length > 0 && createPortal(
        <ul
          className="fixed z-[9999] bg-vault-card border border-vault-border rounded-lg shadow-xl max-h-72 overflow-y-auto"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {results.map((card) => (
            <li key={`${card.scryfall_id}-${card.set_code}`} className="border-b border-vault-border last:border-0">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(card); }}
                className="w-full px-3 py-2.5 hover:bg-vault-raised transition-colors text-left"
              >
                <p className="text-sm font-medium text-vault-cream">{card.name}</p>
                <p className="text-xs text-vault-faint">{card.set_name} · #{card.collector_number}</p>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}

      {open && dropdownPos && results.length === 0 && !loading && query.length >= 2 && createPortal(
        <div
          className="fixed z-[9999] bg-vault-card border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-muted"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          No results for "{query}"
        </div>,
        document.body
      )}
    </div>
  );
}
