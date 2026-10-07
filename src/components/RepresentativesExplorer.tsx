/**
 * The World Maps page's explorer of who leads the world's countries, regions
 * and municipalities: a list beside a map, in the pieces the site's other
 * explorers are made of (DataExplorer).
 *
 * Every row is read from representatives.ts (build-representatives.cjs), at
 * two levels, and the panel says which is which:
 *
 *   Every country   its head of state and of government as Wikipedia's "List
 *                   of current heads of state and government" gives them, at
 *                   the revision the sources link - the list the World
 *                   Leaders page is audited against. All of its states are
 *                   here, the ones with limited recognition among them.
 *   Regions and     there is no register of the world's municipalities and
 *   municipalities  their leaders, and the widest open record of them -
 *                   Wikidata's - is not reliable on its own. A place is here
 *                   only where three records agree on one living person as
 *                   its head: the place's Wikidata record, the records of
 *                   the office's holders, and the infobox of the place's
 *                   English Wikipedia article. A place that fails any of the
 *                   three is left out, not filled in.
 *
 * So every country is listed, most of them by their national heads alone,
 * and each says how many of its places were recorded and how many confirmed:
 * the gap is shown, not hidden. Nothing is typed in here. The map draws every
 * country and every confirmed place where it is; picking a country draws it
 * closer. A count is the only thing worked out, and the panel says what of.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { ArrowSquareOut, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import { NATIONAL_HEADS, REPRESENTATIVES, REPRESENTATIVE_COUNTRIES, REPRESENTATIVES_SOURCES as SRC } from "../data/representatives";
import { Block, Empty, GoButton, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Place = { country: string; place: string; region: string; head: string; office: string; since: string; lat: number; lon: number; pop: number; id: string; article: string };
const PLACES: Place[] = REPRESENTATIVES.map(([country, place, region, head, office, since, lat, lon, pop, id, article]) => ({ country, place, region, head, office, since, lat, lon, pop, id, article }));

type Line = { role: "state" | "government" | "both"; said: string; executive: boolean };
/** A country: its lines in the list of heads of state and government, and how many of its places are recorded and confirmed. */
type Nation = { key: string; code: string; name: string; lat: number; lon: number; lines: Line[]; recorded: number; confirmed: number };
const NATIONS: Nation[] = NATIONAL_HEADS.map(([code, name, lat, lon, lines]) => ({
  // A state with no ISO code is known by its name.
  key: code || name,
  code,
  name,
  lat,
  lon,
  lines: lines.map(([role, said, executive]) => ({ role, said, executive: executive === 1 })),
  recorded: (code && REPRESENTATIVE_COUNTRIES[code]?.[1]) || 0,
  confirmed: (code && REPRESENTATIVE_COUNTRIES[code]?.[2]) || 0,
}));
const NATION: Record<string, Nation> = Object.fromEntries(NATIONS.map((n) => [n.key, n]));
/** The line the list marks as holding executive power, or its first. */
const lead = (n: Nation) => (n.lines.find((l) => l.executive) ?? n.lines[0])?.said ?? "";
const ROLE: Record<Line["role"], string> = { state: "Head of state", government: "Head of government", both: "State and government" };

const ACCENT = "#0ea5e9";
const REGION = "#f59e0b";
const COUNTRY = "#a855f7";
const W = 720;
const H = 360;
const LAND = feature(worldTopo as unknown as Topology, (worldTopo as unknown as Topology).objects.land);
/** How many rows of a list are drawn until it is searched. */
const SHOWN = 60;

const whole = (n: number) => n.toLocaleString("en-US");
const flag = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
/** "since 2019": the year, where the place's record and the holder's give the same one. */
const since = (p: Place) => (p.since ? `since ${p.since}` : "");

