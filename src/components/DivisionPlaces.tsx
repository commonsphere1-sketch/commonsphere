/**
 * What lies inside a division: its counties or districts, and its towns,
 * cities and villages - for the Subnations page's cards and windows.
 *
 * The places are the ones the World Maps page's explorer lists (the files
 * under static/places, built from GeoNames' cities500 by build-places.cjs):
 * every populated place of more than 500 people and every seat of an
 * administrative division, each with the first- and second-order division
 * GeoNames files it under. A country's file is fetched once, when one of its
 * divisions is first asked about.
 *
 * A division is matched to GeoNames' by name - the name the maps give it, or
 * its article's, its official or its native one - first among the country's
 * first-order divisions and then among its second-order ones, since for some
 * countries the maps draw the second order (France's departments). A division
 * no name of which GeoNames has is given no places, and says so: none are
 * guessed at.
 *
 * A count is of the places GeoNames lists, which is not every hamlet: one of
 * 500 people or fewer that is the seat of nothing is not in its file.
 */
import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { PLACE_KINDS, PLACES_SOURCE, type PlaceRow, type PlacesFile } from "../data/placesIndex";
import type { Subnation } from "../data/subnations";
import { SourceLink } from "./SourceLink";

const FILES = new Map<string, Promise<PlacesFile | null>>();
const load = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      fetch(`/places/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<PlacesFile>) : null))
        .catch(() => null),
    );
  return FILES.get(cc)!;
};
/** A country's places: undefined while they are fetched, null where there is no file for it. */
export function usePlaces(cc: string): PlacesFile | null | undefined {
  const [file, setFile] = useState<PlacesFile | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    setFile(undefined);
    load(cc).then((f) => !off && setFile(f));
    return () => {
      off = true;
    };
  }, [cc]);
  return file;
}

/** A name as compared: without accents, case, punctuation, or the words that say what kind of division it is. */
const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*[,(].*$/, "")
    .replace(/\b(state|province|region|department|county|district|prefecture|governorate|oblast|canton|municipality|parish|emirate|territory|republic|autonomous|federal|capital|city|of|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type Inside = {
  /** Whether GeoNames has the division as a first-order one, with second-order ones inside it, or as a second-order one. */
  order: 1 | 2;
  /** Its places, largest first. */
  rows: PlaceRow[];
  /** The counties or districts inside it that have a listed place, each with how many, by name. */
  districts: [name: string, places: number][];
};

/** What GeoNames lists inside a division, or null where it has no division by any of its names. */
export function insideOf(file: PlacesFile, s: Subnation): Inside | null {
  const names = new Set([s.name, s.article, s.official, s.native].filter((x): x is string => Boolean(x)).map(plain).filter(Boolean));
  const find = (list: string[]) => list.findIndex((n) => n !== "" && names.has(plain(n)));
  const region = find(file.regions);
  if (region >= 0) {
    const rows = file.places.filter((p) => p[4] === region);
    const tally = new Map<number, number>();
    for (const p of rows) if (file.districts[p[7]]) tally.set(p[7], (tally.get(p[7]) ?? 0) + 1);
    return { order: 1, rows, districts: [...tally].map(([i, n]): [string, number] => [file.districts[i], n]).sort((a, b) => a[0].localeCompare(b[0])) };
  }
  const district = find(file.districts);
  if (district >= 0) return { order: 2, rows: file.places.filter((p) => p[7] === district), districts: [] };
  return null;
}

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const PAGE = 40;

/** The section of a division's window that lists what is inside it. */
export function DivisionPlaces({ s, country }: { s: Subnation; country: string }) {
  const file = usePlaces(s.cc);
  const inside = useMemo(() => (file ? insideOf(file, s) : null), [file, s]);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [allDistricts, setAllDistricts] = useState(false);
  const heading = (
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Counties, towns and villages</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
  if (file === undefined)
    return (
      <section>
        {heading}
        <p className="text-[11px] font-sans text-muted-foreground">Loading the places of {country}…</p>
      </section>
    );
  if (!inside)
    return (
      <section>
        {heading}
        <p className="text-[11px] font-sans text-muted-foreground leading-snug">
          Not held: GeoNames files the places of {country} under divisions none of which goes by a name the site has for {s.name}, so none are listed here rather than guessed at.
        </p>
      </section>
    );
  const q = query.trim().toLowerCase();
  const rows = q ? inside.rows.filter((p) => p[0].toLowerCase().includes(q) || (file!.districts[p[7]] ?? "").toLowerCase().includes(q)) : inside.rows;
  const districts = allDistricts ? inside.districts : inside.districts.slice(0, 36);
  const peopled = inside.rows.filter((p) => p[3] > 0);
  return (
    <section>
      {heading}
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        The places GeoNames lists in {s.name}: every town, city and village of more than 500 people, and every seat of a county or district. A hamlet smaller than that is not in its
        list.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {inside.order === 1 && (
          <div className="modal-tile rounded-lg p-3 min-w-0">
            <p className="text-xs text-muted-foreground font-sans">Counties or districts</p>
            <p className="text-base font-bold font-mono text-foreground">{whole(inside.districts.length)}</p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">with a listed place</p>
          </div>
        )}
        <div className="modal-tile rounded-lg p-3 min-w-0">
          <p className="text-xs text-muted-foreground font-sans">Towns, cities and villages</p>
          <p className="text-base font-bold font-mono text-foreground">{whole(inside.rows.length)}</p>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">listed by GeoNames</p>
        </div>
        {peopled[0] && (
          <div className="modal-tile rounded-lg p-3 min-w-0">
            <p className="text-xs text-muted-foreground font-sans">Largest</p>
            <p className="text-base font-bold font-sans text-foreground truncate" title={peopled[0][0]}>
              {peopled[0][0]}
            </p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{whole(peopled[0][3])} people, as GeoNames has it</p>
          </div>
        )}
      </div>

      {inside.districts.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Its counties or districts · and how many places are listed in each</p>
          <div className="flex flex-wrap gap-1.5">
            {districts.map(([name, n]) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setQuery(name);
                  setShown(PAGE);
                }}
                className="text-[10px] font-sans px-2 py-0.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer"
                title={`List the places of ${name}`}
              >
                {name} <span className="font-mono text-muted-foreground">{n}</span>
              </button>
            ))}
            {inside.districts.length > districts.length && (
              <button type="button" onClick={() => setAllDistricts(true)} className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
                All {inside.districts.length}
              </button>
            )}
          </div>
        </div>
      )}

      <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 mb-2 transition-colors focus-within:border-foreground/40 max-w-sm">
        <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Find a town, or list a county's"
          aria-label={`Find a place in ${s.name} by its name or its county's`}
          className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>
      <div className="modal-tile rounded-xl px-4 py-1">
        {rows.slice(0, shown).map((p) => (
          <div key={p[6]} className="flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-b-0">
            <span className="min-w-0">
              <span className="block text-[11px] font-sans font-semibold text-foreground truncate">{p[0]}</span>
              <span className="block text-[10px] font-mono text-muted-foreground truncate">{[PLACE_KINDS[p[5]], file!.districts[p[7]]].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="text-[11px] font-mono text-right shrink-0 text-foreground">{p[3] > 0 ? whole(p[3]) : <span className="text-muted-foreground">no figure</span>}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[11px] font-sans text-muted-foreground py-2">None by that name.</p>}
      </div>
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 5)} className="mt-2 text-[11px] font-semibold font-sans px-3 py-1 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
          Show more · {Math.min(shown, rows.length).toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} shown
        </button>
      )}
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
        A population is GeoNames' own for the place, undated; the largest first. What kind of place each is - a seat of a county, a populated place - is as GeoNames classes it.
      </p>
      <SourceLink sources={[{ label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url }]} className="mt-1" />
    </section>
  );
}
