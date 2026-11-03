/**
 * An economy's currency, as asked: what it is worth today and over the past year, and a converter - read live, each time
 * the tab is opened.
 *
 *   The European Central Bank's euro foreign exchange reference rates: each working day, about 16:00 Central European
 *   Time, the rate of the euro in some thirty currencies. Read from the ECB's data portal in the reader's browser. A rate
 *   between two currencies neither of which is the euro - the yen in US dollars - is the ECB's two euro rates divided, and
 *   is said to be worked out here, as the ECB asks of any figure changed from its own. The ECB publishes the rates for
 *   information only, not as rates to buy or sell at, and the tab says so.
 *
 *   For a currency the ECB sets no rate for, the World Bank's official exchange rate: local currency units to the US
 *   dollar, the average of each year, as the country's authorities set or report it (PA.NUS.FCRF, CC BY 4.0). It is a
 *   year's average, not today's rate, so no converter is offered on it.
 *
 * Drawn in the site's chart language: dashed rules, small mono ticks, a line that does not animate, the latest figure, the
 * year's highest and lowest in ink, and the source under it.
 */
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { ChartNote, ChartTitle, FigureRow } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const ECB = "https://data-api.ecb.europa.eu/service/data/EXR";
const ECB_SOURCE = { label: "European Central Bank — euro foreign exchange reference rates", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html" };
const ECB_TERMS = { label: "European Central Bank — copyright and reuse of its statistics", url: "https://www.ecb.europa.eu/services/disclaimer/html/index.en.html" };
const WB_SOURCE = { label: "World Bank — official exchange rate, local currency units per US$, period average (PA.NUS.FCRF)", url: "https://data.worldbank.org/indicator/PA.NUS.FCRF" };
const COLOR = "#0ea5e9";

type Point = [date: string, value: number];

/** The ECB's CSV, figures only: each currency's observations, oldest first. */
async function ecb(query: string): Promise<Map<string, Point[]>> {
  const r = await fetch(`${ECB}/${query}${query.includes("?") ? "&" : "?"}format=csvdata&detail=dataonly`);
  if (!r.ok) throw new Error(`ECB ${r.status}`);
  const [head, ...rows] = (await r.text()).trim().split(/\r?\n/);
  const cols = head.split(",");
  const [iCur, iDate, iVal] = [cols.indexOf("CURRENCY"), cols.indexOf("TIME_PERIOD"), cols.indexOf("OBS_VALUE")];
  const out = new Map<string, Point[]>();
  for (const row of rows) {
    const f = row.split(",");
    const v = Number(f[iVal]);
    if (!f[iCur] || !f[iDate] || !Number.isFinite(v) || v <= 0) continue;
    if (!out.has(f[iCur])) out.set(f[iCur], []);
    out.get(f[iCur])!.push([f[iDate], v]);
  }
  for (const p of out.values()) p.sort((a, b) => a[0].localeCompare(b[0]));
  return out;
}

type Today = { date: string; perEuro: Map<string, number> };
let TODAY: Promise<Today> | null = null;
/** The ECB's latest rate of each currency it still sets: those with one within ten days of its latest. */
const today = () =>
  (TODAY ??= ecb("D..EUR.SP00.A?lastNObservations=1")
    .then((all) => {
      const date = [...all.values()].reduce((m, p) => (p[p.length - 1][0] > m ? p[p.length - 1][0] : m), "");
      const cut = new Date(Date.parse(date) - 10 * 864e5).toISOString().slice(0, 10);
      const perEuro = new Map<string, number>();
      for (const [cur, p] of all) if (p[p.length - 1][0] >= cut) perEuro.set(cur, p[p.length - 1][1]);
      return { date, perEuro };
    })
    .catch((e) => {
      TODAY = null;
      throw e;
    }));

const dayOf = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const nameOf = (code: string) => {
  if (code === "EUR") return "euro";
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
};
/** A rate as the ECB gives it: to six figures at most. */
const rate = (v: number) => v.toLocaleString("en", { maximumSignificantDigits: 6 });
/** A sum of money converted: to the cent, or to four figures where it is less than one. */
const money = (v: number) => (Math.abs(v) >= 1 ? v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toLocaleString("en", { maximumSignificantDigits: 4 }));

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="modal-tile rounded-xl p-4 min-w-0">
      <ChartTitle>{title}</ChartTitle>
      {children}
    </div>
  );
}

