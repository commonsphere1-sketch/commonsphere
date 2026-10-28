/**
 * The innovation sections of the Developments page, as asked: the space race
 * and the companies in it, science and invention, new medicines and the cost
 * of reading a genome, fusion, and the great national and international
 * projects.
 *
 * Every figure is its publisher's, read from data the site holds
 * (innovation.ts, technology.ts): GCAT's orbital launches, the UN's count of
 * objects launched, the World Bank's research and invention series, the FDA's
 * novel drug approvals, and NHGRI's cost of sequencing a genome. The project
 * and fusion cards give only what each project's own body or laboratory has
 * published, with a link to it; a share or a change is worked out here and
 * says so.
 */
import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ORBITAL_LAUNCHES, LAUNCHES_PARTIAL_YEAR, LAUNCH_AGENCIES, SPACE_OBJECTS, RD_SHARE, RESEARCHERS, ARTICLES, PATENTS, FDA_APPROVALS, FDA_DRUGS, INNOVATION_SOURCES } from "../data/innovation";
import { GENOME_COST } from "../data/technology";
import { BATTERY_CELL_PRICE } from "../data/renewables";
import { SATELLITES, SATELLITES_LAUNCHED, SATELLITES_WORKING, RD_BUDGETS, RD_BUDGET_SERIES, RD_OBJECTIVES, SCANNERS, SCANNER_KINDS, FRONTIER2_SOURCES } from "../data/frontiers2";
import { AI_COMPUTE_MAX, AI_LATEST, AI_COUNTRIES, SOLAR_PRICE, SOLAR_GW, WIND_GW, RENEWABLE_SHARE, RENEWABLE_KINDS, LCOE, EV_SHARE, ROBOTS, FASTEST_SUPERCOMPUTER, NUCLEAR_WARHEADS, NOBEL_SCIENCE, FRONTIER_SOURCES } from "../data/frontiers";
import { useTokens, type Tokens } from "./DataExplorer";
import { INK, Panel, Note, Foot, Tiles } from "./CountryFigures";
import SlimBars, { SlimColumns } from "./SlimBars";

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const big = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}K` : whole(v));
const SPACEX = "#0ea5e9";
const OTHERS = "#8b5cf6";

/** A row of panels, three across on a wide screen, as the Worldview page's are. */
function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 items-stretch">{children}</div>;
}
function Head({ t, title, kicker }: { t: Tokens; title: string; kicker: string }) {
  return (
    <div className="flex items-baseline gap-3 px-1">
      <h3 className="text-sm font-bold font-sans" style={{ color: t.headText }}>
        {title}
      </h3>
      <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
        {kicker}
      </span>
      <span className="flex-1 h-px" style={{ background: t.gridLine }} aria-hidden />
    </div>
  );
}
/** A world series year by year: a line over a gradient. */
function Series({ t, rows, fmt, color, id, height = 170 }: { t: Tokens; rows: [number, number][]; fmt: (v: number) => string; color: string; id: string; height?: number }) {
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows.map(([y, v]) => ({ y: String(y), v }))} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.gridLine} vertical={false} />
        <XAxis dataKey="y" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} width={48} tickFormatter={(v: number) => fmt(v)} />
        <Tooltip contentStyle={{ background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: t.headText }} itemStyle={{ color: t.headText }} formatter={(v: number) => [fmt(v), ""]} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Space ── */
function Space({ t }: { t: Tokens }) {
  const recent = ORBITAL_LAUNCHES.filter(([y]) => y >= 2010);
  const full = ORBITAL_LAUNCHES.filter(([y]) => y < LAUNCHES_PARTIAL_YEAR);
  const last = full[full.length - 1];
  const now = ORBITAL_LAUNCHES.find(([y]) => y === LAUNCHES_PARTIAL_YEAR);
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  const objLast = SPACE_OBJECTS.world[SPACE_OBJECTS.world.length - 1];
  return (
    <section id="space-race" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="The space race" kicker="who is launching, how often, and what they put up" />
      <Row>
        <Panel t={t} title="Orbital launches a year" meta={`GCAT · ${recent[0][0]}–${LAUNCHES_PARTIAL_YEAR}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recent.map(([y, total, , spacex]) => ({ y: String(y), spacex, others: total - spacex }))} margin={{ top: 6, right: 6, left: 0, bottom: 0 }} barCategoryGap="28%">
              <defs>
                {[SPACEX, OTHERS].map((c) => (
                  <linearGradient key={c} id={`ip-${c.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={t.gridLine} vertical={false} />
              <XAxis dataKey="y" {...axis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis {...axis} width={34} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: t.headText }} itemStyle={{ color: t.headText }} cursor={{ fill: t.gridLine }} />
              <Bar dataKey="others" name="Every other agency" stackId="l" fill={`url(#ip-${OTHERS.slice(1)})`} maxBarSize={18} isAnimationActive={false} />
              <Bar dataKey="spacex" name="SpaceX" stackId="l" fill={`url(#ip-${SPACEX.slice(1)})`} radius={[5, 5, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-sans" style={{ color: t.bodyText }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SPACEX }} />
              SpaceX
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: OTHERS }} />
              Every other launch agency
            </span>
          </div>
          <Note t={t}>
            Every orbital launch attempt GCAT lists, successful or not. In {last[0]}, {whole(last[1])} attempts, {whole(last[2])} of them reaching orbit; SpaceX made {whole(last[3])}, {((last[3] / last[1]) * 100).toFixed(0)}% of them -
            the share worked out here.{now ? ` ${LAUNCHES_PARTIAL_YEAR} so far: ${whole(now[1])}, ${whole(now[3])} of them SpaceX's.` : ""}
          </Note>
          <Foot sources={[INNOVATION_SOURCES.gcat]} />
        </Panel>
        <Panel t={t} title="The launch companies and agencies" meta={`orbital launch attempts · ${LAUNCH_AGENCIES.year}`}>
          <SlimBars labelWidth="6.5rem" rows={LAUNCH_AGENCIES.rows.map(([n, s, v], i) => ({ key: n, label: `${n}${s ? ` · ${s}` : ""}`, v, color: n === "SpaceX" ? SPACEX : INK[(i + 2) % INK.length] }))} fmt={whole} />
          <Note t={t}>Each launch agency as GCAT names it, with the state code it gives: a company or a state's agency alike.</Note>
          <Foot sources={[INNOVATION_SOURCES.gcat]} />
        </Panel>
        <Panel t={t} title="Objects launched into space" meta={`UNOOSA · ${SPACE_OBJECTS.world[0][0]}–${objLast[0]}`}>
          <Series t={t} id="ip-objects" rows={SPACE_OBJECTS.world.filter(([y]) => y >= 1990)} fmt={big} color={INK[5]} />
          <Note t={t}>
            Satellites, probes, crewed craft and the like registered with the UN each year: {whole(objLast[1])} in {objLast[0]}.
          </Note>
          <Foot sources={[INNOVATION_SOURCES.unoosa]} />
        </Panel>
        <Panel t={t} title="Who launched them" meta={`objects launched · ${SPACE_OBJECTS.year}`}>
          <SlimBars labelWidth="6.5rem" rows={SPACE_OBJECTS.top.map(([n, v], i) => ({ key: n, label: n, v, color: INK[i % INK.length] }))} fmt={whole} />
          <Foot sources={[INNOVATION_SOURCES.unoosa]} />
        </Panel>
      </Row>
    </section>
  );
}

/* ── Science and invention ── */
function Science({ t }: { t: Tokens }) {
  const rdLast = RD_SHARE.world[RD_SHARE.world.length - 1];
  const artLast = ARTICLES.world[ARTICLES.world.length - 1];
  const patLast = PATENTS.world[PATENTS.world.length - 1];
  const resLast = RESEARCHERS[RESEARCHERS.length - 1];
  return (
    <section id="science-output" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Science and invention" kicker="what the world spends on research, who does it, and what comes of it" />
      <Row>
        <Panel t={t} title="At a glance" meta="the world">
          <Tiles
            t={t}
            items={[
              { label: "Spent on R&D, of GDP", text: `${rdLast[1].toFixed(2)}%`, y: rdLast[0] },
              { label: "Researchers per million", text: whole(resLast[1]), y: resLast[0] },
              { label: "Journal articles", text: big(artLast[1]), y: artLast[0] },
              { label: "Patent applications", text: big(patLast[1] + (patLast[2] ?? 0)), y: `${patLast[0]} · residents and non-residents, added here` },
            ]}
          />
          <Foot sources={[INNOVATION_SOURCES.rd, INNOVATION_SOURCES.researchers, INNOVATION_SOURCES.articles, INNOVATION_SOURCES.patents]} />
        </Panel>
        <Panel t={t} title="Who spends most on research" meta="% of GDP · each its latest year">
          <SlimBars labelWidth="6.5rem" rows={RD_SHARE.top.map(([n, v, y], i) => ({ key: n, label: n, v, color: INK[i % INK.length], tip: `${n}: ${v}% of GDP · ${y}` }))} fmt={(v) => `${v.toFixed(2)}%`} />
          <Foot sources={[INNOVATION_SOURCES.rd]} />
        </Panel>
        <Panel t={t} title="The world's R&D spending" meta={`% of GDP · ${RD_SHARE.world[0][0]}–${rdLast[0]}`}>
          <Series t={t} id="ip-rd" rows={RD_SHARE.world} fmt={(v) => `${v.toFixed(1)}%`} color={INK[0]} />
          <Foot sources={[INNOVATION_SOURCES.rd]} />
        </Panel>
        <Panel t={t} title="Scientific papers a year" meta={`the world · ${ARTICLES.world[0][0]}–${artLast[0]}`}>
          <Series t={t} id="ip-art" rows={ARTICLES.world} fmt={big} color={INK[1]} />
          <Foot sources={[INNOVATION_SOURCES.articles]} />
        </Panel>
        <Panel t={t} title="Who publishes most" meta="journal articles · each its latest year">
          <SlimBars labelWidth="6.5rem" rows={ARTICLES.top.map(([n, v, y], i) => ({ key: n, label: n, v, color: INK[(i + 3) % INK.length], tip: `${n}: ${whole(v)} · ${y}` }))} fmt={big} />
          <Foot sources={[INNOVATION_SOURCES.articles]} />
        </Panel>
        <Panel t={t} title="Where inventors file patents" meta="by residents · each its latest year">
          <SlimBars labelWidth="6.5rem" rows={PATENTS.top.map(([n, v, y], i) => ({ key: n, label: n, v, color: INK[(i + 5) % INK.length], tip: `${n}: ${whole(v)} · ${y}` }))} fmt={big} />
          <Note t={t}>Applications filed by the country's own residents, at home or abroad, as WIPO counts them.</Note>
          <Foot sources={[INNOVATION_SOURCES.patents]} />
        </Panel>
      </Row>
    </section>
  );
}

/* ── Medicine and biology ── */
function Medicine({ t }: { t: Tokens }) {
  const g = GENOME_COST.series;
  const thisYear = new Date().getFullYear();
  return (
    <section id="medicine-figures" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Medicine and biology" kicker="new medicines - how many, and each by name and what it treats - and what it costs to read a human genome" />
      <Row>
        <Panel t={t} title="New medicines approved in the United States" meta={`FDA · ${FDA_APPROVALS[0]?.[0]}–${FDA_APPROVALS[FDA_APPROVALS.length - 1]?.[0]}`}>
          <SlimColumns height={170} label="Novel drugs the FDA approved each year" rows={FDA_APPROVALS.map(([y, n]) => ({ key: String(y), label: y === thisYear ? `${y}*` : String(y), v: n, faint: y === thisYear }))} fmt={whole} up={INK[6]} />
          <Note t={t}>
            Novel drugs - medicines never approved before - that the FDA's Center for Drug Evaluation and Research approved each year: the rows of its own list.{FDA_APPROVALS.some(([y]) => y === thisYear) ? ` * ${thisYear} so far.` : ""}
          </Note>
          <Foot sources={[INNOVATION_SOURCES.fda]} />
        </Panel>
        <Panel t={t} title="The cost of reading a human genome" meta={`NHGRI · ${g[0][0]}–${g[g.length - 1][0]}`}>
          <Series t={t} id="ip-genome" rows={g} fmt={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${whole(v)}`)} color={INK[3]} />
          <Note t={t}>
            What it cost to sequence one human genome: ${big(g[0][1])} in {g[0][0]}, ${whole(g[g.length - 1][1])} in {g[g.length - 1][0]}.
          </Note>
          <Foot sources={[GENOME_COST.source]} />
        </Panel>
        <NewMedicines t={t} />
      </Row>
    </section>
  );
}

/**
 * The new medicines themselves, as asked: each the FDA approved in a year, by name, with its active ingredient, the day it
 * was approved and the use the FDA approved it for, in the FDA's own words - the rows of its table. Filtered by any word.
 */
function NewMedicines({ t }: { t: Tokens }) {
  const [year, setYear] = useState(FDA_DRUGS[0]?.year);
  const [q, setQ] = useState("");
  const list = FDA_DRUGS.find((d) => d.year === year)?.rows ?? [];
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((r) => r.join(" ").toLowerCase().includes(needle)) : list;
  if (!FDA_DRUGS.length) return null;
  const thisYear = new Date().getFullYear();
  return (
    <Panel t={t} title="The new medicines, by name" meta={`FDA · novel drug approvals · ${year}${year === thisYear ? " so far" : ""}`} className="md:!basis-full xl:!basis-full">
      <div className="flex flex-wrap items-center gap-1.5">
        {FDA_DRUGS.map((d) => (
          <button key={d.year} type="button" onClick={() => setYear(d.year)} aria-pressed={year === d.year} className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer ${year === d.year ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}>
            {d.year}{d.year === thisYear ? " so far" : ""} · {d.rows.length}
          </button>
        ))}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or use…" aria-label="Filter the medicines" className="ml-auto w-48 rounded-full border border-border bg-transparent px-3 py-1 text-[11px] font-sans text-foreground outline-none placeholder:text-muted-foreground" />
      </div>
      <ul className="max-h-[26rem] overflow-y-auto divide-y divide-border rounded-lg border border-border">
        {shown.map(([name, ingredient, date, use]) => (
          <li key={`${name}-${date}`} className="px-3 py-2 flex flex-col gap-0.5">
            <p className="text-xs font-sans text-foreground">
              <span className="font-semibold">{name}</span> <span className="text-muted-foreground">({ingredient})</span>
              <span className="float-right text-[10px] font-mono text-muted-foreground">{date}</span>
            </p>
            <p className="text-[11px] font-sans text-muted-foreground leading-snug">{use}</p>
          </li>
        ))}
        {!shown.length && <li className="px-3 py-4 text-center text-[11px] font-sans text-muted-foreground">No medicine matches.</li>}
      </ul>
      <Note t={t}>Each medicine the FDA's Center for Drug Evaluation and Research approved as new that year, with the use it approved on that day, in the FDA's own words: a use approved later is not added.</Note>
      <Foot sources={[INNOVATION_SOURCES.fda]} />
    </Panel>
  );
}

/* ── Fusion and the great projects ── */
type Project = { name: string; by: string; what: string; facts: [label: string, value: string][]; source: { label: string; url: string }; more?: { label: string; url: string }[] };
const FUSION: Project[] = [
  {
    name: "ITER",
    by: "China, the European Union, India, Japan, Korea, Russia and the United States",
    what: "The international experimental fusion reactor being built to show that fusion can be a source of energy at scale: a tokamak designed to make 500 megawatts of fusion power from 50 megawatts of heating.",
    facts: [
      ["Site", "Saint-Paul-lez-Durance, France"],
      ["Agreement signed", "21 November 2006"],
      ["Research operation", "from 2034, by its 2024 baseline"],
      ["Deuterium-tritium fuel", "from 2039, by its 2024 baseline"],
    ],
    source: { label: "ITER Organization — What is ITER?", url: "https://www.iter.org/proj/inafewlines" },
  },
  {
    name: "National Ignition Facility",
    by: "Lawrence Livermore National Laboratory, United States",
    what: "A laser facility that on 5 December 2022 achieved fusion ignition for the first time: more energy from the fusion reaction than the lasers put into the fuel.",
    facts: [
      ["Laser energy in", "2.05 megajoules"],
      ["Fusion energy out", "3.15 megajoules"],
    ],
    source: { label: "Lawrence Livermore National Laboratory — Achieving fusion ignition", url: "https://lasers.llnl.gov/science/achieving-fusion-ignition" },
  },
  {
    name: "JET",
    by: "EUROfusion and the UK Atomic Energy Authority",
    what: "The Joint European Torus, at Culham in England, the largest tokamak to have operated until its closure. In its last deuterium-tritium campaign it set a record for fusion energy from a single pulse.",
    facts: [
      ["Record energy", "69 megajoules, in about five seconds"],
      ["Operated", "1983 to the end of 2023"],
    ],
    source: { label: "EUROfusion — JET's final tritium experiments yield new fusion energy record", url: "https://euro-fusion.org/eurofusion-news/dte3record/" },
  },
];
const PROJECTS: Project[] = [
  {
    name: "International Space Station",
    by: "NASA, Roscosmos, the European Space Agency, JAXA and the Canadian Space Agency",
    what: "A laboratory in low Earth orbit, assembled from modules launched from 1998, where people have lived and worked without a break since November 2000.",
    facts: [
      ["First module", "Zarya, launched 20 November 1998"],
      ["Crewed without a break", "since 2 November 2000"],
    ],
    source: { label: "NASA — International Space Station facts and figures", url: "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/" },
  },
  {
    name: "James Webb Space Telescope",
    by: "NASA, with the European and Canadian space agencies",
    what: "The largest space telescope yet flown, observing in the infrared from a point about 1.5 million kilometres from Earth.",
    facts: [
      ["Launched", "25 December 2021, on an Ariane 5 from Kourou"],
      ["Where it works", "the second Sun-Earth Lagrange point"],
    ],
    source: { label: "NASA — James Webb Space Telescope", url: "https://science.nasa.gov/mission/webb/" },
  },
  {
    name: "Artemis",
    by: "NASA, with international and commercial partners",
    what: "The programme to return people to the Moon. Its first flight, Artemis I, sent the uncrewed Orion spacecraft around the Moon and back.",
    facts: [["Artemis I", "launched 16 November 2022, back on 11 December 2022"]],
    source: { label: "NASA — Artemis I", url: "https://www.nasa.gov/mission/artemis-i/" },
  },
  {
    name: "Large Hadron Collider",
    by: "CERN, the European Organization for Nuclear Research",
    what: "The world's largest particle accelerator, a 27-kilometre ring under the French-Swiss border, where the discovery of the Higgs boson was announced in 2012.",
    facts: [
      ["Ring", "27 kilometres"],
      ["Higgs boson announced", "4 July 2012"],
    ],
    source: { label: "CERN — The Large Hadron Collider", url: "https://home.cern/science/accelerators/large-hadron-collider" },
  },
];
function ProjectCard({ t, p, color }: { t: Tokens; p: Project; color: string }) {
  return (
    <Panel t={t} title={p.name} meta={p.by.length > 40 ? undefined : p.by}>
      {p.by.length > 40 && (
        <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
          {p.by}
        </p>
      )}
      <p className="text-[12px] font-sans leading-snug" style={{ color: t.bodyText }}>
        {p.what}
      </p>
      <ul className="flex flex-col">
        {p.facts.map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between gap-3 py-1 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
            <span className="text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ color }}>
              {k}
            </span>
            <span className="text-[11px] font-sans font-semibold text-right" style={{ color: t.headText }}>
              {v}
            </span>
          </li>
        ))}
      </ul>
      <Foot sources={[p.source, ...(p.more ?? [])]} />
    </Panel>
  );
}
function Fusion({ t }: { t: Tokens }) {
  return (
    <section id="fusion" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Fusion" kicker="the machines chasing power from the reaction that lights the sun" />
      <Row>
        {FUSION.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 2) % INK.length]} />
        ))}
      </Row>
    </section>
  );
}
function Projects({ t }: { t: Tokens }) {
  return (
    <section id="projects-figures" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="The great projects" kicker="what nations build together in space and science" />
      <Row>
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 5) % INK.length]} />
        ))}
      </Row>
    </section>
  );
}


/* ── The frontiers: AI, clean energy, robots and computing, military technology, the Nobel Prizes ── */
const sci = (v: number) => {
  if (v >= 1e15) return `${(v / 1e15).toFixed(1)}e15`;
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v < 1 ? v.toPrecision(2) : whole(v);
};
/** A series that grows by powers of ten, on a scale of powers of ten, as its publisher charts it. */
function LogSeries({ t, rows, fmt, color, id, height = 180 }: { t: Tokens; rows: [number, number][]; fmt: (v: number) => string; color: string; id: string; height?: number }) {
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows.filter(([, v]) => v > 0).map(([y, v]) => ({ y: String(y), v }))} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.gridLine} vertical={false} />
        <XAxis dataKey="y" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} width={52} scale="log" domain={["auto", "auto"]} allowDataOverflow tickFormatter={(v: number) => fmt(v)} />
        <Tooltip contentStyle={{ background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: t.headText }} itemStyle={{ color: t.headText }} formatter={(v: number) => [fmt(v), ""]} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} baseValue="dataMin" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
const TECH_NAMES: Record<string, string> = {
  solar_photovoltaic: "Solar panels",
  onshore_wind: "Wind on land",
  offshore_wind: "Wind at sea",
  hydropower: "Hydropower",
  geothermal: "Geothermal",
  bioenergy: "Bioenergy",
  concentrated_solar_power: "Concentrated solar",
};

function AI({ t }: { t: Tokens }) {
  // The year under way is left out: its largest run so far is not the year's.
  const full = AI_COMPUTE_MAX.filter(([y]) => y < new Date().getFullYear());
  const last = full[full.length - 1];
  const first = full[0];
  return (
    <section id="ai-frontier" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Artificial intelligence" kicker="how much computing the largest systems are trained with, and who builds them" />
      <Row>
        <Panel t={t} title="The largest training run each year" meta={`petaFLOP · ${first[0]}–${last[0]}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <LogSeries t={t} id="fr-ai" rows={full.map(([y, , v]) => [y, v])} fmt={sci} color={INK[3]} />
          <Note t={t}>
            The most computation used to train any notable AI system in each year, on a scale of powers of ten: {first[1]} in {first[0]}, {sci(first[2])} petaFLOP; {last[1]} in {last[0]}, {sci(last[2])} - about {sci(last[2] / first[2])} times as
            much, worked out here.
          </Note>
          <Foot sources={[FRONTIER_SOURCES.aiCompute]} />
        </Panel>
        <Panel t={t} title="Who builds the largest systems" meta={`large-scale systems to ${AI_COUNTRIES.year}`}>
          <SlimBars labelWidth="6.5rem" rows={AI_COUNTRIES.rows.map(([n, v], i) => ({ key: n, label: n, v, color: INK[i % INK.length] }))} fmt={whole} />
          <Note t={t}>Systems trained with more than 10²³ floating-point operations, counted to date by the country of the organisation that built them, as Epoch AI records them.</Note>
          <Foot sources={[FRONTIER_SOURCES.aiCountries]} />
        </Panel>
        <Panel t={t} title="The latest notable systems" meta="Epoch AI">
          <ul className="flex flex-col">
            {AI_LATEST.map(([n, day, v]) => (
              <li key={`${n}-${day}`} className="flex items-baseline justify-between gap-3 py-1 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
                <span className="text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                  {n}
                  <span className="font-normal" style={{ color: t.mutedText }}> · {day}</span>
                </span>
                <span className="text-[10px] font-mono" style={{ color: t.bodyText }}>
                  {sci(v)} PF
                </span>
              </li>
            ))}
          </ul>
          <Note t={t}>Each system's training computation in petaFLOP, as Epoch AI estimates it from what its makers published.</Note>
          <Foot sources={[FRONTIER_SOURCES.aiCompute]} />
        </Panel>
      </Row>
    </section>
  );
}

function CleanEnergy({ t }: { t: Tokens }) {
  const sp = SOLAR_PRICE;
  const sw = SOLAR_GW.world;
  const ww = WIND_GW.world;
  const rs = RENEWABLE_SHARE;
  const ev = EV_SHARE.world;
  return (
    <section id="clean-energy" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Clean energy" kicker="what solar and wind cost now, how much is built, and how fast cars are changing" />
      <Row>
        <Panel t={t} title="What a solar panel costs" meta={`US$ a watt · ${sp[0][0]}–${sp[sp.length - 1][0]}`}>
          <LogSeries t={t} id="fr-solar-price" rows={sp} fmt={(v) => `$${v < 1 ? v.toFixed(2) : whole(v)}`} color={INK[2]} />
          <Note t={t}>
            ${sp[0][1].toFixed(0)} a watt in {sp[0][0]}, ${sp[sp.length - 1][1].toFixed(2)} in {sp[sp.length - 1][0]}: {(100 - (sp[sp.length - 1][1] / sp[0][1]) * 100).toFixed(1)}% less, worked out here. In today's dollars, on a scale of powers of ten.
          </Note>
          <Foot sources={[FRONTIER_SOURCES.solarPrice]} />
        </Panel>
        <Panel t={t} title="What a kilowatt-hour costs to make" meta={`US$ · ${LCOE.first} and ${LCOE.last}`}>
          <SlimBars labelWidth="7rem" rows={LCOE.rows.filter(([, , b]) => b !== null).map(([k, a, b], i) => ({ key: k, label: TECH_NAMES[k] ?? k, v: b as number, color: INK[(i + 1) % INK.length], tip: `${TECH_NAMES[k] ?? k}: $${(b as number).toFixed(3)} in ${LCOE.last}${a !== null ? `, $${a.toFixed(3)} in ${LCOE.first}` : ""}` }))} fmt={(v) => `$${v.toFixed(3)}`} />
          <Note t={t}>
            The cost of each new plant's electricity over its life, the world's average for plants built in {LCOE.last}.
            {(() => {
              const s = LCOE.rows.find(([k]) => k === "solar_photovoltaic");
              return s && s[1] && s[2] ? ` Solar's fell from $${s[1].toFixed(3)} in ${LCOE.first}: ${(100 - (s[2] / s[1]) * 100).toFixed(0)}% less, worked out here.` : "";
            })()}
          </Note>
          <Foot sources={[FRONTIER_SOURCES.lcoe]} />
        </Panel>
        <Panel t={t} title="Solar and wind built" meta={`gigawatts · the world · to ${sw[sw.length - 1]?.[0]}`}>
          <Tiles
            t={t}
            items={[
              ...(sw.length ? [{ label: "Solar", text: `${whole(sw[sw.length - 1][1])} GW`, y: sw[sw.length - 1][0] }] : []),
              ...(ww.length ? [{ label: "Wind", text: `${whole(ww[ww.length - 1][1])} GW`, y: ww[ww.length - 1][0] }] : []),
            ]}
          />
          <Series t={t} id="fr-solar-gw" rows={sw.filter(([y]) => y >= 2005)} fmt={(v) => `${whole(v)}`} color={INK[2]} height={140} />
          <Note t={t}>Installed solar capacity, the world's, year by year; the tiles give solar and wind for the latest year.</Note>
          <Foot sources={[FRONTIER_SOURCES.solar, FRONTIER_SOURCES.wind]} />
        </Panel>
        <Panel t={t} title="Who builds the most solar" meta={`gigawatts · ${SOLAR_GW.top.year}`}>
          <SlimBars labelWidth="6.5rem" rows={SOLAR_GW.top.rows.map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 2) % INK.length] }))} fmt={(v) => whole(v)} />
          <Foot sources={[FRONTIER_SOURCES.solar]} />
        </Panel>
        <Panel t={t} title="Electricity from renewables" meta={`% of the world's · ${rs[0]?.[0]}–${rs[rs.length - 1]?.[0]}`}>
          <Series t={t} id="fr-renew" rows={rs} fmt={(v) => `${v.toFixed(0)}%`} color={INK[1]} />
          {/* Each kind and its share of the world's electricity, as asked: the space under the line, filled. */}
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
            By kind · % of the world's electricity · {RENEWABLE_KINDS.year}
          </p>
          <SlimBars
            labelWidth="9.75rem"
            rows={RENEWABLE_KINDS.rows.filter(([, v]) => v !== null).map(([n, v, was], i) => ({ key: n, label: n, v: v as number, color: INK[(i + 1) % INK.length], tip: `${n}: ${(v as number).toFixed(2)}% of the world's electricity in ${RENEWABLE_KINDS.year}${was !== null ? `, ${was.toFixed(2)}% in ${RENEWABLE_KINDS.first}` : ""}` }))}
            fmt={(v) => `${v.toFixed(1)}%`}
          />
          <Note t={t}>
            {rs[rs.length - 1]?.[1].toFixed(1)}% of the world's electricity in {rs[rs.length - 1]?.[0]}.
            {(() => {
              const sum = RENEWABLE_KINDS.rows.reduce((n, [, v]) => n + (v ?? 0), 0);
              const top = RENEWABLE_KINDS.rows[0];
              return sum && top[1] !== null ? ` ${top[0]} is ${((100 * top[1]) / sum).toFixed(0)}% of the renewable share, solar and wind together ${((100 * ((RENEWABLE_KINDS.rows[1][1] ?? 0) + (RENEWABLE_KINDS.rows[2][1] ?? 0))) / sum).toFixed(0)}% - worked out here. In ${RENEWABLE_KINDS.first} solar made ${RENEWABLE_KINDS.rows[1][2]?.toFixed(2)}% of the world's electricity and wind ${RENEWABLE_KINDS.rows[2][2]?.toFixed(2)}%.` : "";
            })()}
          </Note>
          <Foot sources={[FRONTIER_SOURCES.renew, FRONTIER_SOURCES.renewKinds]} />
        </Panel>
        <Panel t={t} title="Electric cars" meta={`% of new cars sold · ${ev[ev.length - 1]?.[0]}`}>
          <Series t={t} id="fr-ev" rows={ev} fmt={(v) => `${v.toFixed(0)}%`} color={INK[5]} height={130} />
          <SlimBars labelWidth="6.5rem" max={100} rows={EV_SHARE.top.rows.slice(0, 6).map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 5) % INK.length] }))} fmt={(v) => `${v.toFixed(0)}%`} />
          <Note t={t}>The world's share year by year, and the countries where it is highest in {EV_SHARE.top.year}: battery and plug-in hybrid cars together.</Note>
          <Foot sources={[FRONTIER_SOURCES.ev]} />
        </Panel>
      </Row>
    </section>
  );
}

