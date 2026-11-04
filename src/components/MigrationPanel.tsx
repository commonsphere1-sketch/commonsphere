/**
 * Who has moved to and from a country, as asked (migration.ts, build-migration.cjs): the people living there born
 * abroad and their share of its people over the years, beside the world's, by the UN; net migration, the UN's estimate
 * for each year to 2023; and what people working abroad send home, received and paid, by the IMF and the World Bank -
 * all as the World Bank's World Development Indicators publish them.
 *
 * Every figure is the body's own. Where migrants come from is not given, and the panel says why.
 */
import { MIGRATION, MIGRATION_SOURCES, MIGRATION_WORLD, NET_MIGRATION_LAST } from "../data/migration";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = "#14b8a6";
const people = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(Math.abs(v) >= 1e7 ? 1 : 2)} million` : Math.round(v).toLocaleString("en-US"));
const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(v >= 1e10 ? 1 : 2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v).toLocaleString("en-US")}`);
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${people(Math.abs(v))}`;

export default function MigrationPanel({ code, country }: { code: string; country: string }) {
  const m = MIGRATION[code];
  if (!m) return null;
  const stock = m.stock;
  const last = stock[stock.length - 1];
  const rec = m.received[m.received.length - 1];
  const recGdp = m.receivedGdp[m.receivedGdp.length - 1];
  const paid = m.paid[m.paid.length - 1];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Migration</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {last && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`Born abroad · the UN's international migrant stock · ${stock[0][0]}–${last[0]}`}</ChartTitle>
            <FigureRow label={`People living there born abroad · ${last[0]}`} value={people(last[1])} sub={last[2] !== null ? `${last[2]}% of its people${MIGRATION_WORLD.share && MIGRATION_WORLD.share[0] === last[0] ? ` · the world ${MIGRATION_WORLD.share[1]}%` : ""}` : undefined} />
            {stock.filter((s) => s[2] !== null).length > 2 && (
              <div className="mt-3">
                <MeasureBars
                  rows={stock.filter((s) => s[2] !== null).map(([y, , sh]) => ({ key: String(y), label: String(y), value: sh!, text: `${sh}%`, color: COLOR }))}
                  label={`The share of ${country}'s people born abroad, by year`}
                />
              </div>
            )}
            <ChartNote className="mt-2">The UN counts the people living in a country who were born in another - or, where a country records no birthplace, who are citizens of another - refugees among them.</ChartNote>
          </div>
        )}
        {m.net.length > 0 && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`Net migration · people who moved in less those who moved out · the UN's estimates to ${NET_MIGRATION_LAST}`}</ChartTitle>
            {m.net
              .slice(-5)
              .reverse()
              .map(([y, v]) => (
                <FigureRow key={y} label={String(y)} value={signed(v)} sub={v > 0 ? "more came than left" : v < 0 ? "more left than came" : "as many came as left"} />
              ))}
            <ChartNote className="mt-2">The UN&apos;s World Population Prospects. Its later years are projections, not counts, and are left out.</ChartNote>
          </div>
        )}
        {(rec || paid) && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>Money sent home · personal remittances, current US dollars</ChartTitle>
            {rec && <FigureRow label={`Received · ${rec[0]}`} value={usd(rec[1])} sub={recGdp ? `${recGdp[1]}% of its GDP, ${recGdp[0]}` : undefined} />}
            {paid && <FigureRow label={`Paid out · ${paid[0]}`} value={usd(paid[1])} sub="sent abroad by those working there" />}
            {MIGRATION_WORLD.received && <FigureRow label={`The world's, received · ${MIGRATION_WORLD.received[0]}`} value={usd(MIGRATION_WORLD.received[1])} />}
            <ChartNote className="mt-2">What households send to and receive from households in other countries, with the pay of seasonal and other short-term workers employed in a country where they do not live: the IMF&apos;s balance of payments, and the World Bank&apos;s estimates where a country reports none.</ChartNote>
          </div>
        )}
        <ChartNote>Which countries {country}&apos;s migrants come from is not shown: the UN publishes it, but under no licence that lets this site carry it.</ChartNote>
      </div>
      <SourceLink sources={[MIGRATION_SOURCES.stock, MIGRATION_SOURCES.net, MIGRATION_SOURCES.remittances, MIGRATION_SOURCES.un]} className="mt-2" />
    </div>
  );
}
