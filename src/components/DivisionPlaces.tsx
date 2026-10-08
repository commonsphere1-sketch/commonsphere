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
 *
 * The places are the main thing in a division's window: a card each, and a
 * window of its own behind each card, laid out as a city's is - Overview,
 * History, Map. What a place's window says of it is gathered when it opens,
 * and each part names whose it is: GeoNames' record of the place; its head,
 * only where three records agree (representatives.ts); the United Nations'
 * figures where the place is one of the cities the UN counts (the same name,
 * within 25 km); the Census Bureau's figures for its county, in the United
 * States; its country's quality of life, named as the country's; and its
 * history from its Wikipedia article, found by the place's own name within
 * ten kilometres of it. A part with nothing behind it is left out.
 */
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ClockCounterClockwise, ListBullets, MagnifyingGlass, MapPin, MapTrifold, X } from "@phosphor-icons/react";
import { CHIP_TEXT } from "@/lib/chipTone";
import { REPRESENTATIVES, REPRESENTATIVES_SOURCES } from "../data/representatives";
import { usStatesData } from "../data/statesData";
import type { UnCity } from "../data/unCities";
import type { UsCounty } from "../data/usCounties";
import { ArticlePanel } from "./HistoryPanel";
import { ChartNote, FigureRow } from "./ModalCharts";
import { SeeAlso } from "./SeeAlso";

/** The place's country's quality of life, as a city's window gives it: loaded when a window opens. */
const CountryQuality = lazy(() => import("./CountryQuality"));
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
export function DivisionPlaces({
  s,
  country,
  onPlace,
  onCloseAll,
}: {
  s: Subnation;
  country: string;
  /** Told when a place's window opens and when it closes: the division's window steps out of sight while it is open. */
  onPlace?: (open: boolean) => void;
  /** Out of every window: what the X of a place's window does. */
  onCloseAll?: () => void;
}) {
  const file = usePlaces(s.cc);
  const inside = useMemo(() => (file ? insideOf(file, s) : null), [file, s]);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [allDistricts, setAllDistricts] = useState(false);
  /** The place whose window is open, over the division's. */
  const [open, setOpen] = useState<PlaceRow | null>(null);
  useEffect(() => onPlace?.(open !== null), [open, onPlace]);
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
      {/* A card for each place: its name and what it is, its county, its people, and its head where one is confirmed. Each opens a window of its own. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.slice(0, shown).map((p) => {
          const head = HEAD_BY_GEONAMES.get(p[6]);
          const facts: [string, string | undefined][] = [
            ["People", p[3] > 0 ? whole(p[3]) : undefined],
            ["County or district", file!.districts[p[7]] || undefined],
            ["Head", head?.[3]],
          ];
          return (
            <button key={p[6]} type="button" onClick={() => setOpen(p)} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
              <span className="min-w-0">
                <span className="block text-sm font-bold font-sans text-foreground truncate">{p[0]}</span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground truncate">
                  <MapPin size={9} aria-hidden /> {PLACE_KINDS[p[5]]}
                </span>
              </span>
              <span className="flex flex-col border-t border-border/40 pt-1.5">
                {facts.map(([k, v]) => (
                  <span key={k} className="flex items-baseline justify-between gap-2 py-0.5 min-w-0">
                    <span className="text-[11px] font-sans text-muted-foreground shrink-0">{k}</span>
                    <span className={`text-[11px] font-mono truncate ${v ? "font-bold text-foreground" : "text-muted-foreground"}`}>{v ?? "Not held"}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {rows.length === 0 && <p className="text-[11px] font-sans text-muted-foreground py-2">None by that name.</p>}
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 5)} className="mt-2 text-[11px] font-semibold font-sans px-3 py-1 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
          Show more · {Math.min(shown, rows.length).toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} shown
        </button>
      )}
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
        A population is GeoNames' own for the place, undated; the largest first. What kind of place each is - a seat of a county, a populated place - is as GeoNames classes it.
      </p>
      <SourceLink sources={[{ label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url }]} className="mt-1" />
      {/* On the page itself, not inside the division's window: that window is out of sight while this one is open. */}
      {open &&
        createPortal(
          <PlaceWindow
            p={open}
            file={file!}
            s={s}
            country={country}
            onBack={() => setOpen(null)}
            onClose={() => {
              setOpen(null);
              onCloseAll?.();
            }}
          />,
          document.body,
        )}
    </section>
  );
}

// ── A place's own window ────────────────────────────────────────────────────

/** The heads three records agree on, by the place's GeoNames id. */
const HEAD_BY_GEONAMES = new Map(REPRESENTATIVES.filter((r) => r[11]).map((r) => [r[11], r]));
const bare = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const km = (a: [number, number], b: [number, number]) => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const coords = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;
const ARTICLES = new Map<number, string | null>();

