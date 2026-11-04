/**
 * What electricity, gas and fuel cost in a place, as asked (energyPrices.ts, build-energy-prices.cjs):
 *
 *   a US state's - the US Energy Information Administration's average price of electricity by sector, the latest month
 *   beside the same month a year before and the nation's, and the year to date; and the week's pump prices of regular
 *   gasoline and diesel over the past year, the state's own where EIA prices it alone, else its petroleum region's,
 *   said to be the region's;
 *   a country's - for the United States the same nation's figures; for a European country Eurostat's household prices of
 *   electricity and gas, the latest half-year beside the European Union's average, and the Weekly Oil Bulletin's pump
 *   prices of Euro-super 95 and diesel.
 *
 * Every figure is the body's own, in its own unit - cents, dollars or euros - none converted.
 */
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { EIA_ELECTRICITY, EIA_ELECTRICITY_PERIODS, EIA_FUEL, EIA_FUEL_AREAS, EIA_PADD, ENERGY_PRICE_SOURCES, EUROSTAT_HOUSEHOLD, OIL_BULLETIN, OIL_BULLETIN_DATE } from "../data/energyPrices";
import { ChartNote, ChartTitle, FigureRow } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const SECTORS = ["Homes", "Businesses", "Industry", "All customers"];
const cents = (v: number | null) => (v === null ? "Not published" : `${v.toFixed(2)}¢`);
const dollars = (v: number) => `$${v.toFixed(3)}`;
const euros = (v: number | null, dp = 3) => (v === null ? "Not published" : `€${v.toFixed(dp)}`);
const dayOf = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** EIA's "August 2026 YTD" as a reader says it: January to August 2026. */
const toDate = (s: string) => {
  const m = s.match(/^(\w+) (\d{4}) YTD$/);
  return m ? (m[1] === "January" ? `January ${m[2]}` : `January–${m[1]} ${m[2]}`) : s;
};
/** Eurostat's "2026-S1" as a reader says it. */
const half = (s: string) => (s.endsWith("S1") ? `January–June ${s.slice(0, 4)}` : s.endsWith("S2") ? `July–December ${s.slice(0, 4)}` : s);

function Header({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}
function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="modal-tile rounded-xl p-4 min-w-0">
      <ChartTitle>{title}</ChartTitle>
      {children}
    </div>
  );
}

/** EIA's electricity prices for one state (or US, the nation). */
function Electricity({ abbr, place }: { abbr: string; place: string }) {
  const e = EIA_ELECTRICITY[abbr];
  const us = EIA_ELECTRICITY.US;
  if (!e) return null;
  const [now, before] = EIA_ELECTRICITY_PERIODS.month;
  return (
    <Tile title={`Electricity · cents a kilowatt-hour · ${now}`}>
      {SECTORS.map((s, i) => (
        <FigureRow
          key={s}
          label={s}
          value={cents(e.month[0][i])}
          sub={[`${before} ${cents(e.month[1][i])}`, abbr !== "US" && us ? `the nation's ${cents(us.month[0][i])}` : ""].filter(Boolean).join(" · ")}
        />
      ))}
      <FigureRow label={`Homes, ${toDate(EIA_ELECTRICITY_PERIODS.ytd[0])}`} value={cents(e.ytd[0][0])} sub={`${toDate(EIA_ELECTRICITY_PERIODS.ytd[1])} ${cents(e.ytd[1][0])}`} />
      <ChartNote className="mt-2">EIA&apos;s average price {place === "the United States" ? "across the country" : `across ${place}`}: the revenue from customers over the electricity sold to them.</ChartNote>
    </Tile>
  );
}

/** The area EIA prices a state's fuel by: the state itself where it prices it alone, else the region it lies in. */
function fuelArea(abbr: string, fuel: "gasoline" | "diesel") {
  const own = `S${abbr}`;
  if (EIA_FUEL[fuel][own]) return own;
  const region = Object.entries(EIA_PADD).find(([, states]) => states.includes(abbr))?.[0];
  // Diesel is priced for the West Coast without California; gasoline the same.
  if (region === "R50" && abbr !== "CA" && EIA_FUEL[fuel].R5XCA) return "R5XCA";
  return region && EIA_FUEL[fuel][region] ? region : null;
}

/** A year of weekly prices: the place's line and the nation's. */
function FuelChart({ lines }: { lines: { key: string; label: string; color: string; points: [string, number][] }[] }) {
  const { theme } = useTheme();
  const muted = theme === "light" ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const grid = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const tick = { fontSize: 9, fill: muted, fontFamily: "monospace" };
  const weeks = [...new Set(lines.flatMap((l) => l.points.map(([w]) => w)))].sort();
  const data = weeks.map((w) => Object.fromEntries([["w", w], ...lines.map((l) => [l.key, l.points.find(([pw]) => pw === w)?.[1] ?? null])]));
  return (
    <>
      <div role="img" aria-label={lines.map((l) => `${l.label}: ${dollars(l.points[l.points.length - 1][1])} the week of ${dayOf(l.points[l.points.length - 1][0])}`).join("; ")}>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data} margin={{ top: 4, right: 6, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="w" tick={tick} axisLine={false} tickLine={false} minTickGap={36} tickFormatter={(d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" })} />
            <YAxis tick={tick} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={44} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, fontFamily: "monospace" }} labelFormatter={(d: string) => `Week of ${dayOf(d)}`} formatter={(v: number, n: string) => [dollars(v), lines.find((l) => l.key === n)?.label ?? n]} />
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
            <span className="text-[10px] font-mono font-bold text-foreground">{dollars(l.points[l.points.length - 1][1])}</span>
          </span>
        ))}
      </div>
    </>
  );
}