function RobotsComputing({ t }: { t: Tokens }) {
  const rw = ROBOTS.world;
  const f = FASTEST_SUPERCOMPUTER;
  return (
    <section id="robots-computing" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Robots and computing" kicker="the machines in factories, and the fastest computer on earth" />
      <Row>
        <Panel t={t} title="Industrial robots installed a year" meta={rw.length ? `the world · ${rw[0][0]}–${rw[rw.length - 1][0]}` : `${ROBOTS.top.year}`}>
          {rw.length > 2 && <Series t={t} id="fr-robots" rows={rw} fmt={(v) => `${Math.round(v / 1000)}K`} color={INK[0]} height={150} />}
          <SlimBars labelWidth="6.5rem" rows={ROBOTS.top.rows.slice(0, 6).map(([n, v], i) => ({ key: n, label: n, v, color: INK[i % INK.length] }))} fmt={(v) => whole(v)} />
          <Note t={t}>New industrial robots put to work each year{rw.length ? ", the world's," : ""} and in the countries installing the most in {ROBOTS.top.year}.</Note>
          <Foot sources={[FRONTIER_SOURCES.robots]} />
        </Panel>
        <Panel t={t} title="The fastest supercomputer" meta={`gigaFLOPS · ${f[0][0]}–${f[f.length - 1][0]}`}>
          <LogSeries t={t} id="fr-flops" rows={f} fmt={sci} color={INK[3]} />
          <Note t={t}>
            The computing power of the world's fastest machine on the TOP500 list each year: {sci(f[0][1])} gigaFLOPS in {f[0][0]}, {sci(f[f.length - 1][1])} in {f[f.length - 1][0]}.
          </Note>
          <Foot sources={[FRONTIER_SOURCES.flops]} />
        </Panel>
      </Row>
    </section>
  );
}

