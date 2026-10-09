/**
 * A city's own figures, set out and worked through: what a city's window on
 * the Cities page says of the city itself, and of nothing else.
 *
 * Everything here is the United Nations' for the city - World Urbanization
 * Prospects: The 2025 Revision - or follows from its figures and is said to:
 *
 *   its own, as given     its people, its land and the land that is built
 *                         on, for every fifth year from 1975 to 2050
 *                         (static/cities/<country>.json, built by
 *                         build-un-city-series.cjs and fetched when the
 *                         window opens), with the UN's own rating of how
 *                         plausible each population is
 *   worked out here       its growth over each five years, its people to a
 *                         km², the share of its land that is built on, its
 *                         place among its country's cities and the world's,
 *                         its share of the people of its country's cities,
 *                         and how far the cities near it are
 *
 * Years to 2025 are the UN's estimates; later ones its projections, and they
 * are drawn apart. A city here is what the UN's method draws - built-up land
 * of at least 1,500 people to a km², holding 50,000 or more - so its figures
 * are of that ground and not of the administrative city.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { countriesData } from "../data/countriesData";
import { UN_CITIES, UN_CITIES_SOURCE, type UnCity } from "../data/unCities";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Series = { p: (number | null)[]; a: (number | null)[]; b: (number | null)[]; q: (0 | 1 | 2 | null)[] };
type SeriesFile = { years: number[]; base: number; cities: Record<string, Series> };

const FILES = new Map<string, Promise<SeriesFile | null>>();
const load = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      fetch(`/cities/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<SeriesFile>) : null))
        .catch(() => null),
    );
  return FILES.get(cc)!;
};

const COUNTRY = new Map(countriesData.map((c) => [c.code, c.name]));
const RATING = ["Low", "Moderate", "High"];
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const pct = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const nth = (n: number) => `${n.toLocaleString("en-US")}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const km = (a: [number, number], b: [number, number]) => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
/** The change a year, compounded, that takes one figure to another over a number of years. */
const yearly = (from: number, to: number, years: number) => 100 * ((to / from) ** (1 / years) - 1);
const tip = { background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 11 };
const tick = { fontSize: 9, fontFamily: "monospace", fill: "currentColor" };

const Section = ({ title, note, children }: { title: string; note?: string; children?: ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
    {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">{note}</p>}
    {children}
  </section>
);
const Tile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="modal-tile rounded-lg p-3 min-w-0">
    <p className="text-xs text-muted-foreground font-sans">{label}</p>
    <p className="text-base font-bold font-mono text-foreground">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{sub}</p>}
  </div>
);

