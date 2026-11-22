/**
 * The Dashboard explorer's Industry tab, as asked: for each continent, what its countries dig, pump and grow, what they
 * sell abroad, what their economies are made of, their largest companies, and their stock markets - how large their
 * listed companies are against their economies, and how much their markets swing from year to year.
 *
 * Every figure is a publisher's, read from the site's own files:
 *   output      the producer tables of USGS, the EIA, OPEC and the others each table names (resourceProducers and the rest)
 *   exports     UN Comtrade, each country's largest goods exports by HS chapter, in its latest year reported
 *   sectors     the World Bank's national accounts - the UN's, and Taiwan's DGBAS, where the Bank has none
 *   companies   Wikipedia's tables of the largest companies by revenue (topCompanies.ts), each of its own year
 *   markets     the World Bank: listed companies' value as a share of GDP, and the yearly change of each market's S&P equity index
 * Worked out here, and said so where it is shown: a continent's share of world output, added from its countries' shares;
 * how many of its countries sell most of one kind of goods; a revenue in billions of dollars from a table's millions; and
 * a market's swing - the standard deviation of its last ten yearly changes. Nothing is estimated: a country without a
 * figure is left out of that part, and the part says how many have one. No source that a commercial site may use gives
 * single companies' share prices, so a company's own swing is not shown.
 *
 * The continents are those the site files its countries under, as the Countries tab names them.
 */
import { useMemo, useState, type ReactNode } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useLiveCountries } from "../contexts/LiveDataContext";
import type { Country } from "../data/countriesData";
import { RESOURCE_PRODUCERS } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { OTHER_PRODUCERS } from "../data/otherProducers";
import type { ResourceProducer, ResourceProducers } from "../data/resourceProducerTypes";
import { TOP_EXPORTS, TOP_EXPORTS_SOURCE } from "../data/topExports";
import { ECONOMY_SECTORS, ECONOMY_SECTORS_SOURCE, type EconomySectors } from "../data/economySectors";
import { UN_SECTORS_SOURCE } from "../data/countrySectorsUn";
import { ECONOMY_MARKETS, ECONOMY_MARKETS_SOURCE, type MarketSeries } from "../data/economyMarkets";
import { TOP_COMPANIES, TOP_COMPANY_LISTS, TOP_COMPANIES_RETRIEVED, type TopCompany } from "../data/topCompanies";
import { ECONOMY_OF } from "../data/placeIndex";
import { ECONOMY_ISO3 } from "../data/resourceRents";
import { countryForFeature } from "../data/mapJoin";
import { tableName, usdBillions } from "../lib/companyTables";
import { SLIM_TRACK, slimFill } from "./SlimBars";
import { Block, Empty, Label, Row, useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

/** The tab's colour, as each of the explorer's tabs has its own. */
export const INDUSTRY_ACCENT = "#0ea5e9";
const ACCENT = INDUSTRY_ACCENT;

type Src = { label: string; url: string };
type Producer = ResourceProducer & { productionShare: NonNullable<ResourceProducer["productionShare"]> };

/** Every producer table the site holds - minerals, fuels, uranium and wheat - by the commodity's name. */
const PRODUCED: [string, ResourceProducers][] = Object.entries({ ...RESOURCE_PRODUCERS, ...ENERGY_PRODUCERS, ...OTHER_PRODUCERS });
/** Taiwan's statistics office, where its national accounts are read from. */
const DGBAS: Src = { label: "Taiwan Directorate-General of Budget, Accounting and Statistics — national accounts", url: "https://eng.stat.gov.tw/" };
/** The World Bank's two market series, by what the World Bank calls them. */
const MARKET_SERIES: Src[] = [
  { label: "World Bank — Market capitalization of listed domestic companies (% of GDP), CM.MKT.LCAP.GD.ZS", url: "https://data.worldbank.org/indicator/CM.MKT.LCAP.GD.ZS" },
  { label: "World Bank — S&P Global Equity Indices (annual % change), CM.MKT.INDX.ZG", url: "https://data.worldbank.org/indicator/CM.MKT.INDX.ZG" },
];

const ordinal = (n: number) => {
  const v = n % 100;
  return `${n}${v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
/** A share out of 100: whole numbers from ten up, tenths below. */
const pct = (v: number) => (v >= 10 ? `${Math.round(v)}%` : `${v.toFixed(1)}%`);
/** US dollars, short. */
const usd = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v).toLocaleString("en-US")}`);
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
/** Sources without repeats, in the order given. */
const distinct = (list: Src[]) => [...new Map(list.map((s) => [s.label, s])).values()];
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

/** A country's economy record, by its two-letter code: the key of its sectors, and the three-letter code of its markets. */
const economyIdOf = (code: string) => ECONOMY_OF[code];
const iso3Of = (code: string) => {
  const id = economyIdOf(code);
  return id ? (ECONOMY_ISO3[id] ?? ECONOMY_SECTORS[id]?.code) : undefined;
};
/** A producer table's country, by the site's own join of names. */
const codeOfName = new Map<string, string | null>();
const producerCode = (name: string) => {
  if (!codeOfName.has(name)) codeOfName.set(name, countryForFeature(name)?.code ?? null);
  return codeOfName.get(name)!;
};

/** The newest figure of a series, and its year. */
function lastOf(s: MarketSeries | undefined) {
  if (!s) return null;
  const [from, vals] = s;
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i] !== null) return { y: from + i, v: vals[i]! };
  return null;
}
/** How far a market's yearly changes spread: the standard deviation of its last ten with a figure (five at least), worked out here, with the lowest and the highest of them. */
function swingOf(s: MarketSeries | undefined) {
  if (!s) return null;
  const [from, vals] = s;
  const pts = vals.flatMap((v, i) => (v === null ? [] : [{ y: from + i, v }])).slice(-10);
  if (pts.length < 5) return null;
  const mean = pts.reduce((n, p) => n + p.v, 0) / pts.length;
  const sd = Math.sqrt(pts.reduce((n, p) => n + (p.v - mean) ** 2, 0) / pts.length);
  const low = pts.reduce((a, p) => (p.v < a.v ? p : a));
  const high = pts.reduce((a, p) => (p.v > a.v ? p : a));
  return { sd, from: pts[0].y, to: pts[pts.length - 1].y, n: pts.length, low, high };
}
const sliceOf = (s: EconomySectors, name: string) => s.slices.find((x) => x.name === name)?.pct ?? null;

