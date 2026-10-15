/**
 * A search over every place the site holds, for the bar over the Dashboard's
 * map, as asked: countries, the US states, every first-order division the
 * site lists, the US counties and the cities. A result opens that place's
 * window on its own page, as the header's search does. The divisions and the
 * counties are large, so they are read only when the box is first used.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { citiesData } from "../data/citiesData";

type Hit = { key: string; name: string; sub: string; type: string; to: string };
const BASE: Hit[] = [
  ...countriesData.filter((c) => !c.uninhabited).map((c) => ({ key: `c-${c.id}`, name: c.name, sub: [c.continent, c.capital].filter(Boolean).join(" · "), type: "Country", to: `/dashboard/countries?open=${encodeURIComponent(c.id)}` })),
  ...usStatesData.map((s) => ({ key: `s-${s.id}`, name: s.name, sub: `United States · ${s.capital}`, type: "State", to: `/dashboard/states?open=${encodeURIComponent(s.id)}` })),
  ...citiesData.map((c) => ({ key: `ci-${c.id}`, name: c.name, sub: [c.region, c.country].filter(Boolean).join(" · "), type: "City", to: `/dashboard/cities?open=${encodeURIComponent(c.id)}` })),
];
const COUNTRY_NAME = new Map(countriesData.map((c) => [c.code, c.name]));
/** Folded for matching: no case and no accents, so "sao paulo" finds São Paulo. */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function PlaceSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [more, setMore] = useState<Hit[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const load = () => {
    if (more) return;
    setMore([]);
    Promise.all([import("../data/subnations"), import("../data/usCounties")]).then(([sub, cty]) =>
      setMore([
        // The US states are in the list above already, from their own page.
        ...sub.SUBNATIONS.filter((s) => s.cc !== "US").map((s) => ({ key: `d-${s.id}`, name: s.name, sub: [s.kind, COUNTRY_NAME.get(s.cc) ?? s.cc].filter(Boolean).join(" · "), type: "Division", to: `/dashboard/subnations?open=${encodeURIComponent(s.id)}` })),
        ...cty.US_COUNTIES.map(([fips, name, st]) => ({ key: `k-${fips}`, name, sub: `${st} · United States`, type: "County", to: `/dashboard/subnations?open=county:${fips}` })),
      ]),
    );
  };
  const hits = useMemo(() => {
    const f = fold(q.trim());
    if (f.length < 2) return [];
    const all = [...BASE, ...(more ?? [])];
    // Names that begin with what is typed first, then those that hold it; in each, the order above - countries, states, cities, divisions, counties.
    const starts = all.filter((h) => fold(h.name).startsWith(f));
    const holds = all.filter((h) => !fold(h.name).startsWith(f) && fold(h.name).includes(f));
    return [...starts, ...holds].slice(0, 12);
  }, [q, more]);
  useEffect(() => setAt(0), [q]);
  useEffect(() => {
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);
  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    navigate(h.to);
  };
  return (
    <div ref={box} className="relative w-full lg:w-64 shrink-0">
      <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 transition-colors focus-within:border-foreground/40">
        <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
        <input
          type="search"
          value={q}
          onFocus={() => {
            load();
            setOpen(true);
          }}
          onChange={(e) => {
            load();
            setQ(e.target.value.slice(0, 80));
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!hits.length) return;
            if (e.key === "ArrowDown") setAt((i) => Math.min(hits.length - 1, i + 1));
            else if (e.key === "ArrowUp") setAt((i) => Math.max(0, i - 1));
            else if (e.key === "Enter") go(hits[at]);
            else if (e.key === "Escape") setOpen(false);
            else return;
            e.preventDefault();
          }}
          placeholder="Search every place"
          aria-label="Search every country, state, division, county and city"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="place-search-hits"
          className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>
      {open && q.trim().length >= 2 && (
        <ul id="place-search-hits" role="listbox" className="absolute right-0 top-full mt-1.5 w-full lg:w-80 max-h-80 overflow-y-auto modal-glass border rounded-xl shadow-lg py-1 z-30">
          {hits.map((h, i) => (
            <li key={h.key} role="option" aria-selected={i === at}>
              <button type="button" onClick={() => go(h)} onMouseEnter={() => setAt(i)} className={`w-full text-left px-3 py-1.5 flex items-baseline gap-2 cursor-pointer ${i === at ? "bg-muted/60" : ""}`}>
                <span className="text-[12px] font-semibold font-sans text-foreground truncate">{h.name}</span>
                <span className="text-[10px] font-sans text-muted-foreground truncate flex-1 min-w-0">{h.sub}</span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">{h.type}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 && <li className="px-3 py-2 text-[11px] font-sans text-muted-foreground">{more && !more.length ? "Reading the divisions and counties…" : "No place by that name."}</li>}
        </ul>
      )}
    </div>
  );
}
