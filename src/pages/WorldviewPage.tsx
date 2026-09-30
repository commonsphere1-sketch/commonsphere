import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowsIn,
  ArrowsOut,
  CaretLeft,
  CaretRight,
  Bank,
  Buildings,
  Coins,
  Cpu,
  Factory,
  GlobeHemisphereWest,
  GlobeStand,
  Leaf,
  Lightbulb,
  Lightning,
  Minus,
  Ranking,
  Scales,
  ShieldWarning,
  TrendUp,
  UsersThree,
  X,
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
  PEW_CHECKED,
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
import { HeadlinesBanner, placeName, placeTag, type Headline, type Shown } from "@/components/HeadlinesBanner";
import { SectionNav, type NavSection } from "@/components/SectionNav";
import { has } from "@/lib/na";

/**
 * Worldview: where the world stands, as a global dashboard in twelve pillars -
 * society, the economy, development, industry, energy, technology, politics,
 * civic rights and freedoms, institutions, ideology, security and the
 * planet - after an
 * overview with the population clock, the headline figures and the day's
 * world headlines.
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
  // A change the source gives only in words is shown in its words.
  if (ind.stated) return { ...ind.stated, verdict: null };
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
  sanitation: "People using a toilet or latrine not shared with other households, from which waste is safely disposed of or treated.",
  broadband: "Fixed connections to the internet - cable, DSL, fibre, satellite or fixed wireless - for every 100 people.",
  secureServers: "Web servers with publicly trusted encryption certificates, for every million people.",
  researchers: "People working in research and development, for every million people.",
  sciArticles: "Articles published in peer-reviewed science and engineering journals, and selected conference papers, in the year.",
  highTechExports: "Exports of products that take intensive research to make - aircraft, computers, medicines, scientific instruments, electrical machinery - as a share of all manufactured exports.",
  ipReceipts: "What countries are paid from abroad for the use of patents, trademarks, copyrights and designs, and for licences to copy software, films and recordings.",
  armedForces: "Active-duty military personnel, including paramilitary forces that could support or replace the regular military.",
  armsTransfers: "The volume of major weapons - aircraft, armoured vehicles, artillery, radar, missiles and ships - delivered from one country to another in the year.",
  nuclearWarheads: "Nuclear warheads in the world's stockpiles, including retired ones not yet dismantled.",
  electoralDemocracy: "How far leaders are chosen in free and fair elections with universal suffrage, and people are free to organise and speak, averaged across the world's people.",
  ruleOfLaw: "How far government obeys the law, the courts are independent, justice is accessible, and officials are impartial and free of corruption, averaged across the world's people.",
  judicialConstraints: "How far the executive respects the constitution and obeys the courts, and the courts are independent, averaged across the world's people.",
  legislativeConstraints: "How far the legislature, the opposition included, questions, oversees and investigates the executive, averaged across the world's people.",
  taxRevenue: "The taxes governments collect, as a share of the economy's output.",
  govRevenue: "Everything governments take in - taxes, social contributions and other revenue - apart from grants, as a share of output.",
  academicFreedom: "How freely academics can research, teach, publish and speak, and how far universities govern themselves, averaged across the world's people.",
  polarization: "How far society is divided into hostile political camps, with political differences souring relationships and discouraging contact across ideological lines, averaged across the world's people.",
  christians: "People who identify as Christians, as a share of everyone.",
  muslims: "People who identify as Muslims, as a share of everyone.",
  unaffiliated: "People who identify with no religion - atheists, agnostics and those who say they are nothing in particular.",
  hindus: "People who identify as Hindus, as a share of everyone.",
  buddhists: "People who identify as Buddhists, as a share of everyone.",
  jews: "Jews as a share of everyone; outside Israel, Pew counts people who identify with Judaism as their religion.",
  otherReligions: "Everyone who identifies with another religion - Baha'is, Daoists, Jains, Sikhs, followers of folk religions and many smaller groups - together.",
  physicalIntegrity: "How far people are free from torture and political killings by the government, averaged across the world's people.",
  womenCivilLiberties: "How far women are free from forced labour, have property rights and access to the courts, and can move freely, averaged across the world's people.",
  equalityBeforeLaw: "How far laws are transparent and enforced alike, administration is impartial, and people have access to justice and are free from torture, forced labour and limits on their religion and movement, averaged across the world's people.",
  privateLiberties: "How far people are free from forced labour, own property securely, and can move and worship freely, averaged across the world's people.",
  freeAssociation: "How far parties, the opposition included, can form and take part in elections, and civil society groups can form and operate freely, averaged across the world's people.",
  womenEmpowerment: "How far women enjoy civil liberties, take part in civil society and are represented in politics, averaged across the world's people.",
  hdi: "UNDP's summary of three things: a long and healthy life, a good education, and a decent standard of living. 1 is the highest.",
  gdpPerCapitaPpp: "What the world produces per person, in dollars adjusted for what money buys in each country and for inflation.",
  agEmployment: "Workers in agriculture, forestry and fishing, as a share of everyone employed.",
  industryEmployment: "Workers in mining, manufacturing, construction and utilities, as a share of everyone employed.",
  servicesEmployment: "Workers in trade, transport, finance, government, education, health and other services, as a share of everyone employed.",
  wageWorkers: "Employees paid a wage or salary, as against the self-employed, as a share of everyone employed.",
  agricultureVA: "The share of the world's output that comes from agriculture, forestry and fishing.",
  manufacturingVA: "The share of the world's output that comes from manufacturing.",
  servicesVA: "The share of the world's output that comes from services.",
  cleanCooking: "People who mainly cook with clean fuels and technologies, such as electricity, gas or solar, rather than wood, charcoal, dung, coal or kerosene.",
  energyPerPerson: "The primary energy the world uses per person, in kilograms of oil equivalent.",
  electricityPerPerson: "The electricity the world uses per person, in kilowatt-hours.",
  displacedShare: "People forced from their homes, as a share of everyone alive: UNHCR's count over the World Bank's population for the same year.",
  aged65: "People aged 65 and over, as a share of everyone.",
  under15: "Children under 15, as a share of everyone.",
  maternalMortality: "Women who die from pregnancy-related causes while pregnant or within six weeks of the pregnancy's end, for every 100,000 live births.",
  measles: "Children aged 12-23 months who have had a measles vaccination.",
  stunting: "Children under five who are too short for their age - a sign of long-term undernourishment.",
  healthSpend: "What is spent on health care each year, public and private, as a share of the world's output.",
  hiv: "People aged 15 to 49 living with HIV.",
  suicide: "Deaths by suicide in the year, for every 100,000 people.",
  roadDeaths: "Deaths from road traffic injuries in the year, for every 100,000 people.",
  handwashing: "People whose home has somewhere to wash hands with soap and water.",
  youthUnemployment: "Young people aged 15 to 24 without work who are available for work and looking for it, as a share of that age group's labour force.",
  labourForce: "People aged 15 and over who are working or looking for work.",
  investment: "What is spent on new buildings, machinery, infrastructure and other lasting assets, and added to stocks, as a share of output.",
  savings: "The part of the world's income that is not spent on consumption, as a share of output.",
  remittances: "Money people working abroad send home, with the pay of people who work across a border.",
  poverty420: "People living on less than $4.20 a day, the poverty line typical of lower-middle-income countries.",
  marketCap: "The market value of companies listed on the world's stock exchanges, as a share of output.",
  accounts: "Adults with an account at a bank or other financial institution, or who use mobile money.",
  vulnerableWork: "Workers who work for themselves without employees, or unpaid in a family business, as a share of everyone employed.",
  airPassengers: "Passengers carried by the world's airlines in the year, on domestic and international flights.",
  ictServiceExports: "Computer, telecommunications and information services, as a share of all services exported.",
  ictGoodsExports: "Computers, phones and other electronic and information technology goods, as a share of all goods exported.",
  landlines: "Fixed telephone lines for every 100 people.",
  govExpense: "What governments spend on running their services, wages, interest and transfers, as a share of output.",
  militaryShare: "What governments spend on their armed forces, as a share of all government spending.",
  methane: "Methane released by farming, energy, waste and industry, in CO₂ equivalents.",
  co2PerPerson: "Carbon dioxide from fossil fuels and industry, per person in the world.",
  protectedLand: "Land in protected areas or conserved by other effective means, as a share of all land.",
  protectedSea: "Territorial waters in marine protected areas, as a share of all territorial waters.",
  pm25: "The average concentration of fine particles (PM2.5) in the air people breathe, in micrograms per cubic metre.",
  waterWithdrawals: "Fresh water taken from rivers, lakes and aquifers each year, against the renewable water that arises within countries.",
  farmland: "Land that is cropped or grazed, as a share of all land.",
  disasterDisplacement: "Times people were forced from their homes by disasters within their own country in the year.",
  disasterDeaths: "People killed or missing in natural disasters in the year.",
  liberalDemocracy: "How far electoral democracy is joined by the rule of law, checks on the executive and protected liberties, averaged across the world's people.",
  participatoryDemocracy: "How far citizens take part beyond elections - in civil society, direct democracy and local government - averaged across the world's people.",
  deliberativeDemocracy: "How far decisions come from reasoned public debate rather than emotional appeals, bargaining or coercion, averaged across the world's people.",
  egalitarianDemocracy: "How equally rights, freedoms and power are spread across social groups, averaged across the world's people.",
  politicalLiberties: "How free people are to speak and to associate, averaged across the world's people.",
  civilSociety: "How far civil society groups are consulted by policymakers and people take part in them, averaged across the world's people.",
  industryVA: "The share of the world's output that comes from industry: mining, manufacturing, construction, and electricity, water and gas.",
  manufacturingUsd: "What manufacturing adds to the world's output in the year, in current US dollars.",
  manufacturesExports: "Manufactured goods - chemicals, basic manufactures, machinery and transport equipment, and others - as a share of all goods exported.",
  resourceRents: "What the world earns from its oil, gas, coal, minerals and forests above the cost of extracting them, as a share of output.",
  oilRents: "What oil earns above the cost of producing it, as a share of the world's output.",
  gasRents: "What natural gas earns above the cost of producing it, as a share of the world's output.",
  coalRents: "What coal earns above the cost of mining it, as a share of the world's output.",
  mineralRents: "What ten minerals, from iron and copper to gold, earn above the cost of mining them, as a share of the world's output.",
  cerealProduction: "The wheat, rice, maize and other grain harvested in the year.",
  cerealYield: "The grain harvested from each hectare of land under cereals.",
  fertilizer: "Nitrogen, potash and phosphate fertilizer used on each hectare of arable land.",
  energySupply: "All the energy the world uses in the year, before it is turned into electricity, fuels and heat, in terawatt-hours.",
  energyIntensity: "How much energy the world uses for each dollar of output; lower means more output from the same energy.",
  fossilShare: "Oil, coal and gas, as a share of all the energy the world uses.",
  electricityGeneration: "All the electricity generated in the world in the year, in terawatt-hours.",
  fossilElectricity: "The share of the world's electricity generated from coal, gas and oil.",
  renewableElectricity: "The share of the world's electricity generated from renewable sources - hydropower, wind, sun, bioenergy and others.",
  oilProduction: "The oil the world produces - crude, condensates and natural gas liquids - measured as energy.",
  gasProduction: "The natural gas the world produces, measured as energy.",
  coalProduction: "The coal the world produces, measured as energy.",
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

/**
 * A figure's trend across the foot of its tile, as wide as the tile: grey
 * line, the latest point in the accent. Drawn in percent of the strip, so it
 * stretches with the tile; the stroke and the point keep their size.
 */
