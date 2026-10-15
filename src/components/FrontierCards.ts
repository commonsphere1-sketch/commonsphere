/**
 * The Developments page's own figures as explorer cards, a group for each of
 * its fields - space, AI and computing, clean energy, research budgets,
 * medicine and military technology - for the explorer under its headlines and
 * the Dashboard's Trends tab.
 *
 * Every figure is its publisher's, read from the data the page's panels draw
 * (innovation.ts, frontiers.ts, frontiers2.ts, technology.ts); a change, a
 * share or a count made here says so. A figure no body publishes for the
 * world - a scanner count, a research budget - is given for the country with
 * the most and named as such, never added up across countries' different
 * years.
 */
import type { StatCardData, StatChange, StatTable } from "./StatCard";
import type { StatGroup } from "./StatExplorer";
import { ORBITAL_LAUNCHES, LAUNCHES_PARTIAL_YEAR, LAUNCH_AGENCIES, SPACE_OBJECTS, FDA_APPROVALS, INNOVATION_SOURCES } from "../data/innovation";
import { AI_COMPUTE_MAX, AI_COUNTRIES, FASTEST_SUPERCOMPUTER, SOLAR_PRICE, SOLAR_GW, WIND_GW, FRONTIER_SOURCES } from "../data/frontiers";
import { SATELLITES, SATELLITES_WORKING, RD_BUDGETS, RD_BUDGET_SERIES, RD_OBJECTIVES, SCANNERS, FRONTIER2_SOURCES } from "../data/frontiers2";
import { GENOME_COST } from "../data/technology";

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const short = (v: number) => (v >= 1e12 ? `${(v / 1e12).toFixed(1)}T` : v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}K` : whole(v));
const sci = (v: number) => (v >= 1e15 ? `${(v / 1e15).toFixed(1)} quadrillion` : short(v));
/** Millions of dollars, as billions. */
const usdM = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${whole(v)}M`);
const last = <T>(a: T[]) => a[a.length - 1];

/** The change of the latest reading on the one before, as a chip. */
function onYear(series: [number, number][], upIsGood: boolean | null): StatChange | null {
  if (series.length < 2) return null;
  const [y, v] = last(series);
  const [, was] = series[series.length - 2];
  if (!was) return null;
  const p = ((v - was) / was) * 100;
  if (Math.abs(p) < 0.5) return { chip: "level", caption: `on ${y - 1}`, dir: "flat", verdict: null };
  return { chip: `${p > 0 ? "+" : ""}${p.toFixed(0)}%`, caption: `on ${y - 1}`, dir: p > 0 ? "up" : "down", verdict: upIsGood === null ? null : p > 0 === upIsGood ? "better" : "worse" };
}
const rows = (r: [string, number][], fmt: (v: number) => string, total?: number) =>
  r.map(([name, value]) => ({ name, value, text: fmt(value), note: total ? `${((100 * value) / total).toFixed(1)}% of all, worked out here` : undefined }));

