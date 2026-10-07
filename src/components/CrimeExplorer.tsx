/**
 * The Crime page's own data explorer: every figure on crime and justice the
 * site holds from a publisher, as a list beside a detail pane - the same card
 * the Dashboard has for countries and the Trends page for its figures
 * (StatExplorer).
 *
 * Five groups:
 *
 *   The world's counts    homicide, terrorism and the rule of law, each a
 *                         published series with its years
 *   Violence, property,   the offences police recorded, as each country
 *     corruption …        reported them to UNODC: who reports, and every
 *                         place's rate, highest first
 *   Trafficking and       the victims authorities detected and the people
 *     modern slavery      convicted (UNODC); the estimates of people in
 *                         modern slavery (ILO, Walk Free and IOM)
 *   Justice and prisons   judges, prosecutors, police and prison staff for
 *                         every 100,000 people (UNODC over the World Bank's
 *                         population), prison populations (World Prison
 *                         Brief) and prisoners with no sentence (UNODC)
 *
 * A figure with no world total - an offence's rate, a staff count - is listed
 * by how many places report it, and its detail ranks the places. Nothing is
 * worked out here but those rankings and the sums the page already states.
 */
import { ShieldCheck } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { OFFENCES, OFFENCE_PLACES, OFFENCE_RATES, OFFENCE_SOURCES, TRAFFICKING, UNSENTENCED, type OffenceGroup } from "../data/crimeOffences";
import { JUSTICE_SOURCES, JUSTICE_STAFF, type StaffKind } from "../data/justice";
import { MODERN_SLAVERY, MODERN_SLAVERY_SOURCES } from "../data/modernSlavery";
import { PRISON_RATES, PRISON_RATES_SOURCE } from "../data/prisonRates";
import { WORLD, type WorldIndicator } from "../data/worldview";
import type { StatCardData, StatTable, StatTableRow } from "./StatCard";
import { StatExplorer, type StatGroup } from "./StatExplorer";

const RED = "#ef4444";
const PLACE = new Map(countriesData.map((c) => [c.id, c]));
const nameOf = (id: string) => PLACE.get(id)?.name ?? OFFENCE_PLACES[id] ?? id.toUpperCase();
const codeOf = (id: string) => PLACE.get(id)?.code;
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const rate = (v: number) => (v >= 100 ? whole(v) : v >= 10 ? v.toFixed(1) : String(Number(v.toFixed(2))));
const span = (years: number[]) => (years.length ? (Math.min(...years) === Math.max(...years) ? `${years[0]}` : `${Math.min(...years)}–${Math.max(...years)}`) : "");

type Source = { label: string; url: string };
type Placed = StatTableRow & { year: number };

/** A figure reported place by place, with no world total: listed by how many report it, and ranked in its detail. */
function ranked({ label, unit, by, rows, about, source, color, notes }: { label: string; unit: string; by: string; rows: Placed[]; about: string; source: Source | Source[]; color?: string; notes?: string[] }): StatCardData | null {
  if (rows.length < 3) return null;
  const high = [...rows].sort((a, b) => b.value - a.value);
  const low = [...rows].sort((a, b) => a.value - b.value);
  const years = span(rows.map((r) => r.year));
  const one = Array.isArray(source) ? source[0] : source;
  const tables: StatTable[] = [
    { key: `${label}-high`, title: "Highest", kicker: `${unit} · each place's latest year`, rows: high, source: one },
    { key: `${label}-low`, title: "Lowest", kicker: `${unit} · each place's latest year`, rows: low.slice(0, 15), source: one },
  ];
  return {
    label,
    value: `${rows.length} places`,
    sub: `${unit} · ${by} · ${years}`,
    about,
    color,
    facts: [
      { label: "Places reporting", value: `${rows.length}`, sub: years },
      { label: "Highest", value: high[0].text, sub: `${high[0].name}, ${high[0].year}` },
      { label: "Lowest", value: low[0].text, sub: `${low[0].name}, ${low[0].year}` },
      { label: "The middle place", value: high[Math.floor(high.length / 2)].text, sub: high[Math.floor(high.length / 2)].name },
    ],
    tables,
    source,
    notes,
  };
}
const kept = (cards: (StatCardData | null)[]) => cards.filter((c): c is StatCardData => !!c);

