/**
 * The Climate page's cards of what is happening and what is projected
 * (data/climateWatch.ts): the seasonal swing of El Niño and La Niña, the
 * records in the measured series, which countries disasters struck, what is
 * published on erosion, and how much warmer each country is projected to be.
 *
 * Each card says whose figures it shows and for when. A rank, an episode or
 * a tally is counted from the source's own series and says so; a projection
 * is the models' answer under a named scenario and is never called a
 * forecast. What no source publishes under terms the site can use - the
 * money cost of disasters country by country, each country's all-time
 * record temperatures - is said to be missing, not filled in.
 */
import { useMemo, useState, type ReactNode } from "react";
import { SLIM_TRACK, slimFill } from "./SlimBars";
import { ArrowSquareOut } from "@phosphor-icons/react";
import {
  CLIMATE_RECORDS,
  CLIMATE_WATCH_NAMES,
  CLIMATE_WATCH_RETRIEVED,
  CLIMATE_WATCH_SOURCES as SRC,
  DISASTER_ALERTS,
  DISASTER_DISPLACED,
  ENSO,
  ENSO_SEASONS,
  EROSION,
  WARMING_PERIODS,
  WARMING_PROJECTED,
  WARMING_REFERENCE,
  WARMING_SCENARIOS,
  type EnsoEpisode,
} from "../data/climateWatch";
import { PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const WARM = "#ea580c";
const COLD = "#0ea5e9";
const QUIET = "#94a3b8";
const RED = "#e11d48";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const signed = (v: number, dp = 2) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}`;
const nth = (n: number) => {
  const t = n % 100;
  return `${n}${t >= 11 && t <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
/** A country's name in English, by its code: the browser's, or the World Bank's where the browser has none. */
const REGION = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();
const nameOf = (code: string) => {
  try {
    return REGION?.of(code) ?? CLIMATE_WATCH_NAMES[code] ?? code;
  } catch {
    return CLIMATE_WATCH_NAMES[code] ?? code;
  }
};

function Card({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{kicker}</p>
        <p className="text-[10px] font-mono text-muted-foreground">retrieved {CLIMATE_WATCH_RETRIEVED}</p>
      </div>
      {children}
    </div>
  );
}
function Tiles({ tiles }: { tiles: { label: string; value: string; sub: string; color?: string }[] }) {
  return (
    <div className="tile-fill gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground font-sans">{t.label}</p>
          <p className="text-base font-bold font-sans leading-snug" style={{ color: t.color ?? "var(--color-foreground)" }}>
            {t.value}
          </p>
          <p className="text-xs text-muted-foreground font-sans leading-snug">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
const Sub = ({ children }: { children: ReactNode }) => <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mt-4 mb-1.5">{children}</p>;
const Note = ({ children }: { children: ReactNode }) => <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2 max-w-prose">{children}</p>;
/** Rows of a figure each, with a bar on one scale: the scale's far end is `max`, said in the caption. */
function Bars({ rows, max, color }: { rows: { key: string; label: string; value: number; text: string; color?: string }[]; max: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-sans text-foreground w-36 sm:w-44 shrink-0 truncate" title={r.label}>
            {r.label}
          </span>
          <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: SLIM_TRACK }} aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${Math.max(1, Math.min(100, (r.value / max) * 100))}%`, background: slimFill(r.color ?? color)}} />
          </span>
          <span className="text-[11px] font-mono font-bold text-foreground w-24 text-right shrink-0">{r.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── El Niño and La Niña ── */
const tone = (a: number) => (a >= 0.5 ? WARM : a <= -0.5 ? COLD : QUIET);
function OniChart() {
  const W = 640;
  const H = 150;
  const n = ENSO.seasons.length;
  const top = Math.max(2.5, Math.ceil(Math.max(...ENSO.seasons.map((s) => Math.abs(s[2]))) * 2) / 2);
  const y = (a: number) => H / 2 - (a / top) * (H / 2 - 12);
  const w = W / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`The Oceanic Niño Index for every season since ${ENSO.since}: the newest, ${ENSO.latest.season}, is ${signed(ENSO.latest.anom)} degrees Celsius.`}>
      {[0.5, -0.5].map((t) => (
        <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3 3" strokeWidth={0.6} />
      ))}
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.4} strokeWidth={0.6} />
      {ENSO.seasons.map(([year, s, a], i) => (
        <rect key={i} x={i * w + 0.15} width={Math.max(0.6, w - 0.3)} y={Math.min(y(a), y(0))} height={Math.max(0.5, Math.abs(y(a) - y(0)))} fill={tone(a)}>
          <title>{`${ENSO_SEASONS[s]} ${year}: ${signed(a)} °C`}</title>
        </rect>
      ))}
      {ENSO.seasons.map(([year, s], i) =>
        s === 0 && year % 4 === 0 ? (
          <text key={year} x={i * w} y={H - 1} fontSize={8} fontFamily="monospace" fill="currentColor" opacity={0.6}>
            {year}
          </text>
        ) : null,
      )}
      {[top, 0.5, -0.5, -top].map((t) => (
        <text key={t} x={W - 2} y={y(t) - 2} fontSize={7} fontFamily="monospace" textAnchor="end" fill="currentColor" opacity={0.55}>
          {signed(t, 1)}
        </text>
      ))}
    </svg>
  );
}
const span = (e: EnsoEpisode) => `${e.from} to ${e.ongoing ? "now" : e.to}`;
function Enso() {
  const run = ENSO.run;
  const short = run && run.seasons < 5;
  return (
    <Card kicker="Seasonal patterns — El Niño and La Niña">
      <Tiles
        tiles={[
          { label: "The Index Now", value: `${signed(ENSO.latest.anom)} °C`, sub: `${ENSO.latest.season} · sea-surface temperature against the season's average, central Pacific`, color: tone(ENSO.latest.anom) },
          {
            label: "What That Makes It",
            value: ENSO.state,
            sub: short
              ? `${run.seasons} overlapping seasons at or beyond ${run.kind === "El Niño" ? "+0.5" : "−0.5"} since ${run.from}; five running make an episode by NOAA's rule · counted here`
              : run
                ? `an episode since ${run.from}, ${run.seasons} seasons running · counted here by NOAA's rule`
                : "the index is inside ±0.5 · counted here by NOAA's rule",
            color: tone(ENSO.latest.anom),
          },
          ...(run ? [{ label: "Its Peak So Far", value: `${signed(run.peak)} °C`, sub: `${run.peakAt}` }] : []),
          { label: "Strongest El Niño On Record", value: `${signed(ENSO.strongest.warm[0].peak)} °C`, sub: `${ENSO.strongest.warm[0].peakAt} · since the index begins in ${ENSO.first}`, color: WARM },
          { label: "Strongest La Niña On Record", value: `${signed(ENSO.strongest.cold[0].peak)} °C`, sub: `${ENSO.strongest.cold[0].peakAt} · since ${ENSO.first}`, color: COLD },
        ]}
      />
      <Sub>
        The Oceanic Niño Index · every overlapping three-month season since {ENSO.since} · °C
      </Sub>
      <OniChart />
      <p className="text-[10px] font-sans text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
        <span>
          <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: WARM }} /> at or above +0.5: El Niño's side
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: COLD }} /> at or below −0.5: La Niña's side
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: QUIET }} /> between them: neutral
        </span>
      </p>
      <Sub>The episodes since 1990 · newest first</Sub>
      <div className="flex flex-wrap gap-1.5">
        {ENSO.episodes.map((e) => (
          <span key={e.from} className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans border border-border text-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full self-center" style={{ background: e.kind === "El Niño" ? WARM : COLD }} />
            {e.kind} · {span(e)}
            <span className="font-mono text-muted-foreground">peak {signed(e.peak, 1)}</span>
          </span>
        ))}
      </div>
      <Note>
        The index is NOAA's: the three-month mean sea-surface temperature in the Niño 3.4 region of the equatorial Pacific, against the average for the season. NOAA counts an El Niño or a La Niña once the index has stayed at or beyond +0.5 or
        −0.5 for five overlapping seasons running; the episodes here are counted from the index by that rule, and a run still short of five seasons is called conditions, not an episode.
      </Note>
      <SourceLink sources={[SRC.oni]} className="mt-1" />
    </Card>
  );
}

