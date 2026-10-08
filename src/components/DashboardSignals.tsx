/**
 * Four Dashboard cards for the parts of the site the Dashboard did not yet
 * show: the countries set against each other, the climate, aid and human
 * rights, and how the world's people live.
 *
 *   Countries         the ten highest or the ten lowest countries on a
 *                     measure the reader picks - output a person, life
 *                     expectancy, growth, unemployment, inflation - from the
 *                     country figures the Countries page shows
 *                     (countryIndicators.ts). A place in the order is worked
 *                     out here; every figure is its publisher's, with its
 *                     year beside it. Only figures for the measure's latest
 *                     two years are ranked, so an old figure is not set
 *                     against a new one.
 *   Climate           the latest reading of each climate indicator and the
 *                     same period ten years before (climateIndicators.ts:
 *                     NOAA, NASA, NSIDC), and where each of the nine
 *                     planetary boundaries stands (planetaryBoundaries.ts:
 *                     the Planetary Health Check).
 *   Aid & human       world series from worldview.ts: the people displaced,
 *     rights          hungry and poor, and V-Dem's measures of liberty.
 *   How the world     world series from worldview.ts: life, schooling and
 *     lives           the services people have.
 *
 * A change is one published figure on another - a rate in points, anything
 * else as a percentage of the year before - and is coloured only where the
 * series itself says which way is better. Nothing here is a forecast or a
 * score of the site's own.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowsLeftRight, Globe, HandHeart, Heartbeat, Leaf } from "@phosphor-icons/react";
import { CLIMATE_INDICATORS, CLIMATE_RETRIEVED } from "../data/climateIndicators";
import { countriesData } from "../data/countriesData";
import { COUNTRY_INDICATOR_FALLBACKS, COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE, type CountryIndicators } from "../data/countryIndicators";
import { BOUNDARIES, PHC_2026, TRANSGRESSED, type Zone } from "../data/planetaryBoundaries";
import { WORLD, type WorldIndicator } from "../data/worldview";
import { Card, Go, Head, Kicker } from "./DashboardCitiesSectors";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
const GREEN = "#10b981";
const RED = "#ef4444";
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : a >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : whole(v);
};
/** The publisher as its source names it, without the "(via ...)" that says where the site read it, or what follows a dash. */
const publisher = (label: string) => label.replace(/ \(via [^)]*\)$/, "").split(" — ")[0];
const track = (t: Tokens) => (t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)");

const Note = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
    {children}
  </p>
);

// ── World series: aid and human rights, and how the world lives ─────────────

/** A world figure as its series prints it. */
const printWorld = (ind: WorldIndicator, v: number) =>
  ind.format === "pct" ? `${v.toFixed(ind.dp)}%` : ind.format === "usd" ? `$${compact(v)}` : ind.format === "count" ? compact(v) : v.toFixed(ind.dp);

/** A series as a line between its own lowest and highest, with the latest year marked: its shape, not its size. */
function Spark({ points, color }: { points: [number, number][]; color: string }) {
  const ys = points.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i: number) => 1 + (i / Math.max(1, points.length - 1)) * 58;
  const y = (v: number) => 15 - ((v - lo) / (hi - lo || 1)) * 13;
  const d = points.map(([, v], i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 60 16" className="w-14 h-4 shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(ys[ys.length - 1])} r={1.6} fill={color} />
    </svg>
  );
}

type Signal = { id: string; color: string };