function Military({ t }: { t: Tokens }) {
  const total = NUCLEAR_WARHEADS.rows.reduce((n, r) => n + r[1] + r[2] + r[3], 0);
  return (
    <section id="military-tech" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Military technology" kicker="the most powerful weapons states hold, as the open record counts them" />
      <Row>
        <Panel t={t} title="Nuclear warheads" meta={`stockpiles · ${NUCLEAR_WARHEADS.year}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <SlimBars labelWidth="7rem" rows={NUCLEAR_WARHEADS.rows.map(([n, a, b, c], i) => ({ key: n, label: n, v: a + b + c, color: INK[(i + 4) % INK.length], tip: `${n}: ${whole(a)} deployed strategic, ${whole(b)} deployed non-strategic, ${whole(c)} in reserve` }))} fmt={whole} />
          <Note t={t}>
            Each state's stockpile - deployed and in reserve, not those retired and awaiting dismantlement - as the Federation of American Scientists estimates it: {whole(total)} in all, added here. The exact numbers are secret; these are its
            best estimates from what governments disclose.
          </Note>
          <Foot sources={[FRONTIER_SOURCES.nukes]} />
        </Panel>
        <Panel t={t} title="Deployed, and in reserve" meta={`${NUCLEAR_WARHEADS.year}`}>
          <ul className="flex flex-col">
            {NUCLEAR_WARHEADS.rows.map(([n, a, b, c, d]) => (
              <li key={n} className="flex items-baseline justify-between gap-2 py-1 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
                <span className="text-[11px] font-sans font-semibold" style={{ color: t.headText }}>{n}</span>
                <span className="text-[10px] font-mono text-right" style={{ color: t.bodyText }}>
                  {whole(a + b)} deployed · {whole(c)} reserve{d ? ` · ${whole(d)} retired` : ""}
                </span>
              </li>
            ))}
          </ul>
          <Foot sources={[FRONTIER_SOURCES.nukes]} />
        </Panel>
      </Row>
      <p className="text-[10px] font-sans px-1" style={{ color: t.mutedText }}>
        Of other military technology - drones, hypersonic missiles, the arms trade - no open body publishes figures the site may use: the arms-transfer databases are for non-commercial use, so none are shown.
      </p>
    </section>
  );
}

function Nobel({ t }: { t: Tokens }) {
  const years = [...new Set(NOBEL_SCIENCE.map(([y]) => y))].sort((a, b) => b - a);
  const color: Record<string, string> = { Physics: INK[0], Chemistry: INK[1], "Physiology or Medicine": INK[6] };
  return (
    <section id="nobel" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="The breakthroughs the Nobel committees named" kicker="physics, chemistry, and physiology or medicine, year by year" />
      <Row>
        {years.slice(0, 6).map((y) => (
          <Panel key={y} t={t} title={String(y)} meta="Nobel Prizes in the sciences">
            <ul className="flex flex-col gap-2.5">
              {NOBEL_SCIENCE.filter(([py]) => py === y).map(([, field, who, why]) => (
                <li key={field} className="flex flex-col gap-0.5 pl-2 border-l-2" style={{ borderColor: color[field] ?? INK[3] }}>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: color[field] ?? t.mutedText }}>
                    {field}
                  </span>
                  <span className="text-[11px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                    {who.join(", ")}
                  </span>
                  <span className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {why.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("; ")}
                  </span>
                </li>
              ))}
            </ul>
            <Foot sources={[FRONTIER_SOURCES.nobel]} />
          </Panel>
        ))}
      </Row>
      <p className="text-[10px] font-sans px-1" style={{ color: t.mutedText }}>
        Each prize's laureates and the committee's own words for why, as the Nobel Prize's own record gives them: the last six years.
      </p>
    </section>
  );
}

/* ── More of the frontiers: satellites and telescopes, research budgets, materials, physics, scanners, brain maps, engineered life, and
   drones, weapons and AI. The figures are the OECD's and GCAT's (frontiers2.ts); each card gives only what its body's own page, or the
   journal its work appeared in, says, with a link to it. ── */
const usdM = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${whole(v)}M`);
/** The countries' research budgets for one objective, largest first. */
const objective = (k: string) =>
  RD_BUDGETS.flatMap((b) => {
    const v = b.parts.find(([o]) => o === k)?.[1];
    return v ? [{ name: b.name, v, year: b.year, share: (100 * v) / b.total }] : [];
  }).sort((a, b) => b.v - a.v);
function ObjectivePanel({ t, k, title, color, n = 8, wide = false }: { t: Tokens; k: string; title: string; color: number; n?: number; wide?: boolean }) {
  const list = objective(k).slice(0, n);
  if (!list.length) return null;
  return (
    <Panel t={t} title={title} meta="government R&D budgets · US$ at PPP" className={wide ? "md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]" : undefined}>
      <SlimBars labelWidth="6.5rem" rows={list.map((r, i) => ({ key: r.name, label: r.name, v: r.v, color: INK[(i + color) % INK.length], tip: `${r.name}: ${usdM(r.v)} in ${r.year}, ${r.share.toFixed(1)}% of its research budget (worked out here)` }))} fmt={usdM} />
      <Note t={t}>
        What each government set aside for research and development with this aim, as it reports it to the OECD, in its latest year ({[...new Set(list.map((r) => r.year))].sort().join(", ")}). Dollars at purchasing power parity,
        current prices; no total is added up across years that differ.
      </Note>
      <Foot sources={[FRONTIER2_SOURCES.gbard]} />
    </Panel>
  );
}

function Satellites({ t }: { t: Tokens }) {
  const s = SATELLITES;
  const w = SATELLITES_WORKING;
  const L = SATELLITES_LAUNCHED;
  return (
    <section id="satellites" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Satellites" kicker="how many are launched each year and by whom, what is working in space, whose it is, and what it does" />
      {/* The satellites launched, as asked: each year, whose they were and what for - above what the working ones do. */}
      <Row>
        <Panel t={t} title="Satellites launched each year" meta={`payloads · GCAT · ${L.series[0][0]}–${L.lastFull}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <Tiles
            t={t}
            items={[
              { label: `Launched in ${L.lastFull}`, text: whole(L.series[L.series.length - 1][1]), y: `owned in ${L.states} countries` },
              { label: `${L.thisYear} so far`, text: whole(L.soFar), y: s.updated.slice(0, 11) },
            ]}
          />
          <Series t={t} id="ip-sats-launched" rows={L.series} fmt={big} color={SPACEX} height={150} />
          <Note t={t}>
            Every payload GCAT's catalogue gives a launch date in the year - satellites, probes and the like, not the rockets that carried them - counted here. The rise since 2019 is
            mostly the large constellations, Starlink above all.
          </Note>
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title={`Whose they were, ${L.lastFull}`} meta="payloads launched · by owning state">
          <SlimBars labelWidth="6.5rem" rows={L.byState.slice(0, 10).map(([n, , v], i) => ({ key: n, label: n, v, color: n === "United States" ? SPACEX : INK[(i + 2) % INK.length] }))} fmt={whole} />
          <Note t={t}>The state GCAT gives as each payload's owner - where the satellite's operator is, not where it was launched from.</Note>
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title={`What they were launched to do, ${L.lastFull}`} meta="payloads launched · by GCAT's category">
          <SlimBars labelWidth="7.5rem" rows={L.byUse.slice(0, 10).map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 4) % INK.length] }))} fmt={whole} />
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title={`Whose, ${L.thisYear} so far`} meta="payloads launched · by owning state">
          <SlimBars labelWidth="6.5rem" rows={L.byStateNow.slice(0, 10).map(([n, , v], i) => ({ key: n, label: n, v, color: n === "United States" ? SPACEX : INK[(i + 2) % INK.length] }))} fmt={whole} />
          <Note t={t}>The year is under way: these are the payloads launched up to GCAT's latest update, {s.updated.slice(0, 11)}.</Note>
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
      </Row>
      <Row>
        <Panel t={t} title="Satellites and probes working" meta={`GCAT · ${w[0][0]}–${s.updated.slice(0, 4)}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <Tiles
            t={t}
            items={[
              { label: "Working now", text: whole(s.total), y: s.updated.slice(0, 11) },
              { label: "Of them Starlink's", text: whole(s.starlink), y: `${((s.starlink / s.total) * 100).toFixed(0)}% of all, worked out here` },
            ]}
          />
          <Series t={t} id="ip-sats" rows={w} fmt={big} color={SPACEX} height={150} />
          <Note t={t}>
            Payloads whose operations GCAT gives as still under way. The line is those working at the end of each year, counted here from GCAT's launch and end-of-operations dates: {whole(w[w.length - 1][1])} at the end of {w[w.length - 1][0]}.
          </Note>
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title="Whose they are" meta="payloads working · by owning state">
          <SlimBars labelWidth="6.5rem" rows={s.byState.slice(0, 10).map(([n, , v], i) => ({ key: n, label: n, v, color: n === "United States" ? SPACEX : INK[(i + 2) % INK.length] }))} fmt={whole} />
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title="What they do" meta="payloads working · by GCAT's category">
          <SlimBars labelWidth="7.5rem" rows={s.byUse.slice(0, 10).map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 4) % INK.length] }))} fmt={whole} />
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <Panel t={t} title="Commercial, civil, military" meta="payloads working · by GCAT's class of owner">
          <SlimBars labelWidth="6.5rem" rows={s.byClass.filter(([n]) => n !== "Other").map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 1) % INK.length], tip: `${n}: ${whole(v)}, ${((v / s.total) * 100).toFixed(1)}% of all (worked out here)` }))} fmt={whole} />
          <Note t={t}>Commercial is owned by companies; civil by governments' civil agencies and universities; military by armed forces and defence agencies; amateur by radio amateurs and hobbyists.</Note>
          <Foot sources={[FRONTIER2_SOURCES.satellites]} />
        </Panel>
        <ObjectivePanel t={t} k="NABS03" title="What governments budget for space research" color={5} />
      </Row>
    </section>
  );
}