type Region = { name: string; countries: Country[] };

/** A table's row for the European Union as one (the USDA's wheat): its members are all filed under Europe, and it is counted with Europe. */
const EU_ROW = "European Union";

/** What a continent's countries produce of the world's output, commodity by commodity: their shares added, of the producers each table names. */
function outputOf(r: Region) {
  const codes = new Set(r.countries.map((c) => c.code));
  return PRODUCED.flatMap(([what, table]) => {
    const mine = table.countries.filter(
      (c): c is Producer => !!c.productionShare && c.productionShare.pct > 0 && (codes.has(producerCode(c.name) ?? "") || (r.name === "Europe" && c.name === EU_ROW)),
    );
    // A share given as "under" a figure counts for nothing here, and makes the total a floor.
    const share = mine.reduce((n, c) => n + (c.productionShare.bound === "atMost" ? 0 : c.productionShare.pct), 0);
    if (!mine.length || share <= 0) return [];
    const lead = [...mine].sort((a, b) => b.productionShare.pct - a.productionShare.pct)[0];
    const eu = mine.find((c) => c.name === EU_ROW);
    return [
      {
        what,
        share,
        atLeast: mine.some((c) => c.productionShare.bound !== "exact"),
        year: table.productionYear,
        lead,
        // The producers named: the European Union counts as one row of the table, its members not named apart.
        named: mine.length,
        eu: eu ? eu.productionShare.pct : null,
        sources: table.sources,
      },
    ];
  }).sort((a, b) => b.share - a.share);
}

