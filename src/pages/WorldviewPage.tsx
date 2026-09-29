import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bank,
  CaretDown,
  Coins,
  GlobeHemisphereWest,
  GlobeStand,
  Leaf,
  Minus,
  Pause,
  Play,
  Ranking,
  Scales,
  UsersThree,
} from "@phosphor-icons/react";
import {
  WORLD,
  POPULATION_PROJECTION,
  WORLDVIEW_RETRIEVED,
  INCOME_GROUPS,
  INCOME_SOURCE,
  BY_INCOME,
  COUNTRY_FIGURES,
  COUNTRY_FIGURE_SOURCES,
  type IncomeGroup,
  type WorldIndicator,
  type WorldPoint,
} from "@/data/worldview";
import { CLIMATE_INDICATORS, CLIMATE_RETRIEVED, type ClimateIndicator } from "@/data/climateIndicators";
import { ALLIANCES, ALLIANCES_CHECKED } from "@/data/alliances";
import { countriesData, type Country } from "@/data/countriesData";
import { COUNTRY_PANELS, PANEL_SOURCES } from "@/data/countryPanels";
import { GLOBAL_NORTH_CODES, GLOBAL_SOUTH_CODES, DEVELOPMENT_STATUS_SOURCE } from "@/data/developmentStatus";
import { LAND_USE, LAND_USE_SOURCE } from "@/data/landUse";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { TONE } from "@/lib/chipTone";
import { has } from "@/lib/na";

/**
 * Worldview: where the world stands, as a global dashboard in four pillars -
 * society, the economy, politics and the planet - after an overview with the
 * population clock, the headline figures and the day's world headlines.
 *
 * Each pillar opens with its status: headline percentages, and how many of
 * its measures have improved or worsened over about ten years, counted only
 * where the direction is not a matter of opinion. Every figure then has a
 * plain description of what it measures, its trend, its year-by-year table
 * and its source.
 *
 * Every figure is a published world total or share, or a country figure the
 * site already cites, with its year and source (build-worldview.cjs fetches
 * the world series). The one moving number, the population clock, follows
 * the UN's medium-variant projection and says so. The two ratios on the page -
 * the displaced as a share of all people, and people in countries Freedom
 * House rates Free - are worked out from published counts and say how.
 */

// ── Colour ─────────────────────────────────────────────────────────────────
// One accent for data marks (the reference palette's blue, checked against the
// site's surfaces in both themes), and an ordered light-to-dark ramp of the
// same blue for ordered groups (income, HDI tiers), validated with --ordinal.
// Status colours appear only for better / worse, always with an icon and word.
const ACCENT_BG = "bg-[#2a78d6] dark:bg-[#3987e5]";
const ACCENT_TRACK = "bg-[#2a78d6]/15 dark:bg-[#3987e5]/20";
const BETTER = "text-emerald-700 dark:text-emerald-400";
const WORSE = "text-red-600 dark:text-red-400";
const BETTER_FILL = "bg-emerald-600 dark:bg-emerald-500";
const WORSE_FILL = "bg-red-600 dark:bg-red-500";
const NEUTRAL_FILL = "bg-zinc-300 dark:bg-zinc-600";
/** Most to least: richest / most developed first. Text colours keep labels legible on each fill. */
const ORD4: { fill: string; ink: string }[] = [
  { fill: "bg-[#0d366b] dark:bg-[#b7d3f6]", ink: "text-white dark:text-[#0b0b0b]" },
  { fill: "bg-[#1c5cab] dark:bg-[#6da7ec]", ink: "text-white dark:text-[#0b0b0b]" },
  { fill: "bg-[#3987e5] dark:bg-[#2a78d6]", ink: "text-white" },
  { fill: "bg-[#86b6ef] dark:bg-[#184f95]", ink: "text-[#0b0b0b] dark:text-white" },
];
const ORD2 = [ORD4[1], ORD4[3]];
const ORD3 = [ORD4[0], ORD4[2], ORD4[3]];

// ── The dashboard's card look ───────────────────────────────────────────────

function useLook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    isLight,
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    },
    muted: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.46)",
    head: isLight ? "#0f172a" : "#f1f0ff",
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
  };
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { card } = useLook();
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={card}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, badge, color, right }: { icon: ReactNode; title: string; badge?: string; color: string; right?: ReactNode }) {
  const { head } = useLook();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h2 className="text-base font-bold font-sans" style={{ color: head }}>
          {title}
        </h2>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: color + "18", color }}>
            {badge}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

// ── Formatting ─────────────────────────────────────────────────────────────