const TELESCOPES: Project[] = [
  {
    name: "Nancy Grace Roman Space Telescope",
    by: "NASA",
    what: "A wide-field infrared survey telescope, built to settle questions of dark energy, planets around other stars and astrophysics.",
    facts: [
      ["Launched", "30 August 2026, on a SpaceX Falcon Heavy"],
      ["From", "Launch Complex 39A, Kennedy Space Center"],
      ["Where it works", "the second Sun-Earth Lagrange point"],
    ],
    source: { label: "NASA — Roman launch", url: "https://science.nasa.gov/mission/roman-space-telescope/roman-launch/" },
  },
  {
    name: "Vera C. Rubin Observatory",
    by: "the US National Science Foundation and Department of Energy",
    what: "A telescope on Cerro Pachón in Chile with the largest camera ever built for astronomy, which is to photograph the whole southern sky every few nights for ten years: the Legacy Survey of Space and Time.",
    facts: [
      ["Camera", "3,200 megapixels"],
      ["Main mirror", "8.4 metres"],
      ["First images shown", "23 June 2025"],
    ],
    source: { label: "Rubin Observatory — First Look", url: "https://rubinobservatory.org/news/rubin-first-look" },
  },
  {
    name: "Extremely Large Telescope",
    by: "the European Southern Observatory",
    what: "The largest optical and infrared telescope under construction, on Cerro Armazones in Chile's Atacama Desert: its main mirror is made of hundreds of hexagonal segments.",
    facts: [
      ["Main mirror", "39 metres, of 798 segments"],
      ["Altitude", "3,046 metres"],
      ["Technical first light", "planned for 2029"],
    ],
    source: { label: "ESO — The ELT in numbers", url: "https://elt.eso.org/about/facts/" },
  },
  {
    name: "Hubble Space Telescope",
    by: "NASA and the European Space Agency",
    what: "The space telescope that has observed in visible, ultraviolet and near-infrared light from low Earth orbit since 1990, serviced in orbit by five Space Shuttle crews.",
    facts: [["Launched", "24 April 1990, on Space Shuttle Discovery"]],
    source: { label: "NASA — Hubble Space Telescope", url: "https://science.nasa.gov/mission/hubble/" },
  },
];
function Telescopes({ t }: { t: Tokens }) {
  const astro = SATELLITES.byUse.find(([n]) => n === "Astronomy")?.[1];
  return (
    <section id="telescopes" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Telescopes" kicker="the great eyes on the sky, in orbit and on the ground" />
      <Row>
        {TELESCOPES.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 3) % INK.length]} />
        ))}
      </Row>
      {astro !== undefined && (
        <p className="text-[10px] font-sans px-1" style={{ color: t.mutedText }}>
          {whole(astro)} astronomy payloads are working in space now, by GCAT's count; the James Webb Space Telescope is among the great projects below.
        </p>
      )}
    </section>
  );
}

