/**
 * The world as one place, as asked: a card the width of the Dashboard with the International Flag of Planet Earth on its
 * face (Oskar Pernefeldt's design, 2015 - simple geometric shapes, public domain on Wikimedia Commons; static/flags/
 * planet-earth.svg), as a country's card has its flag, and a window like a country's: every world figure the site holds
 * (data/worldview.ts - the World Bank's world aggregates, the IMF, UNDP, V-Dem, UNHCR, Uppsala and the others each names),
 * in tabs - the economy, people, the planet, rights and government, technology, security.
 *
 * Each figure is its publisher's latest, with its year, its change on ten years before where the series reaches back (the
 * site's own sum, said as such), a line of the series, and its source. Nothing is estimated here: a figure the source does
 * not give is not drawn.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ArrowsIn,
  ArrowsOut,
  Atom,
  Bank,
  Cpu,
  Globe,
  Leaf,
  ListBullets,
  Scales,
  ShieldWarning,
  SquaresFour,
  Users,
  X,
} from "@phosphor-icons/react";
import { WORLD, WORLDVIEW_RETRIEVED, type WorldIndicator, type WorldPoint } from "../data/worldview";
import { WindowTitle } from "./WindowTitle";
import { SourceLink } from "./SourceLink";
import { lockScroll } from "../lib/scrollLock";

const FLAG = "/flags/planet-earth.svg";
/** The flag's own blue, for the card's glow. */
const FLAG_BLUE = "#013ba6";