const Part = ({ title, note, children }: { title: string; note?: string; children?: ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
    {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">{note}</p>}
    {children}
  </section>
);
const Tile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="modal-tile rounded-lg p-3 min-w-0">
    <p className="text-xs text-muted-foreground font-sans">{label}</p>
    <p className="text-base font-bold font-mono text-foreground truncate" title={value}>
      {value}
    </p>
    {sub && <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{sub}</p>}
  </div>
);
type Tab = "overview" | "history" | "map";

function PlaceWindow({ p, file, s, country, onBack, onClose }: { p: PlaceRow; file: PlacesFile; s: Subnation; country: string; /** Back to the division's window. */ onBack: () => void; /** Out of every window. */ onClose: () => void }) {
  const navigate = useNavigate();
  const [name, lat, lon, pop, , kind, id, di] = p;
  const district = file.districts[di] || "";
  const head = HEAD_BY_GEONAMES.get(id);
  const [tab, setTab] = useState<Tab>("overview");

  /* It is the window on top: Escape closes it and goes no further, so the division's and the country's windows under it stay. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onBack();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onBack]);

  /* The United Nations' city, where this place is one: the same name, in the same country, within 25 km - and only one such. */
  const [un, setUn] = useState<{ city: UnCity; years: number[]; rank: number; of: number } | null>(null);
  useEffect(() => {
    let off = false;
    import("../data/unCities").then((m) => {
      const near = m.UN_CITIES.flatMap((c, i) =>
        c[0] === s.cc && c[3] !== null && c[4] !== null && c[2].split(/[()[\]/]/).map(bare).includes(bare(name)) && km([c[3], c[4]], [lat, lon]) <= 25 ? [{ city: c, rank: i + 1 }] : [],
      );
      if (!off && near.length === 1) setUn({ ...near[0], years: m.UN_CITY_YEARS, of: m.UN_CITIES.length });
    });
    return () => {
      off = true;
    };
  }, [s.cc, name, lat, lon]);

  /* Its county, in the United States: the Census Bureau's figures for it. */
  const [county, setCounty] = useState<{ row: UsCounty; years: number[] } | null>(null);
  useEffect(() => {
    if (s.cc !== "US" || !district) return;
    let off = false;
    const abbr = usStatesData.find((x) => x.name === file.regions[p[4]])?.abbreviation;
    import("../data/usCounties").then((m) => {
      const row = m.US_COUNTIES.find((c) => c[2] === abbr && c[1] === district);
      if (!off && row) setCounty({ row, years: m.US_COUNTY_YEARS });
    });
    return () => {
      off = true;
    };
  }, [s.cc, district, file, p]);

  /* Its article, for its history: the one its confirmed head's record names, or the nearest within ten kilometres whose title is the place's own name. */
  const [article, setArticle] = useState<string | null | undefined>(() => head?.[10] || ARTICLES.get(id));
  useEffect(() => {
    if (tab !== "history" || article !== undefined) return;
    let off = false;
    fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lon}&gsradius=10000&gslimit=50&format=json&origin=*`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { query?: { geosearch?: { title: string }[] } }) => {
        const hit = (j.query?.geosearch ?? []).find((x) => bare(x.title.replace(/[,(].*$/, "")) === bare(name));
        ARTICLES.set(id, hit ? hit.title : null);
        if (!off) setArticle(hit ? hit.title : null);
      })
      .catch(() => !off && setArticle(null));
    return () => {
      off = true;
    };
  }, [tab, article, id, lat, lon, name]);

  const cPop = county?.row[7];
  const cChange = cPop && cPop[0] > 0 ? (100 * (cPop[cPop.length - 1] - cPop[0])) / cPop[0] : null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={name} className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl modal-glass border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={`https://flagcdn.com/w160/${s.cc.toLowerCase()}.png`} alt={`${country} flag`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold font-sans text-foreground">{name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`flex items-center gap-1 ${CHIP_TEXT}`}>
                    <MapPin size={12} weight="fill" /> {[district, s.name, country].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground">{PLACE_KINDS[kind]}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onBack} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label={`Back to ${s.name}`} title={`Back to ${s.name}`}>
                <ArrowLeft size={18} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close" title="Close">
                <X size={18} />
              </button>
            </div>

          </div>

          <SeeAlso code={s.cc} name={country} className="mb-4" />

          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 mb-5">
            {(
              [
                { key: "overview", label: "Overview", icon: <ListBullets size={14} /> },
                { key: "history", label: "History", icon: <ClockCounterClockwise size={14} /> },
                { key: "map", label: "Map", icon: <MapTrifold size={14} /> },
              ] as const
            ).map((x) => (
              <button key={x.key} onClick={() => setTab(x.key)} aria-pressed={tab === x.key} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${tab === x.key ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}>
                {x.icon}
                {x.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <Part title="👥 People & place" note="What GeoNames records of the place. Its population is GeoNames' own figure and carries no date.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Tile label="People" value={pop > 0 ? whole(pop) : "Not held"} sub={pop > 0 ? "GeoNames, undated" : undefined} />
                  <Tile label="County or district" value={district || "Not held"} sub={s.name} />
                  <Tile label="What it is" value={PLACE_KINDS[kind]} sub="as GeoNames classes it" />
                </div>
              </Part>

              <Part title="📋 Its record">
                <div className="modal-tile rounded-xl px-4 py-1.5">
                  <FigureRow label="Name" value={name} />
                  <FigureRow label="Head" value={head ? head[3] : <span className="font-normal text-muted-foreground">Not held</span>} sub={head ? `${head[4]}${head[5] ? ` · since ${head[5]}` : ""} · three records agree` : undefined} />
                  <FigureRow label="Division" value={s.name} sub={s.kind} />
                  <FigureRow label="County or district" value={district || <span className="font-normal text-muted-foreground">Not held</span>} />
                  <FigureRow label="Country" value={country} sub={`ISO 3166-1: ${s.cc}`} />
                  <FigureRow label="Coordinates" value={coords(lat, lon)} />
                  <FigureRow label="GeoNames id" value={String(id)} />
                </div>
                <SourceLink
                  sources={[{ label: `GeoNames — ${name}`, url: `https://www.geonames.org/${id}` }, ...(head ? [{ label: REPRESENTATIVES_SOURCES.wikidata.label, url: REPRESENTATIVES_SOURCES.wikidata.url }] : [])]}
                  className="mt-2"
                />
              </Part>

              {un && (
                <Part title="🏙 As a city the United Nations counts" note="The UN draws a city by where people live close together, not by its boundary, so its figure differs from the place's own.">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Tile label={`Population, ${un.years[2]}`} value={whole(un.city[8])} sub="the UN's last estimate" />
                    {un.city[9] !== null && <Tile label={`Projected, ${un.years[3]}`} value={whole(un.city[9])} sub="the UN's projection" />}
                    <Tile label="Among the UN's cities" value={`#${un.rank.toLocaleString("en-US")}`} sub={`of ${un.of.toLocaleString("en-US")}`} />
                    {un.city[10] !== null && <Tile label="Land area" value={`${whole(un.city[10])} km²`} sub={String(un.years[2])} />}
                    {un.city[11] !== null && <Tile label="People to a km²" value={whole(un.city[11])} sub={String(un.years[2])} />}
                  </div>
                  <button type="button" onClick={() => navigate(`/dashboard/cities?open=un-${un.city[0]}-${un.city[1]}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer mt-2">
                    Its window on the Cities page <ArrowRight size={11} weight="bold" aria-hidden />
                  </button>
                </Part>
              )}

              {county && cPop && (
                <Part title={`🗺 Its county · ${county.row[1]}`} note="The Census Bureau's figures for the county the place is in, not for the place.">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Tile label="People in the county" value={whole(cPop[cPop.length - 1])} sub={`1 July ${county.years[county.years.length - 1]}`} />
                    {cChange !== null && <Tile label={`Since ${county.years[0]}`} value={signed(cChange)} sub="worked out here from the two figures" />}
                    {county.row[5] !== null && <Tile label="Land area" value={`${whole(county.row[5])} km²`} sub="the county's" />}
                  </div>
                  <button type="button" onClick={() => navigate(`/dashboard/subnations?open=county:${county.row[0]}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer mt-2">
                    Open {county.row[1]} <ArrowRight size={11} weight="bold" aria-hidden />
                  </button>
                </Part>
              )}

              <Suspense fallback={<p className="text-xs font-sans text-muted-foreground">Loading {country}'s figures…</p>}>
                <CountryQuality code={s.cc} country={country} place={name} />
              </Suspense>
            </div>
          )}

          {tab === "history" &&
            (article === undefined ? (
              <p className="text-xs font-sans text-muted-foreground py-6 text-center">Looking for the article on {name}…</p>
            ) : article ? (
              <ArticlePanel title={article} name={name} mode="history" />
            ) : (
              <p className="text-xs font-sans text-muted-foreground py-6 text-center">No Wikipedia article by the name of {name} was found where GeoNames places it, so no history is shown.</p>
            ))}

          {tab === "map" && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
                <iframe title={`Map of ${name}`} width="100%" height="100%" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${lat},${lon}&z=12&output=embed`} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Tile label="Coordinates" value={coords(lat, lon)} />
                <Tile label="County or district" value={district || "Not held"} />
                <Tile label="Division" value={s.name} />
              </div>
              <ChartNote>The map is Google's and is opened on the point where GeoNames places {name}.</ChartNote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