function Budgets({ t }: { t: Tokens }) {
  const [code, setCode] = useState(RD_BUDGETS[0]?.code ?? "");
  const b = RD_BUDGETS.find((x) => x.code === code) ?? RD_BUDGETS[0];
  if (!b) return null;
  const series = RD_BUDGET_SERIES[b.code] ?? [];
  const parts = [...b.parts].sort((x, y) => y[1] - x[1]);
  return (
    <section id="budgets" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Research budgets" kicker="what governments set aside for research, and what for" />
      <Row>
        <Panel t={t} title="Who budgets most for research" meta="government R&D budgets · US$ at PPP · each its latest year">
          <SlimBars labelWidth="6.5rem" rows={RD_BUDGETS.slice(0, 12).map((r, i) => ({ key: r.code, label: r.name, v: r.total, color: r.code === b.code ? INK[3] : INK[(i + 5) % INK.length], tip: `${r.name}: ${usdM(r.total)} in ${r.year}` }))} fmt={usdM} />
          <Note t={t}>
            What each government set aside in its budget for research and development, all aims together, as it reports it to the OECD. China does not report to this series, so is not here.
          </Note>
          <Foot sources={[FRONTIER2_SOURCES.gbard]} />
        </Panel>
        <Panel t={t} title={`What ${b.name}'s is for`} meta={`by objective · ${b.year}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <div className="flex flex-wrap gap-1.5">
            {RD_BUDGETS.slice(0, 10).map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => setCode(r.code)}
                aria-pressed={r.code === b.code}
                className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: r.code === b.code ? INK[3] : t.tile, color: r.code === b.code ? "#fff" : t.bodyText, border: `1px solid ${t.gridLine}` }}
              >
                {r.name}
              </button>
            ))}
          </div>
          <SlimBars labelWidth="11rem" rows={parts.map(([k, v], i) => ({ key: k, label: RD_OBJECTIVES[k] ?? k, v, color: INK[i % INK.length], tip: `${RD_OBJECTIVES[k] ?? k}: ${usdM(v)}, ${((100 * v) / b.total).toFixed(1)}% of ${usdM(b.total)} (worked out here)` }))} fmt={usdM} />
          {series.length > 1 && <Series t={t} id="ip-gbard" rows={series} fmt={usdM} color={INK[3]} height={110} />}
          <Note t={t}>
            {usdM(b.total)} in all in {b.year}, by the socio-economic objective it names; the parts need not add up to the whole, as some is not given an aim.{series.length > 1 ? ` The line is the total, ${series[0][0]}–${series[series.length - 1][0]}.` : ""}
          </Note>
          <Foot sources={[FRONTIER2_SOURCES.gbard]} />
        </Panel>
        <ObjectivePanel t={t} k="NABS07" title="Health research" color={6} n={6} />
        <ObjectivePanel t={t} k="NABS05" title="Energy research" color={2} n={6} />
        <ObjectivePanel t={t} k="NABS06" title="Industry and technology research" color={0} n={6} />
      </Row>
    </section>
  );
}

/** The prizes for new materials: the Nobel record's own words; those before 2016 are written here from the Nobel Prize's pages. */
const MATERIAL_PRIZES: [year: number, field: string, who: string, why: string, url?: string][] = [
  ...NOBEL_SCIENCE.filter(([y, f]) => f === "Chemistry" && [2025, 2023, 2019, 2016].includes(y)).map(([y, f, who, why]) => [y, f, who.join(", "), why.join("; ")] as [number, string, string, string]),
  [2014, "Physics", "Isamu Akasaki, Hiroshi Amano, Shuji Nakamura", "for the invention of efficient blue light-emitting diodes which has enabled bright and energy-saving white light sources", "https://www.nobelprize.org/prizes/physics/2014/summary/"],
  [2010, "Physics", "Andre Geim, Konstantin Novoselov", "for groundbreaking experiments regarding the two-dimensional material graphene", "https://www.nobelprize.org/prizes/physics/2010/summary/"],
];
function Materials({ t }: { t: Tokens }) {
  const bat = BATTERY_CELL_PRICE.series;
  return (
    <section id="materials" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Materials science" kicker="the new materials the Nobel committees named, and what one of them now costs" />
      <Row>
        <Panel t={t} title="Materials that won a Nobel Prize" meta="chemistry and physics" className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {MATERIAL_PRIZES.map(([y, f, who, why]) => (
              <li key={`${y}-${f}`} className="flex flex-col gap-0.5 pl-2 border-l-2" style={{ borderColor: f === "Physics" ? INK[0] : INK[1] }}>
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: f === "Physics" ? INK[0] : INK[1] }}>
                  {y} · {f}
                </span>
                <span className="text-[11px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                  {who}
                </span>
                <span className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                  {why.charAt(0).toUpperCase() + why.slice(1)}
                </span>
              </li>
            ))}
          </ul>
          <Note t={t}>Metal-organic frameworks, quantum dots, lithium-ion batteries, molecular machines, blue LEDs and graphene: each prize's laureates and the committee's own words for why.</Note>
          <Foot sources={[FRONTIER_SOURCES.nobel, ...MATERIAL_PRIZES.flatMap(([y, f, , , url]) => (url ? [{ label: `The Nobel Prize — ${f} ${y}`, url }] : []))]} />
        </Panel>
        <Panel t={t} title="What a lithium-ion battery cell costs" meta={`US$ a kilowatt-hour · ${bat[0][0]}–${bat[bat.length - 1][0]}`}>
          <LogSeries t={t} id="ip-battery" rows={bat} fmt={(v) => `$${whole(v)}`} color={INK[1]} />
          <Note t={t}>
            ${whole(bat[0][1])} a kilowatt-hour in {bat[0][0]}, ${whole(bat[bat.length - 1][1])} in {bat[bat.length - 1][0]}: {(100 - (bat[bat.length - 1][1] / bat[0][1]) * 100).toFixed(1)}% less, worked out here. In 2024 dollars, on a scale of powers of ten.
          </Note>
          <Foot sources={[BATTERY_CELL_PRICE.source]} />
        </Panel>
      </Row>
    </section>
  );
}

const DISCOVERIES: Project[] = [
  {
    name: "Gravitational waves",
    by: "LIGO, Caltech and MIT",
    what: "Ripples in spacetime, foretold by Einstein's general relativity, detected for the first time by LIGO's two detectors in the United States, from two black holes merging.",
    facts: [
      ["Detected", "14 September 2015"],
      ["Announced", "11 February 2016"],
    ],
    source: { label: "LIGO Caltech — Gravitational waves detected 100 years after Einstein's prediction", url: "https://www.ligo.caltech.edu/news/ligo20160211" },
  },
  {
    name: "Willow",
    by: "Google Quantum AI",
    what: "A quantum computing chip with which Google reported errors falling, rather than rising, as more qubits were joined together: a step its makers count towards a quantum computer large enough to be useful.",
    facts: [
      ["Qubits", "105"],
      ["Announced", "9 December 2024"],
    ],
    source: { label: "Google — Meet Willow, our state-of-the-art quantum chip", url: "https://blog.google/technology/research/google-willow-quantum-chip/" },
  },
];
function Physics({ t }: { t: Tokens }) {
  const prizes = NOBEL_SCIENCE.filter(([, f]) => f === "Physics").slice(0, 6);
  return (
    <section id="physics" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Physics" kicker="the discoveries the Nobel committee named, and the experiments at the edge" />
      <Row>
        <Panel t={t} title="The Nobel Prize in Physics" meta={`${prizes[prizes.length - 1]?.[0]}–${prizes[0]?.[0]}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {prizes.map(([y, , who, why]) => (
              <li key={y} className="flex flex-col gap-0.5 pl-2 border-l-2" style={{ borderColor: INK[0] }}>
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: INK[0] }}>
                  {y}
                </span>
                <span className="text-[11px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                  {who.join(", ")}
                </span>
                <span className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                  {why.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("; ")}
                </span>
              </li>
            ))}
          </ul>
          <Foot sources={[FRONTIER_SOURCES.nobel]} />
        </Panel>
        {DISCOVERIES.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 1) % INK.length]} />
        ))}
      </Row>
      <p className="text-[10px] font-sans px-1" style={{ color: t.mutedText }}>The Large Hadron Collider, where the Higgs boson was found, is among the great projects; the fastest computers are under Technology.</p>
    </section>
  );
}

