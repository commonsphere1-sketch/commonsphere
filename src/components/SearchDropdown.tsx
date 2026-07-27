import React from "react";
import { Link } from "react-router-dom";
import { SearchResult } from "../utils/searchUtils";

type Props = {
  results: SearchResult[];
  onSelect: () => void;
  visible: boolean;
};

export function SearchDropdown({ results, onSelect, visible }: Props) {
  if (!visible || results.length === 0) return null;
  return (
    <div className="absolute top-full left-0 mt-1 w-full rounded-xl shadow-xl z-50 overflow-hidden bg-card border border-border">
      {results.map((r) => (
        <Link
          key={r.path}
          to={r.path}
          onClick={onSelect}
          className="block px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted"
        >
          <div className="font-medium text-foreground text-sm">{r.title}</div>
          {r.description && <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>}
        </Link>
      ))}
    </div>
  );
}