export default function CityAnalysis({ c, color, fallback }: { c: UnCity; color: string; /** What stands in its place while the city's file is fetched, and where there is none. */ fallback?: ReactNode }) {
  const [cc, code, name, lat, lon, , , , now] = c;
  const land = COUNTRY.get(cc) ?? cc;
  const [got, setGot] = useState<{ cc: string; file: SeriesFile | null } | null>(null);
  useEffect(() => {
    let off = false;
    load(cc).then((file) => !off && setGot({ cc, file }));
    return () => {
      off = true;
    };
  }, [cc]);
  const file = got && got.cc === cc ? got.file : undefined;
  const s = file?.cities[String(code)];

  /* Where it stands: among its country's cities and the world's, by the UN's figures for the same year. The world's list is written largest first. */
  const standing = useMemo(() => {
    const own = UN_CITIES.filter((x) => x[0] === cc);
    const world = UN_CITIES.findIndex((x) => x[0] === cc && x[1] === code);
    const dense = own.filter((x) => x[11] !== null).sort((a, b) => b[11]! - a[11]!);
    const wide = own.filter((x) => x[10] !== null).sort((a, b) => b[10]! - a[10]!);
    const at = (list: UnCity[]) => list.findIndex((x) => x[1] === code) + 1;
    const near =
      lat !== null && lon !== null
        ? UN_CITIES.filter((x) => !(x[0] === cc && x[1] === code) && x[3] !== null && x[4] !== null)
            .map((x) => ({ x, far: km([lat, lon], [x[3]!, x[4]!]) }))
            .sort((a, b) => a.far - b.far)
            .slice(0, 6)
        : [];
    return { own, world, inCountry: at(own), dense, denseAt: at(dense), wide, wideAt: at(wide), sum: own.reduce((t, x) => t + x[8], 0), near };
  }, [cc, code, lat, lon]);

  if (file === undefined) return <p className="text-xs font-sans text-muted-foreground">Loading {name}'s figures…</p>;
  if (!file || !s) return <>{fallback}</>;

  const { years, base } = file;
  const i0 = years.indexOf(base);
  const rows = years.flatMap((year, i) => (s.p[i] === null ? [] : [{ year, i, p: s.p[i]!, a: s.a[i], b: s.b[i], q: s.q[i] }]));
  const first = rows[0];
  const last = rows[rows.length - 1];
  const peak = rows.reduce((best, r) => (r.p > best.p ? r : best), rows[0]);
  const area = s.a[i0];
  const built = s.b[i0];
  const before = s.p[i0 - 1];
  /* The change a year over each five years, from the figures at either end. */
  const periods = rows.slice(1).flatMap((r, k) => (r.year - rows[k].year === 5 ? [{ label: `${String(rows[k].year).slice(2)}–${String(r.year).slice(2)}`, span: `${rows[k].year} to ${r.year}`, v: yearly(rows[k].p, r.p, 5), projected: r.year > base }] : []));
  const fastest = periods.filter((x) => !x.projected).reduce<(typeof periods)[number] | null>((best, x) => (!best || x.v > best.v ? x : best), null);
  const beside = [...standing.own.slice(0, 5), ...(standing.inCountry > 5 ? [c] : [])];
  const around = UN_CITIES.slice(Math.max(0, standing.world - 2), standing.world + 3);
  const dense = (r: (typeof rows)[number]) => (r.a ? r.p / r.a : null);

  return (
    <>
      <Section title={`🏙 ${name} in figures · ${base}`} note={`The United Nations' own figures for the city in ${base}, and what follows from them.`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Tile label="People" value={whole(now)} sub={`UN estimate, ${base}${s.q[i0] !== null ? ` · rated ${RATING[s.q[i0]!].toLowerCase()} for plausibility by the UN` : ""}`} />
          {area !== null && <Tile label="Land area" value={`${area < 100 ? area.toFixed(1) : whole(area)} km²`} sub={`the ground the UN counts as the city, ${base}`} />}
          {area !== null && area > 0 && <Tile label="People to a km²" value={whole(now / area)} sub="its people over its land · worked out here" />}
          {built !== null && <Tile label="Built-up land" value={`${built < 100 ? built.toFixed(1) : whole(built)} km²`} sub={area ? `${((100 * built) / area).toFixed(0)}% of its land · the share worked out here` : `${base}`} />}
          {built !== null && built > 0 && <Tile label="Built-up land a person" value={`${((built * 1e6) / now).toFixed(0)} m²`} sub="its built-up land over its people · worked out here" />}
          {before && <Tile label="Growth a year" value={pct(yearly(before, now, 5), 2)} sub={`on average, ${base - 5} to ${base}, compounded · worked out here`} />}
        </div>
      </Section>

      <Section
        title={`📈 Its people, ${first.year} to ${last.year}`}
        note={`The UN's figure for every fifth year, on an axis from zero: its estimates to ${base} as the filled line, its projections after as the broken one.${first.year > years[0] ? ` It has no figure for ${name} before ${first.year}.` : ""}`}
      >
        <div className="modal-tile rounded-lg p-4" role="img" aria-label={`${name}'s population: ${rows.map((r) => `${r.year} ${people(r.p)}`).join(", ")}.`}>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={rows.map((r) => ({ year: r.year, est: r.year <= base ? r.p : null, proj: r.year >= base ? r.p : null }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="year" type="number" domain={[first.year, last.year]} ticks={rows.filter((r) => r.year % 25 === 0).map((r) => r.year)} tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => people(v)} domain={[0, "auto"]} />
              <Tooltip formatter={(v: number, key: string) => [whole(v), key === "proj" ? "People, projected" : "People, estimated"]} labelFormatter={(y) => String(y)} contentStyle={tip} />
              <Area type="linear" dataKey="est" stroke={color} strokeWidth={1.75} fill={color} fillOpacity={0.14} dot={{ r: 2 }} isAnimationActive={false} connectNulls={false} />
              <Line type="linear" dataKey="proj" stroke={color} strokeWidth={1.75} strokeDasharray="4 3" dot={{ r: 2 }} isAnimationActive={false} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="modal-tile rounded-xl px-4 py-1.5 mt-2">
          <FigureRow label={`In ${first.year}`} value={whole(first.p)} sub={first.q !== null ? `rated ${RATING[first.q].toLowerCase()} by the UN` : undefined} />
          <FigureRow label={`In ${base}`} value={whole(now)} sub={`${pct((100 * (now - first.p)) / first.p, 0)} on ${first.year} · worked out here`} />
          {last.year > base && <FigureRow label={`Projected for ${last.year}`} value={whole(last.p)} sub={`${pct((100 * (last.p - now)) / now, 0)} on ${base} · the UN's projection, the change worked out here`} />}
          <FigureRow label="Its largest figure" value={whole(peak.p)} sub={`${peak.year}${peak.year > base ? ", a projection" : ""}${peak.year < last.year ? " · lower in every year after" : ""}`} />
        </div>
      </Section>

      {periods.length > 1 && (
        <Section title="📊 Its growth, five years at a time" note="The change a year over each five years, compounded: worked out here from the UN's figures at either end. A bar below the line is a fall. Paler bars are projections.">
          <div className="modal-tile rounded-lg p-4" role="img" aria-label={`${name}'s growth a year: ${periods.map((x) => `${x.span} ${pct(x.v)}`).join(", ")}.`}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={periods} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${v}%`} />
                <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.35} />
                <Tooltip formatter={(v: number) => [pct(v, 2), "A year"]} labelFormatter={(_, items) => (items[0]?.payload as { span?: string } | undefined)?.span ?? ""} contentStyle={tip} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
                <Bar dataKey="v" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                  {periods.map((x) => (
                    <Cell key={x.label} fill={color} fillOpacity={x.projected ? 0.35 : 0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {fastest && (
            <ChartNote>
              Its fastest five years on the UN's estimates were {fastest.span}, at {pct(fastest.v, 2)} a year.
            </ChartNote>
          )}
        </Section>
      )}

      {rows.some((r) => r.a !== null) && (
        <Section title="🏗 Its land, and what is built on it" note={`The ground the UN counts as the city and the part of it that is built on, every fifth year; to the right of the line are projections. People to a km² is its people over that ground, worked out here.`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="modal-tile rounded-lg p-4">
              <ChartTitle>Land area and built-up land · km²</ChartTitle>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={rows.map((r) => ({ year: r.year, a: r.a, b: r.b }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="year" type="number" domain={[first.year, last.year]} ticks={rows.filter((r) => r.year % 25 === 0).map((r) => r.year)} tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={40} domain={[0, "auto"]} tickFormatter={(v: number) => whole(v)} />
                  <ReferenceLine x={base} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" />
                  <Tooltip formatter={(v: number, key: string) => [`${v.toLocaleString("en-US")} km²`, key === "a" ? "Land area" : "Built-up land"]} labelFormatter={(y) => (Number(y) > base ? `${y} (projected)` : String(y))} contentStyle={tip} />
                  <Line type="linear" dataKey="a" stroke={color} strokeWidth={1.75} dot={{ r: 1.6 }} isAnimationActive={false} />
                  <Line type="linear" dataKey="b" stroke="currentColor" strokeOpacity={0.7} strokeWidth={1.5} dot={{ r: 1.6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                <span style={{ color }}>━</span> land area · ━ built-up land
              </p>
            </div>
            <div className="modal-tile rounded-lg p-4">
              <ChartTitle>People to a km² of its land</ChartTitle>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={rows.map((r) => ({ year: r.year, d: dense(r) }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="year" type="number" domain={[first.year, last.year]} ticks={rows.filter((r) => r.year % 25 === 0).map((r) => r.year)} tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={44} domain={[0, "auto"]} tickFormatter={(v: number) => whole(v)} />
                  <ReferenceLine x={base} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" />
                  <Tooltip formatter={(v: number) => [whole(v), "People to a km²"]} labelFormatter={(y) => (Number(y) > base ? `${y} (projected)` : String(y))} contentStyle={tip} />
                  <Line type="linear" dataKey="d" stroke={color} strokeWidth={1.75} dot={{ r: 1.6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">its people over its land, year by year</p>
            </div>
          </div>
        </Section>
      )}

      <Section title="🏁 Where it stands" note={`Its place by the UN's ${base} figures: among the ${standing.own.length.toLocaleString("en-US")} cities the UN counts in ${land}, and the ${UN_CITIES.length.toLocaleString("en-US")} it counts in the world. Each place is counted here.`}>
        <div className="modal-tile rounded-xl px-4 py-1.5">
          <FigureRow label="By its people, in the world" value={`${nth(standing.world + 1)} of ${UN_CITIES.length.toLocaleString("en-US")}`} />
          <FigureRow label={`By its people, in ${land}`} value={`${nth(standing.inCountry)} of ${standing.own.length.toLocaleString("en-US")}`} />
          <FigureRow label={`Of the people in ${land}'s cities`} value={`${((100 * now) / standing.sum).toFixed((100 * now) / standing.sum < 1 ? 2 : 1)}%`} sub={`of the ${people(standing.sum)} in all of them · worked out here`} />
          {standing.denseAt > 0 && <FigureRow label={`By people to a km², in ${land}`} value={`${nth(standing.denseAt)} of ${standing.dense.length.toLocaleString("en-US")}`} sub="the most crowded first" />}
          {standing.wideAt > 0 && <FigureRow label={`By land area, in ${land}`} value={`${nth(standing.wideAt)} of ${standing.wide.length.toLocaleString("en-US")}`} sub="the widest first" />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="modal-tile rounded-xl p-4">
            <ChartTitle>
              Beside {land}'s largest cities · people, {base}
            </ChartTitle>
            <MeasureBars label={`${name} beside the largest cities of ${land}`} rows={beside.map((x) => ({ key: String(x[1]), label: x[1] === code ? `${x[2]} · this city` : x[2], value: x[8], text: whole(x[8]), color: x[1] === code ? color : undefined }))} />
          </div>
          <div className="modal-tile rounded-xl p-4">
            <ChartTitle>The cities of its size · people, {base}</ChartTitle>
            <MeasureBars
              label={`${name} beside the cities next to it in the world's order`}
              rows={around.map((x) => ({
                key: `${x[0]}-${x[1]}`,
                label: x[0] === cc && x[1] === code ? `${x[2]} · this city` : `${x[2]}, ${COUNTRY.get(x[0]) ?? x[0]}`,
                value: x[8],
                text: whole(x[8]),
                color: x[0] === cc && x[1] === code ? color : undefined,
              }))}
            />
          </div>
        </div>
      </Section>

      {standing.near.length > 0 && (
        <Section title="🧭 The cities nearest it" note="The nearest other cities the UN counts, by the straight line between where each one's people are centred - worked out here - each with its people.">
          <div className="modal-tile rounded-xl px-4 py-1.5">
            {standing.near.map(({ x, far }) => (
              <FigureRow key={`${x[0]}-${x[1]}`} label={x[0] === cc ? x[2] : `${x[2]}, ${COUNTRY.get(x[0]) ?? x[0]}`} value={`${far < 10 ? far.toFixed(1) : whole(far)} km`} sub={`${whole(x[8])} people, ${base}`} />
            ))}
          </div>
        </Section>
      )}

      <SourceLink sources={[UN_CITIES_SOURCE]} />
    </>
  );
}
