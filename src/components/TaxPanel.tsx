/**
 * Tax and wages: what a country's government takes in tax and what that
 * revenue is made of, the rates it sets on companies and on the highest
 * incomes, and what its employees are paid (data/countryTax.ts: the World
 * Bank, the OECD and the ILO). In a country's own window it is the
 * country's; in the window of a place in it - a state, a district, a town,
 * a city - it is given as the country's and says so, since tax law and the
 * national accounts are the country's and no body publishes these place by
 * place.
 *
 * For a state of the United States there is a second panel: what the state
 * itself collects in tax and what that is made of, from the Census Bureau's
 * survey of state government finances (data/stateFinance.ts).
 *
 * A figure that is not held is left out; the tiles that are there fill
 * their line, and a panel with nothing to show is not drawn.
 */
import { COUNTRY_TAX, COUNTRY_TAX_SOURCES, WAGE_PRICES_OF } from "../data/countryTax";
import { STATE_FINANCE, STATE_FINANCE_SOURCE, STATE_FINANCE_YEAR } from "../data/stateFinance";
import { inSentence } from "./CountryQuality";
import { ChartNote, ChartTitle, PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Tile = { label: string; value: string; sub: string };
const whole = (v: number) => Math.round(v).toLocaleString("en-US");

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">{note}</p>}
    </>
  );
}
function Tiles({ tiles }: { tiles: Tile[] }) {
  if (!tiles.length) return null;
  return (
    <div className="tile-fill gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="modal-tile rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-sans">{t.label}</p>
          <p className="text-lg font-bold font-mono text-foreground">{t.value}</p>
          <p className="text-xs text-muted-foreground font-sans leading-snug">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function TaxPanel({
  code,
  country,
  place,
  className = "",
}: {
  /** The country's ISO 3166-1 code. */
  code: string;
  country: string;
  /** The place whose window this is, where it is not the country itself. */
  place?: string;
  className?: string;
}) {
  const t = COUNTRY_TAX[code];
  if (!t) return null;
  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.label, s);
  const tiles: Tile[] = [];
  if (t.revenue) {
    tiles.push({ label: "Tax Revenue", value: `${t.revenue.v}%`, sub: `of GDP, central government, ${t.revenue.y}` });
    cite(COUNTRY_TAX_SOURCES.revenue);
  }
  if (t.corporate) {
    tiles.push({ label: "Corporate Tax Rate", value: `${t.corporate.v}%`, sub: `statutory, central and local together, ${t.corporate.y}` });
    cite(COUNTRY_TAX_SOURCES.rates);
  }
  if (t.topIncome) {
    tiles.push({ label: "Top Income Tax Rate", value: `${t.topIncome.v}%`, sub: `statutory, on the highest incomes, ${t.topIncome.y}` });
    cite(COUNTRY_TAX_SOURCES.rates);
  }
  if (t.wageMonth) {
    tiles.push({ label: "Average Monthly Earnings", value: `$${whole(t.wageMonth.v)}`, sub: `employees, US dollars at the year's exchange rate, ${t.wageMonth.y}` });
    cite(COUNTRY_TAX_SOURCES.wageMonth);
  }
  if (t.wageYear) {
    tiles.push({ label: "Average Annual Wage", value: `$${whole(t.wageYear.v)}`, sub: `US dollars at purchasing power parity, ${WAGE_PRICES_OF} prices, ${t.wageYear.y}` });
    cite(COUNTRY_TAX_SOURCES.wageYear);
  }
  const mix = t.mix;
  if (mix) cite(COUNTRY_TAX_SOURCES.revenue);
  if (!tiles.length && !mix) return null;
  const share = (v: number | undefined) => (v == null ? [] : [v]);
  return (
    <section className={className}>
      <Head
        title={`💶 Tax and wages${place ? ` · ${country}` : ""}`}
        note={
          place
            ? `These are ${inSentence(country)}'s figures, not ${place}'s own: tax law and the national accounts are the country's, and no body publishes them place by place.`
            : undefined
        }
      />
      <Tiles tiles={tiles} />
      {mix && (
        <div className="modal-tile rounded-xl p-4 mt-2">
          <ChartTitle>
            What the central government's revenue is made of · % of revenue · {mix.y}
          </ChartTitle>
          <PartsDonut
            label={`What the central government of ${country} takes in, by kind, ${mix.y}`}
            parts={[
              { label: "Taxes on income, profits and capital gains", value: mix.income, text: `${mix.income}%` },
              { label: "Taxes on goods and services", value: mix.goods, text: `${mix.goods}%` },
              ...share(mix.social).map((v) => ({ label: "Social contributions", value: v, text: `${v}%` })),
              { label: "Taxes on international trade", value: mix.trade, text: `${mix.trade}%` },
              { label: "Other taxes", value: mix.other, text: `${mix.other}%` },
              ...share(mix.grants).map((v) => ({ label: "Grants and other revenue", value: v, text: `${v}%`, color: "#94a3b8" })),
            ]}
          />
        </div>
      )}
      <ChartNote className="mt-2">
        {t.revenue || mix ? "The revenue is the central government's, as the IMF's accounts have it: a state's or a city's own taxes are not in it, so a federal country's share of GDP reads lower than all its taxes together. " : ""}
        {t.wageMonth && t.wageYear ? "The two wage figures are different measures and are not to be set against one another: one is a month's earnings at the exchange rate, the other a year's wage at what it buys." : ""}
      </ChartNote>
      <SourceLink sources={[...sources.values()]} className="mt-1" />
    </section>
  );
}

/** A US state's own taxes: what it collects, and of what kinds. */
export function StateTaxPanel({ stateId, name, place, className = "" }: { /** The state's id on the US States page. */ stateId: string; name: string; place?: string; className?: string }) {
  const f = STATE_FINANCE[stateId];
  if (!f?.totalTaxes) return null;
  // The survey's figures are in thousands of dollars.
  const dollars = (thousands: number) => (thousands >= 1e6 ? `$${(thousands / 1e6).toFixed(thousands >= 1e7 ? 1 : 2)}B` : `$${whole(thousands / 1e3)}M`);
  const kinds: [string, number | undefined][] = [
    ["Sales and gross receipts taxes", f.salesTaxes],
    ["Individual income taxes", f.individualIncomeTaxes],
    ["Corporate income taxes", f.corporateIncomeTaxes],
  ];
  const named = kinds.reduce((sum, [, v]) => sum + (v ?? 0), 0);
  const rest = f.totalTaxes - named;
  const pct = (v: number) => `${((100 * v) / f.totalTaxes!).toFixed(1)}%`;
  const parts = [
    ...kinds.flatMap(([label, v]) => (v && v > 0 ? [{ label, value: v, text: `${pct(v)} · ${dollars(v)}` }] : [])),
    // What is left once the three kinds the site holds are taken off: property, licence, severance and other taxes.
    ...(rest > 0 ? [{ label: "Other taxes", value: rest, text: `${pct(rest)} · ${dollars(rest)}`, color: "#94a3b8" }] : []),
  ];
  return (
    <section className={className}>
      <Head
        title={`🧾 State taxes · ${name}`}
        note={place ? `What the state of ${name} collects, not ${place} itself: a county's or a city's own taxes are not in it.` : `What the state government of ${name} itself collects: a county's or a city's own taxes are not in it.`}
      />
      <Tiles
        tiles={[
          { label: "State Taxes Collected", value: dollars(f.totalTaxes), sub: `the state government's, fiscal year ${STATE_FINANCE_YEAR}` },
          // A kind the survey gives no figure for is left out: no figure is not the same as none collected.
          ...kinds.flatMap(([label, v]) => (v && v > 0 ? [{ label, value: dollars(v), sub: `${pct(v)} of the state's taxes, ${STATE_FINANCE_YEAR}` }] : [])),
        ]}
      />
      {parts.length > 1 && (
        <div className="modal-tile rounded-xl p-4 mt-2">
          <ChartTitle>What the state's taxes are made of · {STATE_FINANCE_YEAR}</ChartTitle>
          <PartsDonut label={`The taxes the state of ${name} collected, by kind, ${STATE_FINANCE_YEAR}`} parts={parts} />
        </div>
      )}
      <ChartNote className="mt-2">The shares, and "other taxes" - what is left once the three kinds are taken from the total - are worked out here from the Census Bureau's figures.</ChartNote>
      <SourceLink sources={[STATE_FINANCE_SOURCE]} className="mt-1" />
    </section>
  );
}
