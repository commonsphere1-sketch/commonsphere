/**
 * The world as one place, as asked: a card the width of the Dashboard with the International Flag of Planet Earth on its
 * face (Oskar Pernefeldt's design, 2015 - simple geometric shapes, public domain on Wikimedia Commons, and offered by its
 * makers free to use, personal or commercial, to represent the planet; static/flags/planet-earth.svg), as a country's card
 * has its flag, and a window like a country's: every world figure the site holds (data/worldview.ts - the World Bank's
 * world aggregates, the IMF, UNDP, V-Dem, UNHCR, Uppsala and the others each names), in tabs.
 *
 * Laid out as a country's window is, as asked: each tab a column of panels, each panel a head, its key figures as tiles,
 * then its charts - the parts of a whole as a ring, a set of shares or of V-Dem's indices as bars on one scale, the
 * Human Development Index on UNDP's scale - and its other figures as a short table, with its sources under it
 * (ModalCharts, the country window's own). Each figure is its publisher's latest, with its year; a change on ten years
 * before, where the series reaches back, is the site's own sum and said as such. Nothing is estimated: a figure the
 * source does not give is not drawn. Parts are drawn as a ring only where they are of one whole and one year.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Atom,
  Bank,
  Briefcase,
  ChartLineUp,
  Cpu,
  Drop,
  Factory,
  FirstAid,
  Flag,
  Gavel,
  Globe,
  GraduationCap,
  HandHeart,
  Leaf,
  Lightning,
  ListBullets,
  Robot,
  Scales,
  ShieldWarning,
  SquaresFour,
  Users,
  Wind,
  ArrowsIn,
  ArrowsOut,
  X,
  Sword,
  Plant,
  GenderFemale,
  CloudRain,
  Coins,
  WifiHigh,
} from "@phosphor-icons/react";
import { POPULATION_PROJECTION, WORLD, WORLDVIEW_RETRIEVED, type WorldIndicator, type WorldPoint } from "../data/worldview";
import { WORLD_LAND_COVER, WORLD_LAND_COVER_LEFT_OUT, WORLD_LAND_SOURCES, WORLD_LAND_USE } from "../data/worldLand";
import { WindowTitle } from "./WindowTitle";
import { SourceLink } from "./SourceLink";
import { ChartNote, ChartTitle, FigureRow, FigureTile, HdiScale, MeasureBars, PartsDonut } from "./ModalCharts";
import { lockScroll } from "../lib/scrollLock";

const FLAG = "/flags/planet-earth.svg";
/** The flag's own blue, for the card's glow. */
const FLAG_BLUE = "#013ba6";
const FLAG_PAGE = { label: "The International Flag of Planet Earth Organization - the flag", url: "https://www.flagofplanetearth.com/the-flag" };
const FLAG_FILE = { label: "Wikimedia Commons - International Flag of Planet Earth.svg (public domain)", url: "https://commons.wikimedia.org/wiki/File:International_Flag_of_Planet_Earth.svg" };

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
const lastOf = (ind: WorldIndicator | undefined): WorldPoint | null => (ind && ind.series.length ? ind.series[ind.series.length - 1] : null);
const held = (id: string) => (lastOf(WORLD[id]) ? WORLD[id] : null);

/** The change on the point ten years before the latest (or within two years of that), worked out here; none where the series is shorter. */
function changeOf(ind: WorldIndicator): string | null {
  if (ind.stated) return ind.stated.text;
  const last = lastOf(ind);
  const earlier = last ? ind.series.filter(([y]) => y <= last[0] - 10) : [];
  const prev = earlier[earlier.length - 1];
  if (!last || !prev || last[0] - 10 - prev[0] > 2) return null;
  const diff = last[1] - prev[1];
  if (ind.format === "count" || ind.format === "usd") {
    const pct = (100 * diff) / prev[1];
    return `${pct > 0 ? "+" : ""}${pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}% since ${prev[0]}`;
  }
  if (ind.format === "pct") return `${diff > 0 ? "+" : ""}${diff.toFixed(ind.dp)} points since ${prev[0]}`;
  return `${diff > 0 ? "+" : ""}${diff.toLocaleString("en-US", { maximumFractionDigits: ind.dp })} since ${prev[0]}`;
}

