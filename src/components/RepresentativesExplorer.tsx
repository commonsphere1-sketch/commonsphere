/**
 * The World Maps page's explorer of the world's countries, their towns and
 * villages, and who leads them: a list beside a map, in the pieces the site's
 * other explorers are made of (DataExplorer).
 *
 * Three layers, each from its own source, and the panel says which is which:
 *
 *   Every country   its head of state and of government as Wikipedia's "List
 *                   of current heads of state and government" gives them, at
 *                   the revision the sources link (representatives.ts).
 *   Every town      GeoNames' "cities500": each populated place of more than
 *   and village     500 people and each seat of an administrative division,
 *                   in every country and territory - 225,000 of them. A
 *                   country's are in /places/<code>.json, fetched when the
 *                   country is picked; the map of the whole world draws those
 *                   of 15,000 people or more (placesIndex.ts, build-places.cjs).
 *   Who leads a     no register says, for the world's municipalities. A head
 *   place           is shown only where three records agree on one living
 *                   person: the place's Wikidata record, the records of the
 *                   office's holders, and the infobox of the place's English
 *                   Wikipedia article (representatives.ts). Every other place
 *                   says that no head is verified; none is filled in.
 *
 * A verified head is set beside GeoNames' row for the place by GeoNames id,
 * or by the same name within a few kilometres. Nothing is typed in here, and
 * a count is the only thing worked out.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { ArrowSquareOut, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import { NATIONAL_HEADS, REPRESENTATIVES, REPRESENTATIVE_COUNTRIES, REPRESENTATIVES_SOURCES as SRC } from "../data/representatives";
import { PLACE_COUNTRIES, PLACE_KINDS, PLACES_SOURCE, PLACES_TOTAL, PLACES_WORLD, type PlacesFile } from "../data/placesIndex";
import { Block, Empty, GoButton, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

/** A place whose head three records agree on. */
type Head = { country: string; place: string; region: string; head: string; office: string; since: string; lat: number; lon: number; pop: number; id: string; article: string; geo: number };
const HEADS: Head[] = REPRESENTATIVES.map(([country, place, region, head, office, since, lat, lon, pop, id, article, geo]) => ({ country, place, region, head, office, since, lat, lon, pop, id, article, geo }));

type Line = { role: "state" | "government" | "both"; said: string; executive: boolean };
/** A country or territory: its lines in the list of heads of state and government, its places, and its verified heads. */
type Nation = { key: string; code: string; name: string; at: [number, number] | null; lines: Line[]; places: number; recorded: number; confirmed: number };
const STATES: Nation[] = NATIONAL_HEADS.map(([code, name, lat, lon, lines]) => ({
  // A state with no ISO code is known by its name.
  key: code || name,
  code,
  name,
  at: [lon, lat],
  lines: lines.map(([role, said, executive]) => ({ role, said, executive: executive === 1 })),
  places: (code && PLACE_COUNTRIES[code]?.[1]) || 0,
  recorded: (code && REPRESENTATIVE_COUNTRIES[code]?.[1]) || 0,
  confirmed: (code && REPRESENTATIVE_COUNTRIES[code]?.[2]) || 0,
}));
/** The territories GeoNames gives places for that are not states of the list: Puerto Rico, Greenland, Hong Kong. */
const TERRITORIES: Nation[] = Object.entries(PLACE_COUNTRIES)
  .filter(([code]) => !STATES.some((s) => s.code === code))
  .map(([code, [name, places]]) => ({ key: code, code, name, at: null, lines: [], places, recorded: REPRESENTATIVE_COUNTRIES[code]?.[1] ?? 0, confirmed: REPRESENTATIVE_COUNTRIES[code]?.[2] ?? 0 }));
const NATIONS = [...STATES, ...TERRITORIES].sort((a, b) => a.name.localeCompare(b.name));
const NATION: Record<string, Nation> = Object.fromEntries(NATIONS.map((n) => [n.key, n]));
/** The line the list marks as holding executive power, or its first. */
const lead = (n: Nation) => (n.lines.find((l) => l.executive) ?? n.lines[0])?.said ?? "";
const ROLE: Record<Line["role"], string> = { state: "Head of state", government: "Head of government", both: "State and government" };