function SignalRow({ t, ind, color, last }: { t: Tokens; ind: WorldIndicator; color: string; last: boolean }) {
  const s = ind.series;
  const [year, now] = s[s.length - 1];
  const before = s.find(([y]) => y === year - 1)?.[1];
  // A rate is compared in points; anything else as a percentage of the year before.
  const rate = ind.format === "pct";
  const change = before === undefined ? null : rate ? now - before : before !== 0 ? (100 * (now - before)) / Math.abs(before) : null;
  const good = change === null || change === 0 || ind.upIsGood === null ? null : change > 0 === ind.upIsGood;
  const tone = good === null ? t.bodyText : good ? GREEN : RED;
  return (
    <li
      className="flex items-center gap-2 py-2"
      style={{ borderBottom: last ? "none" : `1px solid ${t.gridLine}` }}
      title={`${ind.label}, ${s[0][0]} to ${year} · ${ind.source.label}${before !== undefined ? ` · ${year - 1}: ${printWorld(ind, before)}` : ""}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
          {ind.label}
        </span>
        <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
          {ind.unit} · {publisher(ind.source.label)}
        </span>
      </span>
      <Spark points={s} color={color} />
      <span className="text-right shrink-0 w-16">
        <span className="block text-[11px] font-mono font-bold" style={{ color: t.headText }}>
          {printWorld(ind, now)}
        </span>
        <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
          {year}
        </span>
      </span>
      <span className="flex items-center justify-end gap-0.5 text-[10px] font-mono font-semibold shrink-0 w-[4.5rem]" style={{ color: change === null ? t.mutedText : tone }}>
        {change === null ? (
          "—"
        ) : (
          <>
            {change > 0 ? <ArrowUp size={9} weight="bold" aria-hidden /> : change < 0 ? <ArrowDown size={9} weight="bold" aria-hidden /> : null}
            {change > 0 ? "+" : change < 0 ? "−" : ""}
            {Math.abs(change).toFixed(1)}
            {rate ? " pts" : "%"}
          </>
        )}
      </span>
    </li>
  );
}

function SignalsCard({ icon, label, badge, color, cta, to, intro, signals, note }: { icon: ReactNode; label: string; badge: string; color: string; cta: string; to: string; intro: string; signals: Signal[]; note: string }) {
  const t = useTokens();
  const rows = signals.flatMap((x) => (WORLD[x.id] && WORLD[x.id].series.length > 1 ? [{ ind: WORLD[x.id], color: x.color }] : []));
  const sources = [...new Map(rows.map((r) => [publisher(r.ind.source.label), { label: publisher(r.ind.source.label), url: r.ind.source.url }])).values()];
  return (
    <Card t={t}>
      <Head t={t} icon={icon} label={label} badge={badge} color={color} cta={cta} to={to} />
      <p className="text-[10px] font-sans leading-snug -mt-2 mb-2" style={{ color: t.mutedText }}>
        {intro}
      </p>
      <ul className="flex flex-col flex-1">
        {rows.map((r, i) => (
          <SignalRow key={r.ind.id} t={t} ind={r.ind} color={r.color} last={i === rows.length - 1} />
        ))}
      </ul>
      <Note t={t}>{note}</Note>
      <SourceLink sources={sources} className="mt-1" />
    </Card>
  );
}

const CHANGE_NOTE =
  "The figure is the world's for its latest year; the change is on the year before - a rate in points, anything else as a percentage - and is green where the series moved the way that is better, red where it moved the other. The line is the whole series between its own lowest and highest: its shape, not its size.";

/** The world's people in need, and the liberties they have: the Aid & Human Rights page's subjects. */
export function AidAndRights() {
  return (
    <SignalsCard
      icon={<HandHeart size={16} weight="fill" />}
      label="Aid & human rights"
      badge="world figures"
      color="#f43f5e"
      cta="Aid & Human Rights"
      to="/dashboard/humanitarian"
      intro="The people displaced, hungry and poor, and how free the world's people are - each as its publisher counts it."
      signals={[
        { id: "displaced", color: "#7c3aed" },
        { id: "disasterDisplacement", color: "#0ea5e9" },
        { id: "undernourished", color: "#f59e0b" },
        { id: "foodInsecure", color: "#f97316" },
        { id: "extremePoverty", color: "#ef4444" },
        { id: "civilLiberties", color: "#14b8a6" },
        { id: "freeExpression", color: "#6366f1" },
        { id: "womenParliament", color: "#ec4899" },
      ]}
      note={`${CHANGE_NOTE} The two liberty measures are V-Dem's indices, from 0 to 1, weighted by where people live.`}
    />
  );
}

/** How long people live, what they learn and the services they have: the Worldview page's subjects. */
export function WorldLiving() {
  return (
    <SignalsCard
      icon={<Heartbeat size={16} weight="fill" />}
      label="How the world lives"
      badge="world figures"
      color="#0ea5e9"
      cta="Worldview"
      to="/dashboard/worldview"
      intro="Life, schooling and the services people have, for the world as a whole - each as its publisher counts it."
      signals={[
        { id: "lifeExpectancy", color: "#ec4899" },
        { id: "childMortality", color: "#ef4444" },
        { id: "literacy", color: "#8b5cf6" },
        { id: "schoolingYears", color: "#6366f1" },
        { id: "electricity", color: "#eab308" },
        { id: "water", color: "#0ea5e9" },
        { id: "sanitation", color: "#14b8a6" },
        { id: "internet", color: "#f59e0b" },
      ]}
      note={CHANGE_NOTE}
    />
  );
}

// ── Climate ────────────────────────────────────────────────────────────────

const ZONE: Record<Zone, { label: string; color: string }> = {
  safe: { label: "within the safe space", color: "#10b981" },
  increasing: { label: "increasing risk", color: "#f59e0b" },
  high: { label: "high risk", color: "#ef4444" },
};
/** The decimal places a reading is given to. */
const places = (v: number) => (`${v}`.split(".")[1] ?? "").length;

export function PlanetNow() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#10b981";
  const sources = [...new Map(CLIMATE_INDICATORS.map((c) => [publisher(c.source), { label: publisher(c.source), url: c.url }])).values()];
  return (
    <Card t={t}>
      <Head t={t} icon={<Leaf size={16} weight="fill" />} label="Climate" badge={`${TRANSGRESSED} of ${BOUNDARIES.length} crossed`} color={color} cta="Climate" to="/dashboard/planetary-boundaries" />
      <Kicker t={t}>The latest reading of each · and the same period ten years before</Kicker>
      <ul className="flex flex-col">
        {CLIMATE_INDICATORS.map((c, i) => {
          // To as many places as the finer of the two readings, so a change is not rounded away.
          const dp = Math.max(places(c.value), c.decadeAgo === null ? 0 : places(c.decadeAgo));
          const change = c.decadeAgo === null ? null : c.value - c.decadeAgo;
          return (
            <li key={c.id} className="flex items-center gap-2 py-2" style={{ borderBottom: i < CLIMATE_INDICATORS.length - 1 ? `1px solid ${t.gridLine}` : "none" }} title={c.note ?? `${c.label}, ${c.period} · ${c.source}`}>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                  {c.label}
                </span>
                <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                  {c.period} · {publisher(c.source)}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-[11px] font-mono font-bold" style={{ color: t.headText }}>
                  {c.value} {c.unit}
                </span>
                <span className="flex items-center justify-end gap-0.5 text-[9px] font-mono" style={{ color: t.mutedText }}>
                  {change === null || c.decadeAgo === null ? (
                    "no reading ten years before"
                  ) : (
                    <>
                      {change > 0 ? <ArrowUp size={8} weight="bold" aria-hidden /> : change < 0 ? <ArrowDown size={8} weight="bold" aria-hidden /> : null}
                      {change > 0 ? "+" : change < 0 ? "−" : ""}
                      {Math.abs(change).toFixed(dp)} on {c.decadeAgo} ten years before
                    </>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex-1 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <Kicker t={t}>The nine planetary boundaries · {PHC_2026.title}</Kicker>
        {/* As many columns as the card has room for: the card's width, not the window's, decides. */}
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(11rem,100%),1fr))] gap-x-6 gap-y-1.5
">
          {BOUNDARIES.map((b) => (
            <li key={b.id} className="flex items-baseline gap-2 min-w-0" title={`${b.name}: ${b.verdict}`}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0 self-center" style={{ background: ZONE[b.zone].color }} aria-hidden />
              <span className="text-[10px] font-sans shrink-0" style={{ color: t.bodyText }}>
                {b.shortName}
              </span>
              <span className="text-[9px] font-mono flex-1 min-w-0 text-right leading-snug" style={{ color: ZONE[b.zone].color }}>
                {b.verdict}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono mt-2" style={{ color: t.mutedText }}>
          {(Object.keys(ZONE) as Zone[]).map((z) => (
            <span key={z} className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ZONE[z].color }} aria-hidden />
              {ZONE[z].label}
            </span>
          ))}
        </p>
      </div>
      <div className="mt-2">
        <Go color={color} onClick={() => navigate("/dashboard/planetary-boundaries")}>
          Cause and effect of each, on the Climate page
        </Go>
      </div>
      <Note t={t}>
        Each reading is the latest its agency publishes, read on {CLIMATE_RETRIEVED}, beside the same period ten years earlier; nothing is projected. A single year of sea ice
        can run against its trend. The verdict on each boundary is the report's own.
      </Note>
      <SourceLink sources={[...sources, { label: `${PHC_2026.publisher} — ${PHC_2026.title}`, url: PHC_2026.siteUrl }]} className="mt-1" />
    </Card>
  );
}

// ── Countries, highest and lowest ───────────────────────────────────────────

type MeasureId = "gdpPerCapita" | "lifeExpectancy" | "gdpGrowth" | "unemploymentRate" | "inflationRate";
const signedPct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;
const MEASURES: { id: MeasureId; label: string; unit: string; print: (v: number) => string; /** Whether a figure is a length: one that can be negative is not. */ bars: boolean }[] = [
  { id: "gdpPerCapita", label: "Output a person", unit: "GDP per person, current US dollars", print: (v) => `$${whole(v)}`, bars: true },
  { id: "lifeExpectancy", label: "Life expectancy", unit: "years at birth", print: (v) => `${v.toFixed(1)} yrs`, bars: true },
  { id: "gdpGrowth", label: "Growth", unit: "real GDP, change on the year before", print: signedPct, bars: false },
  { id: "unemploymentRate", label: "Unemployment", unit: "% of the labour force", print: (v) => `${v.toFixed(1)}%`, bars: true },
  { id: "inflationRate", label: "Inflation", unit: "consumer prices, change on the year before", print: signedPct, bars: false },
];
/** The countries that are not territories, each with the figures held for it. */
const STATES = countriesData.flatMap((c) => (!c.territory && !c.uninhabited && COUNTRY_INDICATORS[c.code] ? [{ c, ind: COUNTRY_INDICATORS[c.code] as CountryIndicators }] : []));
const SHOWN = 10;

export function CountryLeaders() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#6366f1";
  const [id, setId] = useState<MeasureId>("gdpPerCapita");
  // Which end of the order is shown. One list, so the card is the same height at any width.
  const [end, setEnd] = useState<"highest" | "lowest">("highest");
  const m = MEASURES.find((x) => x.id === id)!;
  const { highest, lowest, years, ranked, left } = useMemo(() => {
    const all = STATES.flatMap(({ c, ind }) => (ind[id] ? [{ c, v: ind[id]!.v, y: Number.parseInt(ind[id]!.y, 10), s: ind[id]!.s }] : []));
    // Only the measure's latest two years are ranked, so a figure from years back is not set against this year's.
    const latest = Math.max(...all.map((r) => r.y));
    const fresh = all.filter((r) => r.y >= latest - 1).sort((a, b) => b.v - a.v);
    return { highest: fresh.slice(0, SHOWN), lowest: fresh.slice(-SHOWN).reverse(), years: `${latest - 1} or ${latest}`, ranked: fresh.length, left: all.length - fresh.length };
  }, [id]);
  const shown = end === "highest" ? highest : lowest;
  const top = Math.max(...shown.map((r) => r.v));
  const bars = m.bars && shown.every((r) => r.v >= 0) && top > 0;
  const sources: Source[] = [
    { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url },
    ...[...new Set(shown.flatMap((r) => (r.s ? [r.s] : [])))].map((s) => COUNTRY_INDICATOR_FALLBACKS[s]),
  ];
  return (
    <Card t={t}>
      <Head t={t} icon={<Globe size={16} weight="fill" />} label="Countries" badge={`${STATES.length} countries`} color={color} cta="All Countries" to="/dashboard/countries" />
      <p className="text-[10px] font-sans leading-snug -mt-2 mb-2" style={{ color: t.mutedText }}>
        The ten highest or the ten lowest countries on one measure. Choose the measure, and which end of the order.

      </p>
      <div className="flex flex-wrap gap-1.5 mb-3" role="tablist" aria-label="The measure the countries are set in order by">
        {MEASURES.map((x) => {
          const on = x.id === id;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setId(x.id)}
              className="text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: on ? color : t.tile, color: on ? "#ffffff" : t.bodyText, border: `1px solid ${on ? color : t.gridLine}` }}
            >
              {x.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 mb-1">
        <p className="text-[9px] font-mono min-w-0" style={{ color: t.mutedText }}>
          {m.unit} · figures for {years} · {ranked} countries in the order
        </p>
        <div className="flex rounded-full overflow-hidden shrink-0" style={{ border: `1px solid ${t.gridLine}` }} role="group" aria-label="Which end of the order is shown">
          {(["highest", "lowest"] as const).map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={end === e}
              onClick={() => setEnd(e)}
              className="text-[10px] font-semibold font-sans px-2.5 py-0.5 capitalize transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: end === e ? color : "transparent", color: end === e ? "#ffffff" : t.bodyText }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex flex-col flex-1">
        {shown.map((r, i) => (
          <li key={r.c.id} style={{ borderBottom: i < shown.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/countries?open=${r.c.id}`)}
              className="flex items-center gap-2 w-full py-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
              title={`${r.c.name}: ${m.print(r.v)} · ${m.unit} · ${r.y}${r.s ? ` · ${COUNTRY_INDICATOR_FALLBACKS[r.s].label}` : ""}`}
            >
              {/* Its place in the order, counted from the highest. */}
              <span className="text-[10px] font-mono w-6 shrink-0 text-right" style={{ color: t.mutedText }}>
                {end === "highest" ? i + 1 : ranked - i}
              </span>
              <img src={`https://flagcdn.com/w40/${r.c.code.toLowerCase()}.png`} alt="" width={20} height={15} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                  {r.c.name}
                </span>
                <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                  {r.c.continent} · {r.y}
                </span>
              </span>
              {bars && (
                <span className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: track(t) }} aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * r.v) / top)}%`, background: color }} />
                </span>
              )}
              <span className="text-[11px] font-mono font-bold text-right shrink-0 w-20" style={{ color: t.headText }}>
                {m.print(r.v)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <Go color={color} onClick={() => navigate("/dashboard/rankings")}>
          <ArrowsLeftRight size={11} weight="bold" aria-hidden /> Compare countries side by side
        </Go>
        <Go color={color} onClick={() => navigate("/dashboard/maps")}>
          See it on the map
        </Go>
      </div>
      <Note t={t}>
        The order is worked out here from each country's published figure; the figures are not the site's. Countries only, not territories, and only figures for {years}
        {left > 0 ? ` - ${left} whose latest figure is older are left out` : ""}. {bars ? "A bar is on the scale of the highest shown." : "A figure that can fall below zero is given without a bar."}
      </Note>
      <SourceLink sources={sources} className="mt-1" />
    </Card>
  );
}
