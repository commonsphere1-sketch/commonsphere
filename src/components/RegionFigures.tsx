/**
 * A World Bank region in figures, for the explorer's Economies tab: the
 * Bank's own aggregate for the region beside the world's, for each figure
 * the site holds by region (regionSeries.ts, built by
 * build-region-series.cjs).
 *
 * A row is two published figures for one year - the region's latest, and the
 * world's for that same year - with the region's reading ten years before
 * where the series has one. Nothing is worked out. A figure the Bank
 * publishes no aggregate for in a region is left out of that region.
 *
 * The explorer loads this when a region's detail is first shown, so a page
 * does not carry the series before then.
 */
import { REGION_SERIES } from "../data/regionSeries";
import { WORLD, type WorldIndicator, type WorldPoint } from "../data/worldview";
import { Label, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

/** The figures by subject, in the order the pane gives them. */
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "People", ids: ["lifeExpectancy", "childMortality", "fertility", "urban", "aged65", "extremePoverty"] },
  { title: "Economy and work", ids: ["gdpPerCapitaPpp", "unemployment", "vulnerableWork", "trade", "manufacturingVA", "servicesVA", "resourceRents", "highTechExports", "taxRevenue"] },
  { title: "Technology and research", ids: ["internet", "broadband", "mobile", "research", "sciArticles", "patents"] },
  { title: "Energy and environment", ids: ["electricity", "renewables", "co2", "co2PerPerson", "forest"] },
  { title: "Government and security", ids: ["womenParliament", "militaryGdp", "homicide"] },
];

/** A unit that names the world, as a region's row should have it. */
const UNIT: Record<string, string> = { trade: "% of GDP", research: "% of GDP", militaryGdp: "% of GDP" };

const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e12 ? `${(v / 1e12).toFixed(a >= 1e13 ? 1 : 2)}T` : a >= 1e9 ? `${(v / 1e9).toFixed(a >= 1e10 ? 1 : 2)}bn` : a >= 1e6 ? `${(v / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M` : a >= 1e4 ? `${Math.round(v / 1e3)}k` : Math.round(v).toLocaleString("en-US");
};
/** A value as its figure's format prints it. */
function print(ind: Pick<WorldIndicator, "format" | "dp">, v: number): string {
  if (ind.format === "pct") return `${v.toFixed(ind.dp)}%`;
  // A sum per person is printed whole; only totals are shortened.
  if (ind.format === "usd") return Math.abs(v) < 1e6 ? `$${Math.round(v).toLocaleString("en-US")}` : `$${compact(v)}`;
  if (ind.format === "count") return compact(v);
  return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(ind.dp);
}

/** The reading about ten years before the latest, where the series has one. */
function decadeBefore(s: WorldPoint[]): WorldPoint | null {
  const [ly] = s[s.length - 1];
  const earlier = s.filter(([y]) => y <= ly - 10);
  const p = earlier[earlier.length - 1];
  return p && ly - 10 - p[0] <= 2 ? p : null;
}

type FigureRow = { id: string; label: string; unit: string; year: number; region: string; world: string | null; before: { year: number; text: string } | null; /** The Bank's page for the series. */ url: string };

function rowsOf(code: string, ids: string[]): FigureRow[] {
  return ids.flatMap((id) => {
    const ind = WORLD[id];
    const series = REGION_SERIES[id]?.regions.find((r) => r.code === code)?.series;
    if (!ind || !series?.length) return [];
    const [year, value] = series[series.length - 1];
    const world = ind.series.find(([y]) => y === year);
    const before = decadeBefore(series);
    return [
      {
        id,
        label: ind.label,
        unit: UNIT[id] ?? ind.unit,
        year,
        region: print(ind, value),
        world: world ? print(ind, world[1]) : null,
        before: before ? { year: before[0], text: print(ind, before[1]) } : null,
        url: REGION_SERIES[id].source.url,
      },
    ];
  });
}

export default function RegionFigures({ t, code, name }: { t: Tokens; code: string; name: string }) {
  const groups = GROUPS.map((g) => ({ title: g.title, rows: rowsOf(code, g.ids) })).filter((g) => g.rows.length > 0);
  if (!groups.length) return null;
  // Every series is the Bank's, each from its own page: a row's name opens that page, and the one link below is to the Bank's data.
  const sources = [...new Set(groups.flatMap((g) => g.rows.map((r) => REGION_SERIES[r.id].source.label)))].map((label) => ({ label, url: "https://data.worldbank.org/" }));
  return (
    <section className="flex flex-col gap-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
      <div>
        <Label t={t}>The region in figures</Label>
        <p className="text-[10px] font-sans leading-snug mt-1" style={{ color: t.mutedText }}>
          The World Bank's own figure for {name}, each for its latest published year, with the world's for the same year and the region's about ten years
          before.
        </p>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div className="flex items-baseline gap-2 pb-1" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
            <span className="flex-1 text-[10px] font-sans font-bold" style={{ color: t.headText }}>
              {g.title}
            </span>
            <span className="w-16 text-right text-[9px] font-mono" style={{ color: t.mutedText }}>
              Region
            </span>
            <span className="w-14 text-right text-[9px] font-mono" style={{ color: t.mutedText }}>
              World
            </span>
            <span className="w-16 text-right text-[9px] font-mono" style={{ color: t.mutedText }}>
              Before
            </span>
          </div>
          {g.rows.map((r) => (
            <div key={r.id} className="flex items-baseline gap-2 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
              <span className="flex-1 min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open the World Bank's series: ${r.label}`}
                  className="block text-[11px] font-sans font-semibold leading-snug hover:underline decoration-dotted underline-offset-2"
                  style={{ color: t.headText }}
                >
                  {r.label}
                </a>
                <span className="block text-[9px] font-mono leading-snug" style={{ color: t.mutedText }}>
                  {r.unit} · {r.year}
                </span>
              </span>
              <span className="w-16 text-right text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                {r.region}
              </span>
              <span className="w-14 text-right text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                {r.world ?? "—"}
              </span>
              <span className="w-16 text-right text-[10px] font-mono shrink-0" style={{ color: t.mutedText }} title={r.before ? `${r.before.text} in ${r.before.year}` : "No reading about ten years before"}>
                {r.before ? (
                  <>
                    {r.before.text}
                    <span className="block text-[9px]">{r.before.year}</span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          ))}
        </div>
      ))}
      <SourceLink sources={sources} />
    </section>
  );
}