const SCAN_COLORS: Record<string, number> = { MRI: 3, CT_SCAN: 5, PET_SCAN: 6 };
function Scanners({ t }: { t: Tokens }) {
  return (
    <section id="scanners" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Scanners" kicker="the machines that see inside the body, and who has the most" />
      <Row>
        {(["MRI", "CT_SCAN", "PET_SCAN"] as const).map((k) => {
          const list = SCANNERS[k] ?? [];
          if (!list.length) return null;
          return (
            <Panel key={k} t={t} title={`${SCANNER_KINDS[k]} per million people`} meta={`OECD · each its latest year`}>
              <SlimBars labelWidth="6.5rem" rows={list.slice(0, 10).map(([n, , v, y], i) => ({ key: n, label: n, v, color: INK[(i + SCAN_COLORS[k]) % INK.length], tip: `${n}: ${v} per million · ${y}` }))} fmt={(v) => v.toFixed(1)} />
              <Note t={t}>
                {k === "MRI"
                  ? "Magnetic resonance imaging: whole-body scanners that picture soft tissue with magnets and radio waves."
                  : k === "CT_SCAN"
                    ? "Computed tomography: whole-body scanners that build a picture from X-rays taken from many angles."
                    : "Positron emission tomography: scanners that show how tissues work, from a tracer injected into the blood."}{" "}
                In hospitals and clinics together; {list.length} countries report one from the last six years.
              </Note>
              <Foot sources={[FRONTIER2_SOURCES.scanners]} />
            </Panel>
          );
        })}
        <ObjectivePanel t={t} k="NABS07" title="What governments budget for health research" color={6} wide />
      </Row>
    </section>
  );
}

