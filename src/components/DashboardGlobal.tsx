/**
 * The Dashboard's Global & Geopolitical Analytics card.
 *
 * It stands where the National and International cards stood, as asked: the
 * two were lists of the day's headlines with a few figures beside them, and
 * the page already opens on the headlines. This is the figures - the world's,
 * and the ones that say how power is spread across it - each published, each
 * with its year and its source:
 *
 *   The world in figures   output, trade and government debt; armed
 *                          conflicts, the deaths in them and the people
 *                          displaced; military spending and nuclear warheads
 *                          (worldview.ts: World Bank, IMF, UCDP, UNHCR, the
 *                          Federation of American Scientists). The latest
 *                          year, its change on the year before, and the
 *                          series behind it.
 *   How the world is       the share of the world's people under each of
 *     governed             V-Dem's four kinds of regime, how many countries
 *                          are in each, and the countries V-Dem moved from
 *                          one to another in its latest year.
 *   The blocs, side by     NATO, the EU, the G7, BRICS and the rest: what
 *     side                 their members come to together as a share of the
 *                          world's people, its output and its military
 *                          spending. Membership is each body's own list
 *                          (alliances.ts); the figures are the World Bank's
 *                          and SIPRI's for each member, added up here.
 *
 * A change, a share and a sum are worked out here from published figures,
 * and the card says so where it gives one. Nothing on it is a forecast, a
 * score of the site's own or a ranking of who is winning.
 */
import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, GlobeHemisphereWest } from "@phosphor-icons/react";
import { ALLIANCES, ALLIANCES_CHECKED } from "../data/alliances";
import { countriesData } from "../data/countriesData";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { MILITARY_MEASURED, MILITARY_SOURCES } from "../data/militarySpending";
import { WORLD, type WorldIndicator } from "../data/worldview";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
const ACCENT = "#6366f1";
const GREEN = "#10b981";
const RED = "#ef4444";

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e12 ? `${(v / 1e12).toFixed(2)}T` : a >= 1e9 ? `${(v / 1e9).toFixed(a >= 1e10 ? 1 : 2)}bn` : a >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : whole(v);
};
const pct = (v: number, dp = 1) => `${v.toFixed(dp)}%`;
/** The publisher as its source names it, without the "(via ...)" that says where the site read it, or what follows a dash. */
const publisher = (label: string) => label.replace(/ \(via [^)]*\)$/, "").split(" — ")[0];