/* ── Space ── */
const launches = ORBITAL_LAUNCHES.filter(([y]) => y < LAUNCHES_PARTIAL_YEAR).map(([y, n]) => [y, n] as [number, number]);
const lastLaunch = last(ORBITAL_LAUNCHES.filter(([y]) => y < LAUNCHES_PARTIAL_YEAR));
const objects = SPACE_OBJECTS.world;
const SPACE: StatCardData[] = [
  {
    label: "Orbital launches",
    value: whole(lastLaunch[1]),
    sub: `GCAT · ${lastLaunch[0]}`,
    change: onYear(launches, null),
    about: "Every attempt to put something into orbit in the year, successful or not.",
    series: launches,
    fmt: whole,
    source: INNOVATION_SOURCES.gcat,
    moreFacts: [
      { label: "Reached orbit", value: whole(lastLaunch[2]), sub: `${lastLaunch[0]}` },
      { label: "By SpaceX", value: whole(lastLaunch[3]), sub: `${((lastLaunch[3] / lastLaunch[1]) * 100).toFixed(0)}% of all, worked out here` },
    ],
    tables: [{ key: "agencies", title: "The launch companies and agencies", kicker: `Orbital launch attempts · ${LAUNCH_AGENCIES.year}`, rows: LAUNCH_AGENCIES.rows.map(([n, s, v]) => ({ name: n, value: v, text: whole(v), note: s ? `GCAT state code ${s}` : undefined })), source: INNOVATION_SOURCES.gcat, section: "who" }],
  },
  {
    label: "Satellites and probes working",
    value: whole(SATELLITES.total),
    sub: `GCAT · ${SATELLITES.updated.slice(0, 11)}`,
    change: null,
    about: "Payloads launched into space whose operations GCAT gives as still under way: satellites, crewed stations and probes alike.",
    series: SATELLITES_WORKING,
    fmt: whole,
    source: FRONTIER2_SOURCES.satellites,
    moreFacts: [{ label: "Starlink", value: whole(SATELLITES.starlink), sub: `${((SATELLITES.starlink / SATELLITES.total) * 100).toFixed(0)}% of all, worked out here` }],
    tables: [
      { key: "states", title: "By the state that owns them", kicker: "Payloads working, by GCAT's owning state", rows: rows(SATELLITES.byState.map(([n, , v]) => [n, v]), whole, SATELLITES.total), source: FRONTIER2_SOURCES.satellites },
      { key: "class", title: "Commercial, civil, military", kicker: "By GCAT's class of owner", rows: rows(SATELLITES.byClass, whole, SATELLITES.total), source: FRONTIER2_SOURCES.satellites },
      { key: "use", title: "What they do", kicker: "By GCAT's category of payload", rows: rows(SATELLITES.byUse, whole, SATELLITES.total), source: FRONTIER2_SOURCES.satellites },
    ],
    notes: ["The line is the payloads working at the end of each year, counted here from GCAT's launch and end-of-operations dates; the figure is GCAT's count of those working now."],
  },
  {
    label: "Objects launched into space",
    value: whole(last(objects)[1]),
    sub: `UNOOSA · ${last(objects)[0]}`,
    change: onYear(objects, null),
    about: "Satellites, probes, crewed craft and the like registered with the United Nations in the year.",
    series: objects,
    fmt: whole,
    source: INNOVATION_SOURCES.unoosa,
    tables: [{ key: "who", title: "Who launched them", kicker: `Objects launched · ${SPACE_OBJECTS.year}`, rows: rows(SPACE_OBJECTS.top, whole, last(objects)[1]), source: INNOVATION_SOURCES.unoosa }],
  },
];

/* ── AI and computing ── */
// The year under way is left out: its largest run so far is not the year's.
const aiFull = AI_COMPUTE_MAX.filter(([y]) => y < new Date().getFullYear());
const ai = last(aiFull);
const flops = last(FASTEST_SUPERCOMPUTER);
const AI_GROUP: StatCardData[] = [
  {
    label: "Largest AI training run",
    value: `${sci(ai[2])} petaFLOP`,
    sub: `Epoch AI · ${ai[0]} · ${ai[1]}`,
    change: null,
    about: "The most computation used to train any notable AI system in the year, in petaFLOP: a thousand million million operations each.",
    series: aiFull.map(([y, , v]) => [y, v]),
    fmt: sci,
    source: FRONTIER_SOURCES.aiCompute,
    moreFacts: aiFull.slice(-4, -1).reverse().map(([y, n, v]) => ({ label: String(y), value: sci(v), sub: n })),
    tables: [{ key: "countries", title: "Who builds the largest systems", kicker: `Systems trained with over 10²³ operations, to ${AI_COUNTRIES.year}`, rows: rows(AI_COUNTRIES.rows, whole), source: FRONTIER_SOURCES.aiCountries }],
    notes: ["The series grows by powers of ten; the page's own chart draws it on a scale of powers of ten."],
  },
  {
    label: "Fastest supercomputer",
    value: `${(flops[1] / 1e9).toFixed(2)} exaFLOPS`,
    sub: `TOP500 · ${flops[0]}`,
    change: onYear(FASTEST_SUPERCOMPUTER, true),
    about: "The computing power of the fastest machine on the TOP500 list in the year, in exaFLOPS: a million million million operations a second.",
    series: FASTEST_SUPERCOMPUTER,
    fmt: (v) => `${short(v)} GFLOPS`,
    source: FRONTIER_SOURCES.flops,
  },
];