const BRAIN_MAPS: Project[] = [
  {
    name: "The fruit fly's whole brain",
    by: "the FlyWire consortium, with the NIH BRAIN Initiative",
    what: "The first complete map of every neuron in an adult fruit fly's brain and the connections between them: the largest and most complete wiring diagram of an adult animal's brain yet made, published as nine papers in Nature.",
    facts: [
      ["Neurons", "139,000"],
      ["Synapses", "more than 50 million"],
      ["Published", "2 October 2024"],
    ],
    source: { label: "US National Institutes of Health — Researchers fully map neural connections of the fruit fly brain", url: "https://www.nih.gov/news-events/news-releases/researchers-fully-map-neural-connections-fruit-fly-brain" },
  },
  {
    name: "A cubic millimetre of mouse brain",
    by: "the MICrONS programme, funded by IARPA and the NIH BRAIN Initiative",
    what: "The wiring of a piece of a mouse's visual cortex the size of a grain of sand, mapped together with how its neurons fired as the mouse watched video: ten papers in the Nature journals from more than 150 scientists.",
    facts: [
      ["Cells", "more than 200,000"],
      ["Synapses", "more than 524 million"],
      ["Axons", "four kilometres"],
      ["Published", "9 April 2025"],
    ],
    source: { label: "US National Institutes of Health — Scientists map unprecedented detail of connections and visual perception in the mouse brain", url: "https://www.nih.gov/news-events/news-releases/scientists-map-unprecedented-detail-connections-visual-perception-mouse-brain" },
  },
  {
    name: "The mouse brain's cells",
    by: "the NIH BRAIN Initiative",
    what: "The first complete atlas of the cells of the mouse brain: the types of cell and where each is found.",
    facts: [
      ["Cells surveyed", "more than 32 million"],
      ["Completed", "2023"],
    ],
    source: { label: "US National Institutes of Health — Scientists map unprecedented detail of connections and visual perception in the mouse brain", url: "https://www.nih.gov/news-events/news-releases/scientists-map-unprecedented-detail-connections-visual-perception-mouse-brain" },
  },
];
function BrainMapping({ t }: { t: Tokens }) {
  return (
    <section id="brain-mapping" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Brain mapping" kicker="the wiring of brains, neuron by neuron" />
      <Row>
        {BRAIN_MAPS.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 6) % INK.length]} />
        ))}
      </Row>
    </section>
  );
}

