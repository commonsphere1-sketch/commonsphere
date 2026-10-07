/**
 * The World Maps page's explorer of who leads the world's regions and
 * municipalities: a list beside a map, in the pieces the site's other
 * explorers are made of (DataExplorer).
 *
 * Every row is read from representatives.ts (build-representatives.cjs).
 * There is no register of the world's municipalities and their leaders, and
 * the widest open record of them - Wikidata's - is not reliable on its own.
 * So a place is here only where three records agree on one living person as
 * its head: the place's Wikidata record, the records of the office's
 * holders, and the infobox of the place's English Wikipedia article. A place
 * that fails any of the three is left out, not filled in, and the panel says
 * for every country how many were recorded and how many confirmed - the gap
 * is shown, not hidden. Nothing is typed in here.
 *
 * The map draws every confirmed place where it is; picking a country draws it
 * closer. A count is the only thing worked out, and the panel says what of.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { ArrowSquareOut, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import { REPRESENTATIVES, REPRESENTATIVE_COUNTRIES, REPRESENTATIVES_SOURCES as SRC } from "../data/representatives";
import { Block, Empty, GoButton, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Place = { key: string; country: string; place: string; region: string; head: string; office: string; since: string; lat: number; lon: number; pop: number; id: string; article: string };
const PLACES: Place[] = REPRESENTATIVES.map(([country, place, region, head, office, since, lat, lon, pop, id, article]) => ({ key: id, country, place, region, head, office, since, lat, lon, pop, id, article }));
/** Countries with a confirmed place, the most first; and the rest Wikidata records heads for, none of them confirmed. */
const COUNTRIES = Object.entries(REPRESENTATIVE_COUNTRIES)
  .map(([code, [name, recorded, confirmed]]) => ({ code, name, recorded, confirmed }))
  .sort((a, b) => b.confirmed - a.confirmed || a.name.localeCompare(b.name));
const WITH = COUNTRIES.filter((c) => c.confirmed > 0);
const WITHOUT = COUNTRIES.filter((c) => c.confirmed === 0 && c.recorded > 0);

