/**
 * What homes rent and sell for, as asked (housingMeta.ts, build-housing.cjs):
 *
 *   a US state's house prices - the Federal Housing Finance Agency's index of what homes bought with the mortgages it
 *   tracks sold for, each quarter since 2000, beside the nation's, with the change over the last year and five worked out
 *   here and said to be;
 *   a county's rents - HUD's Fair Market Rents for fiscal year 2026 in the rent area HUD puts it in, for a home of each
 *   size - and the house prices of its metropolitan area or division by FHFA, the same way.
 *
 * Every figure is HUD's or FHFA's own. An index says how prices have moved, not what a home costs; the panel says so.
 */
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { FMR_YEAR, HOUSING_SOURCES, HPI_LATEST, type FmrFile, type HpiPoint } from "../data/housingMeta";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const json = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
let STATES: Promise<Record<string, HpiPoint[]>> | null = null;
let FMR: Promise<FmrFile> | null = null;
const states = () => (STATES ??= json<Record<string, HpiPoint[]>>("/housing/hpi-states.json").catch((e) => ((STATES = null), Promise.reject(e))));
const fmrFile = () => (FMR ??= json<FmrFile>("/housing/fmr.json").catch((e) => ((FMR = null), Promise.reject(e))));
const BEDROOMS = ["A studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms"];
const COLOR = "#0891b2";
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;