function Kicker({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}
function Note({ t, children, className = "" }: { t: Tokens; children: ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-sans leading-relaxed ${className}`} style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}

// ── The world in figures ────────────────────────────────────────────────────

type Tile = { id: string; label: string; ind: WorldIndicator; print: (v: number) => string; sub?: string; color: string };
const tile = (id: string, label: string, print: (v: number) => string, color: string, sub?: string): Tile[] => {
  const ind = WORLD[id];
  return ind && ind.series.length > 1 ? [{ id, label, ind, print, sub, color }] : [];
};
const lastOf = (id: string) => WORLD[id]?.series[WORLD[id].series.length - 1];
const growth = lastOf("gdpGrowth");
const milShare = lastOf("militaryGdp");
const conflictParts = WORLD.conflicts?.breakdown?.slice(0, 2);

const TILES: Tile[] = [
  ...tile("gdp", "World output", (v) => `$${compact(v)}`, "#2563eb", growth ? `real growth ${pct(growth[1], 2)} in ${growth[0]}` : undefined),
  ...tile("trade", "Trade", (v) => pct(v), "#0d9488", "exports and imports, % of world GDP"),
  ...tile("govDebt", "Government debt", (v) => pct(v), "#d97706", "general government, % of world GDP"),
  ...tile("militaryUsd", "Military spending", (v) => `$${compact(v)}`, "#ef4444", milShare ? `${pct(milShare[1], 2)} of world GDP in ${milShare[0]}` : undefined),
  ...tile("conflicts", "Armed conflicts", whole, "#f97316", conflictParts?.map(([l, n]) => `${n} ${l.replace(/ \(.*\)$/, "").toLowerCase()}`).join(" · ")),
  ...tile("conflictDeaths", "Deaths in armed conflicts", whole, "#b91c1c", "people killed in the year"),
  ...tile("displaced", "People forcibly displaced", compact, "#7c3aed", "refugees, asylum-seekers and the displaced within their own country"),
  ...tile("nuclearWarheads", "Nuclear warheads", whole, "#64748b", "stockpiled, and retired ones awaiting dismantlement"),
];

/** A world figure: its latest year, the change on the year before, and its whole series as a line. */
function WorldTile({ t, x }: { t: Tokens; x: Tile }) {
  const s = x.ind.series;
  const [year, now] = s[s.length - 1];
  const before = s.find(([y]) => y === year - 1)?.[1];
  // A rate is compared in points; a count or a sum of money as a percentage of the year before.
  const rate = x.ind.format === "pct";
  const change = before === undefined ? null : rate ? now - before : before > 0 ? (100 * (now - before)) / before : null;
  const good = change === null || change === 0 || x.ind.upIsGood === null ? null : change > 0 === x.ind.upIsGood;
  const tone = good === null ? t.bodyText : good ? GREEN : RED;
  const grad = `global-${x.id}`;
  return (
    <div className="rounded-xl px-3 py-2.5 min-w-0 flex flex-col" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} title={`${x.ind.label}, ${s[0][0]} to ${year} · ${x.ind.source.label}`}>
      <span className="block text-[9px] font-mono uppercase tracking-widest leading-snug" style={{ color: t.mutedText }}>
        {x.label} · {year}
      </span>
      <span className="block text-lg font-bold font-mono leading-tight mt-1" style={{ color: t.headText }}>
        {x.print(now)}
      </span>
      {change !== null && (
        <span className="flex items-center gap-1 text-[10px] font-mono leading-snug mt-0.5" style={{ color: tone }}>
          {change > 0 ? <ArrowUp size={9} weight="bold" aria-hidden /> : change < 0 ? <ArrowDown size={9} weight="bold" aria-hidden /> : null}
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {Math.abs(change).toFixed(1)}
          {rate ? " points" : "%"} on {year - 1}
        </span>
      )}
      {x.sub && (
        <span className="block text-[9px] font-sans leading-snug mt-1" style={{ color: t.mutedText }}>
          {x.sub}
        </span>
      )}
      <div className="mt-auto pt-2" role="img" aria-label={`${x.ind.label}, ${s[0][0]} to ${year}.`}>
        <ResponsiveContainer width="100%" height={28}>
          <AreaChart data={s.map(([y, v]) => ({ y, v }))} margin={{ top: 1, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={x.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={x.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={x.color} strokeWidth={1.5} fill={`url(#${grad})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className="flex items-baseline justify-between text-[9px] font-mono mt-0.5" style={{ color: t.mutedText }}>
        <span>{s[0][0]}</span>
        <span>{publisher(x.ind.source.label)}</span>
      </span>
    </div>
  );
}

// ── How the world is governed ───────────────────────────────────────────────

/** V-Dem's four kinds of regime, from the least open to the most, each with its colour. */
const REGIMES = [
  { label: "Closed autocracy", color: "#b91c1c" },
  { label: "Electoral autocracy", color: "#f59e0b" },
  { label: "Electoral democracy", color: "#38bdf8" },
  { label: "Liberal democracy", color: "#2563eb" },
] as const;
const openness = (regime: string) => REGIMES.findIndex((r) => r.label === regime);

function Regimes({ t }: { t: Tokens }) {
  const ind = WORLD.democracyShare;
  const people = ind?.breakdown;
  const m = ind?.members;
  if (!ind || !people || !m) return null;
  const total = people.reduce((a, [, n]) => a + n, 0);
  const rows = REGIMES.flatMap((r) => {
    const n = people.find(([l]) => l === r.label)?.[1];
    const countries = m.groups.find(([l]) => l === r.label)?.[1].length ?? m.others.find(([l]) => l === r.label)?.[1];
    return n === undefined ? [] : [{ ...r, n, share: (100 * n) / total, countries }];
  });
  const up = m.moves.filter(([, from, to]) => openness(to) > openness(from));
  const down = m.moves.filter(([, from, to]) => openness(to) < openness(from));
  const Moves = ({ title, list, color }: { title: string; list: typeof m.moves; color: string }) => (
    <div className="min-w-0">
      <p className="text-[10px] font-sans font-semibold mb-1" style={{ color: t.headText }}>
        {title} · {list.length}
      </p>
      {list.length === 0 ? (
        <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
          None.
        </p>
      ) : (
        <ul className="flex flex-col">
          {list.map(([country, from, to]) => (
            <li key={country} className="py-1 text-[10px] leading-snug" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
              {/* The name in full on its own line: beside the two regimes it was cut to a letter in a narrow column. */}
              <span className="block font-sans font-semibold" style={{ color: t.headText }}>
                {country}
              </span>
              <span className="block font-mono" style={{ color: t.mutedText }}>
                {from.toLowerCase()} <span style={{ color }}>→</span> {to.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <div className="min-w-0">
      <Kicker t={t}>
        How the world is governed · share of the world's people · {ind.breakdownYear} · V-Dem
      </Kicker>
      <div className="flex h-3 gap-0.5" role="img" aria-label={`The world's people by the kind of regime they live under, ${ind.breakdownYear}: ${rows.map((r) => `${r.label} ${pct(r.share)}`).join(", ")}.`}>
        {rows.map((r, i) => (
          <span key={r.label} className={`h-full min-w-[2px] ${i === 0 ? "rounded-l-full" : ""} ${i === rows.length - 1 ? "rounded-r-full" : ""}`} style={{ flexGrow: r.n, flexBasis: 0, background: r.color }} title={`${r.label}: ${pct(r.share)}`} />
        ))}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline gap-2 py-1.5 min-w-0" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
            <span className="w-2 h-2 rounded-sm shrink-0 translate-y-px" style={{ background: r.color }} aria-hidden />
            <span className="text-[11px] font-sans min-w-0 flex-1" style={{ color: t.headText }}>
              {r.label}
              <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                {compact(r.n)} people{r.countries !== undefined ? ` · ${r.countries} countries` : ""}
              </span>
            </span>
            <span className="text-[12px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
              {pct(r.share)}
            </span>
          </li>
        ))}
      </ul>
      {m.moves.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-3">
          <Moves title={`Moved towards democracy in ${m.year}`} list={up} color={GREEN} />
          <Moves title={`Moved towards autocracy in ${m.year}`} list={down} color={RED} />
        </div>
      )}
      <Note t={t} className="mt-2">
        V-Dem sorts every country into one of four kinds of regime each year. The shares are of the people in the countries it classifies, worked out here from its counts;
        a move is a country V-Dem put in a different kind in {m.year} than the year before.
      </Note>
      <SourceLink sources={[ind.source, m.source]} className="mt-1" />
    </div>
  );
}

// ── The blocs, side by side ─────────────────────────────────────────────────

const BLOC_IDS = ["nato", "eu", "g7", "brics", "sco", "asean", "au", "opec"];
const ID_OF = new Map(countriesData.map((c) => [c.code, c.id]));
/** Every country's military spending SIPRI has a figure for, added up: what a bloc's is a share of. */
const SIPRI_TOTAL = countriesData.reduce((a, c) => a + (c.territory ? 0 : (MILITARY_MEASURED[c.id]?.spendUSDm?.v ?? 0)), 0);

function Blocs({ t }: { t: Tokens }) {
  const worldPop = lastOf("population");
  const worldGdp = lastOf("gdp");
  const rows = useMemo(
    () =>
      BLOC_IDS.flatMap((id) => {
        const a = ALLIANCES.find((x) => x.id === id);
        if (!a?.members?.length) return [];
        let people = 0;
        let output = 0;
        let arms = 0;
        for (const code of a.members) {
          people += COUNTRY_INDICATORS[code]?.population?.v ?? 0;
          // The World Bank's GDP is held in US$ billions.
          output += (COUNTRY_INDICATORS[code]?.gdp?.v ?? 0) * 1e9;
          arms += MILITARY_MEASURED[ID_OF.get(code) ?? ""]?.spendUSDm?.v ?? 0;
        }
        return [{ a, people, output, arms }];
      }),
    [],
  );
  if (!worldPop || !worldGdp || !rows.length) return null;
  const cols = [
    { head: "People", of: (r: (typeof rows)[number]) => (100 * r.people) / worldPop[1], color: "#7c3aed" },
    { head: "Output", of: (r: (typeof rows)[number]) => (100 * r.output) / worldGdp[1], color: "#2563eb" },
    { head: "Military spending", of: (r: (typeof rows)[number]) => (SIPRI_TOTAL > 0 ? (100 * r.arms) / SIPRI_TOTAL : 0), color: "#ef4444" },
  ];
  return (
    <div className="min-w-0">
      <Kicker t={t}>The blocs, side by side · their members' share of the world's people, output and military spending</Kicker>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 520 }}>
          <caption className="sr-only">Eight alliances and blocs: how many members each has, and what its members come to together as a share of the world's people, output and military spending.</caption>
          <thead>
            <tr>
              <th scope="col" className="py-1 text-left text-[9px] font-mono font-normal" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                Bloc
              </th>
              {cols.map((c) => (
                <th key={c.head} scope="col" className="py-1 pl-3 text-left text-[9px] font-mono font-normal" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}`, width: "22%" }}>
                  {c.head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.a.id}>
                <th scope="row" className="py-2 text-left align-top" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                  <a href={r.a.source.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-sans font-semibold hover:underline" style={{ color: t.headText }} title={`${r.a.name}: its own list of members`}>
                    {r.a.short}
                  </a>
                  <span className="block text-[9px] font-mono font-normal" style={{ color: t.mutedText }}>
                    {r.a.members!.length} members
                  </span>
                </th>
                {cols.map((c) => {
                  const v = c.of(r);
                  return (
                    <td key={c.head} className="py-2 pl-3 align-top" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                      <span className="block text-[11px] font-mono font-bold tabular-nums" style={{ color: t.headText }}>
                        {pct(v)}
                      </span>
                      {/* On a scale of 0 to 100 per cent of the world's. */}
                      <span className="block h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, v))}%`, minWidth: v > 0 ? 2 : 0, background: c.color }} />
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note t={t} className="mt-2">
        Each bloc's members are its own list, checked on {ALLIANCES_CHECKED}; a name links to it. A share is its members' latest figures added up, worked out here: people
        against the world's {compact(worldPop[1])} and output against the world's ${compact(worldGdp[1])} (World Bank, {worldGdp[0]}; a member's own figure is for its latest
        year), and military spending against the ${compact(SIPRI_TOTAL * 1e6)} SIPRI records for every country it has a figure for. Blocs overlap, so the columns do not add
        up. Each bar is on a scale of 0 to 100 per cent.
      </Note>
      <SourceLink sources={[{ label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }, MILITARY_SOURCES.sipri]} className="mt-1" />
    </div>
  );
}

// ── The card ────────────────────────────────────────────────────────────────

export function GlobalAnalytics() {
  const t = useTokens();
  const navigate = useNavigate();
  const sources = [...new Map(TILES.map((x) => [x.ind.source.url, { label: publisher(x.ind.source.label), url: x.ind.source.url } as Source])).values()];
  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: ACCENT }}>
            <GlobeHemisphereWest size={16} weight="fill" />
          </span>
          <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
            Global &amp; Geopolitical Analytics
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: ACCENT + "15", color: ACCENT }}>
            World
          </span>
        </div>
        <button type="button" onClick={() => navigate("/dashboard/worldview")} className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: ACCENT }}>
          Worldview <ArrowRight size={11} weight="bold" />
        </button>
      </div>

      <Kicker t={t}>The world in figures · each one's latest year, its change on the year before, and its series</Kicker>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {TILES.map((x) => (
          <WorldTile key={x.id} t={t} x={x} />
        ))}
      </div>
      <Note t={t} className="mt-2">
        A change is worked out from the publisher's two figures: a percentage of the year before for a count or a sum of money, percentage points for a share. It is green or
        red only where a rise is plainly better or worse; military spending, output and warheads are left in ink.
      </Note>
      <SourceLink sources={sources} className="mt-1" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 mt-5 pt-5" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <Regimes t={t} />
        <Blocs t={t} />
      </div>
    </div>
  );
}

export default GlobalAnalytics;
