/**
 * The Dashboard's four drop-down cards: up-and-coming industries, funding
 * raised, alliances, and research and development.
 *
 * They are back where they stood, as asked, in the cards they were in. What
 * they hold is not what they held. The old ones were typed in: "Quantum
 * Computing +68%", "AI / ML $94B raised", and a list of "breakthroughs" that
 * included a crewed lunar orbit that had not flown. No body publishes those
 * growth rates or totals, and the site's rule is that a figure is its
 * publisher's or it is not shown. So each card is filled from series the
 * site already holds, each with its year and its source:
 *
 *   Up-and-coming industries  the fastest-growing of the industries and
 *                             technologies the site follows: each one's
 *                             latest year against the year before
 *   Funding raised            private investment in AI by where it was
 *                             raised, and corporate deals by kind (Quid, via
 *                             Stanford's AI Index)
 *   Alliances                 the alliances, blocs and agencies the United
 *                             States belongs to, from each body's own page
 *   Research & development    what research has delivered, then and now: the
 *                             cost of a genome, transistors on a chip, the
 *                             fastest computer, the price of storage, solar
 *                             modules and battery cells - and what the world
 *                             puts into research
 *
 * A growth rate, a share and a multiple are worked out here from two
 * published figures of one series; the cards say so.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Atom, Bank, Handshake, Sparkle } from "@phosphor-icons/react";
import { WORLD } from "../data/worldview";
import { AI_DEALS, AI_DEALS_SOURCE, AI_INVESTMENT_PLACES, AI_INVESTMENT_PLACES_SOURCE, DATA_CENTRES, DISK_PRICE, DRIVERLESS_TAXIS, GENOME_COST, LARGE_AI_SYSTEMS, SUPERCOMPUTER, TRANSISTORS } from "../data/technology";
import { BATTERY_CELL_PRICE, RENEWABLE_GENERATION, RENEWABLE_GENERATION_SOURCE, SOLAR_MODULE_PRICE } from "../data/renewables";
import { ALLIANCES, ALLIANCES_CHECKED } from "../data/alliances";
import { useTokens, type Tokens } from "./DataExplorer";
import { PartsBar } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Point = [year: number, value: number];

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e12 ? `${Number((v / 1e12).toFixed(2))}tn` : a >= 1e9 ? `${Number((v / 1e9).toFixed(a >= 1e10 ? 0 : 1))}bn` : a >= 1e6 ? `${Number((v / 1e6).toFixed(a >= 1e7 ? 0 : 1))}M` : whole(v);
};
const usd = (v: number) => `$${compact(v)}`;
const bn = (v: number) => `$${v >= 100 ? whole(v) : Number(v.toFixed(1))}bn`;
/** The publisher as its source names it, without the "(via ...)" that says where the site read it, or what follows a dash. */
const publisher = (label: string) => label.replace(/ \(via [^)]*\)$/, "").split(" — ")[0];

/** A figure's publisher, linked to the page the figure was read from. */
const Credit = ({ source }: { source: Source }) => (
  <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-dotted hover:opacity-70 transition-opacity" title={source.label}>
    {publisher(source.label)}
  </a>
);

// ── The card ────────────────────────────────────────────────────────────────

/** A card that opens: its mark, title and a line on what it holds, with the rows under it when open. */
function ExpandableCard({ t, icon, title, badge, description, accent, children }: { t: Tokens; icon: ReactNode; title: string; badge?: string; description: string; accent: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Hover is tracked in state: the row's background is an inline style keyed to the accent, which a hover class cannot override.
  const [hover, setHover] = useState(false);
  const headerBg = open ? accent + (t.isLight ? (hover ? "24" : "12") : hover ? "33" : "1a") : hover ? accent + (t.isLight ? "17" : "29") : "transparent";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150 cursor-pointer"
        style={{ borderBottom: open ? `1px solid ${t.gridLine}` : "none", background: headerBg, boxShadow: hover || open ? `inset 3px 0 0 0 ${accent}` : "none" }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent + (hover ? "26" : "15"), border: `1px solid ${accent}${hover ? "45" : "25"}` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold font-sans" style={{ color: t.headText }}>
              {title}
            </span>
            {badge && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: accent + "15", color: accent }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[10px] font-sans mt-0.5 leading-snug pr-4" style={{ color: t.mutedText }}>
            {description}
          </p>
        </div>
        <div className="shrink-0 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: hover ? accent : t.mutedText }} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {open && <div className="px-5 py-4 animate-fade-in">{children}</div>}
    </div>
  );
}

const Note = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: t.mutedText }}>
    {children}
  </p>
);
const Track = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <div className="relative h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
    {children}
  </div>
);

// ── Up-and-coming industries ────────────────────────────────────────────────