// ── The world's counts ──────────────────────────────────────────────────────

const compact = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : whole(v));
const print = (ind: WorldIndicator, v: number) => (ind.format === "count" ? compact(v) : Math.abs(v) >= 1000 ? whole(v) : v.toFixed(ind.dp));
const publisher = (label: string) => label.split(/ \(| — /)[0];

function worldCard(id: string, upIsWorse: boolean | null): StatCardData | null {
  const ind = WORLD[id];
  if (!ind || ind.series.length < 3) return null;
  const s = ind.series;
  const [year, value] = s[s.length - 1];
  const [prevYear, prev] = s[s.length - 2];
  const d = value - prev;
  const same = print(ind, value) === print(ind, prev);
  return {
    label: ind.label,
    value: print(ind, value),
    sub: `${ind.unit} · ${publisher(ind.source.label)} · ${year}`,
    about: ind.note,
    series: s,
    fmt: (v) => print(ind, v),
    color: RED,
    source: ind.source,
    change: same
      ? { chip: "no change", caption: `on ${prevYear}`, dir: "flat" }
      : { chip: `${d > 0 ? "+" : "−"}${print(ind, Math.abs(d))}`, caption: `on ${prevYear}`, dir: d > 0 ? "up" : "down", verdict: upIsWorse === null ? null : d > 0 === upIsWorse ? "worse" : "better" },
  };
}

const WORLD_CARDS = kept([worldCard("homicide", true), worldCard("terrorAttacks", true), worldCard("terrorDeaths", true), worldCard("ruleOfLaw", false), worldCard("judicialConstraints", false), worldCard("physicalIntegrity", false)]);

// ── Offences the police recorded ────────────────────────────────────────────

const OFFENCE_GROUPS: { id: OffenceGroup; title: string; color: string }[] = [
  { id: "violence", title: "Violent and sexual offences", color: "#ef4444" },
  { id: "property", title: "Property offences", color: "#f59e0b" },
  { id: "corruption", title: "Corruption and economic crime", color: "#a855f7" },
  { id: "cyber", title: "Computer offences", color: "#3b82f6" },
  { id: "borders", title: "Smuggling of migrants", color: "#0d9488" },
  { id: "environment", title: "Offences against the environment", color: "#65a30d" },
];
const UNODC_CAUTION =
  "Recorded offences depend on each country's laws, on what its police count and on how willing people are to report, so a high rate may mean more crime or better recording. UNODC advises comparing a country with its own earlier years.";

const offenceCards = (group: OffenceGroup, color: string) =>
  kept(
    OFFENCES.filter((o) => o.group === group).map((o) =>
      ranked({
        label: o.label,
        unit: "per 100,000 people",
        by: "UNODC",
        color,
        rows: Object.entries(OFFENCE_RATES[o.key] ?? {}).map(([id, [v, y, n]]) => ({ name: nameOf(id), code: codeOf(id), value: v, text: rate(v), note: `${y}${n !== undefined ? ` · ${whole(n)} recorded` : ""}`, year: y })),
        about: `Offences the police recorded under UNODC's category "${o.unodc}", as each country reported them to the UN Crime Trends Survey: its rate for every 100,000 people, for the latest year it reported.`,
        source: OFFENCE_SOURCES[o.source],
        notes: [UNODC_CAUTION],
      }),
    ),
  );

// ── Trafficking and modern slavery ──────────────────────────────────────────

function traffickingCards(): StatCardData[] {
  const victims: Placed[] = Object.entries(TRAFFICKING).flatMap(([id, t]) => (typeof t.victims === "number" && t.y ? [{ name: nameOf(id), code: codeOf(id), value: t.victims, text: whole(t.victims), note: `${t.y}`, year: t.y }] : []));
  const convicted: Placed[] = Object.entries(TRAFFICKING).flatMap(([id, t]) => (t.convicted && typeof t.convicted[0] === "number" ? [{ name: nameOf(id), code: codeOf(id), value: t.convicted[0], text: whole(t.convicted[0]), note: `${t.convicted[1]}`, year: t.convicted[1] }] : []));
  const total = (rows: Placed[]) => rows.reduce((a, r) => a + r.value, 0);
  const card = (label: string, rows: Placed[], about: string): StatCardData => ({
    label,
    value: whole(total(rows)),
    sub: `people · ${rows.length} places, each for its latest year · UNODC · ${span(rows.map((r) => r.year))}`,
    about,
    color: "#ec4899",
    facts: [
      { label: "Places reporting a count", value: `${rows.length}`, sub: span(rows.map((r) => r.year)) },
      { label: "Largest count", value: [...rows].sort((a, b) => b.value - a.value)[0].text, sub: [...rows].sort((a, b) => b.value - a.value)[0].name },
    ],
    tables: [{ key: `${label}-places`, title: "By place", kicker: "people · each place's latest year", rows: [...rows].sort((a, b) => b.value - a.value), source: OFFENCE_SOURCES.trafficking }],
    source: OFFENCE_SOURCES.trafficking,
    notes: ["A sum of what each place reported for its own latest year, so the years differ; a count UNODC withholds as \"fewer than five\" is left out. Countries that look harder find more: the total measures detection as much as trafficking."],
  });
  const S = MODERN_SLAVERY;
  const m = (v: number) => `${v % 1 === 0 ? v : v.toFixed(1)}M`;
  const slavery: StatCardData = {
    label: "People in modern slavery",
    value: `${S.world.people} million`,
    sub: `estimate, any given day · ILO, Walk Free and IOM · ${S.year}`,
    about: "The Global Estimates of Modern Slavery: people in forced labour and in forced marriage on any given day, estimated from household surveys and case records. They are estimates, not counts of identified people.",
    color: "#ec4899",
    facts: [
      { label: "In forced labour", value: `${S.world.forcedLabour} million`, sub: `${S.year}` },
      { label: "In forced marriage", value: `${S.world.forcedMarriage} million`, sub: `${S.year}` },
      { label: "Children among them", value: `over ${S.world.childrenOver} million`, sub: `${S.year}` },
      { label: "Women and girls", value: `${S.world.womenAndGirlsPct}%`, sub: `${S.year}` },
    ],
    tables: [
      {
        key: "slavery-forms",
        title: "The forms it takes",
        kicker: `millions of people · ${S.year}`,
        rows: [
          { name: "Forced marriage", value: S.world.forcedMarriage, text: m(S.world.forcedMarriage) },
          { name: "Forced labour in the private economy", value: S.forcedLabourForms.privateEconomy, text: m(S.forcedLabourForms.privateEconomy) },
          { name: "Forced commercial sexual exploitation", value: S.forcedLabourForms.sexualExploitation, text: m(S.forcedLabourForms.sexualExploitation) },
          { name: "Forced labour imposed by the state", value: S.forcedLabourForms.stateImposed, text: m(S.forcedLabourForms.stateImposed) },
        ],
        source: MODERN_SLAVERY_SOURCES.ilo,
      },
      { key: "slavery-regions", title: "By region", kicker: `millions of people · ${S.year}`, rows: [...S.regions].sort((a, b) => b.millions - a.millions).map((r) => ({ name: r.name, value: r.millions, text: m(r.millions), note: `${r.per1000} per 1,000 people` })), source: MODERN_SLAVERY_SOURCES.index },
      { key: "slavery-largest", title: "The ten countries with the largest estimated numbers", kicker: `millions of people · ${S.year}`, rows: S.largest.map((c) => ({ name: c.country, value: c.millions, text: m(c.millions) })), source: MODERN_SLAVERY_SOURCES.index },
    ],
    source: [MODERN_SLAVERY_SOURCES.estimates, MODERN_SLAVERY_SOURCES.ilo, MODERN_SLAVERY_SOURCES.index],
  };
  return [
    ...(victims.length ? [card("Victims of trafficking detected", victims, "People an authority identified and recorded as victims of trafficking in persons, as each country reported them to UNODC for its Global Report on Trafficking in Persons.")] : []),
    ...(convicted.length ? [card("People convicted of trafficking", convicted, "People convicted of trafficking in persons, as each country reported them to UNODC.")] : []),
    slavery,
  ];
}

// ── Justice and prisons ─────────────────────────────────────────────────────

const STAFF: [StaffKind, string][] = [
  ["judges", "Judges and magistrates"],
  ["prosecutors", "Prosecutors"],
  ["police", "Police"],
  ["prisonStaff", "Prison staff"],
];
const JUSTICE_CARDS = kept([
  ...STAFF.map(([kind, label]) =>
    ranked({
      label,
      unit: "per 100,000 people",
      by: "UNODC",
      color: "#6366f1",
      rows: Object.entries(JUSTICE_STAFF).flatMap(([id, s]) => {
        const f = s[kind];
        return f && f[2] !== null ? [{ name: nameOf(id), code: codeOf(id), value: f[2], text: rate(f[2]), note: `${whole(f[0])} in ${f[1]}`, year: f[1] }] : [];
      }),
      about: `${label} for every 100,000 people: the count each country reported to the UN Crime Trends Survey for its latest year, over the World Bank's population for that year.`,
      source: [JUSTICE_SOURCES.unodc, JUSTICE_SOURCES.population],
      notes: ["Countries differ in whom they count - lay and part-time judges, gendarmeries, border and municipal police are in some counts and not others."],
    }),
  ),
  ranked({
    label: "Prison population rate",
    unit: "prisoners per 100,000 people",
    by: "World Prison Brief",
    color: "#6366f1",
    rows: Object.entries(PRISON_RATES).map(([id, p]) => ({ name: nameOf(id), code: codeOf(id), value: p.v, text: `${p.approx ? "c. " : ""}${whole(p.v)}`, note: `count at ${p.at}`, year: Number(/\d{4}/.exec(p.at)?.[0] ?? p.y) })),
    about: "People held in prison for every 100,000 of the population, at the date of each country's latest count, as the World Prison Brief lists them.",
    source: PRISON_RATES_SOURCE,
    notes: ["Counts are for different dates in different countries; \"c.\" is a rate the Brief gives as approximate."],
  }),
  ranked({
    label: "Prisoners with no sentence",
    unit: "% of people held",
    by: "UNODC",
    color: "#6366f1",
    rows: Object.entries(UNSENTENCED).map(([id, [v, y]]) => ({ name: nameOf(id), code: codeOf(id), value: v, text: `${v}%`, note: `${y}`, year: y })),
    about: "The share of people held in prison who have not been sentenced: those awaiting trial, on trial or awaiting a verdict, as each country reported them to UNODC.",
    source: OFFENCE_SOURCES.prisons,
  }),
]);

const GROUPS: StatGroup[] = [
  { title: "The world's counts", color: RED, items: WORLD_CARDS },
  ...OFFENCE_GROUPS.map((g) => ({ title: g.title, color: g.color, items: offenceCards(g.id, g.color) })),
  { title: "Trafficking and modern slavery", color: "#ec4899", items: traffickingCards() },
  { title: "Justice and prisons", color: "#6366f1", items: JUSTICE_CARDS },
].filter((g) => g.items.length > 0);

export function CrimeExplorer() {
  return <StatExplorer title="Crime & justice" icon={<ShieldCheck size={12} weight="fill" aria-hidden />} color={RED} noun="figures" groups={GROUPS} />;
}