/* ── What a tab holds: panels of blocks, each naming the world figures it draws by id ─────────────────────────── */
type Block =
  /** Key figures as tiles, four across. */
  | { kind: "tiles"; ids: string[] }
  /** Parts of one whole in one year, as a ring: each id with the name its part is given. */
  | { kind: "ring"; title: string; parts: [id: string, label: string][]; note?: string }
  /** One measure's kind across several figures, as bars on one scale: 100 for shares, 1 for V-Dem's indices. */
  | { kind: "bars"; title: string; ids: string[]; max?: number; note?: string }
  /** The Human Development Index on UNDP's scale. */
  | { kind: "hdi" }
  /** Figures as a short table: each with its unit, year and change. */
  | { kind: "rows"; title?: string; ids: string[] }
  /** The people alive now, running: the UN's projection, as the Worldview page's counter has it. */
  | { kind: "counter" }
  /** What the world's land is used for, FAO's land use statistics (data/worldLand.ts). */
  | { kind: "landUse" }
  /** What covers the world's surface, each satellite map FAO publishes (data/worldLand.ts). */
  | { kind: "landCover" };
type PanelDef = { title: string; sub: string; icon: ReactNode; blocks: Block[] };
type TabDef = { id: string; label: string; icon: ReactNode; panels: PanelDef[] };

