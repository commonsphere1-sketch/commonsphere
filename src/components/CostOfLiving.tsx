/**
 * What things cost in a place against elsewhere, as asked - the cost of living, by the bodies that measure it
 * (priceLevels.ts, build-price-levels.cjs):
 *
 *   a country's price level against the world's average by the World Bank's International Comparison Program 2021, and
 *   against the European Union's by Eurostat where it covers the country - for all a household consumes and for food,
 *   housing, transport and the rest;
 *   a US state's, and the metro area a county lies in, against the nation's by the Bureau of Economic Analysis's Regional
 *   Price Parities - all items, goods, housing rents, utilities and other services.
 *
 * Each figure is the body's own, drawn on the site's slim bars with the average it is measured against marked on each.
 * A price level compares what the same things cost, at market exchange rates between countries; it says nothing of what
 * people earn there, and the panel says so.
 */
import { useEffect, useState } from "react";
import { BEA_PARTS, BEA_STATES, BEA_YEAR, EUROSTAT_PRICES, ICP_PRICES, ICP_YEAR, PRICE_PARTS, PRICE_SOURCES, type BeaMetros } from "../data/priceLevels";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = "#8b5cf6";
const fmt = (v: number) => v.toLocaleString("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Header({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/** A place's price levels: all of it in ink, then each part on a bar with the average they are measured against marked. */
function Levels({ title, values, labels, refName, place }: { title: string; values: (number | null)[]; labels: string[]; refName: string; place: string }) {
  const [all, ...parts] = values;
  return (
    <div className="modal-tile rounded-xl p-4 min-w-0">
      <ChartTitle>{title}</ChartTitle>
      {all !== null && <FigureRow label={labels[0]} value={fmt(all)} sub={`${refName} 100`} />}
      <div className="mt-3">
        <MeasureBars
          rows={parts.flatMap((v, i) => (v === null ? [] : [{ key: labels[i + 1], label: labels[i + 1], value: v, text: fmt(v), color: COLOR, world: { value: 100, text: "100" } }]))}
          refName={refName}
          label={`${place}'s price levels, ${refName} 100`}
        />
      </div>
    </div>
  );
}

/** A country's: the ICP's against the world, and Eurostat's against the EU where it has one. */
export default function CountryPrices({ code, country }: { code: string; country: string }) {
  const icp = ICP_PRICES[code];
  const es = EUROSTAT_PRICES[code];
  const labels = PRICE_PARTS.map(([, l]) => l);
  return (
    <div className="mb-4">
      <Header>What things cost · price levels</Header>
      {!icp && !es ? (
        <p className="text-[11px] font-sans text-muted-foreground">Not held: neither the World Bank&apos;s International Comparison Program nor Eurostat gives a price level for {country}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {icp && <Levels title={`Against the world · its average 100 · ICP ${ICP_YEAR}`} values={icp} labels={labels} refName="world" place={country} />}
          {es && <Levels title={`Against the European Union · its average 100 · Eurostat ${es[0]}`} values={es[1]} labels={labels} refName="EU" place={country} />}
          <ChartNote>
            A price level compares what the same goods and services cost, at market exchange rates: above 100 they cost more there than on average, below it less. It says nothing of what people earn.{" "}
            {icp ? `${ICP_YEAR} is the ICP's latest benchmark year, published in 2024.` : ""}
          </ChartNote>
        </div>
      )}
      <SourceLink sources={[...(icp ? PRICE_SOURCES.icp : []), ...(es ? PRICE_SOURCES.eurostat : []), ...(!icp && !es ? [...PRICE_SOURCES.icp, ...PRICE_SOURCES.eurostat] : [])]} className="mt-2" />
    </div>
  );
}

function UsLevels({ values, place, what }: { values: (number | null)[]; place: string; what: string }) {
  return (
    <div>
      <Levels title={`What things cost in ${what} · the nation 100 · BEA ${BEA_YEAR}`} values={values} labels={BEA_PARTS} refName="the nation" place={place} />
      <ChartNote className="mt-2">The Bureau of Economic Analysis&apos;s Regional Price Parities: what the same things cost here against the nation&apos;s average, 100. Housing is measured by rents.</ChartNote>
      <SourceLink sources={PRICE_SOURCES.bea} className="mt-2" />
    </div>
  );
}

/** A US state's, from BEA. */
export function StatePrices({ abbr, name }: { abbr: string; name: string }) {
  const v = BEA_STATES[abbr];
  if (!v) return null;
  return <UsLevels values={v} place={name} what={name} />;
}

let METROS: Promise<BeaMetros> | null = null;
/** The metro area BLS and BEA both know by its OMB code, from BEA; nothing where BEA gives it none (a nonmetropolitan area). */
export function MetroPrices({ code }: { code: string }) {
  const [m, setM] = useState<BeaMetros | null>(null);
  useEffect(() => {
    let live = true;
    (METROS ??= fetch("/prices/metros.json").then((r) => (r.ok ? (r.json() as Promise<BeaMetros>) : Promise.reject(new Error(String(r.status))))))
      .then((x) => live && setM(x))
      .catch(() => (METROS = null));
    return () => {
      live = false;
    };
  }, []);
  const row = m?.[code];
  if (!row) return null;
  const [name, ...values] = row;
  return <UsLevels values={values} place={name} what={name} />;
}
