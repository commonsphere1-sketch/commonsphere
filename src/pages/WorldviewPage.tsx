import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bread,
  CloudSun,
  Coins,
  GlobeStand,
  Lightbulb,
  Peace,
  Scales,
  UsersThree,
} from "@phosphor-icons/react";
import { WORLD, POPULATION_PROJECTION, WORLDVIEW_RETRIEVED, type WorldIndicator, type WorldPoint } from "@/data/worldview";
import { CLIMATE_INDICATORS, CLIMATE_RETRIEVED, type ClimateIndicator } from "@/data/climateIndicators";
import { ALLIANCES, ALLIANCES_CHECKED } from "@/data/alliances";
import { countriesData } from "@/data/countriesData";
import { has } from "@/lib/na";

/**
 * Worldview: the world as a whole, in the figures the bodies that measure it
 * publish - peace and war, geopolitics, economy and debt, the climate, human
 * development and equality, food security and technology.
 *
 * Every figure is a published world total or share with its year and source
 * (build-worldview.cjs fetches them; the atmosphere readings are the climate
 * page's). The one moving number, the population clock, follows the UN's
 * medium-variant projection and says so. Each trend line has a year-by-year
 * table under it, so no value is only reachable by hovering.
 */

// ── Colour: one accent for data, status colours only for better / worse ────
// The accent is the reference palette's blue, validated against the site's
// card surfaces in both themes (lightness band, chroma, >= 3:1 contrast).
const ACCENT = "text-[#2a78d6] dark:text-[#3987e5]";
const ACCENT_BG = "bg-[#2a78d6] dark:bg-[#3987e5]";
const ACCENT_TRACK = "bg-[#2a78d6]/15 dark:bg-[#3987e5]/20";
const BETTER = "text-emerald-700 dark:text-emerald-400";
const WORSE = "text-red-600 dark:text-red-400";

// ── Formatting ─────────────────────────────────────────────────────────────