const I = { size: 13, weight: "fill" as const };
const REGIME_RING: Block = {
  kind: "ring",
  title: "How its people are governed · % of people",
  parts: [
    ["democracyShare", "In a democracy"],
    ["electoralAutocracyShare", "In an electoral autocracy"],
    ["closedAutocracyShare", "In a closed autocracy"],
  ],
  note: "V-Dem's Regimes of the World. A democracy here is liberal or electoral; the share in a liberal democracy alone is given below.",
};
const TABS: TabDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <ListBullets {...I} />,
    panels: [
      {
        title: "The world at a glance",
        sub: "Its people, its output and how they live",
        icon: <Globe {...I} />,
        blocks: [
          { kind: "tiles", ids: ["population", "gdp", "gdpGrowth", "inflation", "unemployment", "lifeExpectancy", "extremePoverty", "internet"] },
          { kind: "hdi" },
          REGIME_RING,
          { kind: "rows", title: "And", ids: ["co2", "conflicts", "displaced"] },
        ],
      },
    ],
  },
  {
    id: "economy",
    label: "Economy",
    icon: <Bank {...I} />,
    panels: [
      {
        title: "Output and growth",
        sub: "What the world makes, and how fast it grows",
        icon: <ChartLineUp {...I} />,
        blocks: [
          { kind: "tiles", ids: ["gdp", "gdpGrowth", "gdpPerCapitaPpp", "inflation"] },
          { kind: "bars", title: "What its output is made of · % of GDP", ids: ["agricultureVA", "industryVA", "manufacturingVA", "servicesVA"], max: 100, note: "Each as the World Bank publishes it: manufacturing is part of industry, and the sectors do not add up to 100." },
          { kind: "rows", ids: ["manufacturingUsd", "industryReal", "investment", "savings"] },
        ],
      },
      {
        title: "Work",
        sub: "Who works, and where",
        icon: <Briefcase {...I} />,
        blocks: [
          { kind: "tiles", ids: ["unemployment", "youthUnemployment", "labourForce", "wageWorkers"] },
          { kind: "ring", title: "Where its workers work · % of employment", parts: [["agEmployment", "Farming"], ["industryEmployment", "Industry"], ["servicesEmployment", "Services"]] },
          { kind: "rows", ids: ["vulnerableWork"] },
        ],
      },
      {
        title: "Trade and money",
        sub: "What crosses borders, and who holds an account",
        icon: <Coins {...I} />,
        blocks: [{ kind: "rows", ids: ["trade", "fdi", "manufacturesExports", "marketCap", "accounts", "remittances"] }],
      },
      {
        title: "Government",
        sub: "What governments take in, spend and owe",
        icon: <Gavel {...I} />,
        blocks: [
          { kind: "bars", title: "Governments · % of GDP", ids: ["govRevenue", "govExpense", "taxRevenue", "govDebt"], max: 100 },
          { kind: "rows", ids: ["interestPayments", "extDebt", "extDebtUsd"] },
        ],
      },
      {
        title: "Natural resources",
        sub: "What the earth yields, as a share of output",
        icon: <Factory {...I} />,
        blocks: [{ kind: "bars", title: "Rents from natural resources · % of GDP", ids: ["resourceRents", "oilRents", "gasRents", "coalRents", "mineralRents"] }],
      },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: <Users {...I} />,
    panels: [
      {
        title: "Its people",
        sub: "How many, how fast they grow, where they live",
        icon: <Users {...I} />,
        blocks: [
          { kind: "counter" },
          { kind: "tiles", ids: ["population", "popGrowth", "fertility", "urban"] },
          { kind: "bars", title: "By age · % of people", ids: ["under15", "aged65"], max: 100 },
          { kind: "rows", ids: ["migrants", "migrantShare", "airPassengers"] },
        ],
      },
      {
        title: "Health",
        sub: "How long people live, and what cuts lives short",
        icon: <FirstAid {...I} />,
        blocks: [
          { kind: "tiles", ids: ["lifeExpectancy", "healthyLifeExpectancy", "childMortality", "maternalMortality"] },
          { kind: "bars", title: "Children and adults · % of each group", ids: ["measles", "stunting", "hiv"], max: 100 },
          { kind: "rows", ids: ["healthSpend", "suicide", "roadDeaths"] },
        ],
      },
      {
        title: "Living standards",
        sub: "What people have, and go without",
        icon: <HandHeart {...I} />,
        blocks: [
          { kind: "hdi" },
          { kind: "bars", title: "Going without · % of people", ids: ["extremePoverty", "poverty420", "poverty830", "undernourished", "foodInsecure"], max: 100 },
          { kind: "bars", title: "Have · % of people", ids: ["electricity", "cleanCooking", "water", "sanitation", "handwashing"], max: 100 },
          { kind: "rows", ids: ["ihdi", "lifeSatisfaction"] },
        ],
      },
      {
        title: "Schooling",
        sub: "Who reads, and how far they go in school",
        icon: <GraduationCap {...I} />,
        blocks: [
          { kind: "tiles", ids: ["literacy", "schoolingYears", "primaryCompletion", "tertiaryEnrol"] },
          { kind: "rows", ids: ["lowerSecondary", "secondaryEnrol", "eduSpend"] },
        ],
      },
      {
        title: "Faith",
        sub: "The religions of the world's people",
        icon: <Flag {...I} />,
        blocks: [
          {
            kind: "ring",
            title: "Its people by religion · % of people",
            parts: [["christians", "Christians"], ["muslims", "Muslims"], ["unaffiliated", "No religion"], ["hindus", "Hindus"], ["buddhists", "Buddhists"], ["jews", "Jews"], ["otherReligions", "Other religions"]],
          },
        ],
      },
    ],
  },
  {
    id: "planet",
    label: "Planet",
    icon: <Leaf {...I} />,
    panels: [
      {
        title: "Emissions and air",
        sub: "What the world puts into the air",
        icon: <Wind {...I} />,
        blocks: [
          { kind: "tiles", ids: ["co2", "ghg", "methane", "co2PerPerson"] },
          { kind: "rows", ids: ["pm25"] },
        ],
      },
      {
        title: "Energy",
        sub: "How much is used, and where it comes from",
        icon: <Lightning {...I} />,
        blocks: [
          { kind: "tiles", ids: ["energySupply", "renewables", "fossilShare", "evSalesShare"] },
          { kind: "bars", title: "Electricity generated · % from each", ids: ["fossilElectricity", "renewableElectricity"], max: 100 },
          { kind: "rows", ids: ["electricityGeneration", "energyIntensity", "energyPerPerson", "electricityPerPerson", "oilProduction", "gasProduction", "coalProduction"] },
        ],
      },
      {
        title: "Land and water",
        sub: "What the land is used for, what covers it, and what is protected",
        icon: <Plant {...I} />,
        blocks: [
          { kind: "landUse" },
          { kind: "landCover" },
          { kind: "rows", title: "As the World Bank gives them", ids: ["forest", "farmland", "protectedLand", "protectedSea", "waterWithdrawals", "cerealProduction", "cerealYield", "fertilizer"] },
        ],
      },
      {
        title: "Disasters",
        sub: "Lives lost and homes left to natural disasters",
        icon: <CloudRain {...I} />,
        blocks: [{ kind: "tiles", ids: ["disasterDeaths", "disasterDisplacement"] }],
      },
    ],
  },
  {
    id: "rights",
    label: "Rights",
    icon: <Scales {...I} />,
    panels: [
      {
        title: "How it is governed",
        sub: "Democracies and autocracies, and which way they move",
        icon: <Gavel {...I} />,
        blocks: [
          REGIME_RING,
          { kind: "tiles", ids: ["democracies", "autocratizing", "democratizing", "voterTurnout"] },
          { kind: "rows", ids: ["liberalDemocracyShare", "autocratizingShare", "democratizingShare"] },
        ],
      },
      {
        title: "Democracy and the rule of law",
        sub: "V-Dem's indices for the world, 0 to 1",
        icon: <Scales {...I} />,
        blocks: [
          {
            kind: "bars",
            title: "V-Dem indices · 0 to 1",
            ids: ["electoralDemocracy", "liberalDemocracy", "participatoryDemocracy", "deliberativeDemocracy", "egalitarianDemocracy", "ruleOfLaw", "judicialConstraints", "legislativeConstraints"],
            max: 1,
          },
        ],
      },
      {
        title: "Liberties",
        sub: "How far each kind of freedom is respected",
        icon: <Drop {...I} />,
        blocks: [
          {
            kind: "bars",
            title: "V-Dem indices · 0 to 1",
            ids: ["civilLiberties", "politicalLiberties", "privateLiberties", "physicalIntegrity", "equalityBeforeLaw", "freeExpression", "freeAssociation", "academicFreedom", "civilSociety"],
            max: 1,
          },
          { kind: "rows", ids: ["engagedSociety", "polarization"] },
        ],
      },
      {
        title: "Women",
        sub: "Women's power and freedoms",
        icon: <GenderFemale {...I} />,
        blocks: [
          { kind: "bars", title: "V-Dem indices · 0 to 1", ids: ["womenEmpowerment", "womenCivilLiberties"], max: 1 },
          { kind: "bars", title: "Seats and posts held by women · %", ids: ["womenParliament", "womenMinisters"], max: 100 },
          { kind: "rows", ids: ["workGap"] },
        ],
      },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    icon: <Cpu {...I} />,
    panels: [
      {
        title: "Connected",
        sub: "Who is online, and what the world trades in digital goods",
        icon: <WifiHigh {...I} />,
        blocks: [
          { kind: "tiles", ids: ["internet", "mobile", "broadband", "secureServers"] },
          { kind: "rows", ids: ["landlines", "ictServiceExports", "ictGoodsExports", "highTechExports"] },
        ],
      },
      {
        title: "Research",
        sub: "What is spent on it, and what it produces",
        icon: <Atom {...I} />,
        blocks: [
          { kind: "tiles", ids: ["research", "researchers", "sciArticles", "patents"] },
          { kind: "rows", ids: ["ipReceipts"] },
        ],
      },
      {
        title: "AI and robots",
        sub: "Money and work in artificial intelligence, and robots at work",
        icon: <Robot {...I} />,
        blocks: [
          { kind: "tiles", ids: ["aiInvestment", "genAiInvestment", "aiPublications", "robotInstalls"] },
          { kind: "rows", ids: ["robotStock"] },
        ],
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: <ShieldWarning {...I} />,
    panels: [
      {
        title: "Conflict and violence",
        sub: "Wars, the people they drive from home, and killings",
        icon: <ShieldWarning {...I} />,
        blocks: [
          { kind: "tiles", ids: ["conflicts", "conflictDeaths", "displaced", "homicide"] },
          { kind: "rows", ids: ["terrorAttacks", "terrorDeaths"] },
        ],
      },
      {
        title: "Armed forces",
        sub: "What the world spends on arms, and holds",
        icon: <Sword {...I} />,
        blocks: [
          { kind: "tiles", ids: ["militaryGdp", "militaryUsd", "armedForces", "nuclearWarheads"] },
          { kind: "rows", ids: ["militaryShare", "armedForcesShare", "armsTransfers"] },
        ],
      },
    ],
  },
];

const idsOf = (b: Block): string[] =>
  b.kind === "ring" ? b.parts.map((p) => p[0]) : b.kind === "hdi" ? ["hdi"] : b.kind === "counter" || b.kind === "landUse" || b.kind === "landCover" ? [] : b.ids;
/* Any world figure no panel names has a tab of its own, so none the site holds is left out. */
const NAMED = new Set(TABS.flatMap((t) => t.panels.flatMap((p) => p.blocks.flatMap(idsOf))));
const REST = Object.keys(WORLD).filter((id) => !NAMED.has(id) && held(id));
const ALL_TABS: TabDef[] = REST.length
  ? [...TABS, { id: "more", label: "More", icon: <SquaresFour {...I} />, panels: [{ title: "More figures", sub: "The rest the site holds for the world", icon: <SquaresFour {...I} />, blocks: [{ kind: "rows", ids: REST }] }] }]
  : TABS;
const countOf = (t: TabDef) => new Set(t.panels.flatMap((p) => p.blocks.flatMap(idsOf)).filter((id) => held(id))).size;
/** The latest year of any figure the site holds for the world. */
const LATEST = Math.max(...Object.values(WORLD).flatMap((i) => (i.series.length ? [i.series[i.series.length - 1][0]] : [])));
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep");

/**
 * The people alive now, as asked: the UN's medium-variant projection for 1 January of this year and the next, and the
 * year's projected births and deaths (data/worldview.ts POPULATION_PROJECTION), run between them by the second - the
 * Worldview page's counter. A projection, not a count, and said so; nothing is drawn for a year the UN's table does not hold.
 */
function PeopleCounter() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const year = new Date(now).getUTCFullYear();
  const a = POPULATION_PROJECTION.years.find((r) => r[0] === year);
  const b = POPULATION_PROJECTION.years.find((r) => r[0] === year + 1);
  if (!a || !b) return null;
  const start = Date.UTC(year, 0, 1);
  const yearMs = Date.UTC(year + 1, 0, 1) - start;
  const people = a[1] + ((b[1] - a[1]) * (now - start)) / yearMs;
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  // The year's births and deaths spread evenly over it: so many by this time of day, and of the year.
  const share = (n: number, ms: number) => Math.floor((n * ms) / yearMs).toLocaleString("en-US");
  const todayMs = now - midnight.getTime();
  const yearSoFar = now - start;
  return (
    <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">People alive now · UN projection</p>
      <p
        className="text-2xl sm:text-3xl font-bold font-mono text-foreground leading-tight tabular-nums mt-1"
        title={`The UN's figure for 1 January ${year}, ${a[1].toLocaleString("en-US")}, and since then the year's projected births less its deaths`}
        aria-hidden
      >
        {Math.round(people).toLocaleString("en-US")}
      </p>
      <span className="sr-only">About {compact(people)} people, on the UN's medium-variant projection.</span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-3">
        {[
          ["Born today", share(a[2], todayMs)],
          ["Died today", share(a[3], todayMs)],
          [`Born in ${year}`, share(a[2], yearSoFar)],
          [`Died in ${year}`, share(a[3], yearSoFar)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="text-[10px] font-sans text-muted-foreground">{k}</p>
            <p className="text-sm font-bold font-mono text-foreground tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <ChartNote className="mt-2">
        A projection, not a count: the UN's World Population Prospects {POPULATION_PROJECTION.revision}, medium variant, for 1 January {year} and {year + 1},
        with the year's projected births and deaths spread evenly over it - worked out here, by the second. The figure in the tiles below is
        the World Bank's count for its own year.
      </ChartNote>
    </div>
  );
}

/** Square kilometres as the page writes large areas: "13.0 million km²". */
const km = (v: number) => (v >= 1e6 ? `${Number((v / 1e6).toPrecision(3))} million km²` : `${Math.round(v).toLocaleString("en-US")} km²`);

/**
 * What the world's land is used for, as asked - the kinds of land beside forest and farmland: FAO's land use statistics,
 * every part for the one year, as a ring of the land area, with cropland's two parts, the land area and inland waters
 * under it. FAO's "other land" is all land that is neither farmland nor forest. Shares are FAO's areas over the land
 * area, worked out here.
 */
function LandUse() {
  const u = WORLD_LAND_USE;
  return (
    <div>
      <ChartTitle>What the world's land is used for · % of land area · {u.year}</ChartTitle>
      <PartsDonut label={`What the world's land is used for, ${u.year}`} parts={u.parts.map((p) => ({ label: p.label, value: p.km2, text: `${p.pct}%` }))} />
      <div className="mt-3 flex flex-col">
        {u.cropland.map((c) => (
          <FigureRow key={c.label} label={`${c.label}, part of cropland`} value={`${c.pct}%`} sub={km(c.km2)} />
        ))}
        <FigureRow label="The world's land area" value={km(u.landKm2)} sub={String(u.year)} />
        <FigureRow label="Inland waters, beside it" value={km(u.inlandWaterKm2)} sub={String(u.year)} />
      </div>
      <ChartNote className="mt-2">
        FAO's land use statistics, as countries report them. Other land is all land that is neither farmland nor forest - ice,
        bare ground, built-up land and the rest. Each share is FAO's area over the world's land area, worked out here.
      </ChartNote>
    </div>
  );
}

/**
 * What covers the world's surface, as satellites class it, as asked: each map FAO publishes, picked by a chip, as a ring
 * of the area it maps, and every class it holds set beside the others' in a table, so that the maps' differences show -
 * they class the ground in their own ways (Tree cover is any ground under trees, not FAO's forest above). A map FAO's
 * world sum covers only part of is named and left out.
 */
function LandCover() {
  const maps = WORLD_LAND_COVER;
  const [at, setAt] = useState(0);
  const m = maps[at] ?? maps[0];
  if (!m) return null;
  const classes = [...new Set(maps.flatMap((x) => x.classes.map((c) => c.label)))];
  return (
    <div>
      <ChartTitle>
        What covers the world's surface · % of the area mapped · {m.map}, {m.year}
      </ChartTitle>
      {maps.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3" role="group" aria-label="Which map">
          {maps.map((x, i) => (
            <button
              key={x.map}
              type="button"
              onClick={() => setAt(i)}
              aria-pressed={i === at}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${
                i === at ? "chip-selected" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {x.map} · {x.year}
            </button>
          ))}
        </div>
      )}
      <PartsDonut label={`What covers the world's surface, ${m.map}, ${m.year}`} parts={m.classes.map((c) => ({ label: c.label, value: c.km2, text: `${c.pct}%` }))} />
      {/* Every class beside the other maps', as a short table: what one map calls grassland, another calls shrubs. */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[11px] font-sans">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal py-1 pr-3">Class · % of the area mapped</th>
              {maps.map((x) => (
                <th key={x.map} className={`text-right font-normal py-1 px-2 whitespace-nowrap ${x === m ? "text-foreground font-semibold" : ""}`}>
                  {x.map.replace(" (NASA)", "")} {x.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((label) => (
              <tr key={label} className="border-t border-border">
                <td className="py-1 pr-3 text-foreground">{label}</td>
                {maps.map((x) => {
                  const c = x.classes.find((k) => k.label === label);
                  return (
                    <td key={x.map} className={`py-1 px-2 text-right font-mono ${x === m ? "text-foreground font-semibold" : "text-muted-foreground"}`} title={c ? km(c.km2) : undefined}>
                      {c ? `${c.pct}%` : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="py-1 pr-3 text-muted-foreground">Area mapped</td>
              {maps.map((x) => (
                <td key={x.map} className="py-1 px-2 text-right font-mono text-muted-foreground whitespace-nowrap">
                  {km(x.totalKm2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ChartNote className="mt-2">
        As satellites see the ground, in FAO's land cover statistics: each map classes it in its own way, so the maps differ, and a dash
        is a class a map does not use. Tree cover is any ground under trees, not FAO's forest above. Each share is a class's area over
        the area the map covers, worked out here.
        {WORLD_LAND_COVER_LEFT_OUT.map((x) => ` FAO's world sum for the ${x.map}'s ${x.year} map covers ${km(x.totalKm2)}, far less than the others, so it is not drawn.`).join("")}
      </ChartNote>
    </div>
  );
}

/* ── Drawing a block, as the country window draws its own ─────────────── */
function BlockView({ b }: { b: Block }) {
  if (b.kind === "counter") return <PeopleCounter />;
  if (b.kind === "landUse") return <LandUse />;
  if (b.kind === "landCover") return <LandCover />;
  if (b.kind === "tiles") {
    const inds = b.ids.flatMap((id) => (held(id) ? [WORLD[id]] : []));
    if (!inds.length) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {inds.map((ind) => {
          const [y, v] = lastOf(ind)!;
          return <FigureTile key={ind.id} label={ind.label} value={fmt(ind, v)} sub={`${ind.unit} · ${y}`} />;
        })}
      </div>
    );
  }
  if (b.kind === "hdi") {
    const hdi = lastOf(WORLD.hdi);
    return hdi ? (
      <div>
        <HdiScale value={hdi[1]} year={String(hdi[0])} />
        <ChartNote className="mt-1">The world's value on UNDP's scale; its tiers begin at 0.550, 0.700 and 0.800, marked on it.</ChartNote>
      </div>
    ) : null;
  }
  if (b.kind === "ring") {
    const pts = b.parts.flatMap(([id, label]) => {
      const p = lastOf(WORLD[id]);
      return p ? [{ id, label, y: p[0], v: p[1] }] : [];
    });
    // A ring only where every part is there and of the one year: otherwise each is a bar of its own.
    const oneYear = pts.length === b.parts.length && pts.every((p) => p.y === pts[0].y);
    if (!pts.length) return null;
    return (
      <div>
        <ChartTitle>
          {b.title}
          {oneYear ? ` · ${pts[0].y}` : ""}
        </ChartTitle>
        {oneYear ? (
          <PartsDonut label={b.title} parts={pts.map((p) => ({ label: p.label, value: p.v, text: fmt(WORLD[p.id], p.v) }))} />
        ) : (
          <MeasureBars label={b.title} max={100} rows={pts.map((p) => ({ label: p.label, value: p.v, text: fmt(WORLD[p.id], p.v), sub: String(p.y) }))} />
        )}
        {b.note && <ChartNote className="mt-2">{b.note}</ChartNote>}
      </div>
    );
  }
  if (b.kind === "bars") {
    const inds = b.ids.flatMap((id) => (held(id) ? [WORLD[id]] : []));
    if (!inds.length) return null;
    return (
      <div>
        <ChartTitle>{b.title}</ChartTitle>
        <MeasureBars
          label={b.title}
          max={b.max}
          rows={inds.map((ind) => {
            const [y, v] = lastOf(ind)!;
            return { key: ind.id, label: ind.label, value: v, text: fmt(ind, v), sub: String(y) };
          })}
        />
        {b.note && <ChartNote className="mt-2">{b.note}</ChartNote>}
      </div>
    );
  }
  const inds = b.ids.flatMap((id) => (held(id) ? [WORLD[id]] : []));
  if (!inds.length) return null;
  return (
    <div>
      {b.title && <ChartTitle>{b.title}</ChartTitle>}
      <div className="flex flex-col">
        {inds.map((ind) => {
          const [y, v] = lastOf(ind)!;
          const ch = changeOf(ind);
          return <FigureRow key={ind.id} label={ind.label} value={fmt(ind, v)} sub={[ind.unit, String(y), ch].filter(Boolean).join(" · ")} />;
        })}
      </div>
    </div>
  );
}

function Panel({ p }: { p: PanelDef }) {
  const sources = useMemo(() => {
    const seen = new Map<string, { label: string; url: string }>();
    if (p.blocks.some((b) => b.kind === "counter")) seen.set(POPULATION_PROJECTION.source.label, POPULATION_PROJECTION.source);
    if (p.blocks.some((b) => b.kind === "landUse")) seen.set(WORLD_LAND_SOURCES.use.label, WORLD_LAND_SOURCES.use);
    if (p.blocks.some((b) => b.kind === "landCover")) seen.set(WORLD_LAND_SOURCES.cover.label, WORLD_LAND_SOURCES.cover);
    for (const id of p.blocks.flatMap(idsOf)) {
      const ind = held(id);
      if (ind && !seen.has(ind.source.label)) seen.set(ind.source.label, ind.source);
    }
    return [...seen.values()];
  }, [p]);
  return (
    <div className="modal-tile rounded-lg p-4 mt-4 first:mt-0">
      {/* The panel's head, as a country window's panels have it. */}
      <div className="flex items-center gap-2 min-w-0 mb-4">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">{p.icon}</div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">{p.title}</h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{p.sub}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {p.blocks.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </div>
      <SourceLink sources={sources} className="mt-3" />
    </div>
  );
}

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
  const current = ALL_TABS.find((t) => t.id === tab) ?? ALL_TABS[0];
  const pop = lastOf(WORLD.population);
  const gdp = lastOf(WORLD.gdp);

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

          {/* Tab bar, at the top of the window under its title, as asked - and with no scrollbar drawn under it: on a narrow window
              it still scrolls sideways, by touch or the wheel with shift. */}
          <div className="flex items-center gap-1 mb-5 bg-muted/60 rounded-xl p-1 border border-border/60 overflow-x-auto modal-tabs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="The world's figures by subject">
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
                <span className="text-[10px] font-mono opacity-60">{countOf(t)}</span>
              </button>
            ))}
          </div>

          {/* The flag, and what it is and stands for, on the Overview alone, as asked. */}
          {tab === "overview" && (
            <>
              {/* Its flag and what it is, as a country's window opens. */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md">
                  <img src={FLAG} alt="International Flag of Planet Earth" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground">World aggregates</span>
                    {pop && <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-border text-foreground">{compact(pop[1])} people · {pop[0]}</span>}
                    {gdp && <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-border text-foreground">GDP ${compact(gdp[1])} · {gdp[0]}</span>}
                  </div>
                  <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                    {Object.keys(WORLD).length} figures for the world as a whole, each its publisher's latest, to {LATEST}; read from their sources on{" "}
                    {day(WORLDVIEW_RETRIEVED)}.
                  </p>
                </div>
              </div>

              {/* The flag: what it is and what it stands for, as its makers describe it - in the site's words. */}
              <div className="modal-tile rounded-lg p-4 mb-5">
                <div className="flex items-center gap-2 min-w-0 mb-2">
                  <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">
                    <Flag {...I} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">The flag</h3>
                    <p className="text-[10px] text-muted-foreground font-sans mt-0.5">The International Flag of Planet Earth</p>
                  </div>
                </div>
                <p className="text-xs font-sans text-foreground leading-relaxed">
                  Designed by Oskar Pernefeldt as his graduation project at Beckmans College of Design in Stockholm, and first shown in 2015. At its
                  centre seven rings, linked together, make a flower: the flower stands for life on Earth, and the linking of the rings for how
                  everything on the planet is connected, directly or not. The blue field is water, which life depends on and which covers most of
                  the planet; the outer rings together form a circle that can be read as the Earth itself, with the blue around it as space.
                </p>
                {/* Its facts in words, as a country window's geography list has them: a line between each. */}
                <dl className="mt-3 divide-y divide-border">
                  {[
                    ["Proportions", "2:3"],
                    ["Blazon", "Seven silver circles interlaced on a blue field - its makers' heraldic description"],
                    ["Use", "Free to use, personal or commercial, to represent the planet - not a business, a body or a person"],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2">
                      <dt className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider pt-0.5">{k}</dt>
                      <dd className="text-xs font-sans text-foreground leading-relaxed">{v}</dd>
                    </div>
                  ))}
                </dl>
                <SourceLink sources={[FLAG_PAGE, FLAG_FILE]} className="mt-2" />
              </div>
            </>
          )}


          <div className="flex flex-col">
            {current.panels.map((p) => (
              <Panel key={p.title} p={p} />
            ))}
          </div>
          <ChartNote className="mt-3">
            Each figure is its publisher's latest for the world, with its year. A change is the latest against the figure ten years before
            it (or within two years of that), worked out here. Bars on one chart share its scale: 100 for shares, 1 for V-Dem's indices.
          </ChartNote>
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
    const last = lastOf(ind);
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