/** EIA's pump prices for a state (or US): its own or its region's, beside the nation's. */
function Fuel({ abbr }: { abbr: string }) {
  const gas = abbr === "US" ? "NUS" : fuelArea(abbr, "gasoline");
  const diesel = abbr === "US" ? "NUS" : fuelArea(abbr, "diesel");
  if (!gas) return null;
  const g = EIA_FUEL.gasoline[gas];
  const d = diesel ? EIA_FUEL.diesel[diesel] : undefined;
  const us = EIA_FUEL.gasoline.NUS;
  const week = g[g.length - 1][0];
  const yearAgo = g[0];
  const whose = (area: string) => (area === "NUS" ? "the nation's" : area.startsWith("S") ? "the state's own" : `${EIA_FUEL_AREAS[area]}'s, EIA pricing no state alone here`);
  return (
    <Tile title={`Fuel at the pump · dollars a gallon, taxes included · the week of ${dayOf(week)}`}>
      <FigureRow label="Regular gasoline" value={dollars(g[g.length - 1][1])} sub={`${whose(gas)} · ${dayOf(yearAgo[0])} ${dollars(yearAgo[1])}`} />
      {d && <FigureRow label="Diesel" value={dollars(d[d.length - 1][1])} sub={`${whose(diesel!)} · ${dayOf(d[0][0])} ${dollars(d[0][1])}`} />}
      <div className="mt-3">
        <FuelChart lines={[{ key: "here", label: gas === "NUS" ? "United States, regular" : `${EIA_FUEL_AREAS[gas]}, regular`, color: "#d97706", points: g }, ...(gas !== "NUS" ? [{ key: "us", label: "United States, regular", color: "#64748b", points: us }] : [])]} />
      </div>
    </Tile>
  );
}

/** A US state's: electricity and fuel, from EIA. */
export function StateEnergy({ abbr, name }: { abbr: string; name: string }) {
  if (!EIA_ELECTRICITY[abbr]) return null;
  return (
    <div>
      <Header>{`Energy prices · ${name}`}</Header>
      <div className="grid grid-cols-1 gap-3">
        <Electricity abbr={abbr} place={name} />
        <Fuel abbr={abbr} />
      </div>
      <SourceLink sources={[...ENERGY_PRICE_SOURCES.eiaElectricity, ...ENERGY_PRICE_SOURCES.eiaFuel]} className="mt-2" />
    </div>
  );
}

/** A country's: the United States' from EIA; a European country's from Eurostat and the Weekly Oil Bulletin. */
export default function CountryEnergy({ code, country }: { code: string; country: string }) {
  if (code === "US")
    return (
      <div className="mb-4">
        <Header>Energy prices</Header>
        <div className="grid grid-cols-1 gap-3">
          <Electricity abbr="US" place="the United States" />
          <Fuel abbr="US" />
        </div>
        <SourceLink sources={[...ENERGY_PRICE_SOURCES.eiaElectricity, ...ENERGY_PRICE_SOURCES.eiaFuel]} className="mt-2" />
      </div>
    );
  const el = EUROSTAT_HOUSEHOLD.electricity[code];
  const gas = EUROSTAT_HOUSEHOLD.gas[code];
  const eu = { el: EUROSTAT_HOUSEHOLD.electricity.EU, gas: EUROSTAT_HOUSEHOLD.gas.EU };
  const pump = OIL_BULLETIN[code];
  if (!el && !gas && !pump)
    return (
      <div className="mb-4">
        <Header>Energy prices</Header>
        <p className="text-[11px] font-sans text-muted-foreground">Not held: the open official sources the site reads - EIA for the United States, Eurostat and the European Commission for Europe - give no household energy or pump prices for {country}.</p>
      </div>
    );
  return (
    <div className="mb-4">
      <Header>Energy prices</Header>
      <div className="grid grid-cols-1 gap-3">
        {(el || gas) && (
          <Tile title="For households · euros a kilowatt-hour, all taxes and levies included">
            {el && <FigureRow label={`Electricity · ${half(el[0])}`} value={euros(el[1], 4)} sub={eu.el ? `the EU's ${euros(eu.el[1], 4)}` : undefined} />}
            {gas && <FigureRow label={`Natural gas · ${half(gas[0])}`} value={euros(gas[1], 4)} sub={eu.gas ? `the EU's ${euros(eu.gas[1], 4)}` : undefined} />}
            <ChartNote className="mt-2">Eurostat&apos;s price for a household of middling use: electricity 2,500 to 4,999 kWh a year, gas 20 to 199 GJ.</ChartNote>
          </Tile>
        )}
        {pump && (
          <Tile title={`At the pump · euros a litre, taxes included · the week of ${dayOf(OIL_BULLETIN_DATE)}`}>
            <FigureRow label="Euro-super 95 petrol" value={euros(pump[0])} />
            <FigureRow label="Diesel" value={euros(pump[1])} />
          </Tile>
        )}
      </div>
      <SourceLink sources={[...(el || gas ? ENERGY_PRICE_SOURCES.eurostat : []), ...(pump ? ENERGY_PRICE_SOURCES.oilBulletin : [])]} className="mt-2" />
    </div>
  );
}