/* ── Clean energy ── */
const sp = last(SOLAR_PRICE);
const ENERGY: StatCardData[] = [
  {
    label: "Solar panel price",
    value: `$${sp[1].toFixed(2)} a watt`,
    sub: `IRENA and Nemet · ${sp[0]}`,
    change: onYear(SOLAR_PRICE, false),
    about: "What a solar photovoltaic module cost a watt of capacity, in today's US dollars.",
    series: SOLAR_PRICE,
    fmt: (v) => `$${v < 1 ? v.toFixed(2) : whole(v)}`,
    source: FRONTIER_SOURCES.solarPrice,
    moreFacts: [{ label: "First year", value: `$${SOLAR_PRICE[0][1].toFixed(0)}`, sub: `${SOLAR_PRICE[0][0]}` }],
  },
  {
    label: "Solar power built",
    value: `${whole(last(SOLAR_GW.world)[1])} GW`,
    sub: `IRENA · ${last(SOLAR_GW.world)[0]}`,
    change: onYear(SOLAR_GW.world, null),
    about: "Solar generating capacity installed in the world, in gigawatts.",
    series: SOLAR_GW.world,
    fmt: (v) => `${whole(v)} GW`,
    source: FRONTIER_SOURCES.solar,
    tables: [{ key: "top", title: "Who has built the most", kicker: `Gigawatts · ${SOLAR_GW.top.year}`, rows: rows(SOLAR_GW.top.rows, (v) => `${whole(v)} GW`, last(SOLAR_GW.world)[1]), source: FRONTIER_SOURCES.solar }],
  },
  {
    label: "Wind power built",
    value: `${whole(last(WIND_GW.world)[1])} GW`,
    sub: `IRENA · ${last(WIND_GW.world)[0]}`,
    change: onYear(WIND_GW.world, null),
    about: "Wind generating capacity installed in the world, on land and at sea, in gigawatts.",
    series: WIND_GW.world,
    fmt: (v) => `${whole(v)} GW`,
    source: FRONTIER_SOURCES.wind,
    tables: [{ key: "top", title: "Who has built the most", kicker: `Gigawatts · ${WIND_GW.top.year}`, rows: rows(WIND_GW.top.rows, (v) => `${whole(v)} GW`, last(WIND_GW.world)[1]), source: FRONTIER_SOURCES.wind }],
  },
];

/* ── Research budgets: the OECD's GBARD ── */
const partOf = (b: (typeof RD_BUDGETS)[number], k: string) => b.parts.find(([o]) => o === k)?.[1];
/** The countries' budgets for one objective, largest first: [country, millions, year, share of its own total]. */
function byObjective(k: string) {
  return RD_BUDGETS.flatMap((b) => {
    const v = partOf(b, k);
    return v ? [{ name: b.name, value: v, text: usdM(v), note: `${b.year} · ${((100 * v) / b.total).toFixed(1)}% of its research budget, worked out here` }] : [];
  }).sort((a, b) => b.value - a.value);
}
function objectiveCard(k: string, label: string, about: string): StatCardData | null {
  const list = byObjective(k);
  const top = list[0];
  if (!top) return null;
  const b = RD_BUDGETS.find((x) => x.name === top.name)!;
  return {
    label,
    value: usdM(top.value),
    sub: `OECD · ${top.name}, the largest · ${b.year}`,
    change: null,
    about,
    fmt: usdM,
    source: FRONTIER2_SOURCES.gbard,
    facts: list.slice(0, 3).map((r) => ({ label: r.name, value: r.text, sub: r.note.split(" · ")[0] })),
    tables: [{ key: k, title: `${RD_OBJECTIVES[k]}: who budgets most`, kicker: "Millions of US dollars at purchasing power parity, current prices · each country's latest year", rows: list.slice(0, 15), source: FRONTIER2_SOURCES.gbard }],
    notes: ["What governments set aside in their budgets for research and development with this aim, as each reports it to the OECD; countries' latest years differ, so no total is added up."],
  };
}
const usBudget = RD_BUDGETS[0];
const BUDGETS: StatCardData[] = [
  ...(usBudget
    ? [
        {
          label: "Government research budget",
          value: usdM(usBudget.total),
          sub: `OECD · ${usBudget.name}, the largest · ${usBudget.year}`,
          change: onYear(RD_BUDGET_SERIES[usBudget.code] ?? [], null),
          about: "What a government sets aside in its budget for research and development, all aims together, in US dollars at purchasing power parity.",
          series: RD_BUDGET_SERIES[usBudget.code],
          fmt: usdM,
          source: FRONTIER2_SOURCES.gbard,
          tables: [
            { key: "countries", title: "Who budgets most for research", kicker: "Millions of US dollars at PPP, current prices · each country's latest year", rows: RD_BUDGETS.slice(0, 15).map((b) => ({ name: b.name, value: b.total, text: usdM(b.total), note: String(b.year) })), source: FRONTIER2_SOURCES.gbard },
            { key: "aims", title: `What ${usBudget.name}'s is for`, kicker: `By socio-economic objective · ${usBudget.year}`, rows: [...usBudget.parts].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: RD_OBJECTIVES[k] ?? k, value: v, text: usdM(v), note: `${((100 * v) / usBudget.total).toFixed(1)}% of it, worked out here` })), source: FRONTIER2_SOURCES.gbard },
          ],
        } satisfies StatCardData,
      ]
    : []),
  ...[
    objectiveCard("NABS07", "Health research budgets", "What governments budget for research to protect and improve human health."),
    objectiveCard("NABS03", "Space research budgets", "What governments budget for research to explore and use space, civil and commercial."),
    objectiveCard("NABS05", "Energy research budgets", "What governments budget for research on producing, storing, carrying and saving energy."),
  ].flatMap((c) => c ?? []),
];