/* ── Records ── */
function Records() {
  const t = CLIMATE_RECORDS.temperature;
  const a = CLIMATE_RECORDS.arctic;
  const s = CLIMATE_RECORDS.antarctic;
  const c = CLIMATE_RECORDS.co2;
  const top = t.warmest[0];
  return (
    <Card kicker="Record highs and record lows — in the measured series">
      <Tiles
        tiles={[
          { label: "Warmest Year On Record", value: String(top[0]), sub: `${signed(top[1])} °C against ${t.baseline} · the record begins in ${t.first}`, color: WARM },
          { label: `Where ${t.latestYear.y} Stands`, value: `${nth(t.latestYear.rank)} warmest`, sub: `${signed(t.latestYear.v)} °C · of ${t.latestYear.of} years · counted here` },
          ...(t.latestMonth ? [{ label: `Where ${t.latestMonth.month} Stands`, value: `${nth(t.latestMonth.rank)} warmest ${t.latestMonth.name}`, sub: `${signed(t.latestMonth.v)} °C · of ${t.latestMonth.of} · counted here` }] : []),
          { label: "Coldest Year On Record", value: String(t.coldest[0]), sub: `${signed(t.coldest[1])} °C against ${t.baseline}`, color: COLD },
          { label: "Highest Carbon Dioxide", value: `${c.high.v} ppm`, sub: `${c.high.month} · the highest monthly mean at Mauna Loa since ${c.first}`, color: WARM },
          { label: "Lowest Arctic Sea Ice", value: `${a.lowest[0][1]} million km²`, sub: `September ${a.lowest[0][0]} · the lowest September since ${a.first}`, color: COLD },
          { label: `Arctic, September ${a.latest.y}`, value: `${a.latest.v} million km²`, sub: `the ${nth(a.latest.rank)} lowest September of ${a.latest.of} · counted here` },
          { label: "Lowest Antarctic Sea Ice", value: `${s.lowest[0][1]} million km²`, sub: `February ${s.lowest[0][0]} · the lowest February since ${s.first}`, color: COLD },
          { label: `Antarctic, February ${s.latest.y}`, value: `${s.latest.v} million km²`, sub: `the ${nth(s.latest.rank)} lowest February of ${s.latest.of} · counted here` },
        ]}
      />
      <Sub>
        The ten warmest years · global mean surface temperature, °C against {t.baseline}
      </Sub>
      <Bars max={Math.ceil(top[1] * 2) / 2} color={WARM} rows={t.warmest.map(([y, v], i) => ({ key: String(y), label: `${i + 1}. ${y}`, value: v, text: `${signed(v)} °C` }))} />
      <Note>
        The bars run from zero to {signed(Math.ceil(top[1] * 2) / 2, 1)} °C. These are records of the whole globe's measured series, each ranked here from the agency's own figures. The highest and lowest temperature ever recorded in each country is
        not given: the World Meteorological Organization's archive of extremes is not published as a table that could be read here, and no figure is put in its place.
      </Note>
      <SourceLink sources={[SRC.gistemp, SRC.seaIce, SRC.co2]} className="mt-1" />
    </Card>
  );
}