function compact(v: number, digits = 3): string {
  const a = Math.abs(v);
  if (a >= 1e12) return `${Number((v / 1e12).toPrecision(digits))} trillion`;
  if (a >= 1e9) return `${Number((v / 1e9).toPrecision(digits))} billion`;
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(digits))} million`;
  return Math.round(v).toLocaleString("en-US");
}

function fmt(ind: { format: string; dp: number }, v: number): string {
  switch (ind.format) {
    case "pct":
      return `${v.toFixed(ind.dp)}%`;
    case "usd":
      return Math.abs(v) >= 1e6 ? `$${compact(v)}` : `$${Math.round(v).toLocaleString("en-US")}`;
    case "count":
      return compact(v);
    default:
      return v.toLocaleString("en-US", { minimumFractionDigits: ind.dp, maximumFractionDigits: ind.dp });
  }
}

const lastOf = (id: string) => WORLD[id].series[WORLD[id].series.length - 1];
/** Units the source gives only as "%", said in full. */
const UNIT: Record<string, string> = { womenParliament: "% of seats" };
const unitOf = (ind: WorldIndicator) => UNIT[ind.id] ?? ind.unit;
const usd = (id: string) => `$${compact(lastOf(id)[1])}`;
const climateOf = (id: string) => CLIMATE_INDICATORS.find((c) => c.id === id);

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

/** The same comparison for a climate reading: the same month or year a decade earlier. */
function climateDelta(c: ClimateIndicator): Delta | null {
  if (c.decadeAgo === null) return null;
  const change = c.value - c.decadeAgo;
  // Less Arctic ice is worse; more of any gas, or more warming, is worse.
  const worseWhenUp = c.id !== "sea-ice";
  return {
    text: `${change > 0 ? "+" : ""}${Math.abs(change) < 1 ? change.toFixed(2) : change.toFixed(1)} on ten years before`,
    dir: change > 0 ? "up" : change < 0 ? "down" : "flat",
    verdict: change === 0 ? null : (change > 0) === worseWhenUp ? "worse" : "better",
  };
}

function DeltaLine({ d, small = false }: { d: Delta; small?: boolean }) {
  const Icon = d.dir === "up" ? ArrowUpRight : d.dir === "down" ? ArrowDownRight : ArrowRight;
  const tone = d.verdict === "better" ? BETTER : d.verdict === "worse" ? WORSE : "text-muted-foreground";
  return (
    <p className={`flex items-center gap-1 font-sans ${small ? "text-[10px]" : "text-[11px]"} ${tone}`}>
      <Icon size={small ? 10 : 12} weight="bold" aria-hidden />
      <span>
        {d.text}
        {d.verdict && <span className="font-semibold">{` · ${d.verdict}`}</span>}
      </span>
    </p>
  );
}

function SourceLink({ source, label }: { source: { label: string; url: string }; label?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-sans text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
    >
      {label ?? source.label}
    </a>
  );
}

// ── What each figure measures ──────────────────────────────────────────────
// Plain definitions, as the source defines each measure; a figure's note,
// where it has one, says what is particular about this series.

const DESCRIBE: Record<string, string> = {
  population: "Everyone living in the world at mid-year, whatever their legal status or citizenship.",
  popGrowth: "How fast the number of people is changing: the yearly increase as a share of the population.",
  fertility: "The number of children a woman would have at this year's birth rates. About 2.1 keeps a population the same size in the long run.",
  urban: "People living in places their country counts as urban; each country uses its own definition.",
  migrantShare: "People living in a country other than the one they were born in, as a share of everyone.",
  migrants: "People living in a country other than the one they were born in.",
  lifeExpectancy: "How long a baby born this year would live if today's death rates at every age stayed the same.",
  childMortality: "Children who die before their fifth birthday, for every 1,000 born alive.",
  undernourished: "People whose usual diet does not give them enough energy for a normal, active, healthy life.",
  foodInsecure: "People who, at times during the year, had to eat less or worse food, or went without, for lack of money or other resources.",
  literacy: "People aged 15 and over who can read and write a short, simple statement about their everyday life.",
  primaryCompletion: "Children reaching the last year of primary school, as a share of all children of that age.",
  lowerSecondary: "Young people reaching the last year of lower secondary school, as a share of all of that age.",
  secondaryEnrol: "Everyone enrolled in secondary school, whatever their age, as a share of the secondary-school age group.",
  tertiaryEnrol: "Everyone enrolled in university or college, as a share of the five-year age group after secondary school.",
  schoolingYears: "The average number of years of school completed by adults aged 25 and over.",
  eduSpend: "What governments spend on education, as a share of the world's output.",
  electricity: "People with access to electricity.",
  water: "People whose drinking water comes from a safe source on their premises, available when needed and free from contamination.",
  internet: "People who have used the internet in the past three months, from any device.",
  mobile: "Mobile phone subscriptions for every 100 people. One person can have several, so it can pass 100.",
  workGap: "How much more likely men are than women to be in paid work or looking for it, in percentage points.",
  homicide: "Deaths deliberately and unlawfully caused by another person, for every 100,000 people.",
  gdp: "The value of everything the world produces in a year, in current US dollars.",
  gdpGrowth: "The yearly change in the world's output once rising prices are taken out.",
  inflation: "The yearly rise in the prices people pay for goods and services.",
  unemployment: "People without work who are available for work and looking for it, as a share of everyone working or looking.",
  govDebt: "What governments at every level owe, as a share of the world's output.",
  extDebt: "What developing countries' governments and businesses owe to lenders abroad, as a share of their national income.",
  extDebtUsd: "What developing countries' governments and businesses owe to lenders abroad.",
  trade: "Exports and imports of goods and services, added together, as a share of the world's output.",
  fdi: "Investment from abroad that buys a lasting stake in a business, less what is withdrawn, as a share of the world's output.",
  extremePoverty: "People living on less than $3.00 a day, the World Bank's international poverty line.",
  poverty830: "People living on less than $8.30 a day, the poverty line typical of upper-middle-income countries.",
  research: "Spending on research and development, public and private, as a share of the world's output.",
  patents: "Patent applications filed by inventors at the patent office of the country they live in, added up across the world.",
  democracyShare: "The share of the world's people living in countries V-Dem classes as democracies.",
  civilLiberties: "How free people are from government violence, and to live private and political lives as they choose, averaged across the world's people.",
  freeExpression: "How free speech, the press and other sources of information are, averaged across the world's people.",
  womenParliament: "Seats held by women in national parliaments (the single or lower house).",
  conflicts: "Armed conflicts with a government on at least one side and at least 25 people killed in battle in the year.",
  conflictDeaths: "People killed in armed conflict: fighting that involves a government, fighting between armed groups, and attacks on civilians.",
  displaced: "People forced from their homes by persecution, conflict, violence or human rights violations, inside their country or across a border.",
  militaryGdp: "What countries spend on their armed forces, as a share of the world's output.",
  militaryUsd: "What countries spend on their armed forces.",
  terrorAttacks: "Attacks by groups or individuals, not governments, that use or threaten violence to reach a political, economic, religious or social goal.",
  terrorDeaths: "People killed in those attacks.",
  co2: "Carbon dioxide released by burning fossil fuels and by industry.",
  ghg: "All the greenhouse gases people release - carbon dioxide, methane, nitrous oxide and fluorinated gases - counted in CO₂ equivalents.",
  renewables: "The share of the energy people finally use that comes from renewable sources: water, wind, sun, biofuels and others.",
  forest: "Land covered by trees at least 5 metres tall, as a share of all land.",
};

const DESCRIBE_CLIMATE: Record<string, string> = {
  warming: "How much warmer the world's surface was than its average for 1951-1980.",
  co2: "Carbon dioxide in the air at Mauna Loa, Hawaii, in parts per million.",
  ch4: "Methane in the air, averaged across NOAA's ocean-surface sites, in parts per billion.",
  n2o: "Nitrous oxide in the air, averaged across NOAA's ocean-surface sites, in parts per billion.",
  aggi: "The warming effect of all long-lived greenhouse gases together, compared with 1990.",
  "sea-ice": "The area of the Arctic Ocean covered by ice in September, when it is at its smallest.",
};

// ── Trend lines ────────────────────────────────────────────────────────────

/** A small, static trend for a row: grey line, the latest point in the accent. */
function MiniTrend({ series }: { series: WorldPoint[] }) {
  if (series.length < 3) return null;
  const W = 64;
  const H = 20;
  const x0 = series[0][0];
  const x1 = series[series.length - 1][0];
  const ys = series.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => 2 + ((x - x0) / (x1 - x0 || 1)) * (W - 4);
  const py = (y: number) => H - 3 - ((y - lo) / (hi - lo || 1)) * (H - 6);
  const d = series.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const [lx, ly] = series[series.length - 1];
  return (
    <svg width={W} height={H} className="shrink-0 text-muted-foreground hidden sm:block" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={px(lx)} cy={py(ly)} r={3} className="fill-[#2a78d6] dark:fill-[#3987e5]" />
    </svg>
  );
}

/**
 * The full trend: a grey line with a faint wash, the latest point in the
 * accent. The pointer, or the arrow keys once focused, moves a crosshair and
 * reads out that year.
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
  const mark = shown ?? last;

  const nearest = (clientX: number, rect: DOMRect) => {
    const x = x0 + ((clientX - rect.left) / rect.width) * (x1 - x0);
    let best = 0;
    for (let i = 1; i < s.length; i++) if (Math.abs(s[i][0] - x) < Math.abs(s[best][0] - x)) best = i;
    return best;
  };

  return (
    <div>
      <p className="h-4 text-[10px] font-mono text-muted-foreground">
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
        aria-label={`${ind.label}, ${x0} to ${x1}: from ${fmt(ind, s[0][1])} to ${fmt(ind, last[1])}. Use the arrow keys to read each year; every year is also in the table.`}
        onPointerMove={(e) => setAt(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setAt(null)}
        onBlur={() => setAt(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setAt((i) => Math.max(0, Math.min(s.length - 1, (i ?? s.length - 1) + (e.key === "ArrowLeft" ? -1 : 1))));
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-muted-foreground" aria-hidden>
          <path d={area} fill="currentColor" opacity={0.08} />
          <path d={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {shown && <span className="absolute top-0 bottom-0 w-px bg-foreground/40" style={{ left: pct(shown[0]) }} aria-hidden />}
        <span
          className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background ${ACCENT_BG}`}
          style={{ left: pct(mark[0]), top: topPct(mark[1]) }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function YearTable({ ind }: { ind: WorldIndicator }) {
  return (
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
  );
}

function Breakdown({ ind }: { ind: WorldIndicator }) {
  if (!ind.breakdown?.length) return null;
  const max = Math.max(...ind.breakdown.map(([, v]) => v));
  const pctUnit = ind.breakdownUnit === "%";
  return (
    <div className="space-y-1.5">
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

// ── Hero and population clock ───────────────────────────────────────────────

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

function Hero() {
  const { isLight, muted, head } = useLook();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const pop = projectedPopulation(now);
  const yearMs = Date.UTC(POPULATION_PROJECTION.year + 1, 0, 1) - Date.UTC(POPULATION_PROJECTION.year, 0, 1);
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const todayMs = now - midnight.getTime();
  const born = Math.floor((POPULATION_PROJECTION.births * todayMs) / yearMs);
  const died = Math.floor((POPULATION_PROJECTION.deaths * todayMs) / yearMs);
  const perDay = (n: number) => Math.round((n * 86_400_000) / yearMs).toLocaleString("en-US");
  const all = PILLARS.map(pillarDirection).reduce(
    (t, d) => ({ better: t.better + d.better, worse: t.worse + d.worse, none: t.none + d.none }),
    { better: 0, worse: 0, none: 0 },
  );

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{ background: isLight ? "#ffffff" : "#0b0b0d", border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.12)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, ${isLight ? "#000000" : "#ffffff"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
      />
      <div className="relative px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="max-w-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: muted }}>
            CommonSphere · Worldview
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans" style={{ color: head }}>
            Where the world stands
          </h1>
          <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
            A dashboard of the whole world in four pillars - how people live, what the economy is doing, how the world is governed and at
            peace or war, and the state of the planet - each figure with what it measures, its trend and its source.
          </p>
          <p className="text-sm font-sans mt-3" style={{ color: head }}>
            Of the {all.better + all.worse} measures here whose direction is not a matter of opinion,{" "}
            <span className={`font-semibold ${BETTER}`}>{all.better} improved</span> over about ten years and{" "}
            <span className={`font-semibold ${WORSE}`}>{all.worse} worsened</span>.
          </p>
          <p className="text-[11px] font-sans mt-2" style={{ color: muted }}>
            {Object.keys(WORLD).length + CLIMATE_INDICATORS.length} world figures · {INCOME_GROUPS.reduce((t, g) => t + g.economies, 0)} economies by
            income group · figures retrieved {WORLDVIEW_RETRIEVED}, each cited to its source and year
          </p>
        </div>

        {pop !== null && (
          <div className="lg:text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
              People alive now · UN projection
            </p>
            <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1" style={{ color: head }} aria-hidden>
              {Math.round(pop).toLocaleString("en-US")}
            </p>
            <p className="sr-only">About {compact(pop)} people, on the UN's medium-variant projection.</p>
            <div className="mt-3 flex flex-wrap lg:justify-end gap-x-5 gap-y-1 text-[11px] font-mono" style={{ color: muted }}>
              <span>
                <span style={{ color: head }}>{born.toLocaleString("en-US")}</span> born today · {perDay(POPULATION_PROJECTION.births)} a day
              </span>
              <span>
                <span style={{ color: head }}>{died.toLocaleString("en-US")}</span> died today · {perDay(POPULATION_PROJECTION.deaths)} a day
              </span>
            </div>
            <p className="mt-2 text-[10px] font-sans max-w-sm lg:ml-auto" style={{ color: muted }}>
              A projection, not a count: it moves between the UN's figures for each 1 July (
              <SourceLink source={POPULATION_PROJECTION.source} label="World Population Prospects 2024" />
              ). The World Bank counted {compact(lastOf("population")[1])} in mid-{lastOf("population")[0]}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pillar navigation ───────────────────────────────────────────────────────

const SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "society", label: "Society" },
  { id: "economy", label: "Economy" },
  { id: "politics", label: "Politics" },
  { id: "ecology", label: "Ecology" },
  { id: "rankings", label: "Rankings" },
];

/** Sticky chips to each section, the one in view marked, as the other pages' filter bars. */
function PillarNav() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    // The section whose top has passed just under the sticky bars is the one
    // being read; checked once a frame while scrolling.
    let frame = 0;
    const check = () => {
      frame = 0;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 180) current = s.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <nav aria-label="Worldview sections" className="search-sticky sticky top-16 z-30 border border-border/60 rounded-2xl px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            aria-current={active === s.id ? "true" : undefined}
            className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
              active === s.id ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── World headlines ─────────────────────────────────────────────────────────

type Headline = { url: string; title: string; outlet: string; published_at: string; places: string[] };
const COUNTRY_NAME = new Map(countriesData.map((c) => [`c:${c.code}`, c.name]));

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/**
 * The latest headlines naming a country other than the United States,
 * fetched once per ten minutes. US desks tag every story with the US, so
 * a US-only story is domestic news - it has its own banner on the States
 * page - and a world banner of them was obituaries and state politics.
 */
let worldHeadlineCache: { at: number; rows: Headline[] } | null = null;
function useWorldHeadlines(): Headline[] {
  const [rows, setRows] = useState<Headline[]>(worldHeadlineCache?.rows ?? []);
  useEffect(() => {
    if (!supabase || (worldHeadlineCache && Date.now() - worldHeadlineCache.at < 10 * 60_000)) return;
    let live = true;
    supabase
      .from("news_items")
      .select("url, title, outlet, published_at, places")
      .gte("published_at", new Date(Date.now() - 2 * 86_400_000).toISOString())
      .order("published_at", { ascending: false })
      .limit(80)
      .then(({ data }) => {
        if (!live || !data) return;
        const clean = data
          .filter((r): r is Headline => typeof r.title === "string" && /^https:\/\//.test(r.url) && Array.isArray(r.places))
          .filter((r) => r.places.some((p) => p !== "c:US" && COUNTRY_NAME.has(p)))
          .slice(0, 30);
        worldHeadlineCache = { at: Date.now(), rows: clean };
        setRows(clean);
      });
    return () => {
      live = false;
    };
  }, []);
  return rows;
}

/**
 * The day's world news as a moving banner, like the States page's: headlines
 * from established outlets' public feeds naming a country, newest first,
 * refreshed on the server every half hour. It stops under the pointer or
 * keyboard focus and has a pause button; with reduced motion it stands still
 * and scrolls by hand. Without the news store it is left out.
 */
function WorldHeadlines() {
  const headlines = useWorldHeadlines();
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(120);
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // A steady reading speed, whatever the length: about 40 px a second.
    const measure = () => setDuration(Math.max(30, el.scrollWidth / 2 / 40));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [headlines.length]);
  if (!headlines.length) return null;

  const renderItems = (copy: boolean): ReactNode =>
    headlines.map((h) => {
      const names = h.places.map((p) => COUNTRY_NAME.get(p)).filter((n): n is string => !!n);
      const tag = names.length > 2 ? `${names.slice(0, 2).join(" · ")} +${names.length - 2}` : names.join(" · ");
      return (
        <a
          key={`${copy ? "b" : "a"}-${h.url}`}
          href={h.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${h.title} - ${h.outlet}`}
          tabIndex={copy ? -1 : undefined}
          className="group inline-flex items-center gap-2 shrink-0 whitespace-nowrap pr-6 text-xs font-sans text-foreground/90"
        >
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${names.length > 1 ? TONE.violet : TONE.blue}`}>{tag}</span>
          <span className="group-hover:underline">{h.title}</span>
          <span className="text-[10px] text-muted-foreground">
            {h.outlet} · {ago(h.published_at)}
          </span>
          <span aria-hidden className="text-muted-foreground/60 pl-4">
            •
          </span>
        </a>
      );
    });

  return (
    <section aria-label="World headlines" className="bg-card border border-border rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">World headlines</p>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            aria-label={paused ? "Play the banner" : "Pause the banner"}
            title={paused ? "Play" : "Pause"}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            {paused ? <Play size={12} weight="fill" /> : <Pause size={12} weight="fill" />}
          </button>
        </div>
        <div className="cs-ticker-viewport flex-1 min-w-0 py-1" data-paused={paused}>
          <div ref={trackRef} className="cs-ticker-track flex w-max" style={{ ["--cs-ticker-duration" as string]: `${duration}s` }}>
            <div className="flex">{renderItems(false)}</div>
            {/* The second copy, for a seamless loop; hidden from screen readers. */}
            <div className="cs-ticker-copy flex" aria-hidden>
              {renderItems(true)}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
        The last two days' headlines naming a country outside the United States (US news is on the States page), from established outlets'
        public news feeds, refreshed every half hour. A violet tag is a story naming more than one country. Each links to the outlet.
      </p>
    </section>
  );
}

// ── Headline figures ────────────────────────────────────────────────────────

function Pill({ label, value, sub, d }: { label: string; value: string; sub: string; d: Delta | null }) {
  const { card, muted, head } = useLook();
  return (
    <div className="rounded-2xl px-5 py-4 flex flex-col gap-1" style={card}>
      <p className="text-[11px] font-sans uppercase tracking-widest" style={{ color: muted }}>
        {label}
      </p>
      <p className="text-2xl font-bold font-mono" style={{ color: head }}>
        {value}
      </p>
      <p className="text-[10px] font-sans" style={{ color: muted }}>
        {sub}
      </p>
      {d && <DeltaLine d={d} small />}
    </div>
  );
}

function HeadlinePills() {
  const warming = climateOf("warming");
  const pill = (id: string, label: string, sub?: string) => {
    const ind = WORLD[id];
    const [y, v] = lastOf(id);
    return <Pill key={id} label={label} value={fmt(ind, v)} sub={sub ?? `${unitOf(ind)} · ${y}`} d={delta(ind)} />;
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {pill("population", "Population", `World Bank · ${lastOf("population")[0]}`)}
      {pill("gdp", "World GDP", `current US$ · ${lastOf("gdp")[0]}`)}
      {pill("conflicts", "Armed conflicts", `involving a state · ${lastOf("conflicts")[0]}`)}
      {pill("displaced", "Forcibly displaced", `UNHCR · ${lastOf("displaced")[0]}`)}
      {pill("govDebt", "Government debt", `% of world GDP · ${lastOf("govDebt")[0]}`)}
      {warming && (
        <Pill
          label="Warming"
          value={`${warming.value > 0 ? "+" : ""}${warming.value}${warming.unit.startsWith("°") ? "" : " "}${warming.unit}`}
          sub={`NASA GISTEMP · ${warming.period}`}
          d={climateDelta(warming)}
        />
      )}
    </div>
  );
}

// ── Ratios worked out from published counts ────────────────────────────────

/** Countries and people by Freedom House status, with the site's population figures. */
function freedomSplit() {
  const counts: Record<string, number> = { F: 0, PF: 0, NF: 0 };
  const people: Record<string, number> = { F: 0, PF: 0, NF: 0 };
  let year = 0;
  for (const c of countriesData) {
    const f = COUNTRY_FIGURES.freedom[c.code];
    if (!f) continue;
    year = f[0];
    counts[f[4]]++;
    people[f[4]] += has(c.population) ? c.population : 0;
  }
  const total = people.F + people.PF + people.NF;
  return { year, counts, people, freeShare: total ? (100 * people.F) / total : NaN };
}

/** The forcibly displaced as a share of the world's people, year by year: UNHCR's count over the World Bank's. */
function displacedShare(): WorldIndicator {
  const pop = new Map(WORLD.population.series);
  const series = WORLD.displaced.series
    .filter(([y]) => pop.has(y))
    .map(([y, v]) => [y, Math.round((10000 * v) / pop.get(y)!) / 100] as WorldPoint);
  return {
    id: "displacedShare",
    label: "Forcibly displaced",
    unit: "% of the world's people",
    format: "pct",
    dp: 2,
    upIsGood: false,
    series,
    source: WORLD.displaced.source,
  };
}

// ── The four pillars ────────────────────────────────────────────────────────

type Tile = { label: string; value: string; sub: string; d: Delta | null };
type Group = { title: string; intro: string; ids: string[]; climate?: string[]; extras?: Record<string, string>; freedom?: boolean };
type Pillar = {
  id: "society" | "economy" | "politics" | "ecology";
  title: string;
  kicker: string;
  color: string;
  icon: ReactNode;
  description: string;
  summary: () => string;
  tiles: () => Tile[];
  groups: Group[];
};

const worldTile = (id: string, label: string): Tile => {
  const ind = WORLD[id];
  const [y, v] = lastOf(id);
  return { label, value: fmt(ind, v), sub: `${unitOf(ind)} · ${y}`, d: delta(ind) };
};
const climateTile = (id: string, label: string): Tile | null => {
  const c = climateOf(id);
  if (!c) return null;
  return { label, value: `${c.id === "warming" && c.value > 0 ? "+" : ""}${c.value}${c.unit.startsWith("°") ? "" : " "}${c.unit}`, sub: c.period, d: climateDelta(c) };
};
const pctOf = (id: string, dp = 1) => `${lastOf(id)[1].toFixed(dp)}%`;

const PILLARS: Pillar[] = [
  {
    id: "society",
    title: "Society",
    kicker: "How people live",
    color: "#6366f1",
    icon: <UsersThree size={18} weight="fill" />,
    description:
      "Who we are and how we live: population and where people live, health and food, schooling, and access to the basics - electricity, clean water, the internet - with the gaps between women and men and the level of violent crime.",
    summary: () =>
      `${pctOf("urban")} of people live in cities and ${pctOf("internet")} use the internet (${lastOf("internet")[0]}). ${pctOf("literacy")} of adults can read, a newborn can expect to live ${lastOf("lifeExpectancy")[1]} years, and ${pctOf("undernourished")} of people do not get enough to eat (${lastOf("undernourished")[0]}).`,
    tiles: () => [
      worldTile("urban", "Live in cities"),
      worldTile("internet", "Use the internet"),
      worldTile("literacy", "Adults who can read"),
      worldTile("undernourished", "Undernourished"),
    ],
    groups: [
      {
        title: "People",
        intro: "How many of us there are, how fast that is changing, and where people live.",
        ids: ["population", "popGrowth", "fertility", "urban", "migrantShare"],
      },
      {
        title: "Health & food",
        intro: "How long people live, how many children survive, and whether people have enough to eat.",
        ids: ["lifeExpectancy", "childMortality", "undernourished", "foodInsecure"],
      },
      {
        title: "Education",
        intro: "Who can read, who finishes school, who goes on to university, and what governments spend on it.",
        ids: ["literacy", "primaryCompletion", "lowerSecondary", "tertiaryEnrol", "schoolingYears", "eduSpend"],
      },
      {
        title: "Access & equality",
        intro: "The basics of modern life, the gap between women and men in paid work, and violent crime.",
        ids: ["electricity", "water", "internet", "mobile", "workGap", "homicide"],
      },
    ],
  },
  {
    id: "economy",
    title: "Economy",
    kicker: "What the world produces and owes",
    color: "#0ea5e9",
    icon: <Coins size={18} weight="fill" />,
    description:
      "The world economy: its size and growth, prices and jobs, what governments and developing countries owe, how open it is to trade and investment, poverty, and what it puts into new knowledge - and how it divides between developed and developing countries.",
    summary: () =>
      `The world produced ${usd("gdp")} in ${lastOf("gdp")[0]}, growing ${pctOf("gdpGrowth", 2)} after inflation, while prices rose ${pctOf("inflation", 2)} and ${pctOf("unemployment", 2)} of the labour force was out of work. Governments owe ${pctOf("govDebt")} of world GDP, and ${pctOf("extremePoverty")} of people live on less than $3 a day (${lastOf("extremePoverty")[0]}).`,
    tiles: () => [
      worldTile("gdpGrowth", "Real growth"),
      worldTile("inflation", "Inflation"),
      worldTile("govDebt", "Government debt"),
      worldTile("extremePoverty", "Extreme poverty"),
    ],
    groups: [
      {
        title: "Output, prices & jobs",
        intro: "The size of the world economy, how fast it grows, and what is happening to prices and work.",
        ids: ["gdp", "gdpGrowth", "inflation", "unemployment"],
      },
      {
        title: "Debt & openness",
        intro: "What governments (IMF) and developing countries (World Bank) owe, and how much crosses borders.",
        ids: ["govDebt", "extDebt", "trade", "fdi"],
        extras: { extDebt: `${usd("extDebtUsd")} in ${lastOf("extDebtUsd")[0]}` },
      },
      {
        title: "Poverty",
        intro: "The World Bank's two main lines: extreme poverty, and the line typical of upper-middle-income countries.",
        ids: ["extremePoverty", "poverty830"],
      },
      {
        title: "Knowledge & innovation",
        intro: "What the world invests in research, and the inventions it files for protection.",
        ids: ["research", "patents"],
      },
    ],
  },
  {
    id: "politics",
    title: "Politics",
    kicker: "How the world is governed, at peace and at war",
    color: "#8b5cf6",
    icon: <Bank size={18} weight="fill" />,
    description:
      "How the world is governed and how safe it is: democracy and civil liberties, women in parliament, armed conflict and the people it drives from home, military spending, terrorism, and the blocs countries belong to.",
    summary: () => {
      const f = freedomSplit();
      const ds = displacedShare();
      return `${pctOf("democracyShare")} of people live in a democracy (V-Dem, ${lastOf("democracyShare")[0]}) and ${f.freeShare.toFixed(1)}% in a country Freedom House rates Free (${f.year}). ${lastOf("conflicts")[1]} armed conflicts involved a government in ${lastOf("conflicts")[0]}, and ${compact(lastOf("displaced")[1])} people - ${ds.series[ds.series.length - 1][1].toFixed(2)}% of everyone - were forcibly displaced.`;
    },
    tiles: () => {
      const f = freedomSplit();
      const ds = displacedShare();
      const [dy, dv] = ds.series[ds.series.length - 1];
      return [
        worldTile("democracyShare", "Live in a democracy"),
        { label: "Live in a Free country", value: `${f.freeShare.toFixed(1)}%`, sub: `Freedom House · ${f.year}`, d: null },
        worldTile("womenParliament", "Women in parliament"),
        { label: "Forcibly displaced", value: `${dv.toFixed(2)}%`, sub: `of all people · ${dy}`, d: delta(ds) },
      ];
    },
    groups: [
      {
        title: "Democracy & rights",
        intro:
          "How free people are to speak, organise and choose their governments: Freedom House's status for every country, and V-Dem's measures averaged across the world's people.",
        ids: ["democracyShare", "civilLiberties", "freeExpression", "womenParliament"],
        freedom: true,
      },
      {
        title: "War & peace",
        intro: "Armed conflict (Uppsala Conflict Data Program), the people it drives from home (UNHCR), and what the world spends on arms.",
        ids: ["conflicts", "conflictDeaths", "displaced", "militaryGdp"],
        extras: { militaryGdp: `${usd("militaryUsd")} in ${lastOf("militaryUsd")[0]}` },
      },
      {
        title: "Terrorism",
        intro: "Attacks and deaths recorded by the Global Terrorism Database, whose public release ends in 2021; later years are not published openly.",
        ids: ["terrorAttacks", "terrorDeaths"],
      },
    ],
  },
  {
    id: "ecology",
    title: "Ecology",
    kicker: "The state of the planet",
    color: "#14b8a6",
    icon: <Leaf size={18} weight="fill" />,
    description: `The planet as the agencies that measure it last read it (retrieved ${CLIMATE_RETRIEVED}) - temperature and the gases that drive it, Arctic ice - then what people emit, how much of their energy is renewable, and how much of the land is forest.`,
    summary: () => {
      const w = climateOf("warming");
      const c = climateOf("co2");
      return `${w ? `The surface was ${w.value} °C warmer than its 1951-1980 average in ${w.period}` : "Surface temperature is shown below"}${c ? `, with carbon dioxide at ${c.value} ppm (${c.period})` : ""}. People released ${compact(lastOf("ghg")[1] * 1e6)} tonnes of greenhouse gases in ${lastOf("ghg")[0]}; renewables supplied ${pctOf("renewables")} of final energy (${lastOf("renewables")[0]}), and forests cover ${lastOf("forest")[1].toFixed(1)}% of the land (${lastOf("forest")[0]}).`;
    },
    tiles: () =>
      [
        climateTile("warming", "Warming"),
        climateTile("co2", "Carbon dioxide"),
        worldTile("renewables", "Renewable energy"),
        worldTile("forest", "Forest cover"),
      ].filter((t): t is Tile => t !== null),
    groups: [
      {
        title: "Atmosphere",
        intro: "The latest readings from NASA and NOAA, each against the same month or year a decade earlier.",
        ids: [],
        climate: ["warming", "co2", "ch4", "n2o", "aggi"],
      },
      {
        title: "Emissions & energy",
        intro: "What people release into the air each year, and how much of the energy they use is renewable.",
        ids: ["co2", "ghg", "renewables"],
      },
      {
        title: "Land & ice",
        intro: "How much of the land is forest, and how much of the Arctic Ocean stays frozen at summer's end.",
        ids: ["forest"],
        climate: ["sea-ice"],
      },
    ],
  },
];

/** How many of a pillar's measures improved, worsened, or have no verdict, over about ten years. */
function pillarDirection(p: Pillar) {
  const out = { better: 0, worse: 0, none: 0 };
  const seen = new Set<string>();
  for (const g of p.groups) {
    for (const id of g.ids) {
      if (seen.has(`w:${id}`)) continue;
      seen.add(`w:${id}`);
      const v = delta(WORLD[id])?.verdict ?? null;
      out[v ?? "none"]++;
    }
    for (const id of g.climate ?? []) {
      const c = climateOf(id);
      if (!c || seen.has(`c:${id}`)) continue;
      seen.add(`c:${id}`);
      const v = climateDelta(c)?.verdict ?? null;
      out[v ?? "none"]++;
    }
  }
  return out;
}

/** Better / worse / no verdict as one bar, each part labelled with its count and word. */
function DirectionBar({ p }: { p: Pillar }) {
  const d = pillarDirection(p);
  const total = d.better + d.worse + d.none || 1;
  const judged = d.better + d.worse;
  const parts = [
    { key: "better", n: d.better, fill: BETTER_FILL, label: "better", Icon: ArrowUpRight, tone: BETTER },
    { key: "worse", n: d.worse, fill: WORSE_FILL, label: "worse", Icon: ArrowDownRight, tone: WORSE },
    { key: "none", n: d.none, fill: NEUTRAL_FILL, label: "no verdict", Icon: Minus, tone: "text-muted-foreground" },
  ];
  return (
    <div>
      <div className="flex h-2 w-full gap-[2px]" role="img" aria-label={`${d.better} better, ${d.worse} worse, ${d.none} with no verdict`}>
        {parts.map((x) =>
          x.n ? <div key={x.key} className={`${x.fill} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(100 * x.n) / total}%` }} /> : null,
        )}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-sans">
        {parts.map((x) => (
          <span key={x.key} className={`inline-flex items-center gap-0.5 ${x.tone}`}>
            <x.Icon size={10} weight="bold" aria-hidden />
            {x.n} {x.label}
          </span>
        ))}
        {judged > 0 && <span className="text-muted-foreground">· {Math.round((100 * d.better) / judged)}% of judged measures improving</span>}
      </p>
    </div>
  );
}

function PillarCard({ p }: { p: Pillar }) {
  const { card, head, muted } = useLook();
  const tiles = p.tiles();
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ ...card, boxShadow: `inset 3px 0 0 0 ${p.color}, ${card.boxShadow}` }}>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: p.color + "18", border: `1px solid ${p.color}40`, color: p.color }}
        >
          {p.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold font-sans" style={{ color: head }}>
            {p.title}
          </h3>
          <p className="text-[11px] font-sans" style={{ color: muted }}>
            {p.kicker}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl modal-tile px-3 py-2.5">
            <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: muted }}>
              {t.label}
            </p>
            <p className="text-xl font-bold font-mono leading-tight" style={{ color: head }}>
              {t.value}
            </p>
            <p className="text-[10px] font-sans" style={{ color: muted }}>
              {t.sub}
            </p>
            {t.d && <DeltaLine d={t.d} small />}
          </div>
        ))}
      </div>
      <p className="text-xs font-sans leading-relaxed text-foreground/85">{p.summary()}</p>
      <DirectionBar p={p} />
      <button
        type="button"
        onClick={() => document.getElementById(p.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="mt-auto self-start inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-75 cursor-pointer"
        style={{ color: p.color }}
      >
        All {p.title.toLowerCase()} figures <ArrowRight size={11} weight="bold" />
      </button>
    </div>
  );
}