export function IndustryExplorer({ embedded = false }: { /** Shown inside another explorer's card, under its tab. */ embedded?: boolean } = {}) {
  const t = useTokens();
  const live = useLiveCountries();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  // The continents, the one with the most of the world's output first (by the size of its economies, which the list does not show).
  const regions = useMemo(() => {
    const by = new Map<string, Country[]>();
    for (const c of live) if (c.continent) by.set(c.continent, [...(by.get(c.continent) ?? []), c]);
    const gdp = (cs: Country[]) => cs.reduce((n, c) => n + (Number.isFinite(c.gdp) ? c.gdp : 0), 0);
    return [...by.entries()].map(([name, countries]) => ({ name, countries })).sort((a, b) => gdp(b.countries) - gdp(a.countries));
  }, [live]);
  const outputs = useMemo(() => new Map(regions.map((r) => [r.name, outputOf(r)])), [regions]);
  // A continent none of whose parts holds a figure (Antarctica, whose territories the site files under it) is not listed.
  const holds = (r: Region) =>
    (outputs.get(r.name)?.length ?? 0) > 0 ||
    r.countries.some((c) => {
      const id = economyIdOf(c.code);
      const iso3 = iso3Of(c.code);
      return !!TOP_EXPORTS[c.code] || !!(id && ECONOMY_SECTORS[id]) || !!TOP_COMPANIES[c.name] || !!(iso3 && ECONOMY_MARKETS[iso3]);
    });
  const list = regions.filter(
    (r) =>
      holds(r) &&
      (!q || r.name.toLowerCase().includes(q) || r.countries.some((c) => c.name.toLowerCase().includes(q) || (TOP_COMPANIES[c.name] ?? []).some((x) => x.name.toLowerCase().includes(q)))),
  );
  const shown = (picked ? regions.find((r) => r.name === picked) : null) ?? list[0] ?? null;

  return (
    <div className={embedded ? "flex flex-col w-full" : "explorer flex flex-col rounded-2xl overflow-hidden w-full"} style={embedded ? undefined : { background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="explorer-panes flex flex-col md:flex-row md:h-[560px]">
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[340px] md:max-h-none md:h-full md:w-[38%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {/* The search, at the head of the list it narrows, as asked - it ran across the top of the explorer. */}
          <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0" style={{ borderColor: t.gridLine }}>
            <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search the continents, their countries and companies"
              placeholder="Search a continent, a country or a company…"
              className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
              style={{ color: t.bodyText }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
                <X size={11} weight="bold" />
              </button>
            )}
          </div>
          <div className="px-4 pt-3 pb-1">
            <Label t={t}>The continents · what each makes, sells and owns</Label>
          </div>
          {list.map((r) => {
            const top = outputs.get(r.name)?.[0];
            const named = r.countries.filter((c) => (TOP_COMPANIES[c.name] ?? []).length).length;
            return (
              <Row key={r.name} t={t} selected={shown?.name === r.name} color={ACCENT} onClick={() => setPicked(r.name)}>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                    {r.name}
                  </span>
                  <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                    {r.countries.length} countries · {named} with a company in the tables
                  </span>
                  {top && (
                    <span className="block text-[10px] font-sans truncate" style={{ color: t.bodyText }}>
                      {top.what}: {top.atLeast ? "at least " : ""}
                      {pct(top.share)} of world output, {top.year}
                    </span>
                  )}
                </span>
              </Row>
            );
          })}
          {list.length === 0 && <Empty t={t}>No continent, country or company matches.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-5 md:h-full">
          {shown ? <RegionDetail key={shown.name} t={t} r={shown} output={outputs.get(shown.name) ?? []} /> : <Empty t={t}>Nothing to show.</Empty>}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t flex flex-col gap-1.5" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
          The continents as the site files its countries. Each figure is its publisher's, with its year; what is worked out here - a continent's share added from its countries', a count, a revenue
          turned from millions to billions, a market's swing - says so beside it. Wikipedia's tables of companies read on {TOP_COMPANIES_RETRIEVED}; the markets on {ECONOMY_MARKETS_SOURCE.retrieved}; the exports on{" "}
          {TOP_EXPORTS_SOURCE.retrieved}.
        </span>
      </div>
    </div>
  );
}

/** A figure out of 100 on the slim track, with its words beside it. */
function ShareRow({ t, label, sub, v, text, href }: { t: Tokens; label: ReactNode; sub?: ReactNode; v: number; text: string; href?: string }) {
  return (
    <div className="py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-sans font-semibold min-w-0 truncate" style={{ color: t.headText }}>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {label}
            </a>
          ) : (
            label
          )}
        </span>
        <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
          {text}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: SLIM_TRACK, color: t.headText }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: slimFill(ACCENT) }} />
      </div>
      {sub && (
        <p className="text-[10px] font-sans leading-snug mt-1" style={{ color: t.mutedText }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/** A plain row: a name, its figure, and what it is under it. */
function FigRow({ t, label, sub, fig, figSub, href }: { t: Tokens; label: ReactNode; sub?: ReactNode; fig: ReactNode; figSub?: ReactNode; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <span className="min-w-0">
        <span className="block text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }}>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {label}
            </a>
          ) : (
            label
          )}
        </span>
        {sub && (
          <span className="block text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            {sub}
          </span>
        )}
      </span>
      <span className="text-right shrink-0">
        <span className="block text-[11px] font-mono font-bold" style={{ color: t.headText }}>
          {fig}
        </span>
        {figSub && (
          <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
            {figSub}
          </span>
        )}
      </span>
    </div>
  );
}

/** A part's heading, and how many of the continent's countries it has a figure for. */
function PartHead({ t, title, have, of }: { t: Tokens; title: string; have?: number; of?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label t={t}>{title}</Label>
      {have !== undefined && of !== undefined && (
        <span className="text-[9px] font-mono shrink-0" style={{ color: t.mutedText }}>
          {have} of {of} countries
        </span>
      )}
    </div>
  );
}

const Note = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
    {children}
  </p>
);