/* ── Disasters ── */
function Disasters() {
  const d = DISASTER_DISPLACED;
  const a = DISASTER_ALERTS;
  const kinds = Object.entries(a.byKind).sort((x, y) => y[1].orange + y[1].red - (x[1].orange + x[1].red));
  const [allReds, setAllReds] = useState(false);
  const reds = allReds ? a.reds : a.reds.slice(0, 6);
  return (
    <Card kicker="Natural disasters — the countries struck, and how hard">
      <Tiles
        tiles={[
          ...(d.world !== null ? [{ label: `Displacements By Disasters, ${d.year}`, value: whole(d.world), sub: "movements of people forced from home within their own country, worldwide · IDMC" }] : []),
          { label: "Countries With Any", value: String(d.countries), sub: `with a displacement by a disaster recorded in ${d.year}` },
          { label: "Orange And Red Alerts", value: String(a.total), sub: `in the twelve months to ${day(a.to)} · counted here` },
          { label: "Red Alerts", value: String(a.reds.length), sub: "the gravest: international help likely to be needed", color: RED },
          { label: "Countries Listed", value: String(a.countries), sub: "as affected by at least one of those alerts" },
        ]}
      />
      <Sub>
        Where disasters displaced the most people · new displacements, {d.year}
      </Sub>
      <Bars max={d.top[0][2]} color={WARM} rows={d.top.map(([code, , v]) => ({ key: code, label: nameOf(code), value: v, text: whole(v) }))} />
      <Note>
        The bars run from zero to the largest, {nameOf(d.top[0][0])}'s. A displacement is a movement, not a person: someone forced out twice in the year is counted twice. {d.year} is the latest year the World Bank carries.
      </Note>

      <Sub>The alerts of twelve months, by kind of disaster</Sub>
      <div className="flex flex-wrap gap-1.5">
        {kinds.map(([kind, v]) => (
          <span key={kind} className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans border border-border text-foreground">
            {kind}
            <span className="font-mono" style={{ color: WARM }}>
              {v.orange} orange
            </span>
            <span className="font-mono" style={{ color: RED }}>
              {v.red} red
            </span>
          </span>
        ))}
      </div>

      <Sub>The countries most often listed as affected · orange and red alerts together</Sub>
      <Bars
        max={a.most[0][2] + a.most[0][3]}
        color={WARM}
        rows={a.most.map(([code, , orange, red]) => ({ key: code, label: nameOf(code), value: orange + red, text: `${orange + red} · ${red} red`, color: red ? RED : WARM }))}
      />

      <Sub>The red alerts · newest first</Sub>
      <ul className="space-y-1 text-[11px] font-sans text-muted-foreground leading-snug">
        {reds.map((r) => (
          <li key={r.url} className="flex items-start gap-2">
            <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: RED }} />
            <span>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline decoration-border underline-offset-2 hover:decoration-secondary">
                {r.kind}
                {r.name ? ` ${r.name}` : ""} <ArrowSquareOut size={10} aria-hidden />
              </a>{" "}
              · {r.countries.length ? r.countries.map(nameOf).join(", ") : "no country listed"} · {r.from === r.to ? day(r.from) : `${day(r.from)} to ${day(r.to)}`}
            </span>
          </li>
        ))}
      </ul>
      {a.reds.length > 6 && (
        <button
          type="button"
          onClick={() => setAllReds((v) => !v)}
          aria-expanded={allReds}
          className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:border-secondary/60 transition-colors cursor-pointer"
        >
          {allReds ? "Show the newest six" : `Show all ${a.reds.length}`}
        </button>
      )}
      <Note>
        An alert is the Global Disaster Alert and Coordination System's estimate, made as a disaster happens, of whether international help will be needed: orange for possibly, red for likely. It is not a count of the dead or of damage. The money
        cost of disasters country by country is not given here: the database that holds it does not allow a site that takes payment to republish it, and no estimate is put in its place.
      </Note>
      <SourceLink sources={[SRC.displaced, SRC.alerts]} className="mt-1" />
    </Card>
  );
}