// ── One figure, as a dashboard row ──────────────────────────────────────────

/** One figure as a row: what it measures, its value and direction; opens to its trend, parts, note, table and source. */
function MetricRow({ ind, extra, last = false }: { ind: WorldIndicator; extra?: string; last?: boolean }) {
  const { head, muted, grid } = useLook();
  const [open, setOpen] = useState(false);
  const [y, v] = ind.series[ind.series.length - 1];
  const d = delta(ind);
  const about = DESCRIBE[ind.id];
  return (
    <li style={{ borderBottom: last ? "none" : `1px solid ${grid}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-2.5 text-left hover:opacity-90 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-sans" style={{ color: head }}>
            {ind.label}
          </p>
          {about && (
            <p className="text-[10px] font-sans leading-snug line-clamp-2" style={{ color: muted }}>
              {about}
            </p>
          )}
          <p className="text-[10px] font-mono mt-0.5" style={{ color: muted }}>
            {unitOf(ind)} · {y}
            {extra ? ` · ${extra}` : ""}
          </p>
          {d && (
            <div className="mt-0.5">
              <DeltaLine d={d} small />
            </div>
          )}
        </div>
        <MiniTrend series={ind.series} />
        <span className="w-24 text-right text-sm font-bold font-mono shrink-0" style={{ color: head }}>
          {fmt(ind, v)}
        </span>
        <CaretDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: muted }} aria-hidden />
      </button>
      {open && (
        <div className="pb-3 pl-1 space-y-3 animate-fade-in">
          {about && <p className="text-[11px] font-sans text-foreground/85 leading-snug">{about}</p>}
          {ind.series.length > 2 && <Sparkline ind={ind} />}
          <Breakdown ind={ind} />
          {ind.note && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{ind.note}</p>}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <SourceLink source={ind.source} />
            <YearTable ind={ind} />
          </div>
        </div>
      )}
    </li>
  );
}

function ClimateRow({ c, last = false }: { c: ClimateIndicator; last?: boolean }) {
  const { head, muted, grid } = useLook();
  const [open, setOpen] = useState(false);
  const d = climateDelta(c);
  const about = DESCRIBE_CLIMATE[c.id];
  return (
    <li style={{ borderBottom: last ? "none" : `1px solid ${grid}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full py-2.5 flex items-center gap-3 text-left hover:opacity-90 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-sans" style={{ color: head }}>
            {c.label}
          </p>
          {about && (
            <p className="text-[10px] font-sans leading-snug line-clamp-2" style={{ color: muted }}>
              {about}
            </p>
          )}
          <p className="text-[10px] font-mono mt-0.5" style={{ color: muted }}>
            {c.unit} · {c.period}
          </p>
          {d && (
            <div className="mt-0.5">
              <DeltaLine small d={d} />
            </div>
          )}
        </div>
        <span className="w-24 text-right text-sm font-bold font-mono shrink-0" style={{ color: head }}>
          {c.value}
        </span>
        <CaretDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: muted }} aria-hidden />
      </button>
      {open && (
        <div className="pb-3 pl-1 space-y-2 animate-fade-in">
          {about && <p className="text-[11px] font-sans text-foreground/85 leading-snug">{about}</p>}
          {c.note && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{c.note}</p>}
          {c.decadeAgo !== null && (
            <p className="text-[10px] font-mono text-muted-foreground">
              Ten years before: {c.decadeAgo} {c.unit}
            </p>
          )}
          <SourceLink source={{ label: c.source, url: c.url }} />
        </div>
      )}
    </li>
  );
}