type Candidate = { name: string; what: string; series: Point[]; print: (v: number) => string; source: Source };
const world = (id: string, name: string, what: string, print: (v: number) => string): Candidate[] => {
  const ind = WORLD[id];
  return ind ? [{ name, what, series: ind.series as Point[], print, source: ind.source }] : [];
};
/** The industries and technologies the site holds a yearly world series for. */
const CANDIDATES: Candidate[] = [
  ...world("genAiInvestment", "Generative AI", "private investment, 2021 prices", usd),
  ...world("aiInvestment", "Artificial intelligence", "private investment, 2021 prices", usd),
  ...world("robotStock", "Industrial robots", "robots at work", compact),
  ...world("aiPublications", "AI research", "publications a year", compact),
  { name: "Large AI systems", what: "systems trained with more than 10²³ operations, running total", series: LARGE_AI_SYSTEMS.series as Point[], print: whole, source: LARGE_AI_SYSTEMS.source },
  { name: "Driverless taxis", what: "passenger-kilometres in California's paid service", series: DRIVERLESS_TAXIS.series as Point[], print: (v) => `${compact(v)} km`, source: DRIVERLESS_TAXIS.source },
  { name: "Data centres", what: "share of the world's electricity demand", series: DATA_CENTRES.series as Point[], print: (v) => `${v}%`, source: DATA_CENTRES.source },
  { name: "Solar power", what: "electricity generated in the world", series: RENEWABLE_GENERATION.map((r) => [r.year, r.solar] as Point), print: (v) => `${whole(v)} TWh`, source: RENEWABLE_GENERATION_SOURCE },
  { name: "Wind power", what: "electricity generated in the world", series: RENEWABLE_GENERATION.map((r) => [r.year, r.wind] as Point), print: (v) => `${whole(v)} TWh`, source: RENEWABLE_GENERATION_SOURCE },
];

/** Each candidate's latest year against the year before, where its series has both: the fastest-growing first. */
function fastestGrowing() {
  return CANDIDATES.flatMap((c) => {
    const [y1, v1] = c.series[c.series.length - 1] ?? [];
    const prev = c.series.find(([y]) => y === y1 - 1);
    if (y1 === undefined || !prev || prev[1] <= 0) return [];
    return [{ ...c, year: y1, now: v1, before: prev[1], growth: (v1 / prev[1] - 1) * 100 }];
  })
    .filter((c) => c.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 6);
}

function Industries({ t, accent }: { t: Tokens; accent: string }) {
  const rows = useMemo(fastestGrowing, []);
  const top = Math.max(...rows.map((r) => r.growth), 1);
  return (
    <>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-sans font-semibold min-w-0" style={{ color: t.headText }}>
                {r.name}
              </span>
              <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                +{r.growth >= 100 ? whole(r.growth) : r.growth.toFixed(1)}%
              </span>
            </div>
            {/* On the scale of the fastest shown: a bar's length is its growth against that one's. */}
            <Track t={t}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, (100 * r.growth) / top)}%`, background: accent }} />
            </Track>
            <p className="text-[10px] font-mono leading-snug mt-1" style={{ color: t.mutedText }}>
              {r.print(r.now)} in {r.year}, from {r.print(r.before)} in {r.year - 1} · {r.what} · <Credit source={r.source} />
            </p>
          </li>
        ))}
      </ul>
      <Note t={t}>
        The growth of each from one year to the next, worked out from its publisher's two figures; the six growing fastest, of the {CANDIDATES.length} the site holds
        a yearly world series for. They are measured in different things, so the rates rank them and nothing more. Not a forecast, and not every industry. Each
        publisher's name links to the page its figures were read from.
      </Note>
    </>
  );
}

// ── Funding raised ──────────────────────────────────────────────────────────

function Funding({ t, accent }: { t: Tokens; accent: string }) {
  const p = AI_INVESTMENT_PLACES[AI_INVESTMENT_PLACES.length - 1];
  const before = AI_INVESTMENT_PLACES.find((r) => r.year === p.year - 1);
  const d = AI_DEALS[AI_DEALS.length - 1];
  const places: { name: string; v: number; was?: number }[] = [
    { name: "United States", v: p.us, was: before?.us },
    { name: "Europe (EU and UK)", v: p.europe, was: before?.europe },
    { name: "China", v: p.china, was: before?.china },
    { name: "Everywhere else", v: Math.max(0, p.world - p.us - p.europe - p.china), was: before ? Math.max(0, before.world - before.us - before.europe - before.china) : undefined },
  ];
  return (
    <>
      <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: t.mutedText }}>
        Private investment in AI · {p.year} · {bn(p.world)} in the world{before ? `, from ${bn(before.world)} in ${before.year}` : ""}
      </p>
      <ul className="flex flex-col gap-2.5">
        {places.map((r) => (
          <li key={r.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-sans font-semibold min-w-0" style={{ color: t.headText }}>
                {r.name}
              </span>
              <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                {bn(r.v)}
                <span className="font-normal" style={{ color: t.mutedText }}>
                  {" "}
                  · {((100 * r.v) / p.world).toFixed(1)}%{r.was !== undefined ? ` · ${bn(r.was)} in ${p.year - 1}` : ""}
                </span>
              </span>
            </div>
            {/* On the scale of the world's total: a bar is the place's part of it. */}
            <Track t={t}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(1, (100 * r.v) / p.world)}%`, background: accent }} />
            </Track>
          </li>
        ))}
      </ul>

      <p className="text-[9px] font-mono uppercase tracking-widest mt-4 mb-2" style={{ color: t.mutedText }}>
        Corporate deals involving AI companies, by kind · {d.year} · {bn(d.total)}
      </p>
      <PartsBar
        label={`Corporate deals involving AI companies by kind, ${d.year}`}
        parts={[
          { label: "Private investment", value: d.private, text: bn(d.private) },
          { label: "Mergers and acquisitions", value: d.merger, text: bn(d.merger) },
          { label: "Public offerings", value: d.offering, text: bn(d.offering) },
          { label: "Minority stakes", value: d.minority, text: bn(d.minority) },
        ]}
      />
      <Note t={t}>
        US dollars at 2021 prices. Private investment is money put into privately held AI companies raising more than $1.5 million; it is not what listed companies
        spend on AI. "Everywhere else" is the world's total less the three named.
      </Note>
      <SourceLink
        sources={[
          { label: `${publisher(AI_INVESTMENT_PLACES_SOURCE.label)}: investment by place`, url: AI_INVESTMENT_PLACES_SOURCE.url },
          { label: `${publisher(AI_DEALS_SOURCE.label)}: deals by kind`, url: AI_DEALS_SOURCE.url },
        ]}
        className="mt-2"
      />
    </>
  );
}