const ENGINEERED: Project[] = [
  {
    name: "The minimal synthetic cell",
    by: "the J. Craig Venter Institute",
    what: "A bacterium running on a genome designed and built in the laboratory, cut down from the first synthetic cell its team made in 2010 to the smallest genome of any self-replicating organism.",
    facts: [
      ["Genes", "473"],
      ["Genome", "531,000 base pairs"],
      ["Published", "Science, 25 March 2016"],
    ],
    source: { label: "J. Craig Venter Institute — First minimal synthetic bacterial cell", url: "https://www.jcvi.org/research/first-minimal-synthetic-bacterial-cell" },
  },
  {
    name: "Casgevy",
    by: "approved by the US Food and Drug Administration",
    what: "A treatment for sickle cell disease that edits the patient's own blood stem cells: the first therapy the FDA approved that uses CRISPR/Cas9 genome editing.",
    facts: [["Approved", "8 December 2023"]],
    source: { label: "US Food and Drug Administration — FDA approves first gene therapies to treat patients with sickle cell disease", url: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapies-treat-patients-sickle-cell-disease" },
  },
  {
    name: "A gene edit made for one child",
    by: "Children's Hospital of Philadelphia and Penn Medicine, supported by the NIH",
    what: "A base-editing therapy designed and made for a single infant with CPS1 deficiency, a rare and incurable disease of the liver, from diagnosis to treatment in six months: the first time the technology had been used successfully to treat a patient.",
    facts: [
      ["Announced", "15 May 2025"],
      ["Published", "The New England Journal of Medicine"],
    ],
    source: { label: "US National Institutes of Health — Infant with rare, incurable disease is first to successfully receive personalized gene therapy treatment", url: "https://www.nih.gov/news-events/news-releases/infant-rare-incurable-disease-first-successfully-receive-personalized-gene-therapy-treatment" },
  },
];
function EngineeredLife({ t }: { t: Tokens }) {
  const prizes = NOBEL_SCIENCE.filter(([y, f]) => (y === 2020 || y === 2018 || y === 2024) && f === "Chemistry");
  return (
    <section id="engineered-life" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Engineered life" kicker="cells built in the laboratory, and genes edited to treat disease" />
      <Row>
        {ENGINEERED.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 2) % INK.length]} />
        ))}
        {prizes.length > 0 && (
          <Panel t={t} title="The tools, and their Nobel Prizes" meta="chemistry" className="md:!basis-full xl:!basis-full">
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2.5">
              {prizes.map(([y, , who, why]) => (
                <li key={y} className="flex flex-col gap-0.5 pl-2 border-l-2" style={{ borderColor: INK[1] }}>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: INK[1] }}>
                    {y}
                  </span>
                  <span className="text-[11px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                    {who.join(", ")}
                  </span>
                  <span className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {why.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("; ")}
                  </span>
                </li>
              ))}
            </ul>
            <Foot sources={[FRONTIER_SOURCES.nobel]} />
          </Panel>
        )}
      </Row>
    </section>
  );
}

const AUTONOMY: Project[] = [
  {
    name: "Autonomous weapons at the United Nations",
    by: "the UN General Assembly",
    what: "The General Assembly's first resolutions on lethal autonomous weapons systems - weapons that, once switched on, choose and strike targets without a person deciding each time. The second set up talks in New York; neither began a treaty.",
    facts: [
      ["Resolution 78/241", "22 December 2023 · 152 for, 4 against, 11 abstaining"],
      ["Resolution 79/62", "2 December 2024 · 166 for, 3 against, 15 abstaining"],
    ],
    source: { label: "UN Digital Library — Lethal autonomous weapons systems: resolution adopted by the General Assembly (A/RES/78/241)", url: "https://digitallibrary.un.org/record/4033027" },
    more: [{ label: "UN Digital Library — Lethal autonomous weapons systems: resolution adopted by the General Assembly (A/RES/79/62)", url: "https://digitallibrary.un.org/record/4071100" }],
  },
  {
    name: "Autonomy in weapon systems: the US rules",
    by: "the US Department of Defense",
    what: "The Pentagon's directive on weapons that can select and engage targets on their own: they are to let commanders and operators use appropriate human judgment over the use of force, and must pass senior review before they are developed or fielded.",
    facts: [
      ["Directive", "3000.09"],
      ["In force", "from 25 January 2023, replacing the 2012 directive"],
    ],
    source: { label: "US Department of Defense — Directive 3000.09, Autonomy in Weapon Systems", url: "https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodd/300009p.PDF" },
  },
];
function MilitaryAI({ t }: { t: Tokens }) {
  const mil = SATELLITES.byClass.find(([n]) => n === "Military")?.[1];
  return (
    <section id="military-ai" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Drones, weapons and AI" kicker="what governments spend on military research, what armed forces have in orbit, and the rules for weapons that decide" />
      <Row>
        <ObjectivePanel t={t} k="NABS14" title="What governments budget for defence research" color={4} n={10} wide />
        {mil !== undefined && (
          <Panel t={t} title="Military satellites working" meta={`GCAT · ${SATELLITES.updated.slice(0, 11)}`}>
            <Tiles
              t={t}
              items={[
                { label: "Military", text: whole(mil), y: `${((mil / SATELLITES.total) * 100).toFixed(1)}% of all working, worked out here` },
                { label: "Signals intelligence", text: whole(SATELLITES.militaryUse.find(([n]) => n === "Signals intelligence")?.[1] ?? 0), y: "military" },
              ]}
            />
            <SlimBars labelWidth="7.5rem" rows={SATELLITES.militaryUse.filter(([n]) => n !== "Other").slice(0, 7).map(([n, v], i) => ({ key: n, label: n, v, color: INK[(i + 4) % INK.length] }))} fmt={whole} />
            <Note t={t}>Payloads owned by armed forces and defence agencies whose operations GCAT gives as still under way, by what they do.</Note>
            <Foot sources={[FRONTIER2_SOURCES.satellites]} />
          </Panel>
        )}
        {AUTONOMY.map((p, i) => (
          <ProjectCard key={p.name} t={t} p={p} color={INK[(i + 4) % INK.length]} />
        ))}
      </Row>
      <p className="text-[10px] font-sans px-1" style={{ color: t.mutedText }}>
        Counts of military drones, of hypersonic missiles and of the arms trade are not shown: the databases that keep them are for non-commercial use, and no government publishes its own. Defence research budgets cover drones, weapons and military AI
        together; no government breaks them out.
      </p>
    </section>
  );
}

/** The parts the page's fields can show, by id. */
export const INNOVATION_PARTS = ["space-race", "science-output", "medicine", "fusion", "projects", "ai", "clean-energy", "robots-computing", "military", "nobel", "satellites", "telescopes", "budgets", "materials", "physics", "scanners", "brain-mapping", "engineered-life", "military-ai"] as const;
export default function InnovationPart({ part }: { part: string }) {
  const t = useTokens();
  const parts: Record<string, ReactNode> = {
    "space-race": <Space t={t} />,
    "science-output": <Science t={t} />,
    medicine: <Medicine t={t} />,
    fusion: <Fusion t={t} />,
    projects: <Projects t={t} />,
    ai: <AI t={t} />,
    "clean-energy": <CleanEnergy t={t} />,
    "robots-computing": <RobotsComputing t={t} />,
    military: <Military t={t} />,
    nobel: <Nobel t={t} />,
    satellites: <Satellites t={t} />,
    telescopes: <Telescopes t={t} />,
    budgets: <Budgets t={t} />,
    materials: <Materials t={t} />,
    physics: <Physics t={t} />,
    scanners: <Scanners t={t} />,
    "brain-mapping": <BrainMapping t={t} />,
    "engineered-life": <EngineeredLife t={t} />,
    "military-ai": <MilitaryAI t={t} />,
  };
  return <>{parts[part] ?? null}</>;
}