function TileTrend({ series }: { series: WorldPoint[] }) {
  if (series.length < 3) return null;
  const x0 = series[0][0];
  const x1 = series[series.length - 1][0];
  const ys = series.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => 3 + ((x - x0) / (x1 - x0 || 1)) * 94;
  const py = (y: number) => 86 - ((y - lo) / (hi - lo || 1)) * 72;
  const d = series.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const [lx, ly] = series[series.length - 1];
  return (
    <span className="relative block h-6 w-full text-muted-foreground" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${ACCENT_BG}`}
        style={{ left: `${px(lx)}%`, top: `${py(ly)}%` }}
      />
    </span>
  );
}

/**
 * The full trend: a grey line with a faint wash, the latest point in the
 * accent. The pointer, or the arrow keys once focused, moves a crosshair and
 * reads out that year.
 */
function Sparkline({ ind, tall = false }: { ind: WorldIndicator; tall?: boolean }) {
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
        className={`relative mt-1 ${tall ? "h-36" : "h-11"} cursor-crosshair rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
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

/** Every year of a series, newest first, in columns: the window's full table. */
function YearGrid({ ind }: { ind: WorldIndicator }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 font-mono text-[11px]">
      {[...ind.series].reverse().map(([y, v]) => (
        <div key={y} className="flex justify-between gap-2 border-b border-border/30 py-0.5">
          <span className="text-muted-foreground tabular-nums">{y}</span>
          <span className="text-foreground tabular-nums">{fmt(ind, v)}</span>
        </div>
      ))}
    </div>
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
            A dashboard of the whole world in {inWords(PILLARS.length)} pillars - how people live, what the economy is doing, how far the
            world has developed, what it makes and how it is powered, technology, how it is governed, the rights and freedoms people have,
            its institutions, what people believe, war and peace, and the state of the planet - each figure with what it measures, its
            trend and its source.
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

// ── World headlines ─────────────────────────────────────────────────────────

/**
 * The world desks' latest headlines naming a country other than the United
 * States. A US-only story is domestic news - it has its own banner on the
 * States page - and a world banner of them was obituaries and state
 * politics. The chip names the countries.
 */
const pickWorld = (rows: Headline[]): Shown[] =>
  rows
    .filter((h) => h.places.some((p) => p !== "c:US" && p.startsWith("c:") && placeName(p)))
    .slice(0, 30)
    .map((h) => ({ h, tag: placeTag(h.places.filter((p) => p.startsWith("c:"))) }));

// ── The world wheel ─────────────────────────────────────────────────────────

const WORLD_WHEEL = { cx: 260, cy: 260, core: 70, edge: 198 };
/**
 * The radius that encloses a share `f` of a wedge, from the core out, by
 * area: so each part of a wedge takes the room its count deserves, however
 * far out it lies.
 */
const areaRadius = (f: number) => {
  const { core, edge } = WORLD_WHEEL;
  return Math.sqrt(core ** 2 + Math.max(0, Math.min(1, f)) * (edge ** 2 - core ** 2));
};

/**
 * The world as a wheel of its pillars, in the manner of the Climate page's
 * planetary boundaries: each pillar a wedge, filled from the centre with its
 * measures that improved over about ten years (green), then those that
 * worsened (red); the grey that remains is its measures with no verdict,
 * where the direction is a matter of opinion. Every wedge holds all of its
 * pillar's measures, and each part's area matches its count, so a pillar
 * with few judged measures is not drawn as all good or all bad. Hovering a
 * pillar, here or in the list beside, reads it out in the centre; picking
 * one opens its window.
 */
function WorldWheel() {
  const { isLight, card, head, muted } = useLook();
  const open = useContext(OpenWorldview);
  const [hover, setHover] = useState<Pillar["id"] | null>(null);
  const rows = PILLARS.map((p) => {
    const d = pillarDirection(p);
    return { p, ...d, total: d.better + d.worse + d.none };
  });
  const all = rows.reduce((t, r) => ({ better: t.better + r.better, worse: t.worse + r.worse, none: t.none + r.none }), { better: 0, worse: 0, none: 0 });
  const colors = {
    better: isLight ? "#059669" : "#10b981",
    worse: isLight ? "#dc2626" : "#ef4444",
    none: isLight ? "#d4d4d8" : "#52525b",
  };
  const { cx, cy, core, edge } = WORLD_WHEEL;
  const step = 360 / rows.length;
  const polar = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const wedge = (start: number, end: number, inner: number, outer: number) => {
    if (outer - inner < 0.25) return "";
    const s = start + 0.9;
    const e = end - 0.9;
    const [p1, p2, p3, p4] = [polar(s, inner), polar(s, outer), polar(e, outer), polar(e, inner)];
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${outer} ${outer} 0 0 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${inner} ${inner} 0 0 0 ${p1.x} ${p1.y} Z`;
  };
  const shown = rows.find((r) => r.p.id === hover) ?? null;
  const read = shown ?? { ...all, total: all.better + all.worse + all.none };
  const describe = (r: (typeof rows)[number]) =>
    `${r.p.title}: of ${r.total} measures, ${r.better} improved and ${r.worse} worsened over about ten years; ${r.none} have no verdict. Opens the pillar.`;

  return (
    <div className="rounded-2xl p-5" style={card}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
            {rows.length} pillars · {all.better + all.worse + all.none} measures
          </p>
          <h2 className="text-lg font-bold font-sans" style={{ color: head }}>
            The world at a glance
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-muted/60 text-foreground/80">
          {all.better} better · {all.worse} worse · {all.none} no verdict
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-3 mb-3 border-b border-border">
        {[
          { key: "better", label: "Improved over about ten years", Icon: ArrowUpRight },
          { key: "worse", label: "Worsened", Icon: ArrowDownRight },
          { key: "none", label: "No verdict - the direction is a matter of opinion", Icon: Minus },
        ].map((x) => (
          <span key={x.key} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[x.key as keyof typeof colors] }} aria-hidden />
            <x.Icon size={10} weight="bold" aria-hidden />
            {x.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 flex items-center justify-center">
          <svg
            viewBox="0 0 520 520"
            width="100%"
            style={{ maxWidth: 440, overflow: "visible" }}
            role="img"
            aria-label={`The world's ${rows.length} pillars: of ${all.better + all.worse + all.none} measures, ${all.better} improved and ${all.worse} worsened over about ten years, and ${all.none} have no verdict.`}
          >
            <defs>
              <radialGradient id="wwCoreGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isLight ? "#ffffff" : "#27272a"} />
                <stop offset="100%" stopColor={isLight ? "#e4e4e7" : "#18181b"} />
              </radialGradient>
            </defs>
            {/* Half of a pillar's measures, by area. */}
            <circle cx={cx} cy={cy} r={areaRadius(0.5)} fill="none" stroke={isLight ? "#71717a" : "#a1a1aa"} strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />

            {rows.map((r, i) => {
              const start = i * step;
              const f1 = r.total ? r.better / r.total : 0;
              const f2 = r.total ? (r.better + r.worse) / r.total : 0;
              const lit = hover === null || hover === r.p.id;
              return (
                <g
                  key={r.p.id}
                  role="button"
                  tabIndex={0}
                  aria-label={describe(r)}
                  aria-haspopup="dialog"
                  className="cursor-pointer focus:outline-none"
                  onClick={() => open(r.p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open(r.p);
                    }
                  }}
                  onMouseEnter={() => setHover(r.p.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(r.p.id)}
                  onBlur={() => setHover(null)}
                  opacity={lit ? 1 : 0.4}
                  style={{ transition: "opacity 150ms" }}
                >
                  {/* The whole pillar: its measures with no verdict show as this grey. */}
                  <path d={wedge(start, start + step, core, edge)} fill={colors.none} opacity={0.55} />
                  <path d={wedge(start, start + step, core, areaRadius(f1))} fill={colors.better} opacity={0.9} />
                  <path d={wedge(start, start + step, areaRadius(f1), areaRadius(f2))} fill={colors.worse} opacity={0.85} />
                  {/* The pillar's own colour, as a band round the rim. */}
                  <path d={wedge(start, start + step, edge + 4, edge + 9)} fill={r.p.color} opacity={0.9} />
                  {hover === r.p.id && (
                    <path d={wedge(start, start + step, core, edge + 9)} fill="none" stroke={r.p.color} strokeWidth={2} />
                  )}
                </g>
              );
            })}

            <circle cx={cx} cy={cy} r={core} fill="url(#wwCoreGrad)" stroke={isLight ? "#d4d4d8" : "#3f3f46"} />
            <text x={cx} y={cy - 22} textAnchor="middle" fontSize="9" fontFamily="monospace" letterSpacing="1" fill={shown ? shown.p.color : muted}>
              {(shown ? shown.p.title : "The world").toUpperCase()}
            </text>
            <text x={cx} y={cy - 3} textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="700" fill={colors.better}>
              {read.better} better
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="700" fill={colors.worse}>
              {read.worse} worse
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill={muted}>
              {read.none} no verdict
            </text>
            <text x={cx + areaRadius(0.5) + 3} y={cy - 3} fontSize="7" fontFamily="monospace" fill={muted}>
              half
            </text>

            {rows.map((r, i) => {
              const mid = i * step + step / 2;
              const lp = polar(mid, edge + 26);
              const anchor = mid > 345 || mid < 15 || (mid > 165 && mid < 195) ? "middle" : mid < 180 ? "start" : "end";
              const lit = hover === r.p.id;
              return (
                <text
                  key={`lbl-${r.p.id}`}
                  x={lp.x}
                  y={lp.y + 3}
                  textAnchor={anchor}
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight={lit ? "700" : "600"}
                  fill={lit ? r.p.color : isLight ? "#334155" : "#cbd5e1"}
                  className="select-none cursor-pointer"
                  onClick={() => open(r.p)}
                  onMouseEnter={() => setHover(r.p.id)}
                  onMouseLeave={() => setHover(null)}
                  aria-hidden
                >
                  {r.p.title}
                </text>
              );
            })}
          </svg>
        </div>

        <ul className="lg:col-span-5 flex flex-col gap-1">
          {rows.map((r) => (
            <li key={r.p.id}>
              <button
                type="button"
                onClick={() => open(r.p)}
                onMouseEnter={() => setHover(r.p.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(r.p.id)}
                onBlur={() => setHover(null)}
                aria-haspopup="dialog"
                aria-label={describe(r)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors hover:bg-muted/60"
                style={hover === r.p.id ? { background: r.p.color + "14" } : undefined}
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: r.p.color + "18", color: r.p.color }} aria-hidden>
                  {r.p.icon}
                </span>
                <span className="w-24 shrink-0 text-[11px] font-semibold font-sans truncate" style={{ color: head }}>
                  {r.p.title}
                </span>
                <span className="flex-1 flex h-1.5 gap-[2px] min-w-0" aria-hidden>
                  {(["better", "worse", "none"] as const).map((k) =>
                    r[k] ? <span key={k} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(100 * r[k]) / r.total}%`, background: colors[k] }} /> : null,
                  )}
                </span>
                <span className="shrink-0 w-24 text-right text-[10px] font-mono tabular-nums" style={{ color: muted }} aria-hidden>
                  <span style={{ color: colors.better }}>↗{r.better}</span> <span style={{ color: colors.worse }}>↘{r.worse}</span> —{r.none}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[10px] font-sans leading-relaxed max-w-4xl" style={{ color: muted }}>
        Each wedge is a pillar and holds all its measures: from the centre, those that improved over about ten years, then those that
        worsened; the grey beyond is those with no verdict, where whether up or down is better is a matter of opinion - most of the
        governance and belief measures. Each part's area matches its number of measures, and the dashed ring marks half. Hover a pillar to
        read it in the centre; pick one to open it.
      </p>
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
  return {
    year,
    counts,
    people,
    freeShare: total ? (100 * people.F) / total : NaN,
    notFreeShare: total ? (100 * people.NF) / total : NaN,
  };
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

// ── The pillars ─────────────────────────────────────────────────────────────

const inWords = (n: number) =>
  ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"][n] ?? String(n);

/** "Five of its seven measures are lower than about ten years before." */
function howManyLower(lower: number, n: number): string {
  if (lower === 0) return `None of its ${inWords(n)} measures is lower than about ten years before.`;
  if (lower === n) return `All ${inWords(n)} of its measures are lower than about ten years before.`;
  const w = inWords(lower);
  return `${w[0].toUpperCase()}${w.slice(1)} of its ${inWords(n)} measures ${lower === 1 ? "is" : "are"} lower than about ten years before.`;
}

/** A figure in a group: a world series, or a climate reading. */
type Figure = { kind: "world"; key: string; ind: WorldIndicator; extra?: string } | { kind: "climate"; key: string; c: ClimateIndicator };

const labelOf = (f: Figure) => (f.kind === "world" ? f.ind.label : f.c.label);
const aboutOf = (f: Figure): string | undefined => (f.kind === "world" ? DESCRIBE[f.ind.id] : DESCRIBE_CLIMATE[f.c.id]);
const sourceOf = (f: Figure) => (f.kind === "world" ? f.ind.source : { label: f.c.source, url: f.c.url });
const deltaOf = (f: Figure) => (f.kind === "world" ? delta(f.ind) : climateDelta(f.c));
/** The year a figure is for: its series' last, or the year in a reading's period ("August 2026"). */
const yearOf = (f: Figure) => (f.kind === "world" ? f.ind.series[f.ind.series.length - 1][0] : Number(/\d{4}/.exec(f.c.period)?.[0] ?? NaN));

/** A group's figures as its tiles show them: the climate readings, then the world series. */
function groupFigures(g: Group): Figure[] {
  return [
    ...(g.climate ?? [])
      .map(climateOf)
      .filter((c): c is ClimateIndicator => !!c)
      .map((c): Figure => ({ kind: "climate", key: `c:${c.id}`, c })),
    ...g.ids.map((id): Figure => ({ kind: "world", key: `w:${id}`, ind: WORLD[id], extra: g.extras?.[id] })),
  ];
}

/** "2020–2026": the span of the latest years a set of figures is for. */
function latestSpan(figures: Figure[]): string {
  const years = figures.map(yearOf).filter((y) => Number.isFinite(y));
  if (!years.length) return "";
  const [first, last] = [Math.min(...years), Math.max(...years)];
  return first === last ? `${first}` : `${first}–${last}`;
}

/** The bodies behind a set of figures, by the short names they go by. */
const PUBLISHER: [RegExp, string][] = [
  [/^World Bank/, "World Bank"],
  [/^IMF/, "IMF"],
  [/^Uppsala/, "UCDP"],
  [/^UNHCR/, "UNHCR"],
  [/^V-Dem/, "V-Dem"],
  [/^Global Terrorism Database/, "Global Terrorism Database"],
  [/^Federation of American Scientists/, "Federation of American Scientists"],
  [/^Pew/, "Pew Research Center"],
  [/^UNDP/, "UNDP"],
  [/^UN World Population/, "UN"],
  [/^Freedom House/, "Freedom House"],
  [/^NASA/, "NASA"],
  [/^NOAA/, "NOAA"],
  [/^NSIDC/, "NSIDC"],
];
function publishers(figures: Figure[]): string[] {
  const names = figures.map((f) => {
    const label = sourceOf(f).label;
    return PUBLISHER.find(([r]) => r.test(label))?.[1] ?? label.split(/ — | \(|, /)[0];
  });
  return [...new Set(names)];
}

/** A card's tile: a figure (which opens its window), or a share worked out on the page, with its own summary. */
type Tile = { label: string; value: string; sub: string; d: Delta | null; fig?: Figure; summary?: string };
type Group = { title: string; intro: string; ids: string[]; climate?: string[]; extras?: Record<string, string>; freedom?: boolean };
type Pillar = {
  id: "society" | "economy" | "development" | "industry" | "energy" | "technology" | "politics" | "civic" | "institutions" | "ideology" | "security" | "ecology";
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
  return { label, value: fmt(ind, v), sub: `${unitOf(ind)} · ${y}`, d: delta(ind), fig: { kind: "world", key: `w:${id}`, ind } };
};
const climateTile = (id: string, label: string): Tile | null => {
  const c = climateOf(id);
  if (!c) return null;
  return {
    label,
    value: `${c.id === "warming" && c.value > 0 ? "+" : ""}${c.value}${c.unit.startsWith("°") ? "" : " "}${c.unit}`,
    sub: c.period,
    d: climateDelta(c),
    fig: { kind: "climate", key: `c:${id}`, c },
  };
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
      "Who we are and how we live: how many of us there are, how old and where; health, from birth to old age; food; schooling; and the basics of modern life at home - clean water, sanitation and hygiene - with the gap between women and men in paid work.",
    summary: () =>
      `${pctOf("urban")} of people live in cities and ${pctOf("literacy")} of adults can read (${lastOf("literacy")[0]}). A newborn can expect to live ${lastOf("lifeExpectancy")[1]} years (${lastOf("lifeExpectancy")[0]}), and ${pctOf("undernourished")} of people do not get enough to eat (${lastOf("undernourished")[0]}).`,
    tiles: () => [
      worldTile("urban", "Live in cities"),
      worldTile("literacy", "Adults who can read"),
      worldTile("lifeExpectancy", "Life expectancy"),
      worldTile("childMortality", "Deaths before age 5"),
      worldTile("undernourished", "Undernourished"),
      worldTile("water", "Safe drinking water"),
    ],
    groups: [
      {
        title: "People",
        intro: "How many of us there are, how fast that is changing, how young and old we are, and where people live.",
        ids: ["population", "popGrowth", "fertility", "under15", "aged65", "urban", "migrantShare"],
      },
      {
        title: "Health",
        intro: "How long people live, how many mothers and children survive, vaccination and HIV, deaths by suicide and on the roads, and what is spent on care (WHO, UNICEF, UNAIDS).",
        ids: ["lifeExpectancy", "childMortality", "maternalMortality", "measles", "hiv", "suicide", "roadDeaths", "healthSpend"],
      },
      {
        title: "Food",
        intro: "Whether people have enough to eat, and how many children are stunted by undernourishment (FAO, UNICEF, WHO).",
        ids: ["undernourished", "foodInsecure", "stunting"],
      },
      {
        title: "Education",
        intro: "Who can read, who finishes school, who goes on to university, and what governments spend on it.",
        ids: ["literacy", "primaryCompletion", "lowerSecondary", "tertiaryEnrol", "schoolingYears", "eduSpend"],
      },
      {
        title: "Access & equality",
        intro: "The basics of modern life at home - safe water, sanitation, somewhere to wash hands - and the gap between women and men in paid work.",
        ids: ["water", "sanitation", "handwashing", "workGap"],
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
      "The world economy: its size, growth and prices; who works and who cannot find work; what it saves and invests, and what migrants send home; what governments and developing countries owe and how open it is to trade; and poverty at the World Bank's three lines.",
    summary: () =>
      `The world produced ${usd("gdp")} in ${lastOf("gdp")[0]}, growing ${pctOf("gdpGrowth", 2)} after inflation, while prices rose ${pctOf("inflation", 2)} and ${pctOf("unemployment", 2)} of the labour force was out of work. Governments owe ${pctOf("govDebt")} of world GDP, and ${pctOf("extremePoverty")} of people live on less than $3 a day (${lastOf("extremePoverty")[0]}).`,
    tiles: () => [
      worldTile("gdp", "World GDP"),
      worldTile("gdpGrowth", "Real growth"),
      worldTile("inflation", "Inflation"),
      worldTile("unemployment", "Unemployment"),
      worldTile("govDebt", "Government debt"),
      worldTile("extremePoverty", "Extreme poverty"),
    ],
    groups: [
      {
        title: "Output & prices",
        intro: "The size of the world economy, how fast it grows, and what is happening to prices.",
        ids: ["gdp", "gdpGrowth", "inflation"],
      },
      {
        title: "Jobs",
        intro: "Who is working or looking for work, and how many - young people above all - cannot find it (ILO modelled estimates).",
        ids: ["unemployment", "youthUnemployment", "labourForce"],
      },
      {
        title: "Saving, investment & money",
        intro: "What the world saves and invests, what its listed companies are worth, and what people working abroad send home.",
        ids: ["savings", "investment", "marketCap", "remittances"],
      },
      {
        title: "Debt & openness",
        intro: "What governments (IMF) and developing countries (World Bank) owe, and how much crosses borders.",
        ids: ["govDebt", "extDebt", "trade", "fdi"],
        extras: { extDebt: `${usd("extDebtUsd")} in ${lastOf("extDebtUsd")[0]}` },
      },
      {
        title: "Poverty",
        intro: "The World Bank's three lines: extreme poverty at $3.00 a day, and the lines typical of lower-middle ($4.20) and upper-middle-income ($8.30) countries.",
        ids: ["extremePoverty", "poverty420", "poverty830"],
      },
    ],
  },
  {
    id: "development",
    title: "Development",
    kicker: "How far the world has modernised",
    color: "#84cc16",
    icon: <TrendUp size={18} weight="fill" />,
    description:
      "Development and modernisation: human development and output per person; the shift of work and output from the land to services, and from vulnerable work to wages; bank accounts and air travel - and how the world divides between developed and developing countries. Industry and energy have pillars of their own.",
    summary: () =>
      `The world's Human Development Index was ${fmt(WORLD.hdi, lastOf("hdi")[1])} in ${lastOf("hdi")[0]} (UNDP), and output per person came to ${fmt(WORLD.gdpPerCapitaPpp, lastOf("gdpPerCapitaPpp")[1])} in ${lastOf("gdpPerCapitaPpp")[0]}, at 2021 prices and purchasing power. ${pctOf("agEmployment")} of workers are in farming and ${pctOf("wageWorkers")} are paid a wage or salary (${lastOf("wageWorkers")[0]}), and ${pctOf("accounts")} of adults have a bank or mobile-money account (${lastOf("accounts")[0]}).`,
    tiles: () => [
      worldTile("hdi", "Human development"),
      worldTile("gdpPerCapitaPpp", "Output per person"),
      worldTile("agEmployment", "Working in farming"),
      worldTile("wageWorkers", "Wage and salary work"),
      worldTile("vulnerableWork", "In vulnerable work"),
      worldTile("accounts", "Have an account"),
    ],
    groups: [
      {
        title: "Human development",
        intro: "UNDP's index of health, education and living standards, and what the world produces per person at purchasing power.",
        ids: ["hdi", "gdpPerCapitaPpp"],
      },
      {
        title: "Work",
        intro: "How many of the world's workers are in farming and in services (industry's share is under Industry), how many are paid a wage or salary, and how many are in vulnerable work (ILO modelled estimates).",
        ids: ["agEmployment", "servicesEmployment", "wageWorkers", "vulnerableWork"],
      },
      {
        title: "Money & mobility",
        intro: "Who has a bank or mobile-money account (World Bank Global Findex), and how many people fly (ICAO).",
        ids: ["accounts", "airPassengers"],
      },
      {
        title: "Output",
        intro: "How much of what the world produces comes from farming and from services (industry's share is under Industry).",
        ids: ["agricultureVA", "servicesVA"],
      },
    ],
  },
  {
    id: "industry",
    title: "Industry",
    kicker: "What the world makes, mines and grows",
    color: "#b45309",
    icon: <Factory size={18} weight="fill" />,
    description:
      "The world's industry: what industry and manufacturing add to output and how many people they employ; how much of what the world exports is manufactured; what it earns from oil, gas, coal and minerals; and the grain it harvests, how much from each hectare, and the fertilizer it uses.",
    summary: () =>
      `Manufacturing added ${usd("manufacturingUsd")} to the world's output in ${lastOf("manufacturingUsd")[0]} - ${pctOf("manufacturingVA")} of GDP - and industry as a whole, construction and utilities included, ${pctOf("industryVA")} (${lastOf("industryVA")[0]}). ${pctOf("industryEmployment")} of the world's workers are in industry (${lastOf("industryEmployment")[0]}), and manufactured goods make up ${pctOf("manufacturesExports")} of goods exported (${lastOf("manufacturesExports")[0]}). The world harvested ${compact(lastOf("cerealProduction")[1])} tonnes of cereals in ${lastOf("cerealProduction")[0]}.`,
    tiles: () => [
      worldTile("manufacturingUsd", "Manufacturing value"),
      worldTile("manufacturingVA", "Manufacturing share"),
      worldTile("industryVA", "Industry's share"),
      worldTile("industryEmployment", "Working in industry"),
      worldTile("manufacturesExports", "Manufactured exports"),
      worldTile("cerealProduction", "Cereal harvest"),
    ],
    groups: [
      {
        title: "Industry & manufacturing",
        intro: "What industry and manufacturing add to the world's output, how many people work in industry (ILO), and how much of what the world exports is manufactured (UN Comtrade).",
        ids: ["manufacturingUsd", "manufacturingVA", "industryVA", "industryEmployment", "manufacturesExports"],
      },
      {
        title: "Mining & resources",
        intro: "What the world earns from its oil, gas, coal and minerals above the cost of extracting them, as a share of output (World Bank; last published for 2021).",
        ids: ["resourceRents", "oilRents", "gasRents", "coalRents", "mineralRents"],
      },
      {
        title: "Farm output",
        intro: "The grain the world harvests, how much from each hectare, and the fertilizer it uses (FAO).",
        ids: ["cerealProduction", "cerealYield", "fertilizer"],
      },
    ],
  },
  {
    id: "energy",
    title: "Energy",
    kicker: "How the world is powered",
    color: "#eab308",
    icon: <Lightning size={18} weight="fill" />,
    description:
      "How the world is powered: who has electricity and cooks with clean fuels; how much energy and electricity the world uses, and how much energy each dollar of output takes; where its energy and electricity come from - fossil fuels, nuclear and renewables; and how much oil, gas and coal it produces.",
    summary: () =>
      `${pctOf("electricity")} of people have electricity and ${pctOf("cleanCooking")} cook with clean fuels (${lastOf("cleanCooking")[0]}). The world used ${lastOf("energySupply")[1].toLocaleString("en-US")} TWh of energy in ${lastOf("energySupply")[0]}, ${pctOf("fossilShare")} of it from oil, coal and gas; ${pctOf("renewableElectricity")} of its electricity came from renewables and ${pctOf("fossilElectricity")} from fossil fuels (${lastOf("fossilElectricity")[0]}).`,
    tiles: () => [
      worldTile("electricity", "Have electricity"),
      worldTile("cleanCooking", "Clean cooking"),
      worldTile("energySupply", "Energy supply"),
      worldTile("fossilShare", "Fossil fuels' share"),
      worldTile("renewableElectricity", "Renewable electricity"),
      worldTile("energyIntensity", "Energy intensity"),
    ],
    groups: [
      {
        title: "Access",
        intro: "Who has electricity, and who cooks with clean fuels rather than wood, charcoal, dung, coal or kerosene (Tracking SDG 7).",
        ids: ["electricity", "cleanCooking"],
      },
      {
        title: "Use & efficiency",
        intro: "How much energy and electricity the world uses, in all and per person, and how much energy each dollar of output takes (Energy Institute, Ember, IEA).",
        ids: ["energySupply", "energyPerPerson", "electricityGeneration", "electricityPerPerson", "energyIntensity"],
      },
      {
        title: "The mix",
        intro: "Where the world's energy and electricity come from - each opens to its sources - and how much of its final energy is renewable (Energy Institute, Ember, IEA).",
        ids: ["fossilShare", "renewables", "fossilElectricity", "renewableElectricity"],
      },
      {
        title: "Fossil fuel production",
        intro: "The oil, gas and coal the world produces, as energy (Energy Institute).",
        ids: ["oilProduction", "gasProduction", "coalProduction"],
      },
    ],
  },
  {
    id: "technology",
    title: "Technology",
    kicker: "How connected and inventive the world is",
    color: "#06b6d4",
    icon: <Cpu size={18} weight="fill" />,
    description:
      "How far the world is online and how it invents: internet use, mobile, broadband and landline connections and secure servers; what it spends on research, the researchers it has, the science it publishes and the patents it files; and its trade in high-tech and digital goods and services, and in the use of ideas.",
    summary: () =>
      `${pctOf("internet")} of people use the internet, and there are ${lastOf("broadband")[1]} fixed broadband connections for every 100 people (${lastOf("broadband")[0]}). The world puts ${pctOf("research", 2)} of its output into research and development (${lastOf("research")[0]}), and ${compact(lastOf("sciArticles")[1])} scientific articles were published in ${lastOf("sciArticles")[0]}.`,
    tiles: () => [
      worldTile("internet", "Use the internet"),
      worldTile("mobile", "Mobile subscriptions"),
      worldTile("broadband", "Fixed broadband"),
      worldTile("research", "Research spending"),
      worldTile("researchers", "Researchers"),
      worldTile("sciArticles", "Scientific articles"),
    ],
    groups: [
      {
        title: "Connection",
        intro: "Who is online, and the subscriptions and secure servers that carry it (ITU and Netcraft).",
        ids: ["internet", "mobile", "broadband", "landlines", "secureServers"],
      },
      {
        title: "Research & invention",
        intro: "What the world invests in research, the people who do it, the science it publishes and the inventions it files for protection.",
        ids: ["research", "researchers", "sciArticles", "patents"],
      },
      {
        title: "Technology trade",
        intro: "How much of what the world sells is high-tech or digital, and what countries are paid for the use of their ideas.",
        ids: ["highTechExports", "ictGoodsExports", "ictServiceExports", "ipReceipts"],
      },
    ],
  },
  {
    id: "politics",
    title: "Politics",
    kicker: "How the world is governed",
    color: "#8b5cf6",
    icon: <Bank size={18} weight="fill" />,
    description: "How the world is governed: how many people live in democracies, the five kinds of democracy V-Dem measures - electoral, liberal, participatory, deliberative and egalitarian - women's place in politics, and the blocs countries have joined.",
    summary: () => {
      const f = freedomSplit();
      return `${pctOf("democracyShare")} of people live in a democracy (V-Dem, ${lastOf("democracyShare")[0]}) and ${f.freeShare.toFixed(1)}% in a country Freedom House rates Free (${f.year}). Women hold ${pctOf("womenParliament")} of the seats in national parliaments (${lastOf("womenParliament")[0]}).`;
    },
    tiles: () => {
      const f = freedomSplit();
      return [
        worldTile("democracyShare", "Live in a democracy"),
        {
          label: "Live in a Free country",
          value: `${f.freeShare.toFixed(1)}%`,
          sub: `Freedom House · ${f.year}`,
          d: null,
          summary: `Freedom House rates ${f.counts.F} of the ${f.counts.F + f.counts.PF + f.counts.NF} countries and territories it scores Free. With each one's latest population on this site, they hold ${f.freeShare.toFixed(1)}% of the people in all of them.`,
        },
        {
          label: "Live in a Not Free country",
          value: `${f.notFreeShare.toFixed(1)}%`,
          sub: `Freedom House · ${f.year}`,
          d: null,
          summary: `${f.counts.NF} are rated Not Free, holding ${f.notFreeShare.toFixed(1)}% of those people; the other ${f.counts.PF} are Partly Free.`,
        },
        worldTile("electoralDemocracy", "Electoral democracy"),
        worldTile("womenParliament", "Women in parliament"),
        worldTile("womenEmpowerment", "Women's empowerment"),
      ];
    },
    groups: [
      {
        title: "Democracy",
        intro:
          "How free people are to choose their governments: Freedom House's status for every country, and V-Dem's five kinds of democracy, averaged across the world's people.",
        ids: ["democracyShare", "electoralDemocracy", "liberalDemocracy", "participatoryDemocracy", "deliberativeDemocracy", "egalitarianDemocracy"],
        freedom: true,
      },
      {
        title: "Representation",
        intro: "Whether women are represented in politics: their share of the seats in parliament, and V-Dem's measure of their political empowerment.",
        ids: ["womenParliament", "womenEmpowerment"],
      },
    ],
  },
  {
    id: "civic",
    title: "Civic",
    kicker: "Rights, justice and freedom",
    color: "#3b82f6",
    icon: <Scales size={18} weight="fill" />,
    description:
      "The rights and freedoms people have in practice: freedom from torture and political killing, civil liberties for everyone and for women, equality before the law and access to justice, and the freedom to speak, organise and be heard through civil society - as V-Dem's experts rate them, averaged across the world's people.",
    summary: () => {
      const ids = PILLARS.find((p) => p.id === "civic")!.groups.flatMap((g) => g.ids);
      const lower = ids.filter((id) => delta(WORLD[id])?.dir === "down").length;
      return `Averaged across the world's people, V-Dem scores civil liberties at ${fmt(WORLD.civilLiberties, lastOf("civilLiberties")[1])} out of 1, freedom from torture and political killing at ${fmt(WORLD.physicalIntegrity, lastOf("physicalIntegrity")[1])}, equality before the law at ${fmt(WORLD.equalityBeforeLaw, lastOf("equalityBeforeLaw")[1])} and freedom of expression at ${fmt(WORLD.freeExpression, lastOf("freeExpression")[1])} (${lastOf("civilLiberties")[0]}). ${howManyLower(lower, ids.length)}`;
    },
    tiles: () => [
      worldTile("civilLiberties", "Civil liberties"),
      worldTile("physicalIntegrity", "Free from torture"),
      worldTile("equalityBeforeLaw", "Equality before law"),
      worldTile("womenCivilLiberties", "Women's liberties"),
      worldTile("freeExpression", "Free expression"),
      worldTile("freeAssociation", "Free association"),
    ],
    groups: [
      {
        title: "Rights",
        intro: "Whether people are safe from the state and free to live their lives - women included (V-Dem, averaged across the world's people; 1 is most free).",
        ids: ["civilLiberties", "physicalIntegrity", "womenCivilLiberties"],
      },
      {
        title: "Justice",
        intro: "Whether laws are clear and applied alike, people can get justice and own property, and are free to move and worship and from forced labour.",
        ids: ["equalityBeforeLaw", "privateLiberties"],
      },
      {
        title: "Freedom to speak & organise",
        intro: "Whether people can speak and publish freely, parties, the opposition and civil society groups can form and work, and civil society is heard.",
        ids: ["freeExpression", "freeAssociation", "politicalLiberties", "civilSociety"],
      },
    ],
  },
  {
    id: "institutions",
    title: "Institutions",
    kicker: "How states work and answer for power",
    color: "#ec4899",
    icon: <Buildings size={18} weight="fill" />,
    description:
      "Whether power answers to the law: the rule of law, and how far courts and legislatures check the executive, as V-Dem measures them across the world's people - and what states raise and spend.",
    summary: () =>
      `Averaged across the world's people, V-Dem scores the rule of law at ${fmt(WORLD.ruleOfLaw, lastOf("ruleOfLaw")[1])} out of 1, the courts' check on the executive at ${fmt(WORLD.judicialConstraints, lastOf("judicialConstraints")[1])} and the legislature's at ${fmt(WORLD.legislativeConstraints, lastOf("legislativeConstraints")[1])} (${lastOf("ruleOfLaw")[0]}). Tax revenue comes to ${pctOf("taxRevenue")} of GDP (${lastOf("taxRevenue")[0]}).`,
    tiles: () => [
      worldTile("ruleOfLaw", "Rule of law"),
      worldTile("judicialConstraints", "Courts' check"),
      worldTile("legislativeConstraints", "Legislature's check"),
      worldTile("taxRevenue", "Tax revenue"),
      worldTile("govRevenue", "Government revenue"),
    ],
    groups: [
      {
        title: "Law & checks on power",
        intro: "Whether government obeys the law and answers to courts and legislatures (V-Dem, averaged across the world's people; 1 is strongest).",
        ids: ["ruleOfLaw", "judicialConstraints", "legislativeConstraints"],
      },
      {
        title: "What states raise & spend",
        intro: "What governments collect and what they spend (IMF Government Finance Statistics).",
        ids: ["taxRevenue", "govRevenue", "govExpense"],
      },
    ],
  },
  {
    id: "ideology",
    title: "Ideology",
    kicker: "What people believe, and how freely they think",
    color: "#f97316",
    icon: <Lightbulb size={18} weight="fill" />,
    description:
      "What the world believes and how it thinks: its religions, as Pew Research Center counts them; how freely scholars can work; and how far societies are split into hostile political camps.",
    summary: () => {
      const p = delta(WORLD.polarization);
      return `In 2020, ${pctOf("christians")} of people were Christian, ${pctOf("muslims")} Muslim and ${pctOf("unaffiliated")} had no religion (Pew). Averaged across the world's people, academic freedom scores ${fmt(WORLD.academicFreedom, lastOf("academicFreedom")[1])} out of 1 (${lastOf("academicFreedom")[0]})${
        p && p.dir !== "flat" ? `, and the average person lives in a society ${p.dir === "up" ? "more" : "less"} split into hostile political camps than ten years before (V-Dem)` : ""
      }.`;
    },
    tiles: () => [
      worldTile("christians", "Christians"),
      worldTile("muslims", "Muslims"),
      worldTile("unaffiliated", "No religion"),
      worldTile("hindus", "Hindus"),
      worldTile("academicFreedom", "Academic freedom"),
      worldTile("polarization", "Polarization"),
    ],
    groups: [
      {
        title: "Religion",
        intro: "The world's religious makeup in 2020, and how each group's share changed from 2010, as Pew Research Center puts it.",
        ids: ["christians", "muslims", "unaffiliated", "hindus", "buddhists", "jews", "otherReligions"],
      },
      {
        title: "Ideas & division",
        intro: "How freely scholars can research, teach and speak, and how far societies split into hostile political camps (V-Dem, averaged across the world's people).",
        ids: ["academicFreedom", "polarization"],
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    kicker: "War, weapons, terror and crime",
    color: "#94a3b8",
    icon: <ShieldWarning size={18} weight="fill" />,
    description:
      "How safe the world is: armed conflict, the people it kills and drives from home, what countries spend on arms and how much of their budgets it takes, the forces and weapons they keep and trade, nuclear arsenals, terrorism and murder.",
    summary: () => {
      const ds = displacedShare();
      return `${lastOf("conflicts")[1]} armed conflicts involved a government in ${lastOf("conflicts")[0]}, and ${compact(lastOf("conflictDeaths")[1])} people died in armed conflict; ${compact(lastOf("displaced")[1])} people - ${ds.series[ds.series.length - 1][1].toFixed(2)}% of everyone - were forcibly displaced (${lastOf("displaced")[0]}). Countries spent ${pctOf("militaryGdp", 2)} of world GDP on their armed forces (${lastOf("militaryGdp")[0]}), and an estimated ${lastOf("nuclearWarheads")[1].toLocaleString("en-US")} nuclear warheads existed in ${lastOf("nuclearWarheads")[0]}.`;
    },
    tiles: () => {
      const ds = displacedShare();
      const [dy, dv] = ds.series[ds.series.length - 1];
      return [
        worldTile("conflicts", "Armed conflicts"),
        worldTile("conflictDeaths", "Conflict deaths"),
        { label: "Forcibly displaced", value: `${dv.toFixed(2)}%`, sub: `of all people · ${dy}`, d: delta(ds), fig: { kind: "world", key: "w:displacedShare", ind: ds } },
        worldTile("militaryGdp", "Military spending"),
        worldTile("nuclearWarheads", "Nuclear warheads"),
        worldTile("homicide", "Homicide rate"),
      ];
    },
    groups: [
      {
        title: "War & peace",
        intro: "Armed conflict (Uppsala Conflict Data Program), and the people it drives from home (UNHCR).",
        ids: ["conflicts", "conflictDeaths", "displaced"],
      },
      {
        title: "Arms",
        intro: "What the world spends on its armed forces and how many serve (IISS), the weapons it trades (SIPRI), and its nuclear warheads (Federation of American Scientists).",
        ids: ["militaryGdp", "militaryShare", "armedForces", "armsTransfers", "nuclearWarheads"],
        extras: {
          militaryGdp: `${usd("militaryUsd")} in ${lastOf("militaryUsd")[0]}`,
          armedForces: `${pctOf("armedForcesShare", 2)} of the labour force`,
        },
      },
      {
        title: "Terrorism & crime",
        intro: "Attacks and deaths recorded by the Global Terrorism Database, whose public release ends in 2021, and the murder rate.",
        ids: ["terrorAttacks", "terrorDeaths", "homicide"],
      },
    ],
  },
  {
    id: "ecology",
    title: "Ecology",
    kicker: "The state of the planet",
    color: "#14b8a6",
    icon: <Leaf size={18} weight="fill" />,
    description: `The planet as the agencies that measure it last read it (retrieved ${CLIMATE_RETRIEVED}) - temperature and the gases that drive it, Arctic ice - then what people emit, in all and each, the air they breathe and the water they draw, how the land and sea are used and protected, and the toll of natural disasters. Renewable energy is under Energy.`,
    summary: () => {
      const w = climateOf("warming");
      const c = climateOf("co2");
      return `${w ? `The surface was ${w.value} °C warmer than its 1951-1980 average in ${w.period}` : "Surface temperature is shown below"}${c ? `, with carbon dioxide at ${c.value} ppm (${c.period})` : ""}. People released ${compact(lastOf("ghg")[1] * 1e6)} tonnes of greenhouse gases in ${lastOf("ghg")[0]}. Forests cover ${lastOf("forest")[1].toFixed(1)}% of the land (${lastOf("forest")[0]}), and ${pctOf("protectedLand")} of it is protected (${lastOf("protectedLand")[0]}).`;
    },
    tiles: () =>
      [
        climateTile("warming", "Warming"),
        climateTile("co2", "Carbon dioxide"),
        worldTile("ghg", "Greenhouse gases"),
        worldTile("pm25", "Air pollution"),
        worldTile("forest", "Forest cover"),
        climateTile("sea-ice", "Arctic sea ice"),
      ].filter((t): t is Tile => t !== null),
    groups: [
      {
        title: "Atmosphere",
        intro: "The latest readings from NASA and NOAA, each against the same month or year a decade earlier.",
        ids: [],
        climate: ["warming", "co2", "ch4", "n2o", "aggi"],
      },
      {
        title: "Emissions",
        intro: "What people release into the air each year, in all and per person.",
        ids: ["co2", "co2PerPerson", "methane", "ghg"],
      },
      {
        title: "Air & water",
        intro: "The fine-particle pollution the average person breathes, and how much fresh water the world draws.",
        ids: ["pm25", "waterWithdrawals"],
      },
      {
        title: "Land, sea & ice",
        intro: "How much of the land is forest and farmland, how much land and sea is protected, and how much of the Arctic Ocean stays frozen at summer's end.",
        ids: ["forest", "farmland", "protectedLand", "protectedSea"],
        climate: ["sea-ice"],
      },
      {
        title: "Disasters",
        intro: "The people natural disasters kill (EM-DAT) and drive from their homes (Internal Displacement Monitoring Centre).",
        ids: ["disasterDeaths", "disasterDisplacement"],
      },
    ],
  },
];

/** The page's nav: the overview, each pillar - each its own section, one to a row - and the rankings. */
const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  ...PILLARS.map((p) => ({ id: p.id, label: p.title })),
  { id: "rankings", label: "Rankings" },
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

/**
 * The measures that improved and worsened over about ten years, by name,
 * where the direction is not a matter of opinion; each opens its figure.
 * With `max`, each list shows that many and a "+N more" that opens the rest.
 */
function ChangeLists({ figures, onPick, max, onMore }: { figures: Figure[]; onPick: (f: Figure) => void; max?: number; onMore?: () => void }) {
  const judged = figures.map((f) => ({ f, v: deltaOf(f)?.verdict ?? null }));
  const rows = [
    { key: "better", title: "Improved", Icon: ArrowUpRight, tone: BETTER, list: judged.filter((x) => x.v === "better").map((x) => x.f) },
    { key: "worse", title: "Worsened", Icon: ArrowDownRight, tone: WORSE, list: judged.filter((x) => x.v === "worse").map((x) => x.f) },
  ].filter((r) => r.list.length);
  if (!rows.length) return null;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const shown = max ? r.list.slice(0, max) : r.list;
        const rest = r.list.length - shown.length;
        return (
          <div key={r.key}>
            <p className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest mb-1.5 ${r.tone}`}>
              <r.Icon size={10} weight="bold" aria-hidden />
              {r.title} over about ten years · {r.list.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {shown.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onPick(f)}
                  aria-haspopup="dialog"
                  title={deltaOf(f)?.text}
                  className="text-[10px] font-sans px-2 py-0.5 rounded-full border border-border text-foreground/85 hover:text-foreground hover:bg-muted/60 cursor-pointer transition-colors"
                >
                  {labelOf(f)}
                </button>
              ))}
              {rest > 0 && onMore && (
                <button
                  type="button"
                  onClick={onMore}
                  aria-haspopup="dialog"
                  className="text-[10px] font-sans px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  +{rest} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A pillar, as its own section of the page: what it covers, six of its
 * figures as tiles (each opening its window), what the figures say
 * together, which measures got better or worse, and where the figures come
 * from. "Open" shows every figure of the pillar in a window.
 */
function PillarCard({ p }: { p: Pillar }) {
  const { card, head, muted } = useLook();
  const open = useContext(OpenWorldview);
  const tiles = p.tiles();
  const figures = p.groups.flatMap(groupFigures);
  const sources = [...publishers(figures), ...(p.groups.some((g) => g.freedom) ? ["Freedom House"] : [])];
  return (
    <section
      id={p.id}
      aria-labelledby={`${p.id}-title`}
      className="scroll-mt-36 rounded-2xl p-5 flex flex-col gap-4"
      style={{ ...card, boxShadow: `inset 3px 0 0 0 ${p.color}, ${card.boxShadow}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: p.color + "18", border: `1px solid ${p.color}40`, color: p.color }}
        >
          {p.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 id={`${p.id}-title`} className="text-base font-bold font-sans" style={{ color: head }}>
            {p.title}
          </h3>
          <p className="text-[11px] font-sans" style={{ color: muted }}>
            {p.kicker}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: p.color + "18", color: p.color }}>
          {figures.length} figures · {latestSpan(figures)}
        </span>
      </div>
      <p className="text-[11px] font-sans leading-relaxed -mt-1 max-w-4xl" style={{ color: muted }}>
        {p.description}
      </p>
      {/* The pillar runs the page's width, so its figures sit up to three to a row, each wide, its trend running across it. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {tiles.map((t) => {
          return t.fig ? (
            <FigureTile key={t.label} f={t.fig} label={t.label} onClick={() => open(p, t.fig)} />
          ) : (
            <div key={t.label} className="rounded-xl modal-tile px-3 py-2.5 flex flex-col gap-0.5">
              <p className="text-[10px] font-sans uppercase tracking-wider leading-snug" style={{ color: muted }}>
                {t.label}
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono leading-tight" style={{ color: head }}>
                {t.value}
              </p>
              <p className="text-[10px] font-mono leading-snug" style={{ color: muted }}>
                {t.sub}
              </p>
              {t.d && <DeltaLine d={t.d} small />}
              <TileSummary story={t.summary} />
            </div>
          );
        })}
      </div>
      <p className="text-xs font-sans leading-relaxed text-foreground/85 max-w-4xl">{p.summary()}</p>
      <div className="max-w-xl">
        <DirectionBar p={p} />
      </div>
      <ChangeLists figures={figures} onPick={(f) => open(p, f)} max={6} onMore={() => open(p)} />
      <p className="text-[10px] font-sans leading-snug" style={{ color: muted }}>
        Sources: {sources.join(" · ")}.
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => open(p)}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold font-sans cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: p.color + "1f", color: p.color, border: `1px solid ${p.color}55` }}
        >
          <ArrowsOut size={12} weight="bold" /> Open {p.title.toLowerCase()}
        </button>
      </div>
    </section>
  );
}

// ── One figure, as a tile ───────────────────────────────────────────────────

/** A figure's latest value, as its tile shows it. */
function valueOf(f: Figure): string {
  if (f.kind === "world") return fmt(f.ind, f.ind.series[f.ind.series.length - 1][1]);
  return `${f.c.id === "warming" && f.c.value > 0 ? "+" : ""}${f.c.value}`;
}
/** Its unit and year, and anything the group adds ("$2.65 trillion in 2024"). */
function subOf(f: Figure): string {
  if (f.kind === "world") return `${unitOf(f.ind)} · ${f.ind.series[f.ind.series.length - 1][0]}${f.extra ? ` · ${f.extra}` : ""}`;
  return `${f.c.unit} · ${f.c.period}`;
}

/** A tile's summary: what the figure measures, then what its numbers show. */
function TileSummary({ about, story }: { about?: string; story?: string }) {
  const { muted } = useLook();
  if (!about && !story) return null;
  return (
    <span className="block mt-1.5 text-[11px] font-sans leading-snug">
      {about && <span style={{ color: muted }}>{about} </span>}
      {story && <span className="text-foreground/85">{story}</span>}
    </span>
  );
}

/** "Up 16 since 1990, when it was 49.": the move across a whole series, in its own terms. */
function changeSince(ind: WorldIndicator): string {
  const s = ind.series;
  const [y0, v0] = s[0];
  const v1 = s[s.length - 1][1];
  if (v1 === v0) return `The same as in ${y0}.`;
  const diff = Math.abs(v1 - v0);
  let amount: string;
  // Counts, money and large numbers move in percent; shares in points; the rest in their own units.
  if ((ind.format === "count" || ind.format === "usd" || (ind.format === "num" && Math.abs(v0) >= 1000)) && v0 !== 0) {
    const pct = (100 * diff) / Math.abs(v0);
    amount = `${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}%`;
  } else if (ind.format === "pct") amount = `${diff.toFixed(ind.dp)} points`;
  else amount = `${diff.toLocaleString("en-US", { maximumFractionDigits: ind.dp })}${ind.unit === "years" ? " years" : ""}`;
  return `${v1 > v0 ? "Up" : "Down"} ${amount} since ${y0}, when it was ${fmt(ind, v0)}.`;
}

/**
 * A figure's story in a sentence or two, worked out from its own series:
 * how far it has moved since the series begins, and where it stands against
 * its highest and lowest. Nothing is said that its numbers do not show.
 */
function storyOf(f: Figure): string {
  if (f.kind === "climate") {
    const c = f.c;
    return c.decadeAgo !== null
      ? `${valueOf(f)} ${c.unit} in ${c.period}, against ${c.decadeAgo} ${c.unit} ten years before.`
      : `${valueOf(f)} ${c.unit} in ${c.period}.`;
  }
  const ind = f.ind;
  const s = ind.series;
  if (ind.stated)
    return `Pew Research Center's estimate for ${s[s.length - 1][0]}, from censuses and surveys${ind.stated.dir === "flat" ? "; the share held steady from 2010" : ""}.`;
  if (s.length < 2) return "";
  const since = changeSince(ind);
  if (s.length < 3) return since;
  const [y0, v0] = s[0];
  const [y1, v1] = s[s.length - 1];
  const hi = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lo = s.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (hi[1] === lo[1]) return since;
  // An earlier year with the same value: the latest is level with it, not beyond it.
  const tie = (v: number) => s.find(([y, x]) => x === v && y !== y1)?.[0];
  const extreme = (word: "highest" | "lowest") => {
    const t = tie(v1);
    if (t === undefined) return `the ${word} of any year since ${y0}`;
    // "The same as in 1990" has already said so.
    return t === y0 && v1 === v0 ? null : `level with its ${word}, in ${t}`;
  };
  const parts: string[] = [];
  if (v1 >= hi[1]) parts.push(extreme("highest") ?? "");
  else if (hi[0] !== y0) parts.push(`it peaked at ${fmt(ind, hi[1])} in ${hi[0]}`);
  if (v1 <= lo[1]) parts.push(extreme("lowest") ?? "");
  else if (lo[0] !== y0) parts.push(`its low was ${fmt(ind, lo[1])} in ${lo[0]}`);
  parts.splice(0, parts.length, ...parts.filter(Boolean));
  if (!parts.length) return since;
  const tail = parts.join("; ");
  return `${since} ${tail[0].toUpperCase()}${tail.slice(1)}.`;
}

/**
 * A figure as a tile, as the site's other pages show figures: what it is,
 * its value, its unit and year, its direction over about ten years, a
 * summary - what it measures and what its series shows - and its trend.
 * Picking it opens its window.
 */
function FigureTile({
  f,
  onClick,
  label,
}: {
  f: Figure;
  onClick: () => void;
  /** A shorter name, for a pillar's card. */
  label?: string;
}) {
  const { head, muted } = useLook();
  const d = deltaOf(f);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      title={aboutOf(f)}
      className="modal-tile h-full w-full rounded-xl px-3 py-2.5 flex flex-col gap-0.5 text-left cursor-pointer transition-colors"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-sans uppercase tracking-wider leading-snug" style={{ color: muted }}>
          {label ?? labelOf(f)}
        </span>
        <ArrowsOut size={10} weight="bold" className="shrink-0 mt-0.5" style={{ color: muted }} aria-hidden />
      </span>
      <span className="text-lg sm:text-xl font-bold font-mono leading-tight" style={{ color: head }}>
        {valueOf(f)}
      </span>
      <span className="text-[10px] font-mono leading-snug" style={{ color: muted }}>
        {subOf(f)}
      </span>
      {d && <DeltaLine d={d} small />}
      <TileSummary about={aboutOf(f)} story={storyOf(f)} />
      {f.kind === "world" && f.ind.series.length > 2 && (
        <span className="mt-auto block w-full pt-2">
          <TileTrend series={f.ind.series} />
        </span>
      )}
    </button>
  );
}

// ── The pop-up window ───────────────────────────────────────────────────────

/** What the window shows: a pillar's figures, or one figure of it. */
type ModalState = { pillar: Pillar; figure: Figure | null };
/** Opens the window at a pillar, or at one of its figures. */
const OpenWorldview = createContext<(pillar: Pillar, figure?: Figure) => void>(() => {});

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">{children}</p>;
}

/**
 * A figure's key facts, worked out from its own series: the latest, ten
 * years before, the change, the highest and lowest, and the years covered.
 */
function factsOf(f: Figure): { label: string; value: string; sub?: string }[] {
  const d = deltaOf(f);
  const change = d ? [{ label: f.kind === "world" && f.ind.stated ? "Change, in the source's words" : "Change", value: d.text, sub: d.verdict ?? undefined }] : [];
  if (f.kind === "climate") {
    const c = f.c;
    return [
      { label: "Latest", value: `${valueOf(f)} ${c.unit}`, sub: c.period },
      ...(c.decadeAgo !== null ? [{ label: "Ten years before", value: `${c.decadeAgo} ${c.unit}` }] : []),
      ...change,
    ];
  }
  const ind = f.ind;
  const s = ind.series;
  const [ly, lv] = s[s.length - 1];
  const prev = ind.stated ? null : decadeBefore(s);
  const out: { label: string; value: string; sub?: string }[] = [{ label: "Latest", value: fmt(ind, lv), sub: `${unitOf(ind)} · ${ly}` }];
  if (prev) out.push({ label: "Ten years before", value: fmt(ind, prev[1]), sub: `${prev[0]}` });
  out.push(...change);
  if (s.length > 2) {
    const hi = s.reduce((a, b) => (b[1] > a[1] ? b : a));
    const lo = s.reduce((a, b) => (b[1] < a[1] ? b : a));
    out.push({ label: "Highest", value: fmt(ind, hi[1]), sub: `${hi[0]}` }, { label: "Lowest", value: fmt(ind, lo[1]), sub: `${lo[0]}` });
  }
  if (s.length > 1) out.push({ label: "Years covered", value: `${s[0][0]}–${ly}`, sub: `${s.length} data points` });
  return out;
}

/** One figure in full: what it measures, its key facts, its trend, its parts, its note, every year, and its source. */
function FigureView({ f }: { f: Figure }) {
  const about = aboutOf(f);
  const note = f.kind === "world" ? f.ind.note : f.c.note;
  return (
    <>
      {about && <p className="text-[13px] font-sans leading-relaxed text-muted-foreground mt-5">{about}</p>}
      <SectionLabel>At a glance</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {factsOf(f).map((x) => (
          <div key={x.label} className="modal-tile rounded-xl p-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{x.label}</p>
            <p className="text-sm font-bold font-mono text-foreground leading-tight">{x.value}</p>
            {x.sub && <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{x.sub}</p>}
          </div>
        ))}
      </div>
      {f.kind === "world" && f.ind.series.length > 2 && (
        <>
          <SectionLabel>The trend</SectionLabel>
          <div className="modal-tile rounded-xl p-3">
            <Sparkline ind={f.ind} tall />
          </div>
        </>
      )}
      {f.kind === "world" && !!f.ind.breakdown?.length && (
        <div className="modal-tile rounded-xl p-3 mt-6">
          <Breakdown ind={f.ind} />
        </div>
      )}
      {note && (
        <>
          <SectionLabel>About the figure</SectionLabel>
          <p className="modal-tile rounded-xl p-3 text-[11px] font-sans leading-relaxed text-muted-foreground">{note}</p>
        </>
      )}
      {f.kind === "world" && f.ind.series.length > 1 && (
        <>
          <SectionLabel>Every year</SectionLabel>
          <div className="modal-tile rounded-xl p-3">
            <YearGrid ind={f.ind} />
          </div>
        </>
      )}
      <SectionLabel>Source</SectionLabel>
      <SourceLink source={sourceOf(f)} />
    </>
  );
}

/** The panel a pillar's window opens with, where it has one. */
function PillarLead({ id }: { id: Pillar["id"] }) {
  const panel = id === "society" ? <OutOf100 /> : id === "development" ? <DevelopmentPanel /> : id === "politics" ? <BlocShares /> : null;
  return panel && <div className="mt-4">{panel}</div>;
}

/** A pillar in full: what it covers and what its figures say, its panel, then every figure by group, and every figure's source. */
function PillarView({ p, onPick }: { p: Pillar; onPick: (f: Figure) => void }) {
  const all = p.groups.flatMap(groupFigures);
  return (
    <>
      <p className="text-[13px] font-sans leading-relaxed text-muted-foreground mt-5">{p.description}</p>
      <div className="modal-tile rounded-xl p-3 mt-4 space-y-3">
        <p className="text-xs font-sans leading-relaxed text-foreground/90">{p.summary()}</p>
        <DirectionBar p={p} />
        <ChangeLists figures={all} onPick={onPick} />
      </div>
      <PillarLead id={p.id} />
      {p.groups.map((g) => {
        const figs = groupFigures(g);
        return (
          <div key={g.title}>
            <SectionLabel>
              {g.title} · {figs.length} figure{figs.length === 1 ? "" : "s"} · latest {latestSpan(figs)}
            </SectionLabel>
            <p className="text-[11px] font-sans text-muted-foreground -mt-1 mb-2 leading-relaxed">{g.intro}</p>
            {g.freedom && <FreedomBars />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {figs.map((f) => (
                <FigureTile key={f.key} f={f} onClick={() => onPick(f)} />
              ))}
            </div>
          </div>
        );
      })}
      <SectionLabel>Every figure's source</SectionLabel>
      <ul className="space-y-1">
        {all.map((f) => (
          <li key={f.key} className="text-[10px] font-sans text-muted-foreground leading-snug">
            <span className="text-foreground/85">{labelOf(f)}</span> · <SourceLink source={sourceOf(f)} />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The window: a pillar with every figure, or one figure with its detail,
 * moving between them - back to the pillar, and to the figure before or
 * after. The same shape as the site's other windows (scrim, glass panel,
 * a header washed in the pillar's colour, expand and close); Escape closes
 * it, the page behind stays put, and focus returns to what opened it.
 */
function WorldviewModal({ state, onChange, onClose }: { state: ModalState; onChange: (s: ModalState) => void; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const { pillar: p, figure: f } = state;

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      back?.focus?.();
    };
  }, [onClose]);
  // Each view opens at its top.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [p.id, f?.key]);

  const entries = p.groups.flatMap((g) => groupFigures(g).map((fig) => ({ fig, group: g })));
  const all = entries.map((e) => e.fig);
  const at = f ? entries.findIndex((e) => e.fig.key === f.key) : -1;
  const group = at >= 0 ? entries[at].group : null;
  const prev = at > 0 ? entries[at - 1].fig : null;
  const next = at >= 0 && at < entries.length - 1 ? entries[at + 1].fig : null;
  const d = f ? deltaOf(f) : null;
  const go = (figure: Figure | null) => onChange({ pillar: p, figure });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={f ? `${labelOf(f)} - ${p.title}` : `${p.title}: every figure`}
    >
      <div
        ref={panelRef}
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${expanded ? "max-w-full max-h-full m-0" : "max-w-3xl max-h-[90vh]"}`}
      >
        <div className="p-6">
          <div className="relative flex items-start justify-between gap-3 -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(90deg, ${p.color}33, ${p.color}14, ${p.color}26)` }}
            />
            <div className="relative min-w-0">
              {f ? (
                <>
                  <button
                    type="button"
                    onClick={() => go(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-75 cursor-pointer"
                    style={{ color: p.color }}
                  >
                    <ArrowLeft size={11} weight="bold" /> {p.title}
                    {group ? ` · ${group.title}` : ""}
                  </button>
                  <h2 className="text-xl font-bold font-sans text-foreground leading-tight mt-1">{labelOf(f)}</h2>
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="text-lg font-bold font-mono text-foreground">{valueOf(f)}</span>
                    <span className="text-xs font-mono text-muted-foreground">{subOf(f)}</span>
                  </div>
                  {d && (
                    <div className="mt-1">
                      <DeltaLine d={d} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span style={{ color: p.color }}>{p.icon}</span>
                    <h2 className="text-xl font-bold font-sans text-foreground leading-tight">{p.title}</h2>
                  </div>
                  <p className="text-xs font-sans text-muted-foreground mt-1">
                    {p.kicker} · {all.length} figures · latest {latestSpan(all)}
                  </p>
                </>
              )}
            </div>
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label={expanded ? "Collapse the window" : "Expand the window to full screen"}
                title={expanded ? "Collapse" : "Expand to full screen"}
              >
                {expanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {f ? <FigureView f={f} /> : <PillarView p={p} onPick={go} />}

          {f && (prev || next) && (
            <div className="mt-6 pt-3 border-t border-border/40 flex items-start justify-between gap-3">
              {prev ? (
                <button
                  type="button"
                  onClick={() => go(prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans text-muted-foreground hover:text-foreground cursor-pointer text-left"
                >
                  <CaretLeft size={12} weight="bold" className="shrink-0" /> {labelOf(prev)}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => go(next)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans text-muted-foreground hover:text-foreground cursor-pointer text-right"
                >
                  {labelOf(next)} <CaretRight size={12} weight="bold" className="shrink-0" />
                </button>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      </div>
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
      <CardHeader icon={<TrendUp size={16} weight="fill" />} title="Developed & developing" badge="three classifications" color="#84cc16" />
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
/** 1.46B, $30.8T, 342M: the rankings' short units, so three lists fit a row with the names whole. */
function short(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e12) return `${Number((v / 1e12).toPrecision(3))}T`;
  if (a >= 1e9) return `${Number((v / 1e9).toPrecision(3))}B`;
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(3))}M`;
  if (a >= 1e3) return `${Number((v / 1e3).toPrecision(3))}K`;
  return Math.round(v).toLocaleString("en-US");
}
/** As on the Economies page: below $10 billion a year's growth is one project or one bad harvest. */
const GROWTH_FLOOR_BN = 10;

const RANKINGS: RankingDef[] = [
  { id: "pop", pillar: "society", top: "Most people", bottom: "Fewest people", value: (c) => c.population, format: (v) => short(v), year: (c) => yearOfSource(c, "population"), source: "World Bank / UN WPP" },
  { id: "life", pillar: "society", top: "Longest lives", bottom: "Shortest lives", value: (c) => c.lifeExpectancy, format: (v) => `${v.toFixed(1)} yrs`, year: (c) => yearOfSource(c, "lifeExpectancy"), source: "Life expectancy at birth, World Bank / UN" },
  { id: "hdi", pillar: "development", top: "Most developed (HDI)", bottom: "Least developed (HDI)", value: hdiOf, format: (v) => v.toFixed(3), year: (c) => COUNTRY_PANELS[c.id]?.hdi?.y ?? "", source: "UNDP Human Development Index" },
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
    format: (v) => short(v),
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
    format: (v) => `${v.toFixed(2)} trips`,
    year: (c) => String(COUNTRY_FIGURES.tripsAbroad[c.code]?.[0] ?? ""),
    source: "Residents' overnight trips abroad per person, 2019 for every country (UN Tourism; World Bank population)",
    oneYear: true,
  },
  { id: "gdp", pillar: "economy", top: "Largest economies", bottom: "Smallest economies", value: (c) => c.gdp * 1e9, format: (v) => `$${short(v)}`, year: (c) => yearOfSource(c, "gdp"), source: "World Bank / IMF" },
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
    format: (v) => `${v.toFixed(1)}%`,
    year: (c) => LAND_USE[c.id]?.y ?? "",
    source: `Forest as a share of land area, ${LAND_USE_SOURCE.label}`,
  },
  {
    id: "area",
    pillar: "ecology",
    top: "Largest by area",
    bottom: "Smallest by area",
    value: (c) => c.areaKm2,
    format: (v) => `${short(v)} km²`,
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
                <span className={`hidden sm:block w-10 h-1 rounded-full shrink-0 ${ACCENT_TRACK}`} aria-hidden>
                  <span className={`block h-1 rounded-full ${ACCENT_BG}`} style={{ width: `${(100 * Math.abs(v)) / max}%` }} />
                </span>
                <span className="w-20 text-right text-[11px] font-mono shrink-0 whitespace-nowrap" style={{ color: head }}>
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
          {[
            { id: "all" as const, label: "All" },
            // Only the pillars that have rankings.
            ...PILLARS.filter((p) => RANKINGS.some((r) => r.pillar === p.id)).map((p) => ({ id: p.id, label: p.title })),
          ].map((x) => (
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
        {/* Three lists to a row on a desktop, two on a tablet, one on a phone. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
  const [modal, setModal] = useState<ModalState | null>(null);
  const openWindow = useCallback((pillar: Pillar, figure?: Figure) => setModal({ pillar, figure: figure ?? null }), []);
  const closeWindow = useCallback(() => setModal(null), []);
  return (
    <OpenWorldview.Provider value={openWindow}>
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        <Hero />
        <SectionNav label="Worldview sections" sections={SECTIONS} />

        {/* ── Overview: the wheel of the pillars, then the headline figures ── */}
        <section id="overview" className="scroll-mt-36 flex flex-col gap-4">
          <WorldWheel />
          <HeadlinePills />
        </section>

        <HeadlinesBanner
          label="World headlines"
          topics={["world"]}
          days={2}
          untagged
          pick={pickWorld}
          note={(outlets) => (
            <>
              The last two days' headlines naming a country outside the United States (US news is on the States page), from {outlets},
              refreshed every half hour. A violet tag is a story naming more than one country. Each links to the outlet.
            </>
          )}
        />

        {/* ── The pillars: each its own section, one to a row; each card opens its window ── */}
        <div className="px-1 pt-2 flex items-center gap-2">
          <GlobeHemisphereWest size={18} weight="fill" className="text-[#2a78d6] dark:text-[#3987e5]" />
          <h2 className="text-xl font-bold font-sans" style={{ color: head }}>
            The {inWords(PILLARS.length)} pillars
          </h2>
        </div>
        {PILLARS.map((p) => (
          <PillarCard key={p.id} p={p} />
        ))}

        <Rankings />

        <p className="text-[10px] font-sans text-muted-foreground leading-relaxed max-w-4xl px-1">
          Figures retrieved {WORLDVIEW_RETRIEVED} by build-worldview.cjs: the World Bank's world and income-group aggregates (carrying figures
          from the ILO, the IEA, the FAO, the ITU, UNESCO, the US National Science Foundation, UN Comtrade, the IMF, the IISS, SIPRI and
          WHO/UNICEF), the IMF's World Economic Outlook, UCDP, V-Dem, UNDP's Human Development Report, the Energy Institute's Statistical
          Review of World Energy, Ember, EM-DAT and the Federation of American Scientists via Our World in Data, UNHCR, and the UN's World
          Population Prospects; climate readings from NASA and NOAA, retrieved {CLIMATE_RETRIEVED}; religion from Pew Research Center's 2025 report, read
          from it on {PEW_CHECKED}; rankings and the developed / developing split use the figures on each country's page. Arrows compare with
          about ten years earlier - for religion, with 2010, in Pew's own words; "better" and "worse" - and the counts of them - are only given
          where the direction is not a matter of opinion. The share of people displaced is UNHCR's count over the World Bank's population for
          the same year, and the shares in Free and Not Free countries sum the site's population figures by Freedom House status. Open any
          figure for its trend, its full series and its source.
        </p>
      </div>
    </div>
    {modal && <WorldviewModal state={modal} onChange={setModal} onClose={closeWindow} />}
    </OpenWorldview.Provider>
  );
}