function compact(v: number, digits = 3): string {
  const a = Math.abs(v);
  if (a >= 1e12) return `${Number((v / 1e12).toPrecision(digits))} trillion`;
  if (a >= 1e9) return `${Number((v / 1e9).toPrecision(digits))} billion`;
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(digits))} million`;
  return Math.round(v).toLocaleString("en-US");
}

function fmt(ind: Pick<WorldIndicator, "format" | "dp">, v: number): string {
  switch (ind.format) {
    case "pct":
      return `${v.toFixed(ind.dp)}%`;
    case "usd":
      return `$${compact(v)}`;
    case "count":
      return compact(v);
    default:
      return v.toLocaleString("en-US", { minimumFractionDigits: ind.dp, maximumFractionDigits: ind.dp });
  }
}

/** The value about ten years before the latest, if the series reaches back. */
function decadeBefore(series: WorldPoint[]): WorldPoint | null {
  const [lastYear] = series[series.length - 1];
  const earlier = series.filter(([y]) => y <= lastYear - 10);
  const p = earlier[earlier.length - 1];
  return p && lastYear - 10 - p[0] <= 2 ? p : null;
}

type Delta = { text: string; dir: "up" | "down" | "flat"; verdict: "better" | "worse" | null };

function delta(ind: WorldIndicator): Delta | null {
  const last = ind.series[ind.series.length - 1];
  const prev = decadeBefore(ind.series);
  if (!prev) return null;
  const diff = last[1] - prev[1];
  const flat = Math.abs(diff) < 10 ** -ind.dp / 2;
  const dir = flat ? "flat" : diff > 0 ? "up" : "down";
  const verdict = flat || ind.upIsGood === null ? null : (diff > 0) === ind.upIsGood ? "better" : "worse";
  let text: string;
  if (ind.format === "count" || ind.format === "usd") {
    const pct = (100 * diff) / prev[1];
    text = `${pct > 0 ? "+" : ""}${pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}% since ${prev[0]}`;
  } else if (ind.format === "pct") {
    text = `${diff > 0 ? "+" : ""}${diff.toFixed(ind.dp)} points since ${prev[0]}`;
  } else {
    text = `${diff > 0 ? "+" : ""}${diff.toLocaleString("en-US", { maximumFractionDigits: ind.dp })} since ${prev[0]}`;
  }
  return { text, dir, verdict };
}

function DeltaLine({ d }: { d: Delta }) {
  const Icon = d.dir === "up" ? ArrowUpRight : d.dir === "down" ? ArrowDownRight : ArrowRight;
  const tone = d.verdict === "better" ? BETTER : d.verdict === "worse" ? WORSE : "text-muted-foreground";
  return (
    <p className={`flex items-center gap-1 text-[11px] font-sans ${tone}`}>
      <Icon size={12} weight="bold" aria-hidden />
      <span>
        {d.text}
        {d.verdict && <span className="font-semibold">{` · ${d.verdict}`}</span>}
      </span>
    </p>
  );
}

// ── The trend line ─────────────────────────────────────────────────────────

/**
 * A single-series trend: a recessive grey line with a faint wash, the latest
 * point in the accent. The pointer (or the arrow keys, once focused) moves a
 * crosshair and reads out that year above the line.
 */
function Sparkline({ ind }: { ind: WorldIndicator }) {
  const s = ind.series;
  const [at, setAt] = useState<number | null>(null);
  const W = 240;
  const H = 44;
  const pad = 4;
  const x0 = s[0][0];
  const x1 = s[s.length - 1][0];
  const ys = s.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * pad);
  const py = (y: number) => H - pad - ((y - lo) / (hi - lo || 1)) * (H - 2 * pad);
  const line = s.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const area = `${line}L${px(x1).toFixed(1)},${H}L${px(x0).toFixed(1)},${H}Z`;
  const pct = (x: number) => `${(px(x) / W) * 100}%`;
  const topPct = (y: number) => `${(py(y) / H) * 100}%`;
  const last = s[s.length - 1];
  const shown = at === null ? null : s[at];

  const nearest = (clientX: number, rect: DOMRect) => {
    const x = x0 + ((clientX - rect.left) / rect.width) * (x1 - x0);
    let best = 0;
    for (let i = 1; i < s.length; i++) if (Math.abs(s[i][0] - x) < Math.abs(s[best][0] - x)) best = i;
    return best;
  };

  return (
    <div>
      <p className="h-4 text-[10px] font-mono text-muted-foreground" aria-live="off">
        {shown ? (
          <>
            <span className="text-foreground font-semibold">{fmt(ind, shown[1])}</span> in {shown[0]}
          </>
        ) : (
          `${x0}–${x1}`
        )}
      </p>
      <div
        className="relative mt-1 h-11 cursor-crosshair rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
        role="img"
        aria-label={`${ind.label}, ${x0} to ${x1}: from ${fmt(ind, s[0][1])} to ${fmt(ind, last[1])}. Use the arrow keys to read each year; every year is also in the table below.`}
        onPointerMove={(e) => setAt(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setAt(null)}
        onBlur={() => setAt(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setAt((i) => {
            const cur = i ?? s.length - 1;
            return Math.max(0, Math.min(s.length - 1, cur + (e.key === "ArrowLeft" ? -1 : 1)));
          });
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-muted-foreground" aria-hidden>
          <path d={area} fill="currentColor" opacity={0.08} />
          <path d={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {/* Marks drawn in HTML so they stay round at any width. */}
        {shown && (
          <>
            <span className="absolute top-0 bottom-0 w-px bg-foreground/40" style={{ left: pct(shown[0]) }} aria-hidden />
            <span
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${ACCENT_BG}`}
              style={{ left: pct(shown[0]), top: topPct(shown[1]) }}
              aria-hidden
            />
          </>
        )}
        {!shown && (
          <span
            className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${ACCENT_BG}`}
            style={{ left: pct(last[0]), top: topPct(last[1]) }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

// ── Tiles ──────────────────────────────────────────────────────────────────

function SourceLink({ source }: { source: { label: string; url: string } }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-sans text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
    >
      {source.label}
    </a>
  );
}

function Breakdown({ ind }: { ind: WorldIndicator }) {
  if (!ind.breakdown?.length) return null;
  const max = Math.max(...ind.breakdown.map(([, v]) => v));
  const pctUnit = ind.breakdownUnit === "%";
  return (
    <div className="space-y-1.5 border-t border-border/60 pt-2.5">
      <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">In {ind.breakdownYear}</p>
      {ind.breakdown.map(([label, v]) => (
        <div key={label}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-sans text-foreground/85">{label}</span>
            <span className="text-[11px] font-mono text-foreground">{pctUnit ? `${v}%` : compact(v)}</span>
          </div>
          <div className={`mt-0.5 h-1 rounded-full ${ACCENT_TRACK}`}>
            <div className={`h-1 rounded-full ${ACCENT_BG}`} style={{ width: `${(100 * v) / (pctUnit ? 100 : max || 1)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatTile({ ind, extra }: { ind: WorldIndicator; extra?: ReactNode }) {
  const last = ind.series[ind.series.length - 1];
  const d = delta(ind);
  return (
    <article className="modal-tile rounded-xl p-4 flex flex-col gap-2.5">
      <div>
        <h3 className="text-xs font-semibold font-sans text-foreground">{ind.label}</h3>
        <p className="text-[10px] font-sans text-muted-foreground">
          {ind.unit} · {last[0]}
        </p>
      </div>
      <p className="text-2xl font-bold font-mono text-foreground leading-none">{fmt(ind, last[1])}</p>
      {extra}
      {d && <DeltaLine d={d} />}
      {ind.series.length > 2 && <Sparkline ind={ind} />}
      <Breakdown ind={ind} />
      {ind.note && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{ind.note}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <SourceLink source={ind.source} />
        <details className="text-[10px] font-sans text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Data by year</summary>
          <table className="mt-1.5 w-full font-mono">
            <tbody>
              {[...ind.series].reverse().map(([y, v]) => (
                <tr key={y} className="border-b border-border/40 last:border-0">
                  <td className="py-0.5 pr-3 tabular-nums">{y}</td>
                  <td className="py-0.5 text-right tabular-nums text-foreground">{fmt(ind, v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </article>
  );
}

/** A reading of the atmosphere, from the climate page's data: no series, a decade's change. */
function ClimateTile({ c }: { c: ClimateIndicator }) {
  const change = c.decadeAgo === null ? null : c.value - c.decadeAgo;
  // Less Arctic ice is the bad direction; for every other reading, more is.
  const worseWhenUp = c.id !== "sea-ice";
  const verdict = change === null || change === 0 ? null : (change > 0) === worseWhenUp ? "worse" : "better";
  return (
    <article className="modal-tile rounded-xl p-4 flex flex-col gap-2.5">
      <div>
        <h3 className="text-xs font-semibold font-sans text-foreground">{c.label}</h3>
        <p className="text-[10px] font-sans text-muted-foreground">
          {c.unit} · {c.period}
        </p>
      </div>
      <p className="text-2xl font-bold font-mono text-foreground leading-none">{c.value}</p>
      {change !== null && (
        <DeltaLine
          d={{
            text: `${change > 0 ? "+" : ""}${Math.abs(change) < 1 ? change.toFixed(2) : change.toFixed(1)} ${c.unit} on ten years before`,
            dir: change > 0 ? "up" : change < 0 ? "down" : "flat",
            verdict,
          }}
        />
      )}
      {c.note && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{c.note}</p>}
      <div className="mt-auto pt-1">
        <SourceLink source={{ label: c.source, url: c.url }} />
      </div>
    </article>
  );
}

function Section({
  id,
  icon,
  title,
  intro,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-3 flex items-start gap-3">
        <span className={`mt-0.5 ${ACCENT}`}>{icon}</span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-bold font-sans text-foreground">
            {title}
          </h2>
          <p className="text-xs font-sans text-muted-foreground max-w-3xl leading-relaxed">{intro}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">{children}</div>
    </section>
  );
}

// ── The population clock ───────────────────────────────────────────────────

/** Population now, moving along the UN's projection between 1 July points. */
function projectedPopulation(now: number): number | null {
  const pts = POPULATION_PROJECTION.midYear;
  const t = (y: number) => Date.UTC(y, 6, 1);
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, p0] = pts[i];
    const [y1, p1] = pts[i + 1];
    if (now >= t(y0) && now < t(y1)) return p0 + ((p1 - p0) * (now - t(y0))) / (t(y1) - t(y0));
  }
  return null;
}

function PopulationClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const pop = projectedPopulation(now);
  const yearMs = (Date.UTC(POPULATION_PROJECTION.year + 1, 0, 1) - Date.UTC(POPULATION_PROJECTION.year, 0, 1));
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const todayMs = now - midnight.getTime();
  const births = Math.floor((POPULATION_PROJECTION.births * todayMs) / yearMs);
  const deaths = Math.floor((POPULATION_PROJECTION.deaths * todayMs) / yearMs);
  const perDay = (n: number) => Math.round((n * 86_400_000) / yearMs);
  const wb = WORLD.population.series[WORLD.population.series.length - 1];

  if (pop === null) return null;
  return (
    <section aria-labelledby="clock-title" className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <p id="clock-title" className="text-[10px] font-bold font-sans uppercase tracking-widest text-muted-foreground">
        People alive now, as the UN projects it
      </p>
      <p className="mt-2 text-4xl sm:text-5xl font-bold font-mono text-foreground leading-none" aria-hidden>
        {Math.round(pop).toLocaleString("en-US")}
      </p>
      {/* The moving figure is hidden from screen readers; this one does not tick. */}
      <p className="sr-only">About {compact(pop)} people, on the UN's medium-variant projection.</p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["Born so far today", births.toLocaleString("en-US"), `${perDay(POPULATION_PROJECTION.births).toLocaleString("en-US")} a day`],
          ["Died so far today", deaths.toLocaleString("en-US"), `${perDay(POPULATION_PROJECTION.deaths).toLocaleString("en-US")} a day`],
          ["Added so far today", (births - deaths).toLocaleString("en-US"), `${perDay(POPULATION_PROJECTION.births - POPULATION_PROJECTION.deaths).toLocaleString("en-US")} a day`],
          ["World Bank count", compact(wb[1]), `mid-${wb[0]}`],
        ].map(([label, value, sub]) => (
          <div key={label}>
            <p className="text-[10px] font-sans text-muted-foreground">{label}</p>
            <p className="text-lg font-bold font-mono text-foreground leading-tight">{value}</p>
            <p className="text-[10px] font-sans text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] font-sans text-muted-foreground leading-snug max-w-3xl">
        A projection, not a count: the clock moves in a straight line between the UN's medium-variant figures for 1 July{" "}
        {POPULATION_PROJECTION.midYear[0][0]}–{POPULATION_PROJECTION.midYear[POPULATION_PROJECTION.midYear.length - 1][0]}, and
        births and deaths run at the rates projected for {POPULATION_PROJECTION.year}, counted from your midnight. Source:{" "}
        <SourceLink source={POPULATION_PROJECTION.source} />.
      </p>
    </section>
  );
}

// ── Of every 100 people ────────────────────────────────────────────────────

const OUT_OF_100: [id: string, text: string][] = [
  ["urban", "live in a city or town"],
  ["internet", "use the internet"],
  ["electricity", "have electricity at home"],
  ["water", "have safely managed drinking water"],
  ["democracyShare", "live in a democracy"],
  ["poverty830", "live on less than $8.30 a day"],
  ["foodInsecure", "were moderately or severely food insecure"],
  ["extremePoverty", "live in extreme poverty (under $3 a day)"],
  ["undernourished", "are undernourished"],
];

function OutOf100() {
  return (
    <section aria-labelledby="of100-title" className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <h2 id="of100-title" className="text-lg font-bold font-sans text-foreground">
        Of every 100 people
      </h2>
      <p className="text-xs font-sans text-muted-foreground mb-4">The world's shares, as the latest published figures put them.</p>
      <ul className="space-y-3">
        {OUT_OF_100.map(([id, text]) => {
          const ind = WORLD[id];
          const [year, v] = ind.series[ind.series.length - 1];
          return (
            <li key={id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-sans text-foreground">
                  <span className="font-mono font-bold">{Math.round(v)}</span> {text}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {v.toFixed(1)}% · {year} · <SourceLink source={{ label: "source", url: ind.source.url }} />
                </p>
              </div>
              <div className={`mt-1 h-2 rounded-full ${ACCENT_TRACK}`} aria-hidden>
                <div className={`h-2 rounded-full ${ACCENT_BG}`} style={{ width: `${v}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Blocs: share of the world's people and output ──────────────────────────

const BLOCS = ["g20", "g7", "brics", "eu", "nato", "oecd", "au", "asean", "sco", "opec"];

function BlocShares() {
  const worldPop = WORLD.population.series[WORLD.population.series.length - 1];
  const worldGdp = WORLD.gdp.series[WORLD.gdp.series.length - 1];
  const rows = useMemo(
    () =>
      BLOCS.map((id) => ALLIANCES.find((a) => a.id === id))
        .filter((a): a is (typeof ALLIANCES)[number] => !!a?.members?.length)
        .map((a) => {
          const members = countriesData.filter((c) => a.members!.includes(c.code));
          const pop = members.reduce((t, c) => t + (has(c.population) ? c.population : 0), 0);
          const gdp = members.reduce((t, c) => t + (has(c.gdp) ? c.gdp * 1e9 : 0), 0);
          return {
            id: a.id,
            name: a.short,
            full: a.name,
            counted: members.length,
            memberCount: a.memberCount,
            pop: (100 * pop) / worldPop[1],
            gdp: (100 * gdp) / worldGdp[1],
            source: a.source,
          };
        })
        .sort((a, b) => b.gdp - a.gdp),
    [worldPop, worldGdp],
  );

  const Bar = ({ v }: { v: number }) => (
    <div className="flex items-center gap-2">
      <div className={`h-2 flex-1 rounded-full ${ACCENT_TRACK}`} aria-hidden>
        <div className={`h-2 rounded-r-full ${ACCENT_BG}`} style={{ width: `${Math.min(100, v)}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-mono text-foreground tabular-nums">{v.toFixed(1)}%</span>
    </div>
  );

  return (
    <article className="modal-tile rounded-xl p-4 sm:col-span-2 xl:col-span-2">
      <h3 className="text-xs font-semibold font-sans text-foreground">The blocs' share of the world</h3>
      <p className="text-[10px] font-sans text-muted-foreground mb-3">
        Members' population and GDP (each member's latest World Bank year) against the world totals for {worldPop[0]}. Blocs overlap, so
        the shares do not add up.
      </p>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
            <th className="pb-1.5 text-left font-medium">Bloc</th>
            <th className="pb-1.5 px-2 text-left font-medium w-[38%]">People</th>
            <th className="pb-1.5 text-left font-medium w-[38%]">Output (GDP)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/40">
              <td className="py-1.5 pr-2 align-middle">
                <a href={r.source.url} target="_blank" rel="noopener noreferrer" title={r.full} className="text-xs font-sans text-foreground hover:underline">
                  {r.name}
                </a>
                {r.counted < r.memberCount && (
                  <span className="block text-[9px] font-sans text-muted-foreground">
                    {r.counted} of {r.memberCount} members are countries here
                  </span>
                )}
              </td>
              <td className="py-1.5 px-2">
                <Bar v={r.pop} />
              </td>
              <td className="py-1.5">
                <Bar v={r.gdp} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] font-sans text-muted-foreground">Memberships as checked on {ALLIANCES_CHECKED}; each bloc links to its own member list.</p>
    </article>
  );
}

// ── The page ───────────────────────────────────────────────────────────────

const NAV: [id: string, label: string][] = [
  ["peace", "Peace & war"],
  ["geopolitics", "Geopolitics"],
  ["economy", "Economy & debt"],
  ["climate", "Climate crisis"],
  ["development", "Development & equality"],
  ["food", "Food security"],
  ["advancement", "Advancement"],
];

export function WorldviewPage() {
  const tile = (id: string, extra?: ReactNode) => <StatTile key={id} ind={WORLD[id]} extra={extra} />;
  const lastOf = (id: string) => WORLD[id].series[WORLD[id].series.length - 1];
  const climate = CLIMATE_INDICATORS.filter((c) => ["warming", "co2", "ch4", "sea-ice"].includes(c.id));

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold font-sans text-foreground">Worldview</h1>
          <p className="text-sm font-sans text-muted-foreground max-w-3xl">
            The world as a whole, in the figures the bodies that measure it publish: how many people there are, how many live in peace or
            war, what the world owes, what is happening to the climate, and how development, equality, food and technology are changing.
          </p>
          <nav aria-label="Sections" className="mt-3 flex flex-wrap gap-1.5">
            {NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-[11px] font-sans px-2.5 py-1 rounded-full border border-border text-foreground/80 hover:text-foreground hover:border-foreground/30"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <PopulationClock />
          <OutOf100 />
        </div>

        <Section
          id="peace"
          icon={<Peace size={20} weight="duotone" />}
          title="Peace & war"
          intro="Armed conflict, the people it kills and drives from home, and what the world spends on arms. Conflict figures are the Uppsala Conflict Data Program's; displacement is UNHCR's own count."
        >
          {tile("conflicts")}
          {tile("conflictDeaths")}
          {tile("displaced")}
          {tile("militaryGdp", <p className="text-[11px] font-sans text-muted-foreground">${compact(lastOf("militaryUsd")[1])} in {lastOf("militaryUsd")[0]}</p>)}
          {tile("homicide")}
        </Section>

        <Section
          id="geopolitics"
          icon={<GlobeStand size={20} weight="duotone" />}
          title="Geopolitics"
          intro="How the world is governed and how it groups itself: the share of people living under each kind of regime (V-Dem), and what each major bloc holds of the world's people and output."
        >
          {tile("democracyShare")}
          <BlocShares />
        </Section>

        <Section
          id="economy"
          icon={<Coins size={20} weight="duotone" />}
          title="Economy & debt"
          intro="The size and pace of the world economy, and what governments and developing countries owe. Public debt is the IMF's world aggregate; external debt is the World Bank's for low- and middle-income countries."
        >
          {tile("gdp")}
          {tile("gdpGrowth")}
          {tile("inflation")}
          {tile("unemployment")}
          {tile("govDebt")}
          {tile("extDebt", <p className="text-[11px] font-sans text-muted-foreground">${compact(lastOf("extDebtUsd")[1])} in {lastOf("extDebtUsd")[0]}</p>)}
        </Section>

        <Section
          id="climate"
          icon={<CloudSun size={20} weight="duotone" />}
          title="Climate crisis"
          intro={`The atmosphere as the agencies that measure it last read it (retrieved ${CLIMATE_RETRIEVED}), what the world emits, and the energy and forests that shape the rest.`}
        >
          {climate.map((c) => (
            <ClimateTile key={c.id} c={c} />
          ))}
          {tile("co2")}
          {tile("ghg")}
          {tile("renewables")}
          {tile("forest")}
        </Section>

        <Section
          id="development"
          icon={<Scales size={20} weight="duotone" />}
          title="Development & equality"
          intro="How long people live, how many children survive, who is poor, who can read and finish school, and how far women are represented in parliaments and in paid work."
        >
          {tile("lifeExpectancy")}
          {tile("childMortality")}
          {tile("extremePoverty")}
          {tile("poverty830")}
          {tile("literacy")}
          {tile("primaryCompletion")}
          {tile("womenParliament")}
          {tile("workGap")}
          {tile("water")}
        </Section>

        <Section
          id="food"
          icon={<Bread size={20} weight="duotone" />}
          title="Food security"
          intro="The UN Food and Agriculture Organization's two measures of hunger: people who do not eat enough to live a healthy life, and people who had to cut back on food or go without."
        >
          {tile("undernourished")}
          {tile("foodInsecure")}
        </Section>

        <Section
          id="advancement"
          icon={<Lightbulb size={20} weight="duotone" />}
          title="Advancement"
          intro="How connected the world is and what it invests in new knowledge."
        >
          {tile("internet")}
          {tile("electricity")}
          {tile("mobile")}
          {tile("research")}
          {tile("patents")}
        </Section>

        <Section
          id="population"
          icon={<UsersThree size={20} weight="duotone" />}
          title="Population"
          intro="How fast the world's population is growing and where people live."
        >
          {tile("popGrowth")}
          {tile("fertility")}
          {tile("urban")}
        </Section>

        <footer className="border-t border-border pt-4 text-[10px] font-sans text-muted-foreground leading-relaxed max-w-4xl">
          Figures retrieved {WORLDVIEW_RETRIEVED} by build-worldview.cjs: the World Bank's world aggregates, the IMF's World Economic
          Outlook, UCDP and V-Dem via Our World in Data, UNHCR, and the UN's World Population Prospects. Each tile names its source and
          year, and its full series is under "Data by year". Arrows compare with about ten years earlier; "better" and "worse" are only
          given where the direction is not a matter of opinion.
        </footer>
      </div>
    </div>
  );
}