// ── Developed and developing ────────────────────────────────────────────────

type Split = { label: string; parts: { key: string; value: number }[] };

/** 100% bars for ordered classes, a 2px gap between parts; labels only where they fit. */
function SplitBars({ classes, rows, ramp }: { classes: { key: string; label: string; note?: string }[]; rows: Split[]; ramp: { fill: string; ink: string }[] }) {
  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Legend">
        {classes.map((c, i) => (
          <li key={c.key} className="flex items-center gap-1.5 text-[10px] font-sans text-foreground/85">
            <span className={`h-2.5 w-2.5 rounded-sm ${ramp[i].fill}`} aria-hidden />
            {c.label}
            {c.note && <span className="text-muted-foreground">{c.note}</span>}
          </li>
        ))}
      </ul>
      {rows.map((r) => {
        const total = r.parts.reduce((t, p) => t + p.value, 0) || 1;
        return (
          <div key={r.label}>
            <p className="text-[11px] font-sans text-muted-foreground mb-1">{r.label}</p>
            <div className="flex h-6 w-full gap-[2px]">
              {r.parts.map((p) => {
                const share = (100 * p.value) / total;
                if (share <= 0) return null;
                const cls = classes.find((c) => c.key === p.key)!;
                const slot = ramp[classes.indexOf(cls)];
                return (
                  <div
                    key={p.key}
                    className={`flex items-center justify-center overflow-visible first:rounded-l-md last:rounded-r-md ${slot.fill}`}
                    style={{ width: `${share}%` }}
                    title={`${cls.label}: ${share.toFixed(1)}%`}
                    aria-label={`${cls.label}: ${share.toFixed(1)}%`}
                    role="img"
                  >
                    {share >= 9 && <span className={`text-[10px] font-mono font-semibold ${slot.ink}`}>{Math.round(share)}%</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <details className="text-[10px] font-sans text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">As a table</summary>
        <table className="mt-1.5 w-full font-mono">
          <thead>
            <tr>
              <th className="text-left font-sans font-medium py-0.5 pr-2" />
              {classes.map((c) => (
                <th key={c.key} className="text-right font-sans font-medium py-0.5 pl-2">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = r.parts.reduce((t, p) => t + p.value, 0) || 1;
              return (
                <tr key={r.label} className="border-t border-border/40">
                  <td className="py-0.5 pr-2 font-sans">{r.label}</td>
                  {classes.map((c) => {
                    const v = r.parts.find((p) => p.key === c.key)?.value ?? 0;
                    return (
                      <td key={c.key} className="py-0.5 pl-2 text-right text-foreground tabular-nums">
                        {((100 * v) / total).toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}

const HDI_TIERS = [
  { key: "vh", label: "Very high", note: "0.800+", min: 0.8 },
  { key: "h", label: "High", note: "0.700–0.799", min: 0.7 },
  { key: "m", label: "Medium", note: "0.550–0.699", min: 0.55 },
  { key: "l", label: "Low", note: "under 0.550", min: 0 },
];

function DevelopmentPanel() {
  const { head } = useLook();
  const byIncome = (id: string) => BY_INCOME.find((r) => r.id === id)!;
  const pop = byIncome("population");
  const gdp = byIncome("gdp");
  const incomeClasses = INCOME_GROUPS.map((g) => ({ key: g.id, label: g.label }));
  const incomeRows: Split[] = [
    { label: `Economies (${INCOME_GROUPS.reduce((t, g) => t + g.economies, 0)})`, parts: INCOME_GROUPS.map((g) => ({ key: g.id, value: g.economies })) },
    { label: `The world's people (${pop.values.HIC?.[0]})`, parts: INCOME_GROUPS.map((g) => ({ key: g.id, value: pop.values[g.id]?.[1] ?? 0 })) },
    { label: `The world's output, GDP (${gdp.values.HIC?.[0]})`, parts: INCOME_GROUPS.map((g) => ({ key: g.id, value: gdp.values[g.id]?.[1] ?? 0 })) },
  ];

  // UN M49 developed / developing, summed from the site's country figures.
  const m49 = useMemo(() => {
    const north = new Set<string>(GLOBAL_NORTH_CODES);
    const south = new Set<string>(GLOBAL_SOUTH_CODES);
    const sum = (set: Set<string>, f: (c: Country) => number) =>
      countriesData.filter((c) => set.has(c.code)).reduce((t, c) => t + (has(f(c)) ? f(c) : 0), 0);
    return {
      classes: [
        { key: "dev", label: "Developed" },
        { key: "ing", label: "Developing" },
      ],
      rows: [
        { label: "Countries and territories", parts: [{ key: "dev", value: north.size }, { key: "ing", value: south.size }] },
        { label: "The world's people", parts: [{ key: "dev", value: sum(north, (c) => c.population) }, { key: "ing", value: sum(south, (c) => c.population) }] },
        { label: "The world's output (GDP)", parts: [{ key: "dev", value: sum(north, (c) => c.gdp) }, { key: "ing", value: sum(south, (c) => c.gdp) }] },
      ] as Split[],
    };
  }, []);

  // UNDP human development tiers, from each country's HDI.
  const hdi = useMemo(() => {
    const tierOf = (v: number) => HDI_TIERS.find((t) => v >= t.min)!.key;
    const counts: Record<string, number> = {};
    const people: Record<string, number> = {};
    let year = "";
    for (const c of countriesData) {
      const h = COUNTRY_PANELS[c.id]?.hdi;
      if (!h || c.territory) continue;
      year = h.y;
      const t = tierOf(h.v);
      counts[t] = (counts[t] ?? 0) + 1;
      people[t] = (people[t] ?? 0) + (has(c.population) ? c.population : 0);
    }
    return {
      year,
      total: Object.values(counts).reduce((t, n) => t + n, 0),
      rows: [
        { label: "Countries", parts: HDI_TIERS.map((t) => ({ key: t.key, value: counts[t.key] ?? 0 })) },
        { label: "Their people", parts: HDI_TIERS.map((t) => ({ key: t.key, value: people[t.key] ?? 0 })) },
      ] as Split[],
    };
  }, []);

  const Block = ({ title, sub, children, source }: { title: string; sub: string; children: ReactNode; source: ReactNode }) => (
    <div className="rounded-xl p-4 modal-tile flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold font-sans" style={{ color: head }}>
          {title}
        </h3>
        <p className="text-[10px] font-sans text-muted-foreground leading-snug">{sub}</p>
      </div>
      {children}
      <div className="mt-auto">{source}</div>
    </div>
  );

  return (
    <Card>
      <CardHeader icon={<Scales size={16} weight="fill" />} title="Developed & developing" badge="three classifications" color="#6366f1" />
      <p className="text-xs font-sans text-muted-foreground max-w-4xl -mt-2 mb-4 leading-relaxed">
        There is no single official list of developed countries. The three bodies that classify countries do it differently - by income
        (World Bank), by a statistical convention (UN M49), and by health, education and income together (UNDP) - so all three are
        shown, with what each says about where the world's people and output are.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block
          title="By income"
          sub="The World Bank's four income groups, by gross national income per person. The Bank's own aggregates for each group."
          source={<SourceLink source={INCOME_SOURCE} />}
        >
          <SplitBars classes={incomeClasses} rows={incomeRows} ramp={ORD4} />
        </Block>
        <Block
          title="Developed or developing"
          sub="The UN's M49 statistical split - the published list closest to 'developed countries'. The UN says it is for statistical convenience, not a judgement."
          source={<SourceLink source={DEVELOPMENT_STATUS_SOURCE} />}
        >
          <SplitBars classes={m49.classes} rows={m49.rows} ramp={ORD2} />
        </Block>
        <Block
          title="By human development"
          sub={`UNDP's Human Development Index (health, education, income), ${hdi.year}, for the ${hdi.total} countries it scores, in its four tiers.`}
          source={<SourceLink source={PANEL_SOURCES.hdr} />}
        >
          <SplitBars classes={HDI_TIERS.map((t) => ({ key: t.key, label: t.label, note: t.note }))} rows={hdi.rows} ramp={ORD4} />
        </Block>
      </div>

      {/* The same measures across the income groups. */}
      <h3 className="mt-6 mb-2 text-sm font-bold font-sans" style={{ color: head }}>
        Life in each income group
      </h3>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
              <th className="text-left font-medium pb-2 pr-3">Measure</th>
              <th className="text-right font-medium pb-2 px-2">World</th>
              {INCOME_GROUPS.map((g, i) => (
                <th key={g.id} className="text-right font-medium pb-2 px-2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`h-2 w-2 rounded-sm ${ORD4[i].fill}`} aria-hidden />
                    {g.label.replace(" income", "")}
                  </span>
                </th>
              ))}
              <th className="text-right font-medium pb-2 pl-2">Year</th>
            </tr>
          </thead>
          <tbody>
            {BY_INCOME.filter((r) => r.id !== "population" && r.id !== "gdp").map((r) => {
              const year = r.values.WLD?.[0] ?? r.values.HIC?.[0];
              return (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="py-2 pr-3 text-xs font-sans text-foreground">
                    <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {r.label}
                    </a>
                  </td>
                  {(["WLD", ...INCOME_GROUPS.map((g) => g.id)] as ("WLD" | IncomeGroup)[]).map((a) => (
                    <td key={a} className={`py-2 px-2 text-right text-xs font-mono tabular-nums ${a === "WLD" ? "text-muted-foreground" : "text-foreground"}`}>
                      {r.values[a] ? fmt(r, r.values[a]![1]) : "—"}
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-right text-[10px] font-mono text-muted-foreground">{year}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] font-sans text-muted-foreground">
        The World Bank's aggregates for each group ({INCOME_GROUPS.map((g) => `${g.economies} ${g.label.toLowerCase()}`).join(", ")} economies). Each
        measure links to its series. <SourceLink source={INCOME_SOURCE} label="Which economies are in each group" />.
      </p>
    </Card>
  );
}

// ── Rights and liberties ────────────────────────────────────────────────────

const FREEDOM_CLASSES = [
  { key: "F", label: "Free" },
  { key: "PF", label: "Partly Free" },
  { key: "NF", label: "Not Free" },
];

function FreedomBars() {
  const f = useMemo(freedomSplit, []);
  return (
    <div className="rounded-xl p-4 modal-tile mb-2">
      <p className="text-xs font-semibold font-sans text-foreground">Freedom House status, {f.year}</p>
      <p className="text-[10px] font-sans text-muted-foreground mb-3 leading-snug">
        Political rights and civil liberties scored for {f.counts.F + f.counts.PF + f.counts.NF} countries and territories; the status follows
        Freedom House's published rules from the two scores. People are each country's latest population on this site.
      </p>
      <SplitBars
        classes={FREEDOM_CLASSES}
        ramp={ORD3}
        rows={[
          { label: "Countries", parts: FREEDOM_CLASSES.map((c) => ({ key: c.key, value: f.counts[c.key] })) },
          { label: "The world's people", parts: FREEDOM_CLASSES.map((c) => ({ key: c.key, value: f.people[c.key] })) },
        ]}
      />
      <div className="mt-2">
        <SourceLink source={COUNTRY_FIGURE_SOURCES.freedom} />
      </div>
    </div>
  );
}

// ── Of every 100 people, and the blocs ──────────────────────────────────────

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
  const free = useMemo(freedomSplit, []);
  const rows: { key: string; text: string; year: number; v: number; url: string }[] = [
    ...OUT_OF_100.map(([id, text]) => {
      const [year, v] = lastOf(id);
      return { key: id, text, year, v, url: WORLD[id].source.url };
    }),
    { key: "free", text: "live in a country Freedom House rates Free", year: free.year, v: free.freeShare, url: COUNTRY_FIGURE_SOURCES.freedom.url },
    { key: "migrants", text: "live outside the country they were born in", year: lastOf("migrantShare")[0], v: lastOf("migrantShare")[1], url: WORLD.migrantShare.source.url },
  ].sort((a, b) => b.v - a.v);
  return (
    <Card>
      <CardHeader icon={<UsersThree size={16} weight="fill" />} title="Of every 100 people" badge="latest year" color="#6366f1" />
      <p className="text-[11px] font-sans text-muted-foreground -mt-2 mb-3 leading-relaxed">
        The world as a hundred people: each share is of everyone alive, from the same sources as the figures below.
      </p>
      <ul className="space-y-3">
        {rows.map(({ key: id, text, year, v, url }) => (
          <li key={id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-sans text-foreground">
                <span className="font-mono font-bold">{Math.round(v)}</span> {text}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {v.toFixed(1)}% · {year} · <SourceLink source={{ label: "source", url }} />
              </p>
            </div>
            <div className={`mt-1 h-2 rounded-full ${ACCENT_TRACK}`} aria-hidden>
              <div className={`h-2 rounded-full ${ACCENT_BG}`} style={{ width: `${v}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const BLOCS = ["g20", "g7", "brics", "eu", "nato", "oecd", "au", "asean", "sco", "opec"];

function BlocShares() {
  const worldPop = lastOf("population");
  const worldGdp = lastOf("gdp");
  const rows = useMemo(
    () =>
      BLOCS.map((id) => ALLIANCES.find((a) => a.id === id))
        .filter((a): a is (typeof ALLIANCES)[number] => !!a?.members?.length)
        .map((a) => {
          const members = countriesData.filter((c) => a.members!.includes(c.code));
          const pop = members.reduce((t, c) => t + (has(c.population) ? c.population : 0), 0);
          const gdp = members.reduce((t, c) => t + (has(c.gdp) ? c.gdp * 1e9 : 0), 0);
          return { id: a.id, name: a.short, full: a.name, counted: members.length, memberCount: a.memberCount, pop: (100 * pop) / worldPop[1], gdp: (100 * gdp) / worldGdp[1], source: a.source };
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
    <Card>
      <CardHeader icon={<GlobeStand size={16} weight="fill" />} title="Geopolitics: the blocs' share of the world" badge={`${rows.length} blocs`} color="#8b5cf6" />
      <p className="text-[11px] font-sans text-muted-foreground -mt-2 mb-3 leading-relaxed">
        The groupings countries have joined, and how much of the world's people and output their members account for.
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
                    {r.counted} of {r.memberCount} members are countries
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
      <p className="mt-2 text-[10px] font-sans text-muted-foreground">
        Members' population and GDP (each member's latest World Bank year) against the world totals for {worldPop[0]}. Blocs overlap, so the
        shares do not add up. Memberships as checked on {ALLIANCES_CHECKED}.
      </p>
    </Card>
  );
}

// ── A pillar's section ──────────────────────────────────────────────────────

function GroupCard({ g, color }: { g: Group; color: string }) {
  const { head } = useLook();
  const climate = (g.climate ?? []).map(climateOf).filter((c): c is ClimateIndicator => !!c);
  const count = g.ids.length + climate.length;
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold font-sans" style={{ color: head }}>
          {g.title}
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: color + "18", color }}>
          {count} figure{count === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-[11px] font-sans text-muted-foreground mb-2 leading-relaxed">{g.intro}</p>
      {g.freedom && <FreedomBars />}
      <ul>
        {climate.map((c, i) => (
          <ClimateRow key={c.id} c={c} last={!g.ids.length && i === climate.length - 1} />
        ))}
        {g.ids.map((k, i) => (
          <MetricRow key={k} ind={WORLD[k]} extra={g.extras?.[k]} last={i === g.ids.length - 1} />
        ))}
      </ul>
    </Card>
  );
}

function PillarSection({ p, lead }: { p: Pillar; lead?: ReactNode }) {
  const { head, muted } = useLook();
  const count = p.groups.reduce((t, g) => t + g.ids.length + (g.climate?.length ?? 0), 0);
  return (
    <section id={p.id} className="scroll-mt-36 flex flex-col gap-4" aria-labelledby={`${p.id}-title`}>
      <div className="px-1 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: p.color }}>{p.icon}</span>
          <h2 id={`${p.id}-title`} className="text-xl font-bold font-sans" style={{ color: head }}>
            {p.title}
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: p.color + "18", color: p.color }}>
            {count} figures
          </span>
          <span className="text-[11px] font-sans" style={{ color: muted }}>
            {p.kicker}
          </span>
        </div>
        <p className="text-xs font-sans leading-relaxed mt-1.5 max-w-4xl" style={{ color: muted }}>
          {p.description}
        </p>
        <div className="mt-2 max-w-xl">
          <DirectionBar p={p} />
        </div>
      </div>
      {lead}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {p.groups.map((g) => (
          <GroupCard key={g.title} g={g} color={p.color} />
        ))}
      </div>
    </section>
  );
}

// ── Rankings ────────────────────────────────────────────────────────────────

type RankingDef = {
  id: string;
  pillar: Pillar["id"];
  top: string;
  bottom: string;
  value: (c: Country) => number;
  format: (v: number) => string;
  year: (c: Country) => string;
  source: string;
  /** Which countries are ranked, beyond "countries, not territories". */
  only?: (c: Country) => boolean;
  /** Said in place of "each country's latest year" where the ranking is for one year. */
  oneYear?: boolean;
};

const yearOfSource = (c: Country, field: string) => {
  const label = (c.sources as Record<string, { label: string }> | undefined)?.[field]?.label ?? "";
  return /, (\d{4})$/.exec(label)?.[1] ?? "";
};
const hdiOf = (c: Country) => COUNTRY_PANELS[c.id]?.hdi?.v ?? NaN;
/** As on the Economies page: below $10 billion a year's growth is one project or one bad harvest. */
const GROWTH_FLOOR_BN = 10;

const RANKINGS: RankingDef[] = [
  { id: "pop", pillar: "society", top: "Most people", bottom: "Fewest people", value: (c) => c.population, format: (v) => compact(v), year: (c) => yearOfSource(c, "population"), source: "World Bank / UN WPP" },
  { id: "life", pillar: "society", top: "Longest lives", bottom: "Shortest lives", value: (c) => c.lifeExpectancy, format: (v) => `${v.toFixed(1)} yrs`, year: (c) => yearOfSource(c, "lifeExpectancy"), source: "Life expectancy at birth, World Bank / UN" },
  { id: "hdi", pillar: "society", top: "Most developed (HDI)", bottom: "Least developed (HDI)", value: hdiOf, format: (v) => v.toFixed(3), year: (c) => COUNTRY_PANELS[c.id]?.hdi?.y ?? "", source: "UNDP Human Development Index" },
  {
    id: "migrants",
    pillar: "society",
    top: "Most migrants",
    bottom: "Fewest migrants",
    value: (c) => COUNTRY_FIGURES.migrantShare[c.code]?.[1] ?? NaN,
    format: (v) => `${v.toFixed(1)}%`,
    year: (c) => String(COUNTRY_FIGURES.migrantShare[c.code]?.[0] ?? ""),
    source: "Born abroad, % of the population, UN DESA via World Bank",
  },
  {
    id: "visited",
    pillar: "society",
    top: "Most visited",
    bottom: "Least visited",
    value: (c) => COUNTRY_FIGURES.arrivals[c.code]?.[1] ?? NaN,
    format: (v) => compact(v),
    year: (c) => String(COUNTRY_FIGURES.arrivals[c.code]?.[0] ?? ""),
    source: "International overnight tourist arrivals, UN Tourism, 2019 for every country - the last year before the pandemic that most reported",
    oneYear: true,
  },
  {
    id: "traveled",
    pillar: "society",
    top: "Most traveled people",
    bottom: "Least traveled people",
    value: (c) => COUNTRY_FIGURES.tripsAbroad[c.code]?.[1] ?? NaN,
    format: (v) => `${v.toFixed(2)} trips each`,
    year: (c) => String(COUNTRY_FIGURES.tripsAbroad[c.code]?.[0] ?? ""),
    source: "Residents' overnight trips abroad per person, 2019 for every country (UN Tourism; World Bank population)",
    oneYear: true,
  },
  { id: "gdp", pillar: "economy", top: "Largest economies", bottom: "Smallest economies", value: (c) => c.gdp * 1e9, format: (v) => `$${compact(v)}`, year: (c) => yearOfSource(c, "gdp"), source: "World Bank / IMF" },
  { id: "pc", pillar: "economy", top: "Richest per person", bottom: "Poorest per person", value: (c) => c.gdpPerCapita, format: (v) => `$${Math.round(v).toLocaleString("en-US")}`, year: (c) => yearOfSource(c, "gdpPerCapita"), source: "GDP per person, World Bank / IMF" },
  {
    id: "growth",
    pillar: "economy",
    top: "Fastest-growing economies",
    bottom: "Shrinking or slowest",
    value: (c) => c.gdpGrowth,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
    year: (c) => yearOfSource(c, "gdpGrowth"),
    source: `Real GDP growth, World Bank / IMF; economies over $${GROWTH_FLOOR_BN} billion, as on the Economies page, since a smaller one's year can turn on a single project`,
    only: (c) => has(c.gdp) && c.gdp >= GROWTH_FLOOR_BN,
  },
  { id: "infl", pillar: "economy", top: "Highest inflation", bottom: "Lowest inflation", value: (c) => c.inflationRate, format: (v) => `${v.toFixed(1)}%`, year: (c) => yearOfSource(c, "inflationRate"), source: "Consumer prices, World Bank / IMF" },
  {
    id: "free",
    pillar: "politics",
    top: "Most free",
    bottom: "Least free",
    value: (c) => COUNTRY_FIGURES.freedom[c.code]?.[1] ?? NaN,
    format: (v) => `${v} / 100`,
    year: (c) => String(COUNTRY_FIGURES.freedom[c.code]?.[0] ?? ""),
    source: "Freedom House total score (political rights and civil liberties)",
  },
  {
    id: "forest",
    pillar: "ecology",
    top: "Most forested",
    bottom: "Least forested",
    value: (c) => LAND_USE[c.id]?.forest ?? NaN,
    format: (v) => `${v.toFixed(1)}% of land`,
    year: (c) => LAND_USE[c.id]?.y ?? "",
    source: `Forest as a share of land area, ${LAND_USE_SOURCE.label}`,
  },
  {
    id: "area",
    pillar: "ecology",
    top: "Largest by area",
    bottom: "Smallest by area",
    value: (c) => c.areaKm2,
    format: (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M km²` : `${Math.round(v).toLocaleString("en-US")} km²`),
    year: () => "",
    source: "Total area, CIA World Factbook",
    oneYear: true,
  },
];

function RankCard({ r }: { r: RankingDef }) {
  const { card, head, muted, grid } = useLook();
  const navigate = useNavigate();
  const [bottom, setBottom] = useState(false);
  const list = useMemo(() => {
    const sovereign = countriesData.filter((c) => !c.territory && !c.uninhabited && has(r.value(c)) && (!r.only || r.only(c)));
    return sovereign.sort((a, b) => (bottom ? r.value(a) - r.value(b) : r.value(b) - r.value(a))).slice(0, 10);
  }, [r, bottom]);
  const max = Math.max(...list.map((c) => Math.abs(r.value(c)))) || 1;
  return (
    <div className="rounded-2xl p-4 flex flex-col" style={card}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold font-sans" style={{ color: head }}>
          {bottom ? r.bottom : r.top}
        </h3>
        <div className="flex rounded-full border border-border p-0.5 text-[10px] font-sans" role="group" aria-label="Order">
          {[
            ["Top", false],
            ["Bottom", true],
          ].map(([label, b]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => setBottom(b as boolean)}
              aria-pressed={bottom === b}
              className={`px-2 py-0.5 rounded-full cursor-pointer ${bottom === b ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>
      <ol className="flex flex-col">
        {list.map((c, i) => {
          const v = r.value(c);
          return (
            <li key={c.id} style={{ borderBottom: i < list.length - 1 ? `1px solid ${grid}` : "none" }}>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}
                className="w-full flex items-center gap-2 py-1.5 text-left hover:opacity-80 cursor-pointer"
                title={`${c.name}: ${r.format(v)}${r.year(c) ? ` (${r.year(c)})` : ""}`}
              >
                <span className="w-5 text-[10px] font-mono text-right shrink-0" style={{ color: muted }}>
                  {i + 1}
                </span>
                <img
                  src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                  alt=""
                  className="w-5 h-3.5 rounded-[2px] object-cover border border-border shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="flex-1 min-w-0 truncate text-xs font-sans" style={{ color: head }}>
                  {c.name}
                </span>
                <span className={`hidden sm:block w-12 h-1 rounded-full shrink-0 ${ACCENT_TRACK}`} aria-hidden>
                  <span className={`block h-1 rounded-full ${ACCENT_BG}`} style={{ width: `${(100 * Math.abs(v)) / max}%` }} />
                </span>
                <span className="w-24 text-right text-[11px] font-mono shrink-0" style={{ color: head }}>
                  {r.format(v)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[10px] font-sans" style={{ color: muted }}>
        {r.source}
        {r.oneYear ? "" : "; each country's latest year"}. Countries only, not territories.
      </p>
    </div>
  );
}

function Rankings() {
  const [pillar, setPillar] = useState<"all" | Pillar["id"]>("all");
  const shown = RANKINGS.filter((r) => pillar === "all" || r.pillar === pillar);
  return (
    <section id="rankings" className="scroll-mt-36">
      <Card>
        <CardHeader icon={<Ranking size={16} weight="fill" />} title="World rankings" badge={`${shown.length} lists`} color="#f59e0b" />
        <p className="text-[11px] font-sans text-muted-foreground -mt-2 mb-3">
          The comparisons people most often look up, from the figures on each country's page, by pillar. Pick a country to open it.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Rankings by pillar">
          {[{ id: "all" as const, label: "All" }, ...PILLARS.map((p) => ({ id: p.id, label: p.title }))].map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setPillar(x.id)}
              aria-pressed={pillar === x.id}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer ${
                pillar === x.id ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
          {shown.map((r) => (
            <RankCard key={r.id} r={r} />
          ))}
        </div>
      </Card>
    </section>
  );
}

// ── The page ───────────────────────────────────────────────────────────────

export function WorldviewPage() {
  const { head } = useLook();
  const pillar = (id: Pillar["id"]) => PILLARS.find((p) => p.id === id)!;
  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        <Hero />
        <PillarNav />
        <WorldHeadlines />

        {/* ── Overview ── */}
        <section id="overview" className="scroll-mt-36 flex flex-col gap-4">
          <HeadlinePills />
          <div className="px-1 pt-2 flex items-center gap-2">
            <GlobeHemisphereWest size={18} weight="fill" className="text-[#2a78d6] dark:text-[#3987e5]" />
            <h2 className="text-xl font-bold font-sans" style={{ color: head }}>
              The four pillars
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-stretch">
            {PILLARS.map((p) => (
              <PillarCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <PillarSection p={pillar("society")} lead={<OutOf100 />} />
        <PillarSection p={pillar("economy")} lead={<DevelopmentPanel />} />
        <PillarSection p={pillar("politics")} lead={<BlocShares />} />
        <PillarSection p={pillar("ecology")} />
        <Rankings />

        <p className="text-[10px] font-sans text-muted-foreground leading-relaxed max-w-4xl px-1">
          Figures retrieved {WORLDVIEW_RETRIEVED} by build-worldview.cjs: the World Bank's world and income-group aggregates, the IMF's World
          Economic Outlook, UCDP and V-Dem via Our World in Data, UNHCR, and the UN's World Population Prospects; climate readings from NASA and
          NOAA, retrieved {CLIMATE_RETRIEVED}; rankings and the developed / developing split use the figures on each country's page. Arrows
          compare with about ten years earlier; "better" and "worse" - and the counts of them - are only given where the direction is not a
          matter of opinion. The share of people displaced is UNHCR's count over the World Bank's population for the same year, and the share in
          Free countries sums the site's population figures by Freedom House status. Open any figure for its trend, its full series and its
          source.
        </p>
      </div>
    </div>
  );
}