/* ── Figures, written as the Worldview page writes them ─────────────────── */
function compact(v: number, digits = 3): string {
  const a = Math.abs(v);
  if (a >= 1e12) return `${Number((v / 1e12).toPrecision(digits))} trillion`;
  if (a >= 1e9) return `${Number((v / 1e9).toPrecision(digits))} billion`;
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(digits))} million`;
  return Math.round(v).toLocaleString("en-US");
}
function fmt(ind: WorldIndicator, v: number): string {
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
const lastOf = (ind: WorldIndicator): WorldPoint | null => ind.series[ind.series.length - 1] ?? null;

/** The point ten years before the latest, or within two years of it - else none, and no change is said. */
function decadeBefore(series: WorldPoint[]): WorldPoint | null {
  if (!series.length) return null;
  const [lastYear] = series[series.length - 1];
  const earlier = series.filter(([y]) => y <= lastYear - 10);
  const p = earlier[earlier.length - 1];
  return p && lastYear - 10 - p[0] <= 2 ? p : null;
}
type Delta = { text: string; dir: "up" | "down" | "flat"; verdict: "better" | "worse" | null };
function delta(ind: WorldIndicator): Delta | null {
  if (ind.stated) return { ...ind.stated, verdict: null };
  const last = lastOf(ind);
  const prev = decadeBefore(ind.series);
  if (!last || !prev) return null;
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
const BETTER = "text-emerald-700 dark:text-emerald-400";
const WORSE = "text-red-600 dark:text-red-400";

/** The series as a line, its last point marked: no axis, as on the Worldview page's tiles. */
function Spark({ ind }: { ind: WorldIndicator }) {
  const pts = ind.series;
  if (pts.length < 3) return null;
  const W = 120;
  const H = 28;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const x = (v: number) => (x1 === x0 ? W / 2 : ((v - x0) / (x1 - x0)) * (W - 4) + 2);
  const y = (v: number) => (y1 === y0 ? H / 2 : H - 3 - ((v - y0) / (y1 - y0)) * (H - 6));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-7 text-secondary" aria-hidden preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(last[0])} cy={y(last[1])} r={2} className="fill-current" />
    </svg>
  );
}

function Tile({ ind }: { ind: WorldIndicator }) {
  const last = lastOf(ind);
  if (!last) return null;
  const d = delta(ind);
  const Icon = d?.dir === "up" ? ArrowUpRight : d?.dir === "down" ? ArrowDownRight : ArrowRight;
  const first = ind.series[0];
  return (
    <div className="modal-tile rounded-lg px-3 py-2.5 flex flex-col gap-1 min-w-0" title={ind.note ?? `${ind.label}, ${ind.unit} - ${ind.source.label}`}>
      <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider truncate">{ind.label}</p>
      <p className="text-sm font-bold font-mono text-foreground leading-tight">
        {fmt(ind, last[1])} <span className="text-[10px] font-sans font-normal text-muted-foreground">· {last[0]}</span>
      </p>
      <p className="text-[10px] font-sans text-muted-foreground truncate">{ind.unit}</p>
      <Spark ind={ind} />
      {d ? (
        <p className={`flex items-center gap-1 text-[10px] font-sans ${d.verdict === "better" ? BETTER : d.verdict === "worse" ? WORSE : "text-muted-foreground"}`}>
          <Icon size={10} weight="bold" aria-hidden />
          <span className="truncate">
            {d.text}
            {d.verdict && <span className="font-semibold">{` · ${d.verdict}`}</span>}
          </span>
        </p>
      ) : (
        first && first[0] !== last[0] && <p className="text-[10px] font-sans text-muted-foreground">Series from {first[0]}</p>
      )}
      <a href={ind.source.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-sans text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground truncate">
        {ind.source.label}
      </a>
    </div>
  );
}

/* ── The window's tabs: each the world figures of one subject, by id ───── */
type Tab = { id: string; label: string; icon: ReactNode; ids: string[] };
const TABS: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <ListBullets size={13} weight="fill" />,
    ids: ["population", "gdp", "gdpGrowth", "inflation", "lifeExpectancy", "extremePoverty", "hdi", "internet", "co2", "conflicts", "democracyShare", "displaced"],
  },
  {
    id: "economy",
    label: "Economy",
    icon: <Bank size={13} weight="fill" />,
    ids: [
      "gdp", "gdpGrowth", "gdpPerCapitaPpp", "inflation", "unemployment", "youthUnemployment", "labourForce", "wageWorkers", "vulnerableWork",
      "agEmployment", "industryEmployment", "servicesEmployment", "agricultureVA", "industryVA", "manufacturingVA", "servicesVA", "manufacturingUsd",
      "industryReal", "investment", "savings", "fdi", "trade", "manufacturesExports", "marketCap", "accounts", "remittances", "govDebt", "govRevenue",
      "govExpense", "taxRevenue", "interestPayments", "extDebt", "extDebtUsd", "resourceRents", "oilRents", "gasRents", "coalRents", "mineralRents",
    ],
  },
  {
    id: "people",
    label: "People",
    icon: <Users size={13} weight="fill" />,
    ids: [
      "population", "popGrowth", "fertility", "urban", "aged65", "under15", "migrants", "migrantShare", "lifeExpectancy", "healthyLifeExpectancy",
      "childMortality", "maternalMortality", "measles", "stunting", "hiv", "healthSpend", "suicide", "roadDeaths", "extremePoverty", "poverty420",
      "poverty830", "undernourished", "foodInsecure", "electricity", "cleanCooking", "water", "sanitation", "handwashing", "literacy", "schoolingYears",
      "primaryCompletion", "lowerSecondary", "secondaryEnrol", "tertiaryEnrol", "eduSpend", "hdi", "ihdi", "lifeSatisfaction", "airPassengers",
      "christians", "muslims", "unaffiliated", "hindus", "buddhists", "jews", "otherReligions",
    ],
  },
  {
    id: "planet",
    label: "Planet",
    icon: <Leaf size={13} weight="fill" />,
    ids: [
      "co2", "co2PerPerson", "ghg", "methane", "pm25", "renewables", "fossilShare", "energySupply", "energyIntensity", "energyPerPerson",
      "electricityPerPerson", "electricityGeneration", "fossilElectricity", "renewableElectricity", "oilProduction", "gasProduction", "coalProduction",
      "evSalesShare", "forest", "protectedLand", "protectedSea", "farmland", "waterWithdrawals", "cerealProduction", "cerealYield", "fertilizer",
      "disasterDisplacement", "disasterDeaths",
    ],
  },
  {
    id: "rights",
    label: "Rights",
    icon: <Scales size={13} weight="fill" />,
    ids: [
      "democracyShare", "liberalDemocracyShare", "electoralAutocracyShare", "closedAutocracyShare", "democracies", "autocratizing", "democratizing",
      "autocratizingShare", "democratizingShare", "electoralDemocracy", "liberalDemocracy", "participatoryDemocracy", "deliberativeDemocracy",
      "egalitarianDemocracy", "ruleOfLaw", "judicialConstraints", "legislativeConstraints", "civilLiberties", "politicalLiberties", "privateLiberties",
      "physicalIntegrity", "equalityBeforeLaw", "freeExpression", "freeAssociation", "academicFreedom", "civilSociety", "engagedSociety", "polarization",
      "voterTurnout", "womenEmpowerment", "womenCivilLiberties", "womenParliament", "womenMinisters", "workGap",
    ],
  },
  {
    id: "technology",
    label: "Technology",
    icon: <Cpu size={13} weight="fill" />,
    ids: [
      "internet", "mobile", "broadband", "landlines", "secureServers", "ictServiceExports", "ictGoodsExports", "highTechExports", "research",
      "researchers", "patents", "sciArticles", "ipReceipts", "aiInvestment", "genAiInvestment", "aiPublications", "robotInstalls", "robotStock",
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: <ShieldWarning size={13} weight="fill" />,
    ids: [
      "conflicts", "conflictDeaths", "displaced", "terrorAttacks", "terrorDeaths", "homicide", "militaryGdp", "militaryUsd", "militaryShare",
      "armedForces", "armedForcesShare", "armsTransfers", "nuclearWarheads",
    ],
  },
];
/* Any world figure the tabs above do not name has a tab of its own, so none the site holds is left out. */
const NAMED = new Set(TABS.flatMap((t) => t.ids));
const REST = Object.keys(WORLD).filter((id) => !NAMED.has(id));
const ALL_TABS: Tab[] = REST.length ? [...TABS, { id: "more", label: "More", icon: <SquaresFour size={13} weight="fill" />, ids: REST }] : TABS;
const indicators = (t: Tab) => t.ids.flatMap((id) => (WORLD[id] && WORLD[id].series.length ? [WORLD[id]] : []));
/** The latest year of any figure the site holds for the world. */
const LATEST = Math.max(...Object.values(WORLD).flatMap((i) => (i.series.length ? [i.series[i.series.length - 1][0]] : [])));

function WorldModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState(ALL_TABS[0].id);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const unlock = lockScroll();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      unlock();
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);
  const shown = useMemo(() => indicators(ALL_TABS.find((t) => t.id === tab) ?? ALL_TABS[0]), [tab]);
  const sources = useMemo(() => {
    const seen = new Map<string, { label: string; url: string }>();
    for (const i of shown) if (!seen.has(i.source.label)) seen.set(i.source.label, i.source);
    return [...seen.values()];
  }, [shown]);
  const pop = WORLD.population && lastOf(WORLD.population);
  const gdp = WORLD.gdp && lastOf(WORLD.gdp);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="The world's figures"
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-3xl max-h-[90vh]"}`}
      >
        <div className="p-6">
          <WindowTitle title="The World" note="Every country together">
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label={isExpanded ? "Collapse modal" : "Expand to full screen"}
              title={isExpanded ? "Collapse" : "Expand to full screen"}
            >
              {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </WindowTitle>

          {/* Its flag and what it is, as a country's window opens. */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md">
              <img src={FLAG} alt="International Flag of Planet Earth" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground">World aggregates</span>
                {pop && <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-border text-foreground">{compact(pop[1])} people · {pop[0]}</span>}
                {gdp && <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-border text-foreground">GDP ${compact(gdp[1])} · {gdp[0]}</span>}
              </div>
              <p className="text-[11px] font-sans text-muted-foreground mt-1.5 leading-snug">
                {Object.keys(WORLD).length} figures for the world as a whole, each its publisher's latest, to {LATEST}; read from their sources on{" "}
                {new Date(`${WORLDVIEW_RETRIEVED}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep")}. The
                flag is the International Flag of Planet Earth (Oskar Pernefeldt, 2015).
              </p>
            </div>
          </div>

          {/* Tab bar, as a country's window has it. */}
          <div className="flex items-center gap-1 mb-5 bg-muted/60 rounded-xl p-1 border border-border/60 overflow-x-auto modal-tabs" role="tablist" aria-label="The world's figures by subject">
            {ALL_TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium font-sans whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  tab === t.id ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
                <span className="text-[10px] font-mono opacity-60">{indicators(t).length}</span>
              </button>
            ))}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isExpanded ? "lg:grid-cols-4" : "md:grid-cols-3"} gap-2`}>
            {shown.map((ind) => (
              <Tile key={ind.id} ind={ind} />
            ))}
          </div>
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
            A change is the latest figure against the one ten years before it (or within two years of that), worked out here; green where the
            change is for the better, red where for the worse, grey where neither is said. Point at a figure for what it is.
          </p>
          <SourceLink sources={sources} className="mt-2" />
        </div>
      </div>
    </div>
  );
}

/** The card on the Dashboard: the flag on its face, the world's headline figures across it; the whole card opens the window. */
export function WorldCard() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const head = ["population", "gdp", "gdpGrowth", "inflation", "lifeExpectancy", "extremePoverty"].flatMap((id) => {
    const ind = WORLD[id];
    const last = ind && lastOf(ind);
    return ind && last ? [{ ind, last }] : [];
  });
  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label="Open the world's figures"
        className="cs-glow-card modal-tile relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.005] min-w-0"
        style={{ "--glow": FLAG_BLUE } as React.CSSProperties}
      >
        {/* The flag behind the whole card, dimmed, as a country's card has its own. */}
        <img src={FLAG} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover card-flag scale-105 select-none pointer-events-none" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Globe size={20} weight="fill" className="text-foreground shrink-0" aria-hidden />
            <h2 className="text-lg font-bold font-sans text-foreground leading-tight">The World</h2>
            <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground bg-background/40">Every country together</span>
            <span className="ml-auto text-[11px] font-sans text-muted-foreground flex items-center gap-1">
              <Atom size={12} aria-hidden /> {Object.keys(WORLD).length} figures · open the window →
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
            {head.map(({ ind, last }) => (
              <div key={ind.id} className="min-w-0">
                <p className="text-[11px] font-sans text-muted-foreground truncate">{ind.label}</p>
                <p className="text-base font-bold font-mono text-foreground leading-tight">{fmt(ind, last[1])}</p>
                <p className="text-[10px] font-sans text-muted-foreground truncate">
                  {ind.unit} · {last[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
      {open && <WorldModal onClose={close} />}
    </>
  );
}