/* ── Erosion ── */
function Erosion() {
  const b = EROSION.beaches;
  const s = EROSION.soil;
  return (
    <Card kicker="Erosion — the coasts and the soil">
      <div className="chart-fill">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground font-sans">The world's sandy beaches · {b.years}</p>
          <PartsDonut
            label={`The world's sandy beaches, ${b.years}: ${b.eroding}% eroding, ${b.accreting}% growing, ${b.stable}% stable`}
            parts={[
              { label: `Eroding by ${b.rate}`, value: b.eroding, text: `${b.eroding}%`, color: WARM },
              { label: "Growing", value: b.accreting, text: `${b.accreting}%`, color: "#16a34a" },
              { label: "Stable", value: b.stable, text: `${b.stable}%`, color: QUIET },
            ]}
          />
          <p className="text-xs text-muted-foreground font-sans leading-snug mt-1">
            Measured from satellite images of every sandy shore. {b.sandy}% of the world's ice-free shoreline is sandy; most of the sandy shore inside marine protected areas is eroding.
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground font-sans">Soil lost to erosion · {s.year}</p>
          <p className="text-base font-bold font-sans text-foreground leading-snug">
            {s.eroded} {s.unit}
          </p>
          <p className="text-xs text-muted-foreground font-sans leading-snug">
            a model's estimate for the world, in the one year. Its authors find erosion rising overall, driven by {s.driver}, with the greatest increases predicted in {s.where}, and the highest rates in the least developed economies.
          </p>
        </div>
      </div>
      <Note>
        Two published findings, each as its paper's abstract states it and checked against the abstract when this page's figures were built. They are single studies of the whole world, not yearly readings: neither is updated, and no figure by
        country is given because neither paper's abstract gives one.
      </Note>
      <SourceLink sources={[SRC.beaches, SRC.soil]} className="mt-1" />
    </Card>
  );
}

