import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bread,
  CaretDown,
  ChartBar,
  CloudSun,
  Coins,
  GlobeStand,
  GraduationCap,
  Lightbulb,
  Airplane,
  ShieldWarning,
  HandFist,
  Peace,
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
import { useTheme } from "@/contexts/ThemeContext";
import { has } from "@/lib/na";

/**
 * Worldview: the world as a whole, laid out like the dashboard - a hero with
 * the population clock, headline figures, the split between developed and
 * developing economies, the rankings people most often look up, and cards for
 * peace and war, the economy and debt, the climate, development, food and
 * technology.
 *
 * Every figure is a published world total or share, or a country figure the
 * site already cites, with its year and source (build-worldview.cjs fetches
 * the world series). The one moving number, the population clock, follows
 * the UN's medium-variant projection and says so. Each trend has its year-by-
 * year table, and each share bar a table, so no value is only reachable by
 * hovering.
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
    <svg width={W} height={H} className="shrink-0 text-muted-foreground" aria-hidden>
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
  const economies = INCOME_GROUPS.reduce((t, g) => t + g.economies, 0);

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
            The world at a glance
          </h1>
          <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
            The global community as a whole: how many of us there are, how many live in peace or war, what the world owes, what is
            happening to the climate, and how far development reaches - developed and developing side by side.
          </p>
          <p className="text-[11px] font-sans mt-3" style={{ color: muted }}>
            {Object.keys(WORLD).length} world indicators · {economies} economies by income group · {BLOCS.length} blocs compared · figures
            retrieved {WORLDVIEW_RETRIEVED}, each cited to its source and year
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
  const warming = CLIMATE_INDICATORS.find((c) => c.id === "warming");
  const pill = (id: string, label: string, sub?: string) => {
    const ind = WORLD[id];
    const [y, v] = lastOf(id);
    return <Pill key={id} label={label} value={fmt(ind, v)} sub={sub ?? `${ind.unit} · ${y}`} d={delta(ind)} />;
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
          d={
            warming.decadeAgo === null
              ? null
              : {
                  text: `${warming.value - warming.decadeAgo > 0 ? "+" : ""}${(warming.value - warming.decadeAgo).toFixed(2)} on ten years before`,
                  dir: warming.value > warming.decadeAgo ? "up" : "down",
                  verdict: warming.value > warming.decadeAgo ? "worse" : "better",
                }
          }
        />
      )}
    </div>
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
      <CardHeader
        icon={<Scales size={16} weight="fill" />}
        title="Developed & developing"
        badge="three classifications"
        color="#6366f1"
      />
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
      <CardHeader icon={<UsersThree size={16} weight="fill" />} title="Of every 100 people" badge="latest year" color="#0ea5e9" />
      <ul className="space-y-3">
        {rows.map(({ key: id, text, year, v, url }) => {
          return (
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
          );
        })}
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
      <CardHeader icon={<GlobeStand size={16} weight="fill" />} title="The blocs' share of the world" badge={`${rows.length} blocs`} color="#14b8a6" />
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

// ── Rankings ────────────────────────────────────────────────────────────────

type Ranking = {
  id: string;
  top: string;
  bottom: string;
  value: (c: Country) => number;
  format: (v: number) => string;
  year: (c: Country) => string;
  source: string;
};

const yearOfSource = (c: Country, field: string) => {
  const label = (c.sources as Record<string, { label: string }> | undefined)?.[field]?.label ?? "";
  return /, (\d{4})$/.exec(label)?.[1] ?? "";
};
const hdiOf = (c: Country) => COUNTRY_PANELS[c.id]?.hdi?.v ?? NaN;

const RANKINGS: Ranking[] = [
  { id: "pop", top: "Most people", bottom: "Fewest people", value: (c) => c.population, format: (v) => compact(v), year: (c) => yearOfSource(c, "population"), source: "World Bank / UN WPP" },
  { id: "gdp", top: "Largest economies", bottom: "Smallest economies", value: (c) => c.gdp * 1e9, format: (v) => `$${compact(v)}`, year: (c) => yearOfSource(c, "gdp"), source: "World Bank / IMF" },
  { id: "pc", top: "Richest per person", bottom: "Poorest per person", value: (c) => c.gdpPerCapita, format: (v) => `$${Math.round(v).toLocaleString("en-US")}`, year: (c) => yearOfSource(c, "gdpPerCapita"), source: "GDP per person, World Bank / IMF" },
  { id: "life", top: "Longest lives", bottom: "Shortest lives", value: (c) => c.lifeExpectancy, format: (v) => `${v.toFixed(1)} yrs`, year: (c) => yearOfSource(c, "lifeExpectancy"), source: "Life expectancy at birth, World Bank / UN" },
  { id: "hdi", top: "Most developed (HDI)", bottom: "Least developed (HDI)", value: hdiOf, format: (v) => v.toFixed(3), year: (c) => COUNTRY_PANELS[c.id]?.hdi?.y ?? "", source: "UNDP Human Development Index" },
  { id: "area", top: "Largest by area", bottom: "Smallest by area", value: (c) => c.areaKm2, format: (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M km²` : `${Math.round(v).toLocaleString("en-US")} km²`), year: () => "", source: "Total area, CIA World Factbook" },
  { id: "growth", top: "Fastest-growing economies", bottom: "Shrinking or slowest", value: (c) => c.gdpGrowth, format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`, year: (c) => yearOfSource(c, "gdpGrowth"), source: "Real GDP growth, World Bank / IMF" },
  {
    id: "visited",
    top: "Most visited",
    bottom: "Least visited",
    value: (c) => COUNTRY_FIGURES.arrivals[c.code]?.[1] ?? NaN,
    format: (v) => compact(v),
    year: (c) => String(COUNTRY_FIGURES.arrivals[c.code]?.[0] ?? ""),
    source: "International overnight tourist arrivals, UN Tourism, 2019 for every country - the last year before the pandemic that most reported",
  },
  {
    id: "traveled",
    top: "Most traveled people",
    bottom: "Least traveled people",
    value: (c) => COUNTRY_FIGURES.tripsAbroad[c.code]?.[1] ?? NaN,
    format: (v) => `${v.toFixed(2)} trips each`,
    year: (c) => String(COUNTRY_FIGURES.tripsAbroad[c.code]?.[0] ?? ""),
    source: "Residents' overnight trips abroad per person, 2019 for every country (UN Tourism; World Bank population)",
  },
  {
    id: "free",
    top: "Most free",
    bottom: "Least free",
    value: (c) => COUNTRY_FIGURES.freedom[c.code]?.[1] ?? NaN,
    format: (v) => `${v} / 100`,
    year: (c) => String(COUNTRY_FIGURES.freedom[c.code]?.[0] ?? ""),
    source: "Freedom House total score (political rights and civil liberties)",
  },
  {
    id: "migrants",
    top: "Most migrants",
    bottom: "Fewest migrants",
    value: (c) => COUNTRY_FIGURES.migrantShare[c.code]?.[1] ?? NaN,
    format: (v) => `${v.toFixed(1)}%`,
    year: (c) => String(COUNTRY_FIGURES.migrantShare[c.code]?.[0] ?? ""),
    source: "Born abroad, % of the population, UN DESA via World Bank",
  },
  { id: "infl", top: "Highest inflation", bottom: "Lowest inflation", value: (c) => c.inflationRate, format: (v) => `${v.toFixed(1)}%`, year: (c) => yearOfSource(c, "inflationRate"), source: "Consumer prices, World Bank / IMF" },
];

function RankCard({ r }: { r: Ranking }) {
  const { card, head, muted, grid } = useLook();
  const navigate = useNavigate();
  const [bottom, setBottom] = useState(false);
  const list = useMemo(() => {
    const sovereign = countriesData.filter((c) => !c.territory && !c.uninhabited && has(r.value(c)));
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
        {r.id === "visited" || r.id === "traveled" ? "" : "; each country's latest year"}. Countries only, not territories.
      </p>
    </div>
  );
}

// ── Theme cards ─────────────────────────────────────────────────────────────

/** One figure as a dashboard row; opens to its trend, parts, note, table and source. */
function MetricRow({ ind, extra, last = false }: { ind: WorldIndicator; extra?: string; last?: boolean }) {
  const { head, muted, grid } = useLook();
  const [open, setOpen] = useState(false);
  const [y, v] = ind.series[ind.series.length - 1];
  const d = delta(ind);
  return (
    <li style={{ borderBottom: last ? "none" : `1px solid ${grid}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-2.5 text-left hover:opacity-90 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-sans truncate" style={{ color: head }}>
            {ind.label}
          </p>
          <p className="text-[10px] font-sans truncate" style={{ color: muted }}>
            {ind.unit} · {y}
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
  const change = c.decadeAgo === null ? null : c.value - c.decadeAgo;
  const worseWhenUp = c.id !== "sea-ice";
  const verdict = change === null || change === 0 ? null : (change > 0) === worseWhenUp ? "worse" : "better";
  return (
    <li className="py-2.5 flex items-center gap-3" style={{ borderBottom: last ? "none" : `1px solid ${grid}` }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold font-sans truncate" style={{ color: head }}>
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {c.label}
          </a>
        </p>
        <p className="text-[10px] font-sans truncate" style={{ color: muted }}>
          {c.unit} · {c.period}
        </p>
        {change !== null && (
          <div className="mt-0.5">
            <DeltaLine
              small
              d={{
                text: `${change > 0 ? "+" : ""}${Math.abs(change) < 1 ? change.toFixed(2) : change.toFixed(1)} on ten years before`,
                dir: change > 0 ? "up" : change < 0 ? "down" : "flat",
                verdict,
              }}
            />
          </div>
        )}
      </div>
      <span className="w-24 text-right text-sm font-bold font-mono shrink-0" style={{ color: head }}>
        {c.value}
      </span>
      <span className="w-3 shrink-0" aria-hidden />
    </li>
  );
}

function ThemeCard({ id, icon, title, color, intro, ids, extras = {}, climate = [], children }: {
  id: string;
  icon: ReactNode;
  title: string;
  color: string;
  intro: string;
  ids: string[];
  extras?: Record<string, string>;
  climate?: ClimateIndicator[];
  children?: ReactNode;
}) {
  const count = ids.length + climate.length;
  return (
    <div id={id} className="scroll-mt-24">
      <Card>
        <CardHeader icon={icon} title={title} badge={`${count} figures`} color={color} />
        <p className="text-[11px] font-sans text-muted-foreground -mt-2 mb-2 leading-relaxed">{intro}</p>
        {children}
        <ul>
          {climate.map((c) => (
            <ClimateRow key={c.id} c={c} />
          ))}
          {ids.map((k, i) => (
            <MetricRow key={k} ind={WORLD[k]} extra={extras[k]} last={i === ids.length - 1} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ── The page ───────────────────────────────────────────────────────────────

export function WorldviewPage() {
  const climate = CLIMATE_INDICATORS.filter((c) => ["warming", "co2", "ch4", "sea-ice"].includes(c.id));
  const usd = (id: string) => `$${compact(lastOf(id)[1])}`;

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        <Hero />
        <HeadlinePills />
        <DevelopmentPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <OutOf100 />
          <BlocShares />
        </div>

        <Card>
          <CardHeader icon={<Ranking size={16} weight="fill" />} title="World rankings" badge="countries" color="#f59e0b" />
          <p className="text-[11px] font-sans text-muted-foreground -mt-2 mb-3">
            The comparisons people most often look up, from the figures on each country's page. Pick a country to open it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
            {RANKINGS.map((r) => (
              <RankCard key={r.id} r={r} />
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <ThemeCard
            id="peace"
            icon={<Peace size={16} weight="fill" />}
            title="Peace & war"
            color="#f43f5e"
            intro="Armed conflict (Uppsala Conflict Data Program), the people it drives from home (UNHCR), and what the world spends on arms."
            ids={["conflicts", "conflictDeaths", "displaced", "militaryGdp", "homicide"]}
            extras={{ militaryGdp: `${usd("militaryUsd")} in ${lastOf("militaryUsd")[0]}` }}
          />
          <ThemeCard
            id="rights"
            icon={<HandFist size={16} weight="fill" />}
            title="Rights & liberties"
            color="#8b5cf6"
            intro="How free people are to speak, organise and choose their governments: Freedom House's status for every country, and V-Dem's measures averaged across the world's people."
            ids={["civilLiberties", "freeExpression", "democracyShare"]}
          >
            <FreedomBars />
          </ThemeCard>
          <ThemeCard
            id="terrorism"
            icon={<ShieldWarning size={16} weight="fill" />}
            title="Terrorism"
            color="#dc2626"
            intro="Attacks and deaths recorded by the Global Terrorism Database, whose public release ends in 2021; later years are not published openly."
            ids={["terrorAttacks", "terrorDeaths"]}
          />
          <ThemeCard
            id="economy"
            icon={<Coins size={16} weight="fill" />}
            title="Economy & debt"
            color="#10b981"
            intro="The world economy, and what governments (IMF) and developing countries (World Bank) owe."
            ids={["gdp", "gdpGrowth", "inflation", "unemployment", "govDebt", "extDebt"]}
            extras={{ extDebt: `${usd("extDebtUsd")} in ${lastOf("extDebtUsd")[0]}` }}
          />
          <ThemeCard
            id="climate"
            icon={<CloudSun size={16} weight="fill" />}
            title="Climate crisis"
            color="#f97316"
            intro={`The atmosphere as the agencies that measure it last read it (retrieved ${CLIMATE_RETRIEVED}), then emissions, energy and forests.`}
            climate={climate}
            ids={["co2", "ghg", "renewables", "forest"]}
          />
          <ThemeCard
            id="development"
            icon={<ChartBar size={16} weight="fill" />}
            title="Development & equality"
            color="#6366f1"
            intro="How long people live, how many children survive, poverty, schooling, and women's place in parliaments and paid work."
            ids={["lifeExpectancy", "childMortality", "extremePoverty", "poverty830", "womenParliament", "workGap", "water"]}
          />
          <ThemeCard
            id="education"
            icon={<GraduationCap size={16} weight="fill" />}
            title="Education"
            color="#3b82f6"
            intro="Who can read, who finishes school, who goes on to university, how many years of schooling adults have had, and what governments spend."
            ids={["literacy", "primaryCompletion", "lowerSecondary", "secondaryEnrol", "tertiaryEnrol", "schoolingYears", "eduSpend"]}
          />
          <ThemeCard
            id="cosmopolitanism"
            icon={<Airplane size={16} weight="fill" />}
            title="Cosmopolitanism"
            color="#0891b2"
            intro="How mixed and connected the world is: people living outside the country they were born in, and trade and investment across borders. The most and least visited and traveled countries are in the rankings."
            ids={["migrantShare", "migrants", "trade", "fdi"]}
          />
          <ThemeCard
            id="food"
            icon={<Bread size={16} weight="fill" />}
            title="Food security"
            color="#eab308"
            intro="The UN Food and Agriculture Organization's two measures of hunger."
            ids={["undernourished", "foodInsecure"]}
          />
          <ThemeCard
            id="advancement"
            icon={<Lightbulb size={16} weight="fill" />}
            title="Advancement & population"
            color="#06b6d4"
            intro="How connected the world is, what it invests in new knowledge, and how its population is changing."
            ids={["internet", "electricity", "mobile", "research", "patents", "popGrowth", "fertility", "urban"]}
          />
        </div>

        <p className="text-[10px] font-sans text-muted-foreground leading-relaxed max-w-4xl px-1">
          Figures retrieved {WORLDVIEW_RETRIEVED} by build-worldview.cjs: the World Bank's world and income-group aggregates, the IMF's World
          Economic Outlook, UCDP and V-Dem via Our World in Data, UNHCR, and the UN's World Population Prospects; rankings and the developed /
          developing split use the figures on each country's page. Arrows compare with about ten years earlier; "better" and "worse" are
          only given where the direction is not a matter of opinion. Open any figure for its trend, its full series and its source.
        </p>
      </div>
    </div>
  );
}
