/**
 * Two parts of an economy's window.
 *
 * EconomyStanding, on the Overview: where the economy stands and what it
 * weighs in the world - its size and its share of the world's output, its
 * growth, prices, jobs and debt beside the world's for the same year, what
 * each person's share comes to, and how much of it is trade. It stands where
 * a five-year chart of three of these did.
 *
 * EconomyHasNeeds, under Resources: the largest companies based there, by
 * name; what it sells and what it buys; and the energy it produces beside
 * the energy it uses, with what that energy is made from.
 *
 * Every figure is one the site already holds with its source and year: the
 * economy's own record, the world series of worldview.ts, the energy balance
 * of countryEnergy.ts and the companies of topCompanies.ts. The only things
 * worked out here are a share - one published figure over another for the
 * same year - and which of two figures is the larger; a comparison is made
 * only where both are for the same year, and where a figure is not
 * published the line is left out. No verdict is given on any of it.
 */
import { useState, type ReactNode } from "react";
import { economiesData, ECONOMY_FIGURE_SOURCES, type Economy } from "../data/economiesData";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_OF, CODE_OF_ECONOMY } from "../data/placeIndex";
import { TOP_COMPANIES, TOP_COMPANY_LISTS } from "../data/topCompanies";
import { WORLD } from "../data/worldview";
import { has } from "../lib/na";
import { ChartTitle, PartsDonut, worldFor } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const usd = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}bn` : `$${Math.round(v).toLocaleString("en-US")}`);
const pct = (v: number, dp = 1) => `${v.toFixed(dp)}%`;
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const twh = (v: number) => `${v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)} TWh`;
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

/** The year a figure of the economy is for, from the source it is cited to or the card's own record. */
function yearOf(economy: Economy, field: string): string | undefined {
  return (ECONOMY_FIGURE_SOURCES[economy.id] as Record<string, { year: string } | undefined> | undefined)?.[field]?.year ?? economy.figureYears?.[field];
}

function Heading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
      {aside}
    </div>
  );
}

type Line = { label: string; value: string; year?: string; says?: string };

function Lines({ lines }: { lines: Line[] }) {
  return (
    <div className="modal-tile rounded-xl px-4 py-1">
      {lines.map((l) => (
        <div key={l.label} className="py-2.5 border-b border-border/40 last:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-sans text-foreground min-w-0">{l.label}</span>
            <span className="text-[13px] font-mono font-bold text-foreground shrink-0">
              {l.value}
              {l.year && <span className="text-[10px] font-normal text-muted-foreground"> · {l.year}</span>}
            </span>
          </div>
          {l.says && <p className="text-[11px] font-sans leading-snug text-muted-foreground mt-0.5">{l.says}</p>}
        </div>
      ))}
    </div>
  );
}

/** Which of two figures is the larger, in plain words; nothing on which is the better. */
const beside = (mine: number, world: number, what: string, print: (v: number) => string) =>
  mine === world ? `Level with the world's ${print(world)} ${what}.` : `${mine > world ? "Above" : "Below"} the world's ${print(world)} ${what}.`;

/** Where the economy stands, and what it weighs in the world. */
export function EconomyStanding({ economy }: { economy: Economy }) {
  const lines: Line[] = [];
  const isCountry = economy.entityType === "Country";

  if (has(economy.gdpTrillions)) {
    const year = yearOf(economy, "gdpTrillions");
    const gdp = economy.gdpTrillions * 1e12;
    const world = worldFor("gdp", year);
    const ranked = economiesData.filter((e) => e.entityType === "Country" && has(e.gdpTrillions)).sort((a, b) => b.gdpTrillions - a.gdpTrillions);
    const rank = ranked.findIndex((e) => e.id === economy.id) + 1;
    lines.push({
      label: "Size · everything it produces in a year",
      value: usd(gdp),
      year,
      says: [
        world ? `${pct((100 * gdp) / world, (100 * gdp) / world < 1 ? 2 : 1)} of the world's output of ${usd(world)} that year.` : null,
        isCountry && rank > 0 ? `The ${ordinal(rank)} largest of the ${ranked.length} country economies the site holds.` : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
  if (has(economy.gdpPerCapita)) {
    const year = yearOf(economy, "gdpPerCapita");
    const gdp = worldFor("gdp", year);
    const people = worldFor("population", year);
    const world = gdp && people ? gdp / people : null;
    lines.push({
      label: "Output for each person",
      value: usd(economy.gdpPerCapita),
      year,
      says: world ? `${economy.gdpPerCapita >= world ? `${(economy.gdpPerCapita / world).toFixed(1)} times` : pct((100 * economy.gdpPerCapita) / world, 0) + " of"} the world's ${usd(world)} a person - its output over its people, both for ${year}.` : undefined,
    });
  }
  const compared = (field: "gdpGrowthRate" | "inflationRate" | "unemploymentRate" | "debtToGDPRatio", label: string, worldId: string, what: string) => {
    const v = economy[field];
    if (!has(v)) return;
    const year = yearOf(economy, field);
    const world = worldFor(worldId, year);
    lines.push({ label, value: pct(v), year, says: world !== null ? beside(v, world, what, (x) => pct(x)) : undefined });
  };
  compared("gdpGrowthRate", "Growth · how much more it produces than the year before, prices taken out", "gdpGrowth", "growth");
  compared("inflationRate", "Inflation · how fast prices are rising", "inflation", "inflation");
  compared("unemploymentRate", "Unemployment · of those in the labour force", "unemployment", "unemployment");
  compared("debtToGDPRatio", "Government debt · against a year's output", "govDebt", "government debt, as a share of the world's output");

  if (has(economy.tradeVolumeTrillions) && has(economy.gdpTrillions)) {
    const year = economy.tradeYear ?? yearOf(economy, "tradeVolumeTrillions");
    const same = year && year === yearOf(economy, "gdpTrillions");
    const share = same ? (100 * economy.tradeVolumeTrillions) / economy.gdpTrillions : null;
    const world = same ? worldFor("trade", year) : null;
    lines.push({
      label: "Trade · its exports and imports together",
      value: usd(economy.tradeVolumeTrillions * 1e12),
      year: year ?? undefined,
      says: share !== null ? `Equal to ${pct(share, 0)} of its output for the year${world !== null ? `; the world's trade was ${pct(world, 0)} of world output` : ""}.` : undefined,
    });
  }
  if (!lines.length) return null;
  const sources = (economy.dataSources ?? []).concat([WORLD.gdp.source, WORLD.gdpGrowth.source]).filter((s, i, all) => all.findIndex((o) => o.label === s.label) === i);

  return (
    <div>
      <Heading>Where the economy stands</Heading>
      <Lines lines={lines} />
      <p className="text-[10px] font-sans leading-snug text-muted-foreground mt-2">
        Each figure is the economy's own, with its year; the world's beside it is for the same year, and is left out where the site holds none for that year. A share is one
        published figure over another. Above and below say which is the larger, not which is the better.
      </p>
      <SourceLink sources={sources} className="mt-1" />
    </div>
  );
}

