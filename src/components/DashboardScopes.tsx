/**
 * The Dashboard's National and International containers.
 *
 * They are back where they stood, laid out as they were: a list of what is
 * happening on the left, figures on the right. What fills them is not what
 * did. The lists were eight headlines typed in during 2025 - "Senate passes
 * infrastructure spending package", "COP30 pre-summit: 47 nations pledge
 * net-zero by 2045" - with nothing behind them, and the state figures beside
 * them did not match the data. Now:
 *
 *   National        the newest headlines the site's desks have filed under
 *                   the United States and no other country, each linking to
 *                   its outlet; and the six largest state economies, the
 *                   BEA's figures, each as a share of the fifty states' total
 *   International   the newest headlines naming a country other than the
 *                   United States; consumer-price inflation in the world, the
 *                   advanced and the emerging economies (IMF); and the World
 *                   Bank's regions by GDP with their real growth
 *
 * A headline is the outlet's: the site keeps its title, link, outlet and
 * time. A state's share is worked out from two published figures.
 */
import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowSquareOut, Flag, Globe, Newspaper, TrendDown, TrendUp } from "@phosphor-icons/react";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";
import { IMF_INFLATION, REGIONS, type WorldPoint } from "../data/worldview";
import { tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { ALL_TOPICS, ago, namesAbroad, placeName, spread, useHeadlines, type Headline } from "./HeadlinesBanner";
import { SourceLink } from "./SourceLink";

const DAYS = 2;
const SHOWN = 6;
const lastOf = (s: WorldPoint[]) => s[s.length - 1];
const usd = (b: number) => (b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : `$${Math.round(b)}B`);

function Card({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {children}
    </div>
  );
}

function Head({ t, icon, label, badge, color, cta, to }: { t: Tokens; icon: ReactNode; label: string; badge: string; color: string; cta: string; to: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
          {label}
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
          {badge}
        </span>
      </div>
      <button type="button" onClick={() => navigate(to)} className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer" style={{ color }}>
        {cta} <ArrowRight size={11} weight="bold" />
      </button>
    </div>
  );
}

const Kicker = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: t.mutedText }}>
    {children}
  </p>
);

/** The newest headlines of a scope: each its title, linked to the outlet, the place it is filed under, the outlet and how long ago. */
function Headlines({ t, rows, color, none }: { t: Tokens; rows: Headline[]; color: string; none: string }) {
  if (!rows.length)
    return (
      <p className="text-[11px] font-sans py-6" style={{ color: t.mutedText }}>
        {none}
      </p>
    );
  return (
    <div className="flex flex-col">
      {rows.map((h, i) => {
        const places = h.places.map(placeName).filter((n): n is string => !!n && n !== "United States");
        return (
          <a
            key={h.url}
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 py-3 hover:opacity-90 transition-opacity"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + "18", color }}>
              <Newspaper size={12} weight="fill" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans leading-snug group-hover:underline" style={{ color: t.headText }}>
                {h.title}
              </span>
              <span className="flex items-center gap-2 mt-1 flex-wrap">
                {places.length > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: color + "15", color }}>
                    {places.slice(0, 2).join(" · ")}
                    {places.length > 2 ? ` +${places.length - 2}` : ""}
                  </span>
                )}
                <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
                  {h.outlet} · {ago(h.published_at)}
                </span>
              </span>
            </span>
            <ArrowSquareOut size={11} className="shrink-0 mt-1" style={{ color: t.mutedText }} aria-hidden />
          </a>
        );
      })}
    </div>
  );
}

// ── National ────────────────────────────────────────────────────────────────

const US_GDP = usStatesData.reduce((a, s) => a + (STATE_INDICATORS[s.id]?.gdp.v ?? 0), 0);
const TOP_STATES = [...usStatesData]
  .flatMap((s) => {
    const f = STATE_INDICATORS[s.id];
    return f ? [{ s, gdp: f.gdp, jobs: f.unemploymentRate }] : [];
  })
  .sort((a, b) => b.gdp.v - a.gdp.v)
  .slice(0, 6);