/* ── Medicine ── */
const thisYear = new Date().getFullYear();
const fda = FDA_APPROVALS.filter(([y]) => y < thisYear);
const genome = GENOME_COST.series;
function scannerCard(k: string, label: string, about: string): StatCardData | null {
  const list = SCANNERS[k] ?? [];
  const top = list[0];
  if (!top) return null;
  return {
    label,
    value: top[2].toFixed(1),
    sub: `OECD · ${top[0]}, the most · ${top[3]}`,
    change: null,
    about,
    fmt: (v) => v.toFixed(1),
    source: FRONTIER2_SOURCES.scanners,
    facts: list.slice(0, 3).map(([n, , v, y]) => ({ label: n, value: v.toFixed(1), sub: String(y) })),
    tables: [{ key: k, title: "Per million people", kicker: "Hospitals and clinics together · each country's latest year", rows: list.map(([n, , v, y]) => ({ name: n, value: v, text: v.toFixed(1), note: String(y) })), source: FRONTIER2_SOURCES.scanners }],
  };
}
const MEDICINE: StatCardData[] = [
  {
    label: "New medicines approved",
    value: whole(last(fda)[1]),
    sub: `US FDA · ${last(fda)[0]}`,
    change: onYear(fda, null),
    about: "Novel drugs - medicines never approved before - that the FDA's Center for Drug Evaluation and Research approved in the year.",
    series: fda,
    fmt: whole,
    source: INNOVATION_SOURCES.fda,
  },
  {
    label: "Cost of a human genome",
    value: `$${whole(last(genome)[1])}`,
    sub: `NHGRI · ${last(genome)[0]}`,
    change: onYear(genome, false),
    about: "What it cost to sequence one human genome.",
    series: genome,
    fmt: (v) => `$${short(v)}`,
    source: GENOME_COST.source,
    moreFacts: [{ label: "First year", value: `$${short(genome[0][1])}`, sub: `${genome[0][0]}` }],
  },
  ...[
    scannerCard("MRI", "MRI scanners per million", "Magnetic resonance imaging units - whole-body scanners that picture the body's soft tissue with magnets and radio waves - per million people."),
    scannerCard("CT_SCAN", "CT scanners per million", "Computed tomography scanners - which build pictures of the body from X-rays taken from many angles - per million people."),
    scannerCard("PET_SCAN", "PET scanners per million", "Positron emission tomography scanners - which picture how the body's tissues work, from a tracer injected into the blood - per million people."),
  ].flatMap((c) => c ?? []),
];

/* ── Military technology ── */
const military = SATELLITES.byClass.find(([k]) => k === "Military")?.[1];
const MILITARY: StatCardData[] = [
  ...[objectiveCard("NABS14", "Defence research budgets", "What governments budget for military research and development: weapons, drones, aircraft and the systems that run them.")].flatMap((c) => c ?? []),
  ...(military
    ? [
        {
          label: "Military satellites working",
          value: whole(military),
          sub: `GCAT · ${SATELLITES.updated.slice(0, 11)}`,
          change: null,
          about: "Payloads in orbit owned by armed forces and defence agencies whose operations GCAT gives as still under way.",
          fmt: whole,
          source: FRONTIER2_SOURCES.satellites,
          facts: [
            { label: "Military", value: whole(military), sub: `${((military / SATELLITES.total) * 100).toFixed(1)}% of all, worked out here` },
            { label: "All working", value: whole(SATELLITES.total), sub: "every class" },
          ],
          tables: [{ key: "class", title: "Commercial, civil, military", kicker: "Payloads working, by GCAT's class of owner", rows: rows(SATELLITES.byClass, whole, SATELLITES.total), source: FRONTIER2_SOURCES.satellites }],
        } satisfies StatCardData,
      ]
    : []),
];

const groups: [string, string, StatCardData[]][] = [
  ["Space", "#0ea5e9", SPACE],
  ["AI and computing", "#8b5cf6", AI_GROUP],
  ["Clean energy", "#10b981", ENERGY],
  ["Research budgets", "#06b6d4", BUDGETS],
  ["Medicine", "#ec4899", MEDICINE],
  ["Military technology", "#ef4444", MILITARY],
];
/** The groups, each card in its group's colour. */
export const FRONTIER_GROUPS: StatGroup[] = groups.map(([title, color, items]) => ({ title, color, items: items.map((s) => ({ ...s, color })) }));
/** Unused tables are dropped: a group never shows a breakdown of fewer than two rows. */
for (const g of FRONTIER_GROUPS) for (const s of g.items) s.tables = s.tables?.filter((t: StatTable) => t.rows.length > 1);