/** The energy balance of the country the economy is, where the site holds one. */
function energyOf(economy: Economy) {
  const code = CODE_OF_ECONOMY[economy.id];
  const id = code ? COUNTRY_OF[code] : undefined;
  return id ? COUNTRY_ENERGY[id] : undefined;
}

/** Whether there is anything to say of the economy under this heading: for the window to know its Resources tab has something in it. */
export function hasEconomyHasNeeds(economy: Economy): boolean {
  return Boolean(TOP_COMPANIES[economy.name]?.length || energyOf(economy) || economy.topExports?.length || economy.topImports?.length);
}

/** The largest companies based there, what it sells and buys, and the energy it makes and uses. */
export function EconomyHasNeeds({ economy }: { economy: Economy }) {
  const [all, setAll] = useState(false);
  const companies = TOP_COMPANIES[economy.name] ?? [];
  const shown = all ? companies : companies.slice(0, 10);
  const lists = [...new Set(companies.map((c) => c.list))].map((i) => TOP_COMPANY_LISTS[i]);
  const energy = energyOf(economy);
  const isPlace = economy.entityType === "Country" || economy.entityType === "Territory";
  const trade: [string, string, string[]][] = [
    ["What it has to sell", "Its main exports", economy.topExports ?? []],
    ["What it needs to buy", "Its main imports", economy.topImports ?? []],
    ["Whom it trades with", "Its main trading partners", economy.tradingPartners ?? []],
  ];

  return (
    <div className="space-y-4">
      {isPlace && (
        <div>
          <Heading aside={companies.length > 0 ? <span className="text-[10px] font-mono text-muted-foreground">{companies.length} named</span> : undefined}>Largest companies based here</Heading>
          {companies.length > 0 ? (
            <>
              <div className="modal-tile rounded-xl px-4 py-1">
                {shown.map((c) => {
                  const unit = c.unit ? (/^Revenue\s*\((.*)\)$/.exec(c.unit)?.[1] ?? c.unit) : "";
                  return (
                    <div key={c.name} className="flex items-baseline justify-between gap-3 py-2 border-b border-border/40 last:border-b-0">
                      <span className="min-w-0">
                        {c.article ? (
                          <a href={wiki(c.article)} target="_blank" rel="noopener noreferrer" className="text-[12px] font-sans font-semibold text-foreground hover:underline">
                            {c.name}
                          </a>
                        ) : (
                          <span className="text-[12px] font-sans font-semibold text-foreground">{c.name}</span>
                        )}
                        <span className="block text-[10px] font-sans text-muted-foreground">
                          {[c.industry, c.rank ? `${ordinal(c.rank)} in ${TOP_COMPANY_LISTS[c.list].title.replace(/^List of /, "the list of ")}` : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {c.revenue && (
                        <span className="text-right shrink-0">
                          <span className="block text-[12px] font-mono font-bold text-foreground">{c.revenue}</span>
                          <span className="block text-[9px] font-mono text-muted-foreground">revenue · {unit}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {companies.length > 10 && (
                <button type="button" onClick={() => setAll((v) => !v)} className="text-[10px] font-sans text-secondary mt-1.5 cursor-pointer hover:underline">
                  {all ? "Show the first ten" : `Show all ${companies.length}`}
                </button>
              )}
              <p className="text-[10px] font-sans leading-snug text-muted-foreground mt-2">
                The companies based in {economy.name} that Wikipedia's lists of the world's and its region's largest companies name, in the order and with the revenue each list
                gives. They are those large enough for such a ranking - not a ranking made for {economy.name}, and not every large company it has.
              </p>
              <SourceLink sources={lists.map((l) => ({ label: `Wikipedia — ${l.title} (revision ${l.revision})`, url: l.url }))} className="mt-1" />
            </>
          ) : (
            <p className="modal-tile rounded-xl px-4 py-3 text-[11px] font-sans leading-snug text-muted-foreground">
              None is named. No company based in {economy.name} is in the lists of the world's and its region's largest companies that the site reads ({TOP_COMPANY_LISTS.length} of
              Wikipedia's lists), and no other open source ranks its companies - so none is put here.
            </p>
          )}
        </div>
      )}

      {trade.some(([, , items]) => items.length > 0) && (
        <div>
          <Heading>What it has and what it needs · trade</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {trade
              .filter(([, , items]) => items.length > 0)
              .map(([title, sub, items]) => (
                <div key={title} className="modal-tile rounded-xl p-3 min-w-0">
                  <p className="text-[11px] font-sans font-bold text-foreground">{title}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{sub}</p>
                  <ul className="flex flex-col gap-1">
                    {items.map((x) => (
                      <li key={x} className="text-[11px] font-sans text-foreground/90 leading-snug">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
          <p className="text-[10px] font-sans leading-snug text-muted-foreground mt-2">As the economy's own record on this page lists them; they are names, in the record's order, with no amounts.</p>
        </div>
      )}

      {energy && (
        <div>
          <Heading>What it has and what it needs · energy</Heading>
          <div className="grid grid-cols-2 gap-2">
            <div className="modal-tile rounded-xl p-3">
              <p className="text-[10px] font-sans text-muted-foreground">Energy it produces</p>
              <p className="text-base font-bold font-mono text-foreground">{twh(energy.totalProductionTWh)}</p>
              <p className="text-[10px] font-mono text-muted-foreground">primary energy · {energy.y}</p>
            </div>
            <div className="modal-tile rounded-xl p-3">
              <p className="text-[10px] font-sans text-muted-foreground">Energy it uses</p>
              <p className="text-base font-bold font-mono text-foreground">{twh(energy.totalUseTWh)}</p>
              <p className="text-[10px] font-mono text-muted-foreground">primary energy · {energy.y}</p>
            </div>
          </div>
          {energy.totalUseTWh > 0 && energy.totalProductionTWh > 0 && (
            <p className="text-[11px] font-sans leading-snug text-foreground/90 mt-2">
              It produces {pct((100 * energy.totalProductionTWh) / energy.totalUseTWh, 0)} of the energy it uses:{" "}
              {energy.totalProductionTWh >= energy.totalUseTWh ? "more than it needs, by this measure." : "less than it needs, by this measure."}
            </p>
          )}
          {energy.mix.length > 0 && (
            <div className="mt-3">
              <ChartTitle>What it produces its energy from · % of production · {energy.y}</ChartTitle>
              <PartsDonut label={`What ${economy.name} produces its energy from, ${energy.y}`} parts={energy.mix.map((m) => ({ label: m.source, value: m.pct, text: `${m.pct}%` }))} />
            </div>
          )}
          <SourceLink sources={[{ label: ENERGY_SOURCE.label, url: ENERGY_SOURCE.url }]} className="mt-2" />
        </div>
      )}
    </div>
  );
}
