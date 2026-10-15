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
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ORBITAL_LAUNCHES, LAUNCHES_PARTIAL_YEAR, LAUNCH_AGENCIES, SPACE_OBJECTS, RD_SHARE, RESEARCHERS, ARTICLES, PATENTS, FDA_APPROVALS, INNOVATION_SOURCES } from "../data/innovation";
import { GENOME_COST } from "../data/technology";
import { AI_COMPUTE_MAX, AI_LATEST, AI_COUNTRIES, SOLAR_PRICE, SOLAR_GW, WIND_GW, RENEWABLE_SHARE, LCOE, EV_SHARE, ROBOTS, FASTEST_SUPERCOMPUTER, NUCLEAR_WARHEADS, NOBEL_SCIENCE, FRONTIER_SOURCES } from "../data/frontiers";
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
      <Head t={t} title="Medicine and biology" kicker="new medicines, and what it costs to read a human genome" />
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
      </Row>
    </section>
  );
}

/* ── Fusion and the great projects ── */
type Project = { name: string; by: string; what: string; facts: [label: string, value: string][]; source: { label: string; url: string } };
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
      <Foot sources={[p.source]} />
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
  const last = AI_COMPUTE_MAX[AI_COMPUTE_MAX.length - 1];
  const first = AI_COMPUTE_MAX[0];
  return (
    <section id="ai-frontier" className="scroll-mt-36 flex flex-col gap-3">
      <Head t={t} title="Artificial intelligence" kicker="how much computing the largest systems are trained with, and who builds them" />
      <Row>
        <Panel t={t} title="The largest training run each year" meta={`petaFLOP · ${first[0]}–${last[0]}`} className="md:!basis-full xl:!basis-[calc(66.666%-0.25rem)]">
          <LogSeries t={t} id="fr-ai" rows={AI_COMPUTE_MAX.map(([y, , v]) => [y, v])} fmt={sci} color={INK[3]} />
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
          <Note t={t}>
            {rs[rs.length - 1]?.[1].toFixed(1)}% of the world's electricity in {rs[rs.length - 1]?.[0]}: hydropower, wind, solar, bioenergy and the rest.
          </Note>
          <Foot sources={[FRONTIER_SOURCES.renew]} />
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

/** The parts the page's fields can show, by id. */
export const INNOVATION_PARTS = ["space-race", "science-output", "medicine", "fusion", "projects", "ai", "clean-energy", "robots-computing", "military", "nobel"] as const;
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
  };
  return <>{parts[part] ?? null}</>;
}