/** One line over time, its latest figure and its highest and lowest named under it. */
function RateChart({ points, unit, label, daily }: { points: Point[]; unit: string; label: string; daily: boolean }) {
  const { theme } = useTheme();
  const muted = theme === "light" ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const grid = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const tick = { fontSize: 9, fill: muted, fontFamily: "monospace" };
  const data = points.map(([d, v]) => ({ d, v }));
  const hi = points.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lo = points.reduce((a, b) => (b[1] < a[1] ? b : a));
  const last = points[points.length - 1];
  const when = (d: string) => (daily ? dayOf(d) : d);
  return (
    <>
      <div role="img" aria-label={`${label}: ${rate(last[1])} ${unit} on ${when(last[0])}; highest ${rate(hi[1])} on ${when(hi[0])}, lowest ${rate(lo[1])} on ${when(lo[0])}.`}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="d" tick={tick} axisLine={false} tickLine={false} minTickGap={36} tickFormatter={(d: string) => (daily ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }) : d)} />
            <YAxis tick={tick} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={52} tickFormatter={(v: number) => rate(v)} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, fontFamily: "monospace" }} labelFormatter={(d: string) => when(d)} formatter={(v: number) => [`${rate(v)} ${unit}`, ""]} separator="" />
            <Line type="linear" dataKey="v" stroke={COLOR} strokeWidth={1.75} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2">
        <FigureRow label={`Latest · ${when(last[0])}`} value={rate(last[1])} sub={unit} />
        <FigureRow label={`Highest · ${when(hi[0])}`} value={rate(hi[1])} sub={unit} />
        <FigureRow label={`Lowest · ${when(lo[0])}`} value={rate(lo[1])} sub={unit} />
      </div>
    </>
  );
}

/** Any sum in this currency in another the ECB sets a rate for, through the euro. */
function Converter({ code, t }: { code: string; t: Today }) {
  const codes = useMemo(() => ["EUR", ...[...t.perEuro.keys()].sort()], [t]);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(code);
  const [to, setTo] = useState(code === "USD" ? "EUR" : "USD");
  const per = (c: string) => (c === "EUR" ? 1 : t.perEuro.get(c)!);
  const n = Number(amount.replace(/,/g, ""));
  const out = Number.isFinite(n) ? (n / per(from)) * per(to) : NaN;
  const select = (value: string, set: (v: string) => void, label: string) => (
    <select value={value} onChange={(e) => set(e.target.value)} aria-label={label} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[12px] font-sans text-foreground cursor-pointer min-w-0 max-w-[11rem]">
      {codes.map((c) => (
        <option key={c} value={c}>
          {c} · {nameOf(c)}
        </option>
      ))}
    </select>
  );
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.slice(0, 18))}
          aria-label="Amount to convert"
          className="w-28 rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[12px] font-mono text-foreground focus:outline-none focus:border-foreground/40"
        />
        {select(from, setFrom, "From currency")}
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="px-2 py-1 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label="Swap the two currencies"
        >
          ⇄
        </button>
        {select(to, setTo, "To currency")}
      </div>
      <p className="mt-3 text-base font-bold font-mono text-foreground" aria-live="polite">
        {Number.isFinite(out) ? `${n.toLocaleString("en", { maximumFractionDigits: 2 })} ${from} = ${money(out)} ${to}` : "Enter a number to convert"}
      </p>
      <ChartNote className="mt-1">
        Worked out here from the ECB&apos;s reference rates of {dayOf(t.date)}, through the euro
        {from !== "EUR" && to !== "EUR" ? ` (1 euro = ${rate(per(from))} ${from} = ${rate(per(to))} ${to})` : ""}. The ECB publishes them for information only, not as rates to buy or sell at: a bank or a card charges its own.
      </ChartNote>
    </div>
  );
}