const ACCENT = "#0ea5e9";
const REGION = "#f59e0b";
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

  const inCountry = useMemo(() => (country ? PLACES.filter((p) => p.country === country) : []), [country]);
  /** A search reads every place, head and office; with a country picked, that country's only. */
  const found = useMemo(() => (q ? (country ? inCountry : PLACES).filter((p) => [p.place, p.head, p.office].some((s) => s.toLowerCase().includes(q))) : []), [q, country, inCountry]);
  const picked = pickedId ? (PLACES.find((p) => p.id === pickedId) ?? null) : null;
  const c = country ? COUNTRIES.find((x) => x.code === country)! : null;
  const rows = q ? found : inCountry;
  const regions = rows.filter((p) => p.region);
  const towns = rows.filter((p) => !p.region);

  // The map: the whole world, or the picked country's places with room around them.
  const { land, dots } = useMemo(() => {
    const proj = geoEqualEarth();
    if (inCountry.length) {
      const lon = inCountry.map((p) => p.lon);
      const lat = inCountry.map((p) => p.lat);
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
    const shown = inCountry.length ? inCountry : PLACES;
    return {
      land: geoPath(proj)(LAND) ?? "",
      dots: shown.flatMap((p) => {
        const at = proj([p.lon, p.lat]);
        return at ? [{ p, x: at[0], y: at[1] }] : [];
      }),
    };
  }, [inCountry]);

  const pick = (p: Place) => {
    setPickedId(p.id);
    if (p.country !== country) setCountry(p.country);
  };
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
          {!country && ` · ${p.country}`}
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
        <h2 className="text-[11px] font-bold font-sans">Who leads the world's regions and municipalities</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {whole(PLACES.length)} confirmed
        </span>
        <span className="text-[10px] font-sans ml-auto" style={{ color: t.mutedText }}>
          of {whole(SRC.recorded)} recorded · {WITH.length} countries
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search places, heads and offices"
          placeholder={country ? `Search ${c?.name}'s places, heads and offices…` : "Search every place, head and office…"}
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="explorer-panes flex flex-col md:flex-row md:h-[560px]">
        {/* The list: countries, or a country's places, or what a search finds */}
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[340px] md:max-h-none md:h-full md:w-[42%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {country && (
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
          {!country && !q && (
            <>
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>Countries · {WITH.length} · most places confirmed first</Label>
              </div>
              {WITH.map((x) => (
                <Row key={x.code} t={t} selected={false} color={ACCENT} onClick={() => setCountry(x.code)}>
                  <img src={flag(x.code)} alt="" width={20} height={14} className="rounded-[2px] shrink-0" loading="lazy" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                      {x.name}
                    </span>
                    <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                      {whole(x.recorded)} recorded
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] font-mono font-bold" style={{ color: t.headText }}>
                      {whole(x.confirmed)}
                    </span>
                    <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                      confirmed
                    </span>
                  </span>
                </Row>
              ))}
              {WITHOUT.length > 0 && (
                <p className="px-4 py-3 text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                  In {WITHOUT.length} more countries and territories a head is recorded for {whole(WITHOUT.reduce((n, x) => n + x.recorded, 0))} places, and for none of them do the three
                  records agree: {WITHOUT.slice(0, 40).map((x) => x.name).join(", ")}
                  {WITHOUT.length > 40 ? " and others" : ""}. They are not shown.
                </p>
              )}
            </>
          )}
          {(country || q) && (
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
              {rows.length === 0 && <Empty t={t}>{q ? "No confirmed place, head or office matches the search." : "No place is confirmed here."}</Empty>}
            </>
          )}
        </div>

        {/* The map and what is picked */}
        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          <Block>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} role="img" aria-label={c ? `${c.name}: the ${c.confirmed} places with a confirmed head, each a dot where it is.` : `The world: the ${PLACES.length} places with a confirmed head, each a dot where it is.`}>
              <path d={land} fill={t.isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"} stroke={t.gridLine} strokeWidth={0.5} />
              {dots.map(({ p, x, y }) => (
                <circle key={p.id} cx={x} cy={y} r={picked?.id === p.id ? 5 : p.region ? (c ? 3 : 1.6) : c ? 2 : 1} fill={p.region ? REGION : ACCENT} fillOpacity={picked && picked.id !== p.id ? 0.45 : 0.85} stroke={picked?.id === p.id ? t.headText : "none"} strokeWidth={1.5} onClick={() => pick(p)} className="cursor-pointer">
                  <title>{`${p.place}: ${p.head}, ${p.office}`}</title>
                </circle>
              ))}
            </svg>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-sans" style={{ color: t.mutedText }}>
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
                  {picked.office} · {picked.place}, {REPRESENTATIVE_COUNTRIES[picked.country]?.[0] ?? picked.country}
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
          ) : (
            <Block>
              <Label t={t}>{c ? c.name : "The world"}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi t={t} label="Confirmed" value={whole(c ? c.confirmed : PLACES.length)} color={t.headText} sub="places with a head" />
                <Kpi t={t} label="Recorded" value={whole(c ? c.recorded : SRC.recorded)} color={t.headText} sub="by Wikidata" />
                <Kpi t={t} label="Subdivisions" value={whole((c ? inCountry : PLACES).filter((p) => p.region).length)} color={REGION} sub="states, provinces…" />
                <Kpi t={t} label="Municipalities" value={whole((c ? inCountry : PLACES).filter((p) => !p.region).length)} color={ACCENT} sub="and other places" />
              </div>
            </Block>
          )}

          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            No register lists the world's municipalities and who leads them, so this is not all of them. A place is shown only where three records name the same living person
            as its head, with no end date: the place's Wikidata record, the records of everyone holding the office, and the infobox of the place's English Wikipedia article.
            The other {whole(SRC.recorded - PLACES.length)} of the {whole(SRC.recorded)} places Wikidata records a head for failed one of the three - or are countries, whose leaders
            are on the World Leaders page - and are left out, not filled in. A year is given only where the place's record and the holder's agree on it.
            {SRC.check &&
              ` Where the site holds its own list to check against, the rule named the same person for ${SRC.check.governors.agree} of ${SRC.check.governors.checked} US governors and ${SRC.check.mayors.agree} of ${SRC.check.mayors.checked} mayors of the largest US cities; a place those lists contradict is not shown.`}{" "}
            Three records can still be out of date together after an election: open the place's article before relying on a name. Read on {SRC.retrieved}.
          </p>
          <SourceLink sources={[SRC.wikidata, SRC.wikipedia]} />
          <GoButton color={ACCENT} onClick={() => navigate("/dashboard/world-leaders")}>
            National leaders are on the World Leaders page
          </GoButton>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {q ? `${whole(found.length)} found` : c ? `${whole(c.confirmed)} of ${whole(c.recorded)} recorded places confirmed in ${c.name}` : `${whole(PLACES.length)} places in ${WITH.length} countries`} · read on {SRC.retrieved}
        </span>
      </div>
    </div>
  );
}