function Header({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/** A series' change from the same quarter a number of years before: worked out here from FHFA's index. */
function changeOver(p: HpiPoint[], years: number) {
  const last = p[p.length - 1];
  const then = p.find(([y, q]) => y === last[0] - years && q === last[1]);
  return then ? (100 * (last[2] - then[2])) / then[2] : null;
}

/** FHFA's index over the years: the place's line and, where given, the nation's. */
function IndexChart({ lines }: { lines: { key: string; label: string; color: string; points: HpiPoint[] }[] }) {
  const { theme } = useTheme();
  const muted = theme === "light" ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const grid = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const tick = { fontSize: 9, fill: muted, fontFamily: "monospace" };
  const keys = [...new Set(lines.flatMap((l) => l.points.map(([y, q]) => `${y} Q${q}`)))].sort();
  const data = keys.map((k) => Object.fromEntries([["k", k], ...lines.map((l) => [l.key, l.points.find(([y, q]) => `${y} Q${q}` === k)?.[2] ?? null])]));
  return (
    <>
      <div role="img" aria-label={lines.map((l) => `${l.label}: ${l.points[l.points.length - 1][2]} in ${l.points[l.points.length - 1][0]} Q${l.points[l.points.length - 1][1]}`).join("; ")}>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data} margin={{ top: 4, right: 6, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="k" tick={tick} axisLine={false} tickLine={false} minTickGap={36} tickFormatter={(k: string) => k.slice(0, 4)} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={44} domain={[0, "auto"]} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, fontFamily: "monospace" }} formatter={(v: number, n: string) => [v.toFixed(1), lines.find((l) => l.key === n)?.label ?? n]} />
            {lines.map((l) => (
              <Line key={l.key} type="linear" dataKey={l.key} stroke={l.color} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
        {lines.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
            <span className="text-[10px] font-sans text-muted-foreground">{l.label}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function Changes({ p, nation }: { p: HpiPoint[]; nation?: HpiPoint[] }) {
  const last = p[p.length - 1];
  return (
    <div className="mt-3">
      {[1, 5].map((y) => {
        const c = changeOver(p, y);
        const n = nation ? changeOver(nation, y) : null;
        return c === null ? null : <FigureRow key={y} label={`Over ${y === 1 ? "the last year" : "five years"}, to ${last[0]} Q${last[1]}`} value={signed(c)} sub={`worked out here${n !== null ? ` · the nation ${signed(n)}` : ""}`} />;
      })}
    </div>
  );
}

/** A US state's house prices, from FHFA. */
export function StateHousing({ abbr, name }: { abbr: string; name: string }) {
  const [s, setS] = useState<Record<string, HpiPoint[]> | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    states()
      .then((x) => live && setS(x))
      .catch(() => live && setS(null));
    return () => {
      live = false;
    };
  }, []);
  const p = s?.[abbr];
  if (!p || p.length < 8) return null;
  return (
    <div>
      <Header>{`House prices · ${name}`}</Header>
      <div className="modal-tile rounded-xl p-4 min-w-0">
        <ChartTitle>{`FHFA's house price index · each quarter since 2000 · to ${HPI_LATEST.year} Q${HPI_LATEST.quarter}`}</ChartTitle>
        <IndexChart lines={[{ key: "here", label: name, color: COLOR, points: p }, ...(s?.US && abbr !== "US" ? [{ key: "us", label: "United States", color: "#64748b", points: s.US }] : [])]} />
        <Changes p={p} nation={s?.US} />
        <ChartNote className="mt-2">The prices of homes bought with mortgages that Fannie Mae and Freddie Mac back, the same homes compared sale to sale, seasonally adjusted; 1991&apos;s first quarter is 100. It says how prices have moved, not what a home costs.</ChartNote>
      </div>
      <SourceLink sources={HOUSING_SOURCES.hpi} className="mt-2" />
    </div>
  );
}

/** A county's rents, from HUD, and its metropolitan area's house prices, from FHFA. */
export function CountyHousing({ fips, name }: { fips: string; name: string }) {
  const [f, setF] = useState<FmrFile | null | undefined>(undefined);
  const [metro, setMetro] = useState<[string, HpiPoint[]] | null>(null);
  useEffect(() => {
    let live = true;
    fmrFile()
      .then((x) => {
        if (!live) return;
        setF(x);
        const code = x.counties[fips]?.[1];
        if (code)
          json<[string, HpiPoint[]]>(`/housing/metro/${code}.json`)
            .then((m) => live && setMetro(m))
            .catch(() => undefined);
      })
      .catch(() => live && setF(null));
    return () => {
      live = false;
    };
  }, [fips]);
  const c = f?.counties[fips];
  const area = c?.[0] ? f?.areas[c[0]] : undefined;
  if (!area && !metro) return null;
  return (
    <div>
      <Header>{`Rents and house prices · ${name}`}</Header>
      <div className="grid grid-cols-1 gap-3">
        {area && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`HUD's Fair Market Rents · a month · FY${FMR_YEAR} · ${area[0]}`}</ChartTitle>
            <MeasureBars rows={area.slice(1).map((v, i) => ({ key: BEDROOMS[i], label: BEDROOMS[i], value: v as number, text: `$${(v as number).toLocaleString("en-US")}`, color: COLOR }))} label={`HUD's fair market rents in ${area[0]}`} />
            <ChartNote className="mt-2">
              What HUD finds a home of each size there rents for with its essential utilities: the 40th percentile of what recent movers pay, set each year for its housing vouchers, for October {FMR_YEAR - 1} to September {FMR_YEAR}.
              {c?.[2] ? " In New England HUD draws its areas by town, so part of the county may lie in another of its areas." : area[0].startsWith(name) ? "" : ` These are the rents of the area HUD counts ${name} in.`}
            </ChartNote>
          </div>
        )}
        {metro && metro[1].length > 8 && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`House prices in ${metro[0]} · FHFA's index · each quarter since 2000`}</ChartTitle>
            <IndexChart lines={[{ key: "here", label: metro[0], color: COLOR, points: metro[1] }]} />
            <Changes p={metro[1]} />
            <ChartNote className="mt-2">FHFA&apos;s index of all transactions in the metropolitan area {name} lies in, sales and refinancing appraisals alike; 1995&apos;s first quarter is 100. It says how prices have moved, not what a home costs.</ChartNote>
          </div>
        )}
      </div>
      <SourceLink sources={[...(area ? HOUSING_SOURCES.fmr : []), ...(metro ? HOUSING_SOURCES.hpi : [])]} className="mt-2" />
    </div>
  );
}