// ── Alliances ───────────────────────────────────────────────────────────────

function Alliances({ t, accent }: { t: Tokens; accent: string }) {
  const navigate = useNavigate();
  const [all, setAll] = useState(false);
  const mine = useMemo(() => ALLIANCES.filter((a) => a.members?.includes("US")), []);
  const shown = all ? mine : mine.slice(0, 6);
  return (
    <>
      <ul className="flex flex-col">
        {shown.map((a) => (
          <li key={a.id} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
            <div className="flex items-baseline justify-between gap-3">
              <a href={a.source.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-sans font-semibold min-w-0 hover:underline" style={{ color: t.headText }} title={`${a.name}: its own page`}>
                {a.short}
                {a.name !== a.short && <span className="font-normal"> · {a.name}</span>}
              </a>
              <span className="text-[10px] font-mono shrink-0" style={{ color: t.headText }}>
                {a.memberCount} members
              </span>
            </div>
            <p className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
              {a.kind}
              {a.founded ? ` · founded ${a.founded}` : ""}
              {a.headquarters ? ` · ${a.headquarters}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        {mine.length > 6 && (
          <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity cursor-pointer" style={{ color: accent }}>
            {all ? "Show six" : `Show all ${mine.length}`}
          </button>
        )}
        <button type="button" onClick={() => navigate("/dashboard/world-leaders")} className="flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity cursor-pointer" style={{ color: accent }}>
          Every alliance and bloc <ArrowRight size={11} weight="bold" aria-hidden />
        </button>
      </div>
      <Note t={t}>
        The {mine.length} of the {ALLIANCES.length} alliances, blocs and agencies the site lists that count the United States a member. Each membership was checked
        against the body's own page on {ALLIANCES_CHECKED}; a name links to it.
      </Note>
    </>
  );
}

// ── Research & development ──────────────────────────────────────────────────

type Then = { name: string; unit: string; series: Point[]; print: (v: number) => string; source: Source };
const worldThen = (id: string, name: string, print: (v: number) => string): Then[] => {
  const ind = WORLD[id];
  return ind ? [{ name, unit: ind.unit, series: ind.series as Point[], print, source: ind.source }] : [];
};
const DELIVERED: Then[] = [
  { name: "Sequencing a human genome", unit: "current US dollars", series: GENOME_COST.series as Point[], print: usd, source: GENOME_COST.source },
  { name: "Transistors on a microchip", unit: "the most on one chip", series: TRANSISTORS.series as Point[], print: compact, source: TRANSISTORS.source },
  { name: "The fastest supercomputer", unit: "gigaflops, 10⁹ operations a second", series: SUPERCOMPUTER.series as Point[], print: compact, source: SUPERCOMPUTER.source },
  { name: "Disk storage", unit: "2020 US dollars a terabyte", series: DISK_PRICE.series as Point[], print: (v) => `$${v >= 1000 ? compact(v) : Number(v.toFixed(2))}`, source: DISK_PRICE.source },
  { name: "Solar modules", unit: "2025 US dollars a watt", series: SOLAR_MODULE_PRICE.series as Point[], print: (v) => `$${Number(v.toFixed(2))}`, source: SOLAR_MODULE_PRICE.source },
  { name: "Lithium-ion battery cells", unit: "2024 US dollars a kilowatt-hour", series: BATTERY_CELL_PRICE.series as Point[], print: (v) => `$${whole(v)}`, source: BATTERY_CELL_PRICE.source },
];
const PUT_IN: Then[] = [
  ...worldThen("research", "Research and development", (v) => `${v.toFixed(2)}%`),
  ...worldThen("researchers", "Researchers", whole),
  ...worldThen("sciArticles", "Scientific articles", compact),
  ...worldThen("patents", "Patent applications", compact),
];

/** A series at its two ends: where it is, where it started, and the multiple between the two. */
function ThenRow({ t, r }: { t: Tokens; r: Then }) {
  const [y0, v0] = r.series[0];
  const [y1, v1] = r.series[r.series.length - 1];
  const ratio = v0 > 0 && v1 > 0 ? (v1 >= v0 ? v1 / v0 : v0 / v1) : null;
  // A multiple, either way: "× 25M" where the figure has risen, "÷ 181,453" where it has fallen.
  const times = ratio === null || ratio < 1.05 ? null : `${v1 >= v0 ? "×" : "÷"} ${ratio >= 10 ? compact(ratio) : ratio.toFixed(1)}`;
  return (
    <li className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-sans font-semibold min-w-0" style={{ color: t.headText }}>
          {r.name}
        </span>
        <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
          {r.print(v1)}
          <span className="font-normal" style={{ color: t.mutedText }}>
            {" "}
            · {y1}
          </span>
        </span>
      </div>
      <p className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
        {r.print(v0)} in {y0}
        {times ? ` · ${times}` : ""} · {r.unit} · <Credit source={r.source} />
      </p>
    </li>
  );
}

function Research({ t }: { t: Tokens }) {
  return (
    <>
      <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: t.mutedText }}>
        What research has delivered · then and now
      </p>
      <ul className="flex flex-col">
        {DELIVERED.map((r) => (
          <ThenRow key={r.name} t={t} r={r} />
        ))}
      </ul>
      <p className="text-[9px] font-mono uppercase tracking-widest mt-4 mb-1" style={{ color: t.mutedText }}>
        What the world puts into it
      </p>
      <ul className="flex flex-col">
        {PUT_IN.map((r) => (
          <ThenRow key={r.name} t={t} r={r} />
        ))}
      </ul>
      <Note t={t}>
        Each is a published series at its first year and its latest, with the multiple between the two worked out here. They are measurements, not announcements: the
        site keeps no list of breakthroughs, and the dated one that stood here included events that had not happened. Each publisher's name links to the page its
        figures were read from.
      </Note>
    </>
  );
}

// ── The four, in the column ─────────────────────────────────────────────────

export function DashboardDrops() {
  const t = useTokens();
  const places = AI_INVESTMENT_PLACES[AI_INVESTMENT_PLACES.length - 1];
  const usAlliances = ALLIANCES.filter((a) => a.members?.includes("US")).length;
  return (
    <>
      <ExpandableCard
        t={t}
        icon={<Sparkle size={14} weight="fill" style={{ color: "#f97316" }} />}
        title="Up-and-coming Industries"
        badge="World · latest year"
        description="The fastest-growing of the industries and technologies the site follows, by each one's latest year against the year before."
        accent="#f97316"
      >
        <Industries t={t} accent="#f97316" />
      </ExpandableCard>
      <ExpandableCard
        t={t}
        icon={<Bank size={14} weight="fill" style={{ color: "#6366f1" }} />}
        title="Funding Raised"
        badge={`AI · ${places.year}`}
        description="Private money put into AI companies, by where it was raised and by kind of deal."
        accent="#6366f1"
      >
        <Funding t={t} accent="#6366f1" />
      </ExpandableCard>
      <ExpandableCard
        t={t}
        icon={<Handshake size={14} weight="fill" style={{ color: "#ef4444" }} />}
        title="Alliances"
        badge={`${usAlliances} with the US`}
        description="The alliances, blocs and agencies the United States belongs to, each from the body's own page."
        accent="#ef4444"
      >
        <Alliances t={t} accent="#ef4444" />
      </ExpandableCard>
      <ExpandableCard
        t={t}
        icon={<Atom size={14} weight="fill" style={{ color: "#06b6d4" }} />}
        title="R&D Breakthroughs"
        badge="Then and now"
        description="What research has delivered, measured: the cost of a genome, transistors on a chip, the fastest computer - and what the world puts into research."
        accent="#06b6d4"
      >
        <Research t={t} />
      </ExpandableCard>
    </>
  );
}