export default function EconomyCurrency({ code, name, cc, place }: { code: string; name: string; /** Its country's ISO code, for the World Bank's yearly rate. */ cc?: string; place: string }) {
  const [t, setT] = useState<Today | null | undefined>(undefined);
  const [year, setYear] = useState<Map<string, Point[]> | null | undefined>(undefined);
  const [wb, setWb] = useState<Point[] | null | undefined>(undefined);
  const [against, setAgainst] = useState<"EUR" | "USD">("EUR");

  useEffect(() => {
    let live = true;
    today()
      .then((x) => live && setT(x))
      .catch(() => live && setT(null));
    return () => {
      live = false;
    };
  }, []);

  const byEcb = !!t && (code === "EUR" || t.perEuro.has(code));
  // The past year, daily: this currency's rate and the dollar's, which a rate against the dollar is worked out from.
  useEffect(() => {
    if (!t || !byEcb) return;
    let live = true;
    const from = new Date(Date.parse(t.date) - 366 * 864e5).toISOString().slice(0, 10);
    const keys = [...new Set([code === "EUR" ? "USD" : code, "USD"])].join("+");
    ecb(`D.${keys}.EUR.SP00.A?startPeriod=${from}`)
      .then((x) => live && setYear(x))
      .catch(() => live && setYear(null));
    return () => {
      live = false;
    };
  }, [t, byEcb, code]);
  // Where the ECB sets no rate: the World Bank's average of each year.
  useEffect(() => {
    if (t === undefined || byEcb || !cc) return;
    let live = true;
    fetch(`https://api.worldbank.org/v2/country/${cc}/indicator/PA.NUS.FCRF?format=json&per_page=80`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: [unknown, { date: string; value: number | null }[] | null]) => {
        const p = (j?.[1] ?? []).flatMap((x): Point[] => (x.value !== null && x.value > 0 ? [[x.date, x.value]] : [])).sort((a, b) => a[0].localeCompare(b[0]));
        if (live) setWb(p.slice(-20));
      })
      .catch(() => live && setWb(null));
    return () => {
      live = false;
    };
  }, [t, byEcb, cc]);

  const header = (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
        Its currency · {name}
        {code && code !== "None" ? ` (${code})` : ""}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );

  if (t === undefined) return <div>{header}<p className="text-[11px] font-sans text-muted-foreground">Reading the ECB&apos;s rates…</p></div>;

  if (byEcb && t) {
    const usd = t.perEuro.get("USD");
    const x = code === "EUR" ? 1 : t.perEuro.get(code)!;
    const mine = year?.get(code === "EUR" ? "USD" : code);
    const dollar = year?.get("USD");
    // Against the dollar, day by day: the two euro rates of each day the ECB set both, divided.
    const vsUsd = mine && dollar && code !== "USD" && code !== "EUR" ? mine.flatMap(([d, v]): Point[] => {
      const u = dollar.find((p) => p[0] === d);
      return u ? [[d, v / u[1]]] : [];
    }) : null;
    const showUsd = against === "USD" && vsUsd && vsUsd.length > 2;
    return (
      <div>
        {header}
        <div className="grid grid-cols-1 gap-3">
          <Tile title={`Today · the ECB's reference rate · ${dayOf(t.date)}`}>
            {code === "EUR" ? (
              <>
                {usd && <FigureRow label="1 euro" value={`${rate(usd)} USD`} sub="the ECB's rate" />}
                {usd && <FigureRow label="1 US dollar" value={`${rate(1 / usd)} EUR`} sub="worked out here" />}
              </>
            ) : (
              <>
                <FigureRow label="1 euro" value={`${rate(x)} ${code}`} sub="the ECB's rate" />
                <FigureRow label={`1 ${nameOf(code)}`} value={`${rate(1 / x)} EUR`} sub="worked out here" />
                {usd && code !== "USD" && <FigureRow label="1 US dollar" value={`${rate(x / usd)} ${code}`} sub="worked out here from the ECB's two euro rates" />}
              </>
            )}
            <ChartNote className="mt-2">The ECB sets its rates each working day at about 16:00 Central European Time; a rate shown for a day before today is its latest.</ChartNote>
          </Tile>

          <Tile title={`Convert · ${place}'s currency and ${t.perEuro.size} others`}>
            <Converter code={code} t={t} />
          </Tile>

          {mine && mine.length > 2 && (
            <Tile title={showUsd ? `${code} to the US dollar · the past year, daily` : code === "EUR" ? "US dollars to the euro · the past year, daily" : `${code} to the euro · the past year, daily`}>
              {vsUsd && vsUsd.length > 2 && (
                <div className="flex gap-1.5 mb-2" role="group" aria-label="Against which currency">
                  {(["EUR", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAgainst(c)}
                      aria-pressed={against === c}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${against === c ? "border-foreground/40 text-foreground bg-muted/60" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      Against the {c === "EUR" ? "euro" : "US dollar"}
                    </button>
                  ))}
                </div>
              )}
              <RateChart
                points={showUsd ? vsUsd! : mine}
                unit={showUsd ? `${code} to the dollar` : code === "EUR" ? "USD to the euro" : `${code} to the euro`}
                label={showUsd ? `${code} to the US dollar over the past year` : `${code === "EUR" ? "US dollars" : code} to the euro over the past year`}
                daily
              />
              <ChartNote className="mt-2">
                {showUsd
                  ? "Each day's figure worked out here: the ECB's rate of the euro in this currency, divided by its rate of the euro in US dollars that day."
                  : "The ECB's rate each working day. A higher line is more of it to the euro: the currency weaker against it."}
              </ChartNote>
            </Tile>
          )}
          {year === null && <ChartNote>The ECB&apos;s past year of rates could not be read just now.</ChartNote>}

          {code === "EUR" && (
            <Tile title={`The euro in each currency the ECB sets · ${dayOf(t.date)}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {[...t.perEuro].sort((a, b) => a[0].localeCompare(b[0])).map(([c, v]) => (
                  <FigureRow key={c} label={`${c} · ${nameOf(c)}`} value={rate(v)} />
                ))}
              </div>
            </Tile>
          )}
        </div>
        <SourceLink sources={[ECB_SOURCE, ECB_TERMS]} className="mt-3" />
      </div>
    );
  }

  // The ECB sets no rate for it: the World Bank's yearly average, where there is one.
  return (
    <div>
      {header}
      {wb === undefined && cc ? (
        <p className="text-[11px] font-sans text-muted-foreground">Reading the World Bank&apos;s rates…</p>
      ) : wb && wb.length > 0 ? (
        <Tile title={`Local currency units to the US dollar · the average of each year · ${wb[0][0]}–${wb[wb.length - 1][0]}`}>
          {wb.length > 2 ? <RateChart points={wb} unit="to the dollar" label={`${place}'s official exchange rate to the US dollar, by year`} daily={false} /> : <FigureRow label={`Average · ${wb[wb.length - 1][0]}`} value={rate(wb[wb.length - 1][1])} sub="to the dollar" />}
          <ChartNote className="mt-2">
            The ECB sets no daily rate for the {name}{t === null ? " (or its rates could not be read just now)" : ""}. This is the World Bank&apos;s official rate: the average over each year of the rate the country&apos;s authorities set or report, in local currency units as the World Bank gives them. It is not today&apos;s rate, so it is not offered for converting.
          </ChartNote>
        </Tile>
      ) : (
        <p className="text-[11px] font-sans text-muted-foreground">Not held: {t === null ? "the ECB's rates could not be read just now, and " : "the ECB sets no rate for it, and "}the World Bank publishes no official rate for {place}.</p>
      )}
      <SourceLink sources={[WB_SOURCE, ECB_SOURCE]} className="mt-3" />
    </div>
  );
}