const ACCENT = "#0ea5e9";
const REGION = "#f59e0b";
const COUNTRY = "#a855f7";
const TOWN = "#64748b";
const W = 720;
const H = 360;
const LAND = feature(worldTopo as unknown as Topology, (worldTopo as unknown as Topology).objects.land);
/** How many rows of a list are drawn until it is searched, and when it is. */
const SHOWN = 60;
const FOUND = 200;

const whole = (n: number) => n.toLocaleString("en-US");
const flag = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
const since = (p: Head) => (p.since ? `since ${p.since}` : "");
/** A name as compared: without accents, case or punctuation. */
const bare = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// A country's places are fetched once, when it is first picked; the world's larger places when the panel is first shown.
const FILES = new Map<string, Promise<PlacesFile>>();
const placesOf = (code: string) => {
  if (!FILES.has(code)) FILES.set(code, fetch(`/places/${code}.json`).then((r) => (r.ok ? (r.json() as Promise<PlacesFile>) : Promise.reject(new Error(String(r.status))))));
  return FILES.get(code)!;
};
let WORLD: Promise<number[]> | null = null;
const worldPlaces = () => (WORLD ??= fetch("/places/world.json").then((r) => (r.ok ? (r.json() as Promise<number[]>) : Promise.reject(new Error(String(r.status))))));

/** What `load` gives for `key`, once it has: null while it has not, or where there is nothing to load. */
function useLoaded<T>(key: string | null, load: () => Promise<T>): { data: T | null; failed: boolean } {
  const [got, setGot] = useState<{ key: string; data: T | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!key) return;
    let live = true;
    load().then(
      (data) => live && setGot({ key, data, failed: false }),
      () => live && setGot({ key, data: null, failed: true }),
    );
    return () => {
      live = false;
    };
    // `load` is made from `key` alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return got && got.key === key ? got : { data: null, failed: false };
}

/** What is picked: a GeoNames place by its id, or a place with a verified head by its Wikidata id. */
type Pick = { geo: number } | { head: string } | null;