/** "Show all", where a part has more than it first shows. */
function More({ open, onToggle, total, first }: { open: boolean; onToggle: () => void; total: number; first: number }) {
  if (total <= first) return null;
  return (
    <button type="button" onClick={onToggle} className="self-start text-[10px] font-mono uppercase tracking-wider px-2.5 h-7 rounded-full border border-border bg-background/70 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
      {open ? "Fewer" : `All ${total}`}
    </button>
  );
}

function RegionDetail({ t, r, output }: { t: Tokens; r: Region; output: ReturnType<typeof outputOf> }) {
  const of = r.countries.length;
  const [openOut, setOpenOut] = useState(false);
  return (
    <>
      <Block>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>
            Industry · {of} countries
          </p>
          <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
            {r.name}
          </p>
        </div>
      </Block>

      {/* What it digs, pumps and grows: its share of the world's output of each, of the producers each table names. */}
      <Block>
        <PartHead t={t} title="What it digs, pumps and grows · share of world output" />
        {output.length ? (
          <>
            <div className="flex flex-col">
              {output.slice(0, openOut ? output.length : 8).map((o) => (
                <ShareRow
                  key={o.what}
                  t={t}
                  label={o.what}
                  v={o.share}
                  text={`${o.atLeast ? "≥ " : ""}${pct(o.share)}`}
                  sub={`${o.year} · ${o.eu !== null ? `the European Union's ${pct(o.eu)}, which the table gives as one, and ${o.named - 1} other producers of it named` : `${o.named} of its countries named`} · the largest, ${o.lead.name}, ${o.lead.productionShare.bound === "atMost" ? "under " : o.lead.productionShare.bound === "atLeast" ? "over " : ""}${pct(o.lead.productionShare.pct)}`}
                />
              ))}
            </div>
            <More open={openOut} onToggle={() => setOpenOut((v) => !v)} total={output.length} first={8} />
            <Note t={t}>
              Each country's share of the world's output as its publisher's table gives it, added here for the continent: only the producers a table names, so a continent's small producers that a table counts
              together as "other countries" are not in it. A share given as under a figure is not counted, and the total is marked ≥.
            </Note>
            <SourceLink sources={distinct(output.flatMap((o) => o.sources))} />
          </>
        ) : (
          <Note t={t}>None of its countries is named in the producer tables the site holds.</Note>
        )}
      </Block>

      <Exports t={t} r={r} />
      <Sectors t={t} r={r} />
      <Companies t={t} r={r} />
      <Markets t={t} r={r} />
    </>
  );
}

/** What it sells abroad: the kind of goods each of its countries sells most of, and its largest sellers. */
function Exports({ t, r }: { t: Tokens; r: Region }) {
  const held = r.countries.flatMap((c) => {
    const e = TOP_EXPORTS[c.code];
    return e?.rows.length ? [{ c, e }] : [];
  });
  const [open, setOpen] = useState(false);
  if (!held.length)
    return (
      <Block>
        <PartHead t={t} title="What it sells abroad" have={0} of={r.countries.length} />
        <Note t={t}>None of its countries' exports is held.</Note>
      </Block>
    );
  // Each country's largest kind of goods, and the countries for each kind: the most countries first.
  const byKind = new Map<string, { c: Country; usd: number; share: number; y: number }[]>();
  for (const { c, e } of held) {
    const [kind, value, share] = e.rows[0];
    byKind.set(kind, [...(byKind.get(kind) ?? []), { c, usd: value, share, y: e.y }]);
  }
  const kinds = [...byKind.entries()].map(([kind, cs]) => ({ kind, cs: cs.sort((a, b) => b.usd - a.usd) })).sort((a, b) => b.cs.length - a.cs.length || b.cs[0].usd - a.cs[0].usd);
  const sellers = [...held].sort((a, b) => b.e.total - a.e.total);
  return (
    <Block>
      <PartHead t={t} title="What it sells abroad · the goods each country sells most of" have={held.length} of={r.countries.length} />
      <div className="flex flex-col">
        {kinds.slice(0, open ? kinds.length : 6).map(({ kind, cs }) => (
          <FigRow
            key={kind}
            t={t}
            label={kind}
            sub={cs
              .slice(0, 3)
              .map((x) => `${x.c.name} ${usd(x.usd)} (${pct(x.share)} of its goods exports, ${x.y})`)
              .join(" · ")
              .concat(cs.length > 3 ? ` · and ${cs.length - 3} more` : "")}
            fig={`${cs.length}`}
            figSub={cs.length === 1 ? "country" : "countries"}
          />
        ))}
      </div>
      <More open={open} onToggle={() => setOpen((v) => !v)} total={kinds.length} first={6} />
      <Label t={t}>Its largest sellers of goods abroad</Label>
      <div className="flex flex-col">
        {sellers.slice(0, 5).map(({ c, e }) => (
          <FigRow key={c.code} t={t} label={c.name} sub={`Most of all: ${e.rows[0][0]}, ${pct(e.rows[0][2])}`} fig={usd(e.total)} figSub={`${e.y}`} />
        ))}
      </div>
      <Note t={t}>
        Each country's goods exports to the world, by HS chapter, in the latest year it has reported to UN Comtrade - so the years differ, and they are not added together. How many countries sell most
        of each kind of goods is counted here.
      </Note>
      <SourceLink sources={[TOP_EXPORTS_SOURCE]} />
    </Block>
  );
}

/** What its economies are made of: industry's share of each, and of it manufacturing's. */
function Sectors({ t, r }: { t: Tokens; r: Region }) {
  const held = r.countries.flatMap((c) => {
    const id = economyIdOf(c.code);
    const s = id ? ECONOMY_SECTORS[id] : undefined;
    const industry = s ? sliceOf(s, "Industry") : null;
    return s && industry !== null ? [{ c, s, industry }] : [];
  });
  const [open, setOpen] = useState(false);
  if (!held.length)
    return (
      <Block>
        <PartHead t={t} title="What its economies are made of" have={0} of={r.countries.length} />
        <Note t={t}>No country of it has its output by sector held.</Note>
      </Block>
    );
  // Which of the three is the largest part of each economy, counted here.
  const largest = { Agriculture: 0, Industry: 0, Services: 0 } as Record<string, number>;
  for (const { s } of held) {
    const top = s.slices.filter((x) => x.name in largest).sort((a, b) => b.pct - a.pct)[0];
    if (top) largest[top.name]++;
  }
  const rows = [...held].sort((a, b) => b.industry - a.industry);
  const sources = distinct(held.map(({ s }) => (s.source === "un" ? UN_SECTORS_SOURCE : s.source === "dgbas" ? DGBAS : ECONOMY_SECTORS_SOURCE)));
  return (
    <Block>
      <PartHead t={t} title="What its economies are made of · industry's share" have={held.length} of={r.countries.length} />
      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
        Services are the largest part of {largest.Services} of these {held.length} economies, industry of {largest.Industry} and farming of {largest.Agriculture}.
      </p>
      <div className="flex flex-col">
        {rows.slice(0, open ? rows.length : 8).map(({ c, s, industry }) => {
          const services = sliceOf(s, "Services");
          const farming = sliceOf(s, "Agriculture");
          return (
            <ShareRow
              key={c.code}
              t={t}
              label={c.name}
              v={industry}
              text={pct(industry)}
              sub={[
                s.manufacturing !== null ? `manufacturing ${pct(s.manufacturing)}` : null,
                services !== null ? `services ${pct(services)}` : null,
                farming !== null ? `farming ${pct(farming)}` : null,
                `${s.basis === "gdp" ? "of GDP" : "of value added"}, ${s.year}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          );
        })}
      </div>
      <More open={open} onToggle={() => setOpen((v) => !v)} total={rows.length} first={8} />
      <Note t={t}>
        Value added by sector: industry is mining, manufacturing, building, electricity, gas and water, and manufacturing is part of it, not apart from it. Most are shares of GDP; where the UN
        publishes them, or subsidies outweigh taxes, of value added, as each row says. The largest part of each economy is counted here.
      </Note>
      <SourceLink sources={sources} />
    </Block>
  );
}

type Co = TopCompany & { country: Country };

/** Its largest companies: the region's companies in each of Wikipedia's tables, the same edition of the Fortune Global 500 set side by side. */
function Companies({ t, r }: { t: Tokens; r: Region }) {
  const cos: Co[] = r.countries.flatMap((c) => (TOP_COMPANIES[c.name] ?? []).map((x) => ({ ...x, country: c })));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const withSome = new Set(cos.map((x) => x.country.code)).size;
  if (!cos.length)
    return (
      <Block>
        <PartHead t={t} title="Its largest companies · by revenue" have={0} of={r.countries.length} />
        <Note t={t}>No company based in it is in the tables of the largest companies the site reads.</Note>
      </Block>
    );
  // One group a table; one country's companies in the Global 500 with the others' of the same edition, in the Global 500's order.
  const groups = new Map<string, { key: string; lists: number[]; rows: Co[] }>();
  for (const x of cos) {
    const l = TOP_COMPANY_LISTS[x.list];
    const key = l.global500 && l.edition ? `g500-${l.edition}` : `list-${x.list}`;
    const g = groups.get(key) ?? { key, lists: [], rows: [] };
    if (!g.lists.includes(x.list)) g.lists.push(x.list);
    g.rows.push(x);
    groups.set(key, g);
  }
  const ordered = [...groups.values()]
    .map((g) => ({
      ...g,
      rows: g.key.startsWith("g500")
        ? g.rows.sort((a, b) => (a.g500 ?? 1e9) - (b.g500 ?? 1e9))
        : g.rows.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || (usdBillions(b) ?? 0) - (usdBillions(a) ?? 0)),
    }))
    .sort((a, b) => Math.min(...a.lists) - Math.min(...b.lists));
  const revenue = (x: Co) => {
    const b = usdBillions(x);
    return b !== null ? `$${b >= 100 ? Math.round(b) : b.toFixed(1)}B` : (x.revenue ?? "—");
  };
  return (
    <Block>
      <PartHead t={t} title="Its largest companies · by revenue" have={withSome} of={r.countries.length} />
      {ordered.map((g) => {
        const first = TOP_COMPANY_LISTS[g.lists[0]];
        const isG = g.key.startsWith("g500");
        const shown = open[g.key] ? g.rows : g.rows.slice(0, 6);
        return (
          <div key={g.key} className="flex flex-col">
            <p className="text-[10px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
              {isG ? `In the Fortune Global 500, ${first.edition} edition` : tableName(first).replace(/^the list of /, "The ")}
            </p>
            <p className="text-[10px] font-sans leading-snug mb-1" style={{ color: t.mutedText }}>
              {isG
                ? `As Wikipedia's tables of ${g.lists.length === 1 ? "a country's" : `${g.lists.length} countries'`} companies in it give them, in the Global 500's order`
                : first.about.split(/(?<=\.)\s/)[0]}
            </p>
            {shown.map((x) => {
              const l = TOP_COMPANY_LISTS[x.list];
              return (
                <FigRow
                  key={`${x.list}-${x.name}`}
                  t={t}
                  label={x.name}
                  href={x.article ? wiki(x.article) : undefined}
                  sub={[x.country.name, x.industry, isG ? (x.g500 ? `${ordinal(x.g500)} in the Global 500` : null) : x.rank ? `${ordinal(x.rank)} in ${tableName(l)}` : null].filter(Boolean).join(" · ")}
                  fig={revenue(x)}
                  figSub={usdBillions(x) !== null ? "revenue" : (x.unit ?? "")}
                />
              );
            })}
            <div className="mt-1.5">
              <More open={!!open[g.key]} onToggle={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} total={g.rows.length} first={6} />
            </div>
          </div>
        );
      })}
      <Note t={t}>
        The companies based in its countries that Wikipedia's tables of the largest companies by revenue name - the world's, the United States', Asia's and Africa's, and each country's in the Fortune
        Global 500 - each table of its own year, as its heading says; a company in more than one is shown from the newest. A revenue in millions of dollars is written here in billions. They are those
        large enough for such a ranking, not every large company the continent has. No source that a commercial site may use gives single companies' share prices, so how much a company's shares
        swing is not shown; how much each country's market swings is, below.
      </Note>
      <SourceLink sources={[...new Set(cos.map((x) => x.list))].sort((a, b) => a - b).map((i) => ({ label: `Wikipedia — ${TOP_COMPANY_LISTS[i].title}, "${TOP_COMPANY_LISTS[i].section}" (revision ${TOP_COMPANY_LISTS[i].revision})`, url: TOP_COMPANY_LISTS[i].url }))} />
    </Block>
  );
}

/** Its stock markets: how large its listed companies are against each economy, and how much each market swings. */
function Markets({ t, r }: { t: Tokens; r: Region }) {
  const held = r.countries.flatMap((c) => {
    const iso3 = iso3Of(c.code);
    const m = iso3 ? ECONOMY_MARKETS[iso3] : undefined;
    if (!m) return [];
    const size = lastOf(m.stockValue);
    const swing = swingOf(m.stockChange);
    const latest = lastOf(m.stockChange);
    return size || swing ? [{ c, size, swing, latest }] : [];
  });
  if (!held.length)
    return (
      <Block>
        <PartHead t={t} title="Its stock markets" have={0} of={r.countries.length} />
        <Note t={t}>The World Bank publishes neither series for any of its countries.</Note>
      </Block>
    );
  const bySize = held.filter((x) => x.size).sort((a, b) => b.size!.v - a.size!.v);
  const bySwing = held.filter((x) => x.swing).sort((a, b) => b.swing!.sd - a.swing!.sd);
  return (
    <Block>
      <PartHead t={t} title="Its stock markets" have={held.length} of={r.countries.length} />
      {bySize.length > 0 && (
        <>
          <Label t={t}>Listed companies' value against the economy</Label>
          <div className="flex flex-col">
            {bySize.slice(0, 6).map(({ c, size }) => (
              <FigRow key={c.code} t={t} label={c.name} fig={`${Math.round(size!.v)}%`} figSub={`of GDP · ${size!.y}`} />
            ))}
          </div>
        </>
      )}
      {bySwing.length > 0 && (
        <>
          <Label t={t}>How much each market swings from year to year</Label>
          <div className="flex flex-col">
            {bySwing.slice(0, 6).map(({ c, swing, latest }) => (
              <FigRow
                key={c.code}
                t={t}
                label={c.name}
                sub={`${swing!.from}–${swing!.to}: lowest ${signed(swing!.low.v)}% (${swing!.low.y}), highest ${signed(swing!.high.v)}% (${swing!.high.y})${latest ? ` · ${latest.y}: ${signed(latest.v)}%` : ""}`}
                fig={`±${swing!.sd.toFixed(1)}`}
                figSub="points a year"
              />
            ))}
          </div>
        </>
      )}
      <Note t={t}>
        The value of the companies listed on each country's exchanges as a share of its GDP, and the yearly change, in US dollars, of its S&P Global equity index - both as the World Bank publishes them.
        A market's swing is worked out here: the standard deviation of its last ten yearly changes the World Bank gives (five at least), in percentage points - the larger it is, the further its
        years have strayed from their average.
      </Note>
      <SourceLink sources={MARKET_SERIES} />
    </Block>
  );
}

export default IndustryExplorer;