export function NationalSection() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#3b82f6";
  const read = useHeadlines(["us", "economy", "policy"], DAYS, 300, false);
  // Filed under the United States or one of its states, and naming no other country.
  const rows = useMemo(() => spread(read.filter((h) => !namesAbroad(h) && h.places.some((p) => p === "c:US" || p.startsWith("s:"))), 2, SHOWN), [read]);
  return (
    <Card t={t}>
      <Head t={t} icon={<Flag size={16} weight="fill" />} label="National" badge="US Focus" color={color} cta="View States" to="/dashboard/states" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <Kicker t={t}>Domestic highlights · the newest headlines of the last two days</Kicker>
          <Headlines t={t} rows={rows} color={color} none="No US headlines have come in over the last two days." />
        </div>
        <div className="min-w-0">
          <Kicker t={t}>State GDP snapshot · the six largest · {TOP_STATES[0]?.gdp.y}</Kicker>
          <div className="flex flex-col">
            {TOP_STATES.map(({ s, gdp, jobs }, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/dashboard/states?open=${s.id}`)}
                className="flex items-center gap-2.5 py-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
                style={{ borderBottom: i < TOP_STATES.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
                title={`${s.name}: unemployment ${jobs.v}% (${jobs.y})`}
              >
                <span className="text-[10px] font-mono font-bold w-7 text-center rounded-md py-0.5 shrink-0" style={{ background: color + "18", color }}>
                  {s.abbreviation}
                </span>
                <span className="text-xs font-semibold font-sans flex-1 truncate" style={{ color: t.headText }}>
                  {s.name}
                </span>
                <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
                  {usd(gdp.v)}
                </span>
                <span className="text-[10px] font-mono shrink-0 w-12 text-right" style={{ color: t.mutedText }}>
                  {((100 * gdp.v) / US_GDP).toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
          <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
            Each state's GDP, and its share of the fifty states' together. The headlines are the outlets' own; each links to the story.
          </p>
          <SourceLink sources={[STATE_SOURCES.bea]} className="mt-1" />
        </div>
      </div>
    </Card>
  );
}

// ── International ───────────────────────────────────────────────────────────

const INFLATION_LINES = [
  { key: "world", label: "World", color: "#f59e0b" },
  { key: "advanced", label: "Advanced", color: "#3b82f6" },
  { key: "emerging", label: "Emerging & developing", color: "#ec4899" },
] as const;
const INFLATION_YEARS = [...new Set([...IMF_INFLATION.world, ...IMF_INFLATION.advanced, ...IMF_INFLATION.emerging].map(([y]) => y))].sort((a, b) => a - b);
const at = (s: WorldPoint[], y: number) => s.find(([x]) => x === y)?.[1] ?? null;
const INFLATION = INFLATION_YEARS.map((y) => ({ year: String(y), world: at(IMF_INFLATION.world, y), advanced: at(IMF_INFLATION.advanced, y), emerging: at(IMF_INFLATION.emerging, y) }));
const TOP_REGIONS = [...REGIONS].sort((a, b) => lastOf(b.gdp)[1] - lastOf(a.gdp)[1]).slice(0, 5);

export function InternationalSection() {
  const t = useTokens();
  const color = "#6366f1";
  const read = useHeadlines(ALL_TOPICS, DAYS, 300, false);
  const rows = useMemo(() => spread(read.filter(namesAbroad), 2, SHOWN), [read]);
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  return (
    <Card t={t}>
      <Head t={t} icon={<Globe size={16} weight="fill" />} label="International" badge="Global" color={color} cta="View Countries" to="/dashboard/countries" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <Kicker t={t}>Global developments · the newest headlines of the last two days</Kicker>
          <Headlines t={t} rows={rows} color={color} none="No headlines naming another country have come in over the last two days." />
        </div>
        <div className="min-w-0">
          <Kicker t={t}>
            Inflation trend · % a year · {INFLATION[0].year}–{INFLATION[INFLATION.length - 1].year}
          </Kicker>
          <div role="img" aria-label={`Consumer-price inflation, ${INFLATION[0].year} to ${INFLATION[INFLATION.length - 1].year}, in the world, the advanced and the emerging and developing economies.`}>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={INFLATION} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
                <XAxis dataKey="year" {...axis} />
                <YAxis {...axis} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip {...tooltipStyle(t)} formatter={(v: number, k: string) => [`${v}%`, INFLATION_LINES.find((l) => l.key === k)?.label ?? k]} />
                {INFLATION_LINES.map((l) => (
                  <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {INFLATION_LINES.map((l) => (
              <span key={l.key} className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded-full" style={{ background: l.color }} aria-hidden />
                <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
                  {l.label}
                </span>
              </span>
            ))}
          </div>
          <SourceLink sources={IMF_INFLATION.source} className="mt-1" />

          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
            <Kicker t={t}>Regional GDP · real growth · {lastOf(TOP_REGIONS[0].growth)[0]}</Kicker>
            {TOP_REGIONS.map((r, i) => {
              const [, gdp] = lastOf(r.gdp);
              const [, g] = lastOf(r.growth);
              const up = g >= 0;
              return (
                <div key={r.id} className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: i < TOP_REGIONS.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
                  <span className="text-[11px] font-sans truncate flex-1" style={{ color: t.headText }}>
                    {r.name}
                  </span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                    ${(gdp / 1e12).toFixed(1)}T
                  </span>
                  <span className="flex items-center gap-1 shrink-0 w-14 justify-end">
                    {up ? <TrendUp size={9} weight="fill" color="#10b981" /> : <TrendDown size={9} weight="fill" color="#ef4444" />}
                    <span className="text-[10px] font-mono" style={{ color: up ? "#10b981" : "#ef4444" }}>
                      {g > 0 ? "+" : ""}
                      {g.toFixed(1)}%
                    </span>
                  </span>
                </div>
              );
            })}
            <SourceLink sources={[TOP_REGIONS[0].source]} className="mt-1" />
          </div>
        </div>
      </div>
    </Card>
  );
}