/* ── Projected warming ── */
function Projected() {
  const [scenario, setScenario] = useState(1);
  const [period, setPeriod] = useState(1);
  const [code, setCode] = useState("US");
  const ranked = useMemo(
    () =>
      Object.entries(WARMING_PROJECTED)
        .map(([c, v]) => ({ code: c, v: v[scenario][period] }))
        .sort((x, y) => y.v - x.v),
    [scenario, period],
  );
  // One scale for every scenario and period, so that switching between them shows the difference.
  const max = useMemo(() => Math.ceil(Math.max(...Object.values(WARMING_PROJECTED).flatMap((v) => v.flat()))), []);
  const options = useMemo(() => Object.keys(WARMING_PROJECTED).map((c) => ({ value: c, label: nameOf(c) })).sort((a, b) => a.label.localeCompare(b.label)), []);
  const own = WARMING_PROJECTED[code];
  const at = ranked.findIndex((r) => r.code === code) + 1;
  const chip = (on: boolean) => `px-3 py-1 rounded-full text-[11px] font-sans border cursor-pointer transition-colors ${on ? "chip-selected bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-secondary/60"}`;
  const row = (r: { code: string; v: number }) => ({ key: r.code, label: nameOf(r.code), value: Math.max(0, r.v), text: `${signed(r.v)} °C` });
  return (
    <Card kicker="Projections — how much warmer each country is projected to be">
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        {WARMING_SCENARIOS.map((s, i) => (
          <button key={s.id} type="button" onClick={() => setScenario(i)} aria-pressed={scenario === i} className={chip(scenario === i)} title={s.said}>
            {s.label}
          </button>
        ))}
        <span className="w-px h-4 bg-border mx-1" aria-hidden />
        {WARMING_PERIODS.map((p, i) => (
          <button key={p} type="button" onClick={() => setPeriod(i)} aria-pressed={period === i} className={chip(period === i)}>
            {p}
          </button>
        ))}
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-3">
        {WARMING_SCENARIOS[scenario].label}: {WARMING_SCENARIOS[scenario].said}. The change in mean annual temperature in {WARMING_PERIODS[period]}, against {WARMING_REFERENCE}.
      </p>

      <div className="rounded-lg border border-border/60 bg-background/40 p-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs text-muted-foreground font-sans">One country:</span>
          <span className="rounded-full border border-border px-3 py-1">
            <StyledSelect value={code} onValueChange={setCode} options={options} ariaLabel="Which country's projected warming" triggerClassName="!text-[12px] font-semibold !text-foreground" />
          </span>
          {at > 0 && (
            <span className="text-[11px] font-sans text-muted-foreground">
              the {nth(at)} largest change of {ranked.length} · counted here
            </span>
          )}
        </div>
        {own && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left font-sans font-medium text-muted-foreground pb-1 text-[9px] uppercase tracking-widest">Scenario</th>
                  {WARMING_PERIODS.map((p) => (
                    <th key={p} className="text-right font-sans font-medium text-muted-foreground pb-1 text-[9px] uppercase tracking-widest">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WARMING_SCENARIOS.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-3 font-sans text-foreground">
                      {s.label} <span className="text-muted-foreground">· {s.said}</span>
                    </td>
                    {own[i].map((v, p) => (
                      <td key={p} className={`py-1.5 pl-3 text-right font-mono whitespace-nowrap ${i === scenario && p === period ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                        {signed(v)} °C
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="chart-fill">
        <div>
          <Sub>The ten largest changes</Sub>
          <Bars max={max} color={WARM} rows={ranked.slice(0, 10).map(row)} />
        </div>
        <div>
          <Sub>The ten smallest</Sub>
          <Bars max={max} color={WARM} rows={ranked.slice(-10).reverse().map(row)} />
        </div>
      </div>
      <Note>
        Every bar runs from zero to {signed(max, 0)} °C, whichever scenario and period is chosen. A projection is not a forecast: it is the median of an ensemble of climate models run under a scenario of the world's emissions, for the country as
        a whole and its land. The change is against {WARMING_REFERENCE}, the Portal's reference period - not against pre-industrial times, which the headline warming figures are measured from - so these are smaller than those. The scenarios are
        the IPCC's shared socioeconomic pathways; which one the world follows is not known.
      </Note>
      <SourceLink sources={[SRC.projected]} className="mt-1" />
    </Card>
  );
}

export default function ClimateWatch() {
  return (
    <>
      <Enso />
      <Records />
      <Disasters />
      <Erosion />
      <Projected />
    </>
  );
}
