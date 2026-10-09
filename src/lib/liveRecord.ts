/**
 * A second-order division's own record, read live: its population over the
 * years, its area, when it was founded and its website, from Wikidata (CC0).
 *
 * The site holds no record for a district outside the United States, and
 * geoBoundaries' outlines carry a name and nothing more. So a record is
 * looked for when a district's window opens, and taken as the district's
 * only where three things agree:
 *
 *   its name     the English Wikipedia article goes by the district's name -
 *                alone, or with its division's or its country's after it
 *   its place    the point the article gives lies inside the district's outline
 *   its size     the area its Wikidata record gives is within a fifth of the
 *                outline's own
 *
 * The third is what tells a district from the town it is named for: the two
 * share a name and a place, never a size. A record with no area cannot pass.
 * Where none passes, nothing is returned, and the window says so.
 *
 * A population is kept only where its statement is dated and cites a source
 * of its own - not one merely imported from a Wikipedia - as the site's
 * built records require.
 */
import { geoContains } from "d3-geo";
import { outlineKm2, type Outline } from "./outlines";

export type LiveRecord = {
  /** The English Wikipedia article's title. */
  title: string;
  /** Its Wikidata record. */
  qid: string;
  /** Its population by year, the earliest first: one figure a year. */
  pop: [year: number, people: number][];
  areaKm2: number;
  founded?: number;
  site?: string;
};

type Snak = { datavalue?: { value: unknown } };
type Claim = { rank: string; mainsnak: Snak; qualifiers?: Record<string, Snak[]>; references?: { snaks: Record<string, unknown> }[] };
type Entity = { claims?: Record<string, Claim[]> };

const UNIT_KM2: Record<string, number> = { Q712226: 1, Q35852: 0.01, Q25343: 1e-6 };
/** What a reference may hold and still not be a source: "imported from", its URL, the day it was read, and "based on heuristic". */
const NOT_A_SOURCE = new Set(["P143", "P4656", "P813", "P887"]);
const live = (claims?: Claim[]) => (claims ?? []).filter((c) => c.rank !== "deprecated" && c.mainsnak.datavalue);
const first = (claims?: Claim[]) => live(claims).sort((a, b) => Number(b.rank === "preferred") - Number(a.rank === "preferred"))[0];
const yearOf = (v: unknown) => {
  const t = (v as { time?: string; precision?: number } | undefined)?.time;
  const m = t ? /^\+(\d{4})-/.exec(t) : null;
  return m && ((v as { precision?: number }).precision ?? 0) >= 9 ? Number(m[1]) : undefined;
};

function areaOf(e: Entity): number | undefined {
  const v = first(e.claims?.P2046)?.mainsnak.datavalue?.value as { amount?: string; unit?: string } | undefined;
  const per = v?.unit ? UNIT_KM2[v.unit.split("/").pop() ?? ""] : undefined;
  const amount = Number(v?.amount);
  return per && Number.isFinite(amount) && amount > 0 ? amount * per : undefined;
}

function populationOf(e: Entity): [number, number][] {
  const byYear = new Map<number, { people: number; preferred: boolean }>();
  for (const c of live(e.claims?.P1082)) {
    const year = yearOf(c.qualifiers?.P585?.[0]?.datavalue?.value);
    const people = Number((c.mainsnak.datavalue?.value as { amount?: string } | undefined)?.amount);
    const sourced = (c.references ?? []).some((r) => Object.keys(r.snaks).some((p) => !NOT_A_SOURCE.has(p)));
    if (!year || !Number.isFinite(people) || people <= 0 || !sourced) continue;
    const had = byYear.get(year);
    if (!had || (c.rank === "preferred" && !had.preferred)) byYear.set(year, { people, preferred: c.rank === "preferred" });
  }
  return [...byYear].map(([y, v]): [number, number] => [y, v.people]).sort((a, b) => a[0] - b[0]);
}

const api = (host: string, params: Record<string, string>) =>
  fetch(`https://${host}/w/api.php?${new URLSearchParams({ format: "json", origin: "*", ...params })}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

async function find(names: string[], shape: Outline): Promise<LiveRecord | null> {
  type Page = { title: string; coordinates?: { lat: number; lon: number }[]; pageprops?: { wikibase_item?: string; disambiguation?: string } };
  const wiki = (await api("en.wikipedia.org", { action: "query", redirects: "1", prop: "coordinates|pageprops", ppprop: "wikibase_item|disambiguation", titles: names.slice(0, 20).join("|") })) as {
    query?: { pages?: Record<string, Page> };
  };
  // By name and by place: an article of that name whose point lies inside the outline.
  const here = Object.values(wiki.query?.pages ?? {}).filter((p) => {
    const at = p.coordinates?.[0];
    return p.pageprops?.wikibase_item && p.pageprops.disambiguation === undefined && at && geoContains(shape as never, [at.lon, at.lat]);
  });
  if (!here.length) return null;
  const data = (await api("www.wikidata.org", { action: "wbgetentities", props: "claims", ids: here.map((p) => p.pageprops!.wikibase_item!).join("|") })) as { entities?: Record<string, Entity> };
  // And by size: the record whose area is the outline's, to within a fifth - the nearest, where more than one is.
  const own = outlineKm2(shape);
  const fits = here
    .flatMap((p) => {
      const e = data.entities?.[p.pageprops!.wikibase_item!];
      const area = e ? areaOf(e) : undefined;
      return e && area && area / own >= 0.8 && area / own <= 1.25 ? [{ p, e, area, off: Math.abs(Math.log(area / own)) }] : [];
    })
    .sort((a, b) => a.off - b.off)[0];
  if (!fits) return null;
  const site = first(fits.e.claims?.P856)?.mainsnak.datavalue?.value;
  return {
    title: fits.p.title,
    qid: fits.p.pageprops!.wikibase_item!,
    pop: populationOf(fits.e),
    areaKm2: fits.area,
    founded: yearOf(first(fits.e.claims?.P571)?.mainsnak.datavalue?.value),
    site: typeof site === "string" && /^https?:\/\//.test(site) ? site : undefined,
  };
}

const FOUND = new Map<string, Promise<LiveRecord | null>>();
/** The record of the district an outline is of, or null where none passes: asked for once a district, by a key of the caller's. */
export function liveRecord(key: string, names: string[], shape: Outline): Promise<LiveRecord | null> {
  if (!FOUND.has(key)) FOUND.set(key, find(names, shape).catch(() => null));
  return FOUND.get(key)!;
}