export default function RepresentativesExplorer() {
  const t = useTokens();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [picked, setPicked] = useState<Pick>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  /** Where each drawn town is on the map, for a click to find the nearest: x, y, and its row. */
  const drawn = useRef<[number, number, number][]>([]);
  const q = search.trim().toLowerCase();

  const c = country ? (NATION[country] ?? null) : null;
  const file = useLoaded(c?.code ? c.code : null, () => placesOf(c!.code));
  const world = useLoaded("world", worldPlaces);
  const heads = useMemo(() => (c?.code ? HEADS.filter((p) => p.country === c.code) : []), [c]);

  /** The verified head of each of the country's GeoNames places that has one: by GeoNames id, or by the same name within a few kilometres. */
  const headOf = useMemo(() => {
    const out = new Map<number, Head>();
    if (!file.data) return out;
    const ids = new Set(file.data.places.map((p) => p[6]));
    const byName = new Map<string, number[]>();
    file.data.places.forEach((p, i) => {
      const k = bare(p[0]);
      byName.set(k, [...(byName.get(k) ?? []), i]);
    });
    for (const h of heads) {
      if (h.region) continue;
      if (h.geo && ids.has(h.geo)) {
        out.set(h.geo, h);
        continue;
      }
      // The same name, and the nearest of them within about a tenth of a degree.
      const near = (byName.get(bare(h.place)) ?? []).map((i) => ({ i, d: Math.hypot(file.data!.places[i][1] - h.lat, file.data!.places[i][2] - h.lon) })).sort((a, b) => a.d - b.d)[0];
      if (near && near.d < 0.12 && !out.has(file.data.places[near.i][6])) out.set(file.data.places[near.i][6], h);
    }
    return out;
  }, [file.data, heads]);
  const matched = useMemo(() => new Set([...headOf.values()].map((h) => h.id)), [headOf]);

  // The lists. With a country picked: its subdivisions with a head, its towns and villages, and its other verified places.
  const subdivisions = heads.filter((h) => h.region && (!q || [h.place, h.head, h.office].some((s) => s.toLowerCase().includes(q))));
  const towns = useMemo(() => {
    const all = file.data?.places ?? [];
    if (!q) return all;
    return all.filter((p) => p[0].toLowerCase().includes(q) || file.data!.regions[p[4]]?.toLowerCase().includes(q) || headOf.get(p[6])?.head.toLowerCase().includes(q));
  }, [file.data, q, headOf]);
  const others = heads.filter((h) => !h.region && !matched.has(h.id) && (!q || [h.place, h.head, h.office].some((s) => s.toLowerCase().includes(q))));
  // With none picked, a search reads every country and every verified head.
  const foundNations = useMemo(() => (q && !c ? NATIONS.filter((n) => n.name.toLowerCase().includes(q) || n.lines.some((l) => l.said.toLowerCase().includes(q))) : []), [q, c]);
  const foundHeads = useMemo(() => (q && !c ? HEADS.filter((p) => [p.place, p.head, p.office].some((s) => s.toLowerCase().includes(q))) : []), [q, c]);

  const pickedHead = picked && "head" in picked ? (HEADS.find((h) => h.id === picked.head) ?? null) : picked && "geo" in picked ? (headOf.get(picked.geo) ?? null) : null;
  const pickedTown = picked && "geo" in picked ? (file.data?.places.find((p) => p[6] === picked.geo) ?? null) : null;

  // The map's projection: the whole world, or the picked country with its places and room around them.
  const proj = useMemo(() => {
    const p = geoEqualEarth();
    const lon = [...(c?.at ? [c.at[0]] : []), ...heads.map((h) => h.lon), ...(file.data?.places ?? []).map((x) => x[2])];
    const lat = [...(c?.at ? [c.at[1]] : []), ...heads.map((h) => h.lat), ...(file.data?.places ?? []).map((x) => x[1])];
    if (!c || !lon.length) return p.fitSize([W, H], { type: "Sphere" });
    // At least eight degrees each way, so that a country of one place is not drawn at the scale of a street. A country
    // that lies across the 180th meridian is drawn from its middle outwards.
    const pad = (lo: number, hi: number) => (hi - lo < 8 ? [(lo + hi) / 2 - 4, (lo + hi) / 2 + 4] : [lo, hi]);
    const lo = lon.reduce((a, b) => Math.min(a, b), 180);
    const hi = lon.reduce((a, b) => Math.max(a, b), -180);
    const [s, n] = pad(lat.reduce((a, b) => Math.min(a, b), 90), lat.reduce((a, b) => Math.max(a, b), -90));
    if (hi - lo > 300) p.rotate([180, 0]);
    const [w, e] = hi - lo > 300 ? [-180, 180] : pad(lo, hi);
    return p.fitExtent(
      [
        [24, 24],
        [W - 24, H - 24],
      ],
      { type: "MultiPoint", coordinates: [[w, s], [w, n], [e, s], [e, n]] },
    );
  }, [c, heads, file.data]);
  const land = useMemo(() => geoPath(proj)(LAND) ?? "", [proj]);
  const dots = useMemo(() => (c ? heads : HEADS).flatMap((p) => ((at) => (at ? [{ p, x: at[0], y: at[1] }] : []))(proj([p.lon, p.lat]))), [c, heads, proj]);
  const marks = useMemo(() => (c ? [c] : STATES).flatMap((n) => ((at) => (at ? [{ n, x: at[0], y: at[1] }] : []))(n.at ? proj(n.at) : null)), [c, proj]);

  // The towns and villages are too many for the page to hold each as an element: they are painted.
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = TOWN;
    ctx.globalAlpha = t.isLight ? 0.75 : 0.9;
    const seen: [number, number, number][] = [];
    if (c) {
      const size = (file.data?.places.length ?? 0) > 4000 ? 1.1 : 1.8;
      (file.data?.places ?? []).forEach((p, i) => {
        const at = proj([p[2], p[1]]);
        if (!at) return;
        ctx.fillRect(at[0] - size / 2, at[1] - size / 2, size, size);
        seen.push([at[0], at[1], i]);
      });
    } else if (world.data) {
      for (let i = 0; i < world.data.length; i += 2) {
        const at = proj([world.data[i] / 100, world.data[i + 1] / 100]);
        if (at) ctx.fillRect(at[0] - 0.4, at[1] - 0.4, 0.8, 0.8);
      }
    }
    drawn.current = seen;
  }, [c, file.data, world.data, proj, t.isLight]);

  const open = (n: Nation) => {
    setCountry(n.key);
    setPicked(null);
    setSearch("");
  };
  const pickHead = (h: Head) => {
    if (h.country !== c?.code && NATION[h.country]) setCountry(h.country);
    setPicked({ head: h.id });
  };
  /** A click on the map that is on no ring or dot: the nearest painted town, if one is within reach. */
  const nearest = (e: MouseEvent<SVGSVGElement>) => {
    if (!c || !file.data || (e.target as Element).tagName === "circle") return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    let best: [number, number] | null = null;
    for (const [px, py, i] of drawn.current) {
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < 64 && (!best || d < best[0])) best = [d, i];
    }
    if (best) setPicked({ geo: file.data.places[best[1]][6] });
  };
  const spot = pickedTown ? proj([pickedTown[2], pickedTown[1]]) : pickedHead ? proj([pickedHead.lon, pickedHead.lat]) : null;

  const nationRow = (n: Nation) => (
    <Row key={n.key} t={t} selected={false} color={COUNTRY} onClick={() => open(n)}>
      {n.code ? <img src={flag(n.code)} alt="" width={20} height={14} className="rounded-[2px] shrink-0" loading="lazy" /> : <span className="w-5 h-3.5 rounded-[2px] shrink-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} aria-hidden />}
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
          {n.name}
        </span>
        <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
          {lead(n) || "A territory: not a state of the list of heads"}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[11px] font-mono font-bold" style={{ color: n.places ? t.headText : t.mutedText }}>
          {n.places ? whole(n.places) : "—"}
        </span>
        <span className="block text-[9px] font-mono" style={{ color: n.confirmed ? ACCENT : t.mutedText }}>
          {n.confirmed ? `${whole(n.confirmed)} heads verified` : "places"}
        </span>
      </span>
    </Row>
  );
  const headRow = (p: Head) => (
    <Row key={p.id} t={t} selected={pickedHead?.id === p.id} color={p.region ? REGION : ACCENT} onClick={() => pickHead(p)}>
      <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: p.region ? REGION : ACCENT }} aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
          {p.head}
        </span>
        <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
          {p.office}
        </span>
      </span>
      <span className="shrink-0 text-right max-w-[40%]">
        <span className="block text-[10px] font-mono font-bold truncate" style={{ color: t.headText }}>
          {p.place}
          {!c && ` · ${p.country}`}
        </span>
        <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
          {since(p) || (p.region ? "subdivision" : "municipality")}
        </span>
      </span>
    </Row>
  );

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full mb-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <MapPin size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">The world's countries, towns and villages, and who leads them</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: COUNTRY + "22", color: t.headText }}>
          {NATIONS.length} countries and territories
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: TOWN + "33", color: t.headText }}>
          {whole(PLACES_TOTAL)} towns and villages
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {whole(HEADS.length)} heads verified
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search countries, places, heads and offices"
          placeholder={c ? `Search ${c.name}'s ${whole(c.places)} towns and villages, its regions and heads…` : "Search every country and every verified head; pick a country to search its towns and villages…"}
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="explorer-panes flex flex-col md:flex-row md:h-[600px]">
        {/* The list: every country, or a country's places, or what a search finds */}
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[360px] md:max-h-none md:h-full md:w-[42%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {c && (
            <button
              type="button"
              onClick={() => {
                setCountry(null);
                setPicked(null);
                setSearch("");
              }}
              className="px-4 pt-3 text-left text-[10px] font-semibold font-sans cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: ACCENT }}
            >
              ← Every country
            </button>
          )}
          {!c && !q && (
            <>
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>
                  Every country and territory · {NATIONS.length} · the number is its towns and villages
                </Label>
              </div>
              {NATIONS.map(nationRow)}
            </>
          )}
          {!c && q && (
            <>
              {foundNations.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>Countries · {foundNations.length}</Label>
                </div>
              )}
              {foundNations.map(nationRow)}
              {foundHeads.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>
                    Places with a verified head · {whole(foundHeads.length)}
                    {foundHeads.length > FOUND ? ` · the first ${FOUND} shown` : ""}
                  </Label>
                </div>
              )}
              {foundHeads.slice(0, FOUND).map(headRow)}
              {foundNations.length + foundHeads.length === 0 && <Empty t={t}>No country or verified head matches. A town or village is found by picking its country first.</Empty>}
            </>
          )}
          {c && (
            <>
              {subdivisions.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>States, provinces and other subdivisions with a verified head · {subdivisions.length}</Label>
                </div>
              )}
              {subdivisions.slice(0, q ? FOUND : SHOWN).map(headRow)}

              <div className="px-4 pt-3 pb-1">
                <Label t={t}>
                  Towns and villages · {file.data ? whole(towns.length) : "…"}
                  {file.data && towns.length > (q ? FOUND : SHOWN) ? ` · the ${q ? FOUND : SHOWN} largest shown${q ? "" : "; search to find the rest"}` : ""}
                </Label>
              </div>
              {!c.code && <Empty t={t}>GeoNames files {c.name}'s places under another country's code, so none are listed here.</Empty>}
              {c.code && !file.data && <Empty t={t}>{file.failed ? `${c.name}'s towns and villages could not be loaded. Try again in a moment.` : `Loading ${c.name}'s ${whole(c.places)} towns and villages…`}</Empty>}
              {towns.slice(0, q ? FOUND : SHOWN).map((p) => {
                const h = headOf.get(p[6]);
                const on = !!picked && "geo" in picked && picked.geo === p[6];
                return (
                  <Row key={p[6]} t={t} selected={on} color={h ? ACCENT : TOWN} onClick={() => setPicked({ geo: p[6] })}>
                    <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: h ? ACCENT : TOWN }} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                        {p[0]}
                      </span>
                      <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                        {[file.data!.regions[p[4]], p[5] <= 6 ? PLACE_KINDS[p[5]] : ""].filter(Boolean).join(" · ") || "Populated place"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right max-w-[44%]">
                      <span className="block text-[10px] font-mono font-bold truncate" style={{ color: h ? ACCENT : t.headText }}>
                        {h ? h.head : p[3] ? whole(p[3]) : "—"}
                      </span>
                      <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                        {h ? h.office : p[3] ? "people" : "no population given"}
                      </span>
                    </span>
                  </Row>
                );
              })}
              {file.data && towns.length === 0 && subdivisions.length + others.length === 0 && <Empty t={t}>{q ? `Nothing in ${c.name} matches the search.` : `GeoNames lists no place of more than 500 people in ${c.name}.`}</Empty>}

              {others.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>
                    Other places with a verified head · {whole(others.length)}
                    {others.length > (q ? FOUND : SHOWN) ? ` · the first ${q ? FOUND : SHOWN} shown` : ""}
                  </Label>
                </div>
              )}
              {others.slice(0, q ? FOUND : SHOWN).map(headRow)}
            </>
          )}
        </div>

        {/* The map and what is picked */}
        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          <Block>
            <div className="relative rounded-xl overflow-hidden" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
              <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" aria-hidden>
                <path d={land} fill={t.isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"} stroke={t.gridLine} strokeWidth={0.5} />
              </svg>
              <canvas ref={canvas} width={W * 2} height={H * 2} className="absolute inset-0 w-full h-full" aria-hidden />
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="absolute inset-0 w-full h-full"
                role="img"
                onClick={nearest}
                aria-label={
                  c
                    ? `${c.name}: its ${whole(c.places)} towns and villages, each a point where it is, and the ${c.confirmed} places with a verified head.`
                    : `The world: the ${whole(PLACES_WORLD.count)} places of ${whole(PLACES_WORLD.atLeast)} people or more, each country a ring, and the ${whole(HEADS.length)} places with a verified head.`
                }
              >
                {dots.map(({ p, x, y }) => (
                  <circle key={p.id} cx={x} cy={y} r={p.region ? (c ? 3 : 1.6) : c ? 2 : 1} fill={p.region ? REGION : ACCENT} fillOpacity={0.9} onClick={() => pickHead(p)} className="cursor-pointer">
                    <title>{`${p.place}: ${p.head}, ${p.office}`}</title>
                  </circle>
                ))}
                {marks.map(({ n, x, y }) => (
                  <circle key={n.key} cx={x} cy={y} r={c ? 6 : 2.6} fill="none" stroke={COUNTRY} strokeWidth={c ? 2 : 1} onClick={() => open(n)} className="cursor-pointer" pointerEvents="all">
                    <title>{`${n.name}: ${lead(n)}`}</title>
                  </circle>
                ))}
                {spot && <circle cx={spot[0]} cy={spot[1]} r={6} fill="none" stroke={t.headText} strokeWidth={2} pointerEvents="none" />}
              </svg>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-sans" style={{ color: t.mutedText }}>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5" style={{ background: TOWN }} aria-hidden />
                {c ? "A town or village" : `A place of ${whole(PLACES_WORLD.atLeast)} people or more`}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} aria-hidden />A place with a verified head
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: REGION }} aria-hidden />A state or province with one
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ border: `1.5px solid ${COUNTRY}` }} aria-hidden />A country
              </span>
              <span>{c ? `${c.name}, drawn to its places · click a point for the place` : "Equal Earth projection · pick a country for all of its towns and villages"}</span>
            </p>
          </Block>

          {pickedTown || pickedHead ? (
            <Block>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: pickedHead?.region ? REGION : pickedHead ? ACCENT : TOWN }}>
                  {pickedHead?.region ? `Subdivision · ${pickedHead.region}` : pickedTown ? PLACE_KINDS[pickedTown[5]] : "Municipality"}
                </p>
                <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                  {pickedTown ? pickedTown[0] : pickedHead!.place}
                </p>
                <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                  {[pickedTown && file.data ? file.data.regions[pickedTown[4]] : "", NATION[pickedHead?.country ?? c?.key ?? ""]?.name ?? c?.name].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Kpi
                  t={t}
                  label="People"
                  value={pickedTown ? (pickedTown[3] ? whole(pickedTown[3]) : "not given") : pickedHead!.pop > 0 ? whole(pickedHead!.pop) : "not recorded"}
                  color={t.headText}
                  sub={pickedTown ? "as GeoNames gives it" : "as Wikidata records it"}
                />
                <Kpi t={t} label="Head" value={pickedHead ? pickedHead.head : "none verified"} color={pickedHead ? ACCENT : t.mutedText} sub={pickedHead ? `${pickedHead.office}${pickedHead.since ? ` · since ${pickedHead.since}` : ""}` : "no three records agree on one"} />
              </div>
              {!pickedHead && (
                <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                  GeoNames says where {pickedTown![0]} is and how many live there, not who leads it. No head is shown because none passed the check - Wikidata either records none for it
                  or its records do not agree - and none is guessed.
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {pickedTown && (
                  <a href={`https://www.geonames.org/${pickedTown[6]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                    Its GeoNames record <ArrowSquareOut size={11} aria-hidden />
                  </a>
                )}
                {pickedHead && (
                  <>
                    <a href={wiki(pickedHead.article)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                      The place's Wikipedia article <ArrowSquareOut size={11} aria-hidden />
                    </a>
                    <a href={`https://www.wikidata.org/wiki/${pickedHead.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                      Its Wikidata record <ArrowSquareOut size={11} aria-hidden />
                    </a>
                  </>
                )}
              </div>
            </Block>
          ) : c ? (
            <>
              {c.lines.length > 0 && (
                <Block>
                  <Label t={t}>{c.name} · the country's own heads</Label>
                  <div className="flex flex-col">
                    {c.lines.map((l, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                        <span className="text-[11px] font-sans font-semibold min-w-0" style={{ color: t.headText }}>
                          {l.said}
                        </span>
                        <span className="text-[9px] font-mono shrink-0 text-right" style={{ color: l.executive ? COUNTRY : t.mutedText }}>
                          {ROLE[l.role]}
                          {l.executive ? " · executive" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </Block>
              )}
              <Block>
                <Label t={t}>{c.name} · towns, villages and their heads</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Kpi t={t} label="Towns and villages" value={whole(c.places)} color={t.headText} sub="in GeoNames" />
                  <Kpi t={t} label="Heads verified" value={whole(c.confirmed)} color={ACCENT} sub="three records agree" />
                  <Kpi t={t} label="Heads recorded" value={whole(c.recorded)} color={t.headText} sub="by Wikidata, unchecked" />
                  <Kpi t={t} label="Subdivisions" value={whole(heads.filter((p) => p.region).length)} color={REGION} sub="with a verified head" />
                </div>
              </Block>
            </>
          ) : (
            <Block>
              <Label t={t}>The world</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi t={t} label="Countries" value={String(NATIONS.length)} color={COUNTRY} sub={`${STATES.length} states, ${TERRITORIES.length} territories`} />
                <Kpi t={t} label="Towns and villages" value={whole(PLACES_TOTAL)} color={t.headText} sub="in GeoNames" />
                <Kpi t={t} label="Heads verified" value={whole(HEADS.length)} color={ACCENT} sub={`of ${whole(SRC.recorded)} recorded`} />
                <Kpi t={t} label="Drawn here" value={whole(PLACES_WORLD.count)} color={t.headText} sub={`places of ${whole(PLACES_WORLD.atLeast)}+ people`} />
              </div>
            </Block>
          )}

          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            The towns and villages are GeoNames' own cut of the world: every populated place of more than 500 people and every seat of an administrative division, in every
            country and territory; a smaller hamlet that is the seat of nothing is not in it. GeoNames does not say who leads a place, and no register of the world's
            municipalities does. A head is shown only where three records name the same living person, with no end date - the place's Wikidata record, the records of everyone
            holding the office, and the infobox of the place's English Wikipedia article; {whole(HEADS.length)} places pass, of {whole(SRC.recorded)} Wikidata records a head
            for, and every other place says that none is verified. A country's own heads are as Wikipedia's list of current heads of state and government gives them.
            {SRC.check &&
              ` Where the site holds its own list to check against, the rule named the same person for ${SRC.check.governors.agree} of ${SRC.check.governors.checked} US governors and ${SRC.check.mayors.agree} of ${SRC.check.mayors.checked} mayors of the largest US cities.`}{" "}
            Records can still be out of date together after an election: open the place's article before relying on a name. Read on {SRC.retrieved}.
          </p>
          <SourceLink sources={[PLACES_SOURCE.geonames, SRC.list, SRC.wikidata, SRC.wikipedia]} />
          <GoButton color={ACCENT} onClick={() => navigate("/dashboard/world-leaders")}>
            Each national leader's profile is on the World Leaders page
          </GoButton>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {c
            ? `${c.name}: ${whole(c.places)} towns and villages · ${whole(c.confirmed)} heads verified of ${whole(c.recorded)} recorded`
            : q
              ? `${foundNations.length} countries and ${whole(foundHeads.length)} verified heads found`
              : `${NATIONS.length} countries and territories · ${whole(PLACES_TOTAL)} towns and villages · ${whole(HEADS.length)} heads verified`}{" "}
          · GeoNames to {PLACES_SOURCE.updated} · read on {SRC.retrieved}
        </span>
      </div>
    </div>
  );
}