export default function RepresentativesExplorer() {
  const t = useTokens();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const q = search.trim().toLowerCase();

  const c = country ? (NATION[country] ?? null) : null;
  const inCountry = useMemo(() => (c?.code ? PLACES.filter((p) => p.country === c.code) : []), [c]);
  /** A search reads every country, place, head and office; with a country picked, that country's places only. */
  const foundPlaces = useMemo(() => (q ? (c ? inCountry : PLACES).filter((p) => [p.place, p.head, p.office].some((s) => s.toLowerCase().includes(q))) : []), [q, c, inCountry]);
  const foundNations = useMemo(() => (q && !c ? NATIONS.filter((n) => n.name.toLowerCase().includes(q) || n.lines.some((l) => l.said.toLowerCase().includes(q))) : []), [q, c]);
  const picked = pickedId ? (PLACES.find((p) => p.id === pickedId) ?? null) : null;
  const rows = q ? foundPlaces : inCountry;
  const regions = rows.filter((p) => p.region);
  const towns = rows.filter((p) => !p.region);

  // The map: the whole world, or the picked country with its places and room around them.
  const { land, dots, marks } = useMemo(() => {
    const proj = geoEqualEarth();
    if (c) {
      const lon = [c.lon, ...inCountry.map((p) => p.lon)];
      const lat = [c.lat, ...inCountry.map((p) => p.lat)];
      // At least eight degrees each way, so that a country with one place is not drawn at the scale of a street.
      const pad = (lo: number, hi: number) => (hi - lo < 8 ? [(lo + hi) / 2 - 4, (lo + hi) / 2 + 4] : [lo, hi]);
      const [w, e] = pad(Math.min(...lon), Math.max(...lon));
      const [s, n] = pad(Math.min(...lat), Math.max(...lat));
      proj.fitExtent(
        [
          [28, 28],
          [W - 28, H - 28],
        ],
        { type: "MultiPoint", coordinates: [[w, s], [w, n], [e, s], [e, n], ...inCountry.map((p) => [p.lon, p.lat])] },
      );
    } else proj.fitSize([W, H], { type: "Sphere" });
    return {
      land: geoPath(proj)(LAND) ?? "",
      dots: (c ? inCountry : PLACES).flatMap((p) => {
        const at = proj([p.lon, p.lat]);
        return at ? [{ p, x: at[0], y: at[1] }] : [];
      }),
      marks: (c ? [c] : NATIONS).flatMap((n) => {
        const at = proj([n.lon, n.lat]);
        return at ? [{ n, x: at[0], y: at[1] }] : [];
      }),
    };
  }, [c, inCountry]);

  const pick = (p: Place) => {
    setPickedId(p.id);
    if (p.country !== c?.code) setCountry(p.country);
  };
  const open = (n: Nation) => {
    setCountry(n.key);
    setPickedId(null);
    setSearch("");
  };
  const nationRow = (n: Nation) => (
    <Row key={n.key} t={t} selected={false} color={COUNTRY} onClick={() => open(n)}>
      {n.code ? <img src={flag(n.code)} alt="" width={20} height={14} className="rounded-[2px] shrink-0" loading="lazy" /> : <span className="w-5 h-3.5 rounded-[2px] shrink-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} aria-hidden />}
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
          {n.name}
        </span>
        <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
          {lead(n)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[11px] font-mono font-bold" style={{ color: n.confirmed ? t.headText : t.mutedText }}>
          {n.confirmed ? whole(n.confirmed) : "—"}
        </span>
        <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
          {n.confirmed ? "places" : "national"}
        </span>
      </span>
    </Row>
  );
  const placeRow = (p: Place) => (
    <Row key={p.id} t={t} selected={picked?.id === p.id} color={p.region ? REGION : ACCENT} onClick={() => pick(p)}>
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
        <h2 className="text-[11px] font-bold font-sans">Who leads the world's countries, regions and municipalities</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: COUNTRY + "22", color: t.headText }}>
          {NATIONS.length} countries
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {whole(PLACES.length)} places confirmed
        </span>
        <span className="text-[10px] font-sans ml-auto" style={{ color: t.mutedText }}>
          of {whole(SRC.recorded)} recorded
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
          placeholder={c ? `Search ${c.name}'s places, heads and offices…` : "Search every country, place, head and office…"}
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="explorer-panes flex flex-col md:flex-row md:h-[580px]">
        {/* The list: every country, or a country's places, or what a search finds */}
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[340px] md:max-h-none md:h-full md:w-[42%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {c && (
            <button
              type="button"
              onClick={() => {
                setCountry(null);
                setPickedId(null);
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
                  Every country · {NATIONS.length} · {NATIONS.filter((n) => n.confirmed).length} with confirmed places
                </Label>
              </div>
              {NATIONS.map(nationRow)}
            </>
          )}
          {!c && q && foundNations.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>Countries · {foundNations.length}</Label>
              </div>
              {foundNations.map(nationRow)}
            </>
          )}
          {(c || q) && (
            <>
              {regions.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>States, provinces and other subdivisions · {regions.length}</Label>
                </div>
              )}
              {regions.slice(0, q ? 200 : SHOWN).map(placeRow)}
              {towns.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>
                    Municipalities and other places · {whole(towns.length)}
                    {!q && towns.length > SHOWN ? ` · the ${SHOWN} largest shown; search to find the rest` : ""}
                  </Label>
                </div>
              )}
              {towns.slice(0, q ? 200 : SHOWN).map(placeRow)}
              {rows.length === 0 && (!q || foundNations.length === 0) && (
                <Empty t={t}>
                  {q
                    ? "No country, confirmed place, head or office matches the search."
                    : `No region or municipality of ${c?.name} passed the three-record check${c?.recorded ? `: ${whole(c.recorded)} are recorded, and for none do the records agree` : ": none is recorded with an office and a head"}. Its national heads are beside the map.`}
                </Empty>
              )}
            </>
          )}
        </div>

        {/* The map and what is picked */}
        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          <Block>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} role="img" aria-label={c ? `${c.name}, with the ${c.confirmed} places that have a confirmed head, each a dot where it is.` : `The world: ${NATIONS.length} countries, each a ring, and the ${PLACES.length} places with a confirmed head, each a dot where it is.`}>
              <path d={land} fill={t.isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"} stroke={t.gridLine} strokeWidth={0.5} />
              {dots.map(({ p, x, y }) => (
                <circle key={p.id} cx={x} cy={y} r={picked?.id === p.id ? 5 : p.region ? (c ? 3 : 1.6) : c ? 2 : 1} fill={p.region ? REGION : ACCENT} fillOpacity={picked && picked.id !== p.id ? 0.45 : 0.85} stroke={picked?.id === p.id ? t.headText : "none"} strokeWidth={1.5} onClick={() => pick(p)} className="cursor-pointer">
                  <title>{`${p.place}: ${p.head}, ${p.office}`}</title>
                </circle>
              ))}
              {marks.map(({ n, x, y }) => (
                <circle key={n.key} cx={x} cy={y} r={c ? 6 : 2.6} fill="none" stroke={COUNTRY} strokeWidth={c ? 2 : 1} onClick={() => open(n)} className="cursor-pointer" pointerEvents="all">
                  <title>{`${n.name}: ${lead(n)}`}</title>
                </circle>
              ))}
            </svg>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-sans" style={{ color: t.mutedText }}>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ border: `1.5px solid ${COUNTRY}` }} aria-hidden />A country
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: REGION }} aria-hidden />A state, province or other subdivision with an ISO 3166-2 code
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} aria-hidden />A municipality or other place
              </span>
              <span>{c ? `${c.name}, drawn to its confirmed places` : "Equal Earth projection · pick a country to draw it closer"}</span>
            </p>
          </Block>

          {picked ? (
            <Block>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: picked.region ? REGION : ACCENT }}>
                  {picked.region ? `Subdivision · ${picked.region}` : "Municipality"}
                </p>
                <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                  {picked.head}
                </p>
                <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                  {picked.office} · {picked.place}, {NATION[picked.country]?.name ?? REPRESENTATIVE_COUNTRIES[picked.country]?.[0] ?? picked.country}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Kpi t={t} label="In office since" value={picked.since || "not confirmed"} color={t.headText} sub={picked.since ? "the year both records give" : "the two records give no one year"} />
                <Kpi t={t} label="People" value={picked.pop > 0 ? whole(picked.pop) : "not recorded"} color={t.headText} sub={picked.pop > 0 ? "as Wikidata records it" : undefined} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <a href={wiki(picked.article)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                  The place's Wikipedia article <ArrowSquareOut size={11} aria-hidden />
                </a>
                <a href={`https://www.wikidata.org/wiki/${picked.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                  Its Wikidata record <ArrowSquareOut size={11} aria-hidden />
                </a>
              </div>
            </Block>
          ) : c ? (
            <>
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
                <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                  As Wikipedia's list of current heads of state and government writes them; "executive" is the line the list marks as holding executive power.
                </p>
              </Block>
              <Block>
                <Label t={t}>{c.name} · regions and municipalities</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Kpi t={t} label="Confirmed" value={whole(c.confirmed)} color={t.headText} sub="places with a head" />
                  <Kpi t={t} label="Recorded" value={whole(c.recorded)} color={t.headText} sub="by Wikidata" />
                  <Kpi t={t} label="Subdivisions" value={whole(inCountry.filter((p) => p.region).length)} color={REGION} sub="states, provinces…" />
                  <Kpi t={t} label="Municipalities" value={whole(inCountry.filter((p) => !p.region).length)} color={ACCENT} sub="and other places" />
                </div>
              </Block>
            </>
          ) : (
            <Block>
              <Label t={t}>The world</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi t={t} label="Countries" value={String(NATIONS.length)} color={COUNTRY} sub="with their heads" />
                <Kpi t={t} label="Places confirmed" value={whole(PLACES.length)} color={t.headText} sub={`of ${whole(SRC.recorded)} recorded`} />
                <Kpi t={t} label="Subdivisions" value={whole(PLACES.filter((p) => p.region).length)} color={REGION} sub="states, provinces…" />
                <Kpi t={t} label="Municipalities" value={whole(PLACES.filter((p) => !p.region).length)} color={ACCENT} sub="and other places" />
              </div>
            </Block>
          )}

          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            Every country is here by its head of state and of government, as Wikipedia's list of current heads of state and government gives them at the revision linked below -
            one curated list, the one the World Leaders page is checked against. Below that level no register exists, so the regions and municipalities are not all of them: a
            place is shown only where three records name the same living person as its head, with no end date - the place's Wikidata record, the records of everyone holding the
            office, and the infobox of the place's English Wikipedia article. The other {whole(SRC.recorded - PLACES.length)} of the {whole(SRC.recorded)} places Wikidata records
            a head for failed one of the three, or are countries, and are left out, not filled in. A year is given only where the place's record and the holder's agree on it.
            {SRC.check &&
              ` Where the site holds its own list to check against, the rule named the same person for ${SRC.check.governors.agree} of ${SRC.check.governors.checked} US governors and ${SRC.check.mayors.agree} of ${SRC.check.mayors.checked} mayors of the largest US cities; a place those lists contradict is not shown.`}{" "}
            Records can still be out of date together after an election: open the place's article before relying on a name. Read on {SRC.retrieved}.
          </p>
          <SourceLink sources={[SRC.list, SRC.wikidata, SRC.wikipedia]} />
          <GoButton color={ACCENT} onClick={() => navigate("/dashboard/world-leaders")}>
            Each national leader's profile is on the World Leaders page
          </GoButton>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {q ? `${foundNations.length ? `${foundNations.length} countries and ` : ""}${whole(foundPlaces.length)} places found` : c ? `${c.name}: ${c.lines.length} national lines · ${whole(c.confirmed)} of ${whole(c.recorded)} recorded places confirmed` : `${NATIONS.length} countries · ${whole(PLACES.length)} places in ${NATIONS.filter((n) => n.confirmed).length} of them`} · read on {SRC.retrieved}
        </span>
      </div>
    </div>
  );
}
