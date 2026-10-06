/**
 * Builds src/data/modernSlavery.ts — the published estimates of modern
 * slavery behind the Crime page's section on it.
 *
 * What this replaces. The Crime page had a modern-slavery section typed by
 * hand: regional figures, "government response" scores and a split of forced
 * labour's profits that were not the Global Slavery Index's. It was removed.
 * This puts the published estimates back, and nothing else:
 *
 *   ILO, Walk Free and IOM,    the world on any given day in 2021: people in
 *     Global Estimates of      modern slavery, in forced labour and in forced
 *     Modern Slavery (2022)    marriage, the children among them, the share
 *                              who are women and girls, the rise since 2016
 *   Walk Free, Global          the five regions (people, and prevalence per
 *     Slavery Index 2023       thousand in all, in forced labour and in forced
 *                              marriage), the ten countries with the largest
 *                              estimated numbers, and the ten with the highest
 *                              and the ten with the lowest prevalence, by name
 *   ILO, figures on forced     the forms forced labour takes - in the private
 *     labour                   economy, forced commercial sexual exploitation,
 *                              imposed by the state - the women and girls and
 *                              the children in it, and the profits made from
 *                              it each year (Profits and Poverty, 2024)
 *
 * Every figure is read by this script out of the sentence that states it on
 * Walk Free's own findings pages or the ILO's page of its main figures; if a
 * sentence is no longer there, the build stops rather than keep an old
 * figure. Nothing is typed in.
 *
 * What is not here: a figure for every country. Walk Free gives its
 * country-level dataset on request through a form, which this does not fill
 * in or go round. The pages name the ten highest-prevalence countries but
 * print their rates only in a chart, so those are given by name, in order.
 *
 *   node build-modern-slavery.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/modernSlavery.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-modern-slavery");
fs.mkdirSync(CACHE, { recursive: true });

const BASE = "https://www.walkfree.org/global-slavery-index/findings/";
/** The ILO's page of its main figures on forced labour. The ILO's material is free to reuse with the ILO cited (its Open Access policy, CC BY 4.0). */
const ILO = "https://www.ilo.org/topics-and-sectors/forced-labour-modern-slavery-and-trafficking-persons/data-and-research-forced-labour";
const GLOBAL = `${BASE}global-findings/`;
const REGIONS = [
  { name: "Asia and the Pacific", slug: "asia-and-the-pacific" },
  { name: "Africa", slug: "africa" },
  { name: "Europe and Central Asia", slug: "europe-and-central-asia" },
  { name: "Americas", slug: "americas" },
  { name: "Arab States", slug: "arab-states" },
];

function page(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "90", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${url}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}
const entities = (s) => s.replace(/&nbsp;/g, " ").replace(/&#0?39;/g, "'").replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, "-").replace(/&#8212;|&mdash;/g, "—").replace(/&amp;/g, "&");
const text = (html) => entities(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
/** The first capture of a pattern in a page's text, as a number; the build stops if the sentence is gone. */
const read = (where, s, re, what) => {
  const m = s.match(re);
  if (!m) throw new Error(`${where}: the sentence giving ${what} is no longer on the page`);
  return m.slice(1).map(Number);
};

// ── The world, and the countries named ──
const globalHtml = page(GLOBAL, "global.html");
const g = text(globalHtml);
const [people, year] = read("global findings", g, /An estimated ([\d.]+) million people were living in situations of modern slavery on any given day in (\d{4})/, "the world's total");
const [forcedLabour, forcedMarriage] = read("global findings", g, /approximately ([\d.]+) million were in forced labour and ([\d.]+) million were in forced marriages/, "forced labour and forced marriage");
const [children] = read("global findings", g, /More than ([\d.]+) million of all people in modern slavery are children/, "the children");
const [womenAndGirlsPct] = read("global findings", g, /women and girls account for over half of them \((\d+) per cent\)/, "the share who are women and girls");
const [risen] = read("global findings", g, /has risen by ([\d.]+) million/, "the rise since 2016");

const largestText = g.match(/these countries — (.*?) — account for/);
if (!largestText) throw new Error("global findings: the list of the largest estimated numbers is no longer on the page");
const largest = [...largestText[1].matchAll(/(?:and the |and )?([A-Z][A-Za-zü' ]+?) \(([\d.]+) million\)/g)].map((m) => ({ country: m[1].trim(), millions: +m[2] }));
if (largest.length !== 10) throw new Error(`global findings: read ${largest.length} of the ten largest`);

// The ten highest: a list in the page, after the sentence that introduces it.
const at = globalHtml.indexOf("highest prevalence of modern slavery are");
const list = at < 0 ? null : globalHtml.slice(at, at + 4000).match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/);
const highest = list ? [...list[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => entities(m[1].replace(/<[^>]+>/g, "")).trim()) : [];
if (highest.length !== 10) throw new Error(`global findings: read ${highest.length} of the ten highest-prevalence countries`);

const lowestText = g.match(/With the exception of (\w+), the countries with lowest prevalence of modern slavery are from northern or western Europe — (.*?)\. /);
if (!lowestText) throw new Error("global findings: the countries with the lowest prevalence are no longer named on the page");
const lowest = [...lowestText[2].split(/, and |, | and /).map((x) => x.trim()).filter(Boolean), lowestText[1]];
if (lowest.length !== 10) throw new Error(`global findings: read ${lowest.length} of the ten lowest-prevalence countries`);

// ── The forms forced labour takes: the ILO's main figures ──
const ilo = text(page(ILO, "ilo-forced-labour.html"));
const [iloForcedLabour] = read("ILO figures", ilo, /([\d.]+) million people are in forced labour/, "the people in forced labour");
const [privateEconomy, sexualExploitation, stateImposed] = read(
  "ILO figures",
  ilo,
  /Victims of forced labour include ([\d.]+) million exploited in the private sector; ([\d.]+) million in forced commercial sexual exploitation, and ([\d.]+) million in forced labour imposed by State/,
  "the forms of forced labour",
);
const [labourWomenPct, womenInSexual, womenInOther] = read("ILO figures", ilo, /([\d.]+)% of them are women and girls \(([\d.]+) million in forced commercial sexual exploitation, and ([\d.]+) million in other economic sectors\)/, "the women and girls in forced labour");
const [labourChildrenPct, labourChildren] = read("ILO figures", ilo, /([\d.]+)% of them are children \(([\d.]+) million\)/, "the children in forced labour");
const [profitsBn] = read("ILO figures", ilo, /US\$ ?([\d.]+) billion generated in illegal profits every year/, "the profits from forced labour");
const [profitsYear] = read("ILO figures", ilo, /Profits and Poverty: The Economics of Forced Labour \((\d{4})\)/, "the year of the profits report");
// The ILO's figure and Walk Free's are the same estimate, and the three forms are its parts.
if (iloForcedLabour !== forcedLabour) throw new Error(`the ILO gives ${iloForcedLabour} million in forced labour, Walk Free ${forcedLabour}`);
const formsSum = privateEconomy + sexualExploitation + stateImposed;
if (Math.abs(formsSum - forcedLabour) > 0.3) throw new Error(`the forms of forced labour come to ${formsSum.toFixed(1)} million, the total to ${forcedLabour}`);

// ── The five regions: each page words its figures its own way ──
const REGION_PATTERNS = {
  "asia-and-the-pacific": {
    people: /an estimated ([\d.]+) million people were living in modern slavery in Asia and the Pacific/,
    per1000: /with ([\d.]+) per thousand people in the region forced to work or marry/,
    marriage: /prevalence of forced marriage \(([\d.]+) per thousand\)/,
    labour: /prevalence of forced labour \(([\d.]+) per thousand\)/,
  },
  africa: {
    people: /an estimated ([\d.]+) million men, women, and children were living in modern slavery in Africa/,
    per1000: /a prevalence of ([\d.]+) people in modern slavery for every thousand people/,
    labour: /Forced labour was the most common form of modern slavery in the region, at a rate of ([\d.]+) per thousand people/,
    marriage: /while forced marriage was at ([\d.]+) per thousand/,
  },
  "europe-and-central-asia": {
    people: /An estimated ([\d.]+) million people were living in modern slavery in Europe and Central Asia/,
    per1000: /with ([\d.]+) per thousand people living in modern slavery/,
    labour: /prevalence of forced labour at an estimated ([\d.]+) per thousand people/,
    marriage: /prevalence of forced marriage \(([\d.]+) per thousand\)/,
  },
  americas: {
    people: /An estimated ([\d.]+) million men, women, and children were living in modern slavery on any given day/,
    per1000: /with ([\d.]+) in every thousand people living in modern slavery/,
    labour: /prevalence of forced labour \(([\d.]+) per thousand\)/,
    marriage: /prevalence of forced marriage \(([\d.]+) per thousand\)/,
  },
  "arab-states": {
    people: /An estimated ([\d.]+) million men, women, and children were living in modern slavery in the Arab States region/,
    per1000: /An estimated ([\d.]+) people per thousand people were living in modern slavery in the region/,
    labour: /which breaks down to ([\d.]+) in forced labour/,
    marriage: /in forced labour and ([\d.]+) in forced marriage/,
  },
};
const regions = REGIONS.map((r) => {
  const url = `${BASE}regional-findings/${r.slug}/`;
  const s = text(page(url, `${r.slug}.html`));
  const p = REGION_PATTERNS[r.slug];
  const one = (re, what) => read(r.name, s, re, what)[0];
  return { name: r.name, url, millions: one(p.people, "its total"), per1000: one(p.per1000, "its prevalence"), labourPer1000: one(p.labour, "forced labour's prevalence"), marriagePer1000: one(p.marriage, "forced marriage's prevalence") };
});
// The regions' totals are parts of the world's: they must come to about it.
const sum = regions.reduce((a, r) => a + r.millions, 0);
if (Math.abs(sum - people) > 1) throw new Error(`the regions come to ${sum.toFixed(1)} million, the world to ${people}`);
for (const r of regions) if (!(r.per1000 > 0 && r.per1000 < 20 && r.labourPer1000 + r.marriagePer1000 <= r.per1000 + 0.2)) throw new Error(`${r.name}: prevalence ${r.per1000} against ${r.labourPer1000} + ${r.marriagePer1000}`);

const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(v);
fs.writeFileSync(
  OUT,
  `/**
 * The published estimates of modern slavery: the world, its five regions,
 * and the countries the Global Slavery Index names.
 *
 * GENERATED by build-modern-slavery.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every figure was read by the script out of the sentence that states it on
 * Walk Free's findings pages for the Global Slavery Index 2023, which reports
 * the Global Estimates of Modern Slavery that the ILO, Walk Free and the IOM
 * published in 2022. They are estimates for any given day in ${year}, from
 * household surveys and case data, not counts.
 *
 * There is no figure for every country here: Walk Free gives its
 * country-level dataset on request, and the site does not hold it. The ten
 * countries with the highest and the lowest prevalence are given by name, as
 * the page names them; their rates are printed only in a chart.
 */
export const MODERN_SLAVERY_SOURCES = {
  estimates: { label: "ILO, Walk Free and IOM — Global Estimates of Modern Slavery (2022), as reported by Walk Free", url: ${q(GLOBAL)} },
  index: { label: "Walk Free — Global Slavery Index 2023", url: "https://www.walkfree.org/global-slavery-index/" },
  ilo: { label: "ILO — main figures on forced labour (2022 Global Estimates; Profits and Poverty, ${profitsYear})", url: ${q(ILO)} },
  retrieved: "${today}",
};

export const MODERN_SLAVERY = {
  /** The estimates are for any given day in this year. */
  year: ${year},
  /** Millions of people. */
  world: { people: ${people}, forcedLabour: ${forcedLabour}, forcedMarriage: ${forcedMarriage}, /** "More than" this many are children. */ childrenOver: ${children}, womenAndGirlsPct: ${womenAndGirlsPct}, /** The rise since the 2016 estimates. */ risenSince2016: ${risen} },
  /**
   * The forms forced labour takes, millions of people, as the ILO gives them: in the private economy outside the sex
   * trade, in forced commercial sexual exploitation, and imposed by the state. Rounded each on its own, so they come
   * to within a tenth of the total.
   */
  forcedLabourForms: { privateEconomy: ${privateEconomy}, sexualExploitation: ${sexualExploitation}, stateImposed: ${stateImposed} },
  /** Of the people in forced labour: the share who are women and girls, and the millions of them in each kind; the share who are children, and how many. */
  forcedLabourWho: { womenAndGirlsPct: ${labourWomenPct}, womenInSexualExploitation: ${womenInSexual}, womenInOtherSectors: ${womenInOther}, childrenPct: ${labourChildrenPct}, children: ${labourChildren} },
  /** Illegal profits made from forced labour each year, US$ billions, and the year of the ILO report that estimates them. */
  profits: { billions: ${profitsBn}, report: ${profitsYear} },
  /** Each region: millions of people, and people per thousand - in all, in forced labour, in forced marriage. */
  regions: [
${regions.map((r) => `    { name: ${q(r.name)}, millions: ${r.millions}, per1000: ${r.per1000}, labourPer1000: ${r.labourPer1000}, marriagePer1000: ${r.marriagePer1000}, url: ${q(r.url)} },`).join("\n")}
  ],
  /** The ten countries with the largest estimated numbers, millions of people. */
  largest: [
${largest.map((c) => `    { country: ${q(c.country)}, millions: ${c.millions} },`).join("\n")}
  ],
  /** The ten countries with the highest prevalence, highest first, as the page lists them. */
  highestPrevalence: ${q(highest)},
  /** The ten countries with the lowest prevalence, as the page names them. */
  lowestPrevalence: ${q(lowest)},
};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}`);
console.log(`  world, ${year}: ${people}M in modern slavery - ${forcedLabour}M forced labour, ${forcedMarriage}M forced marriage; over ${children}M children; ${womenAndGirlsPct}% women and girls; +${risen}M since 2016`);
console.log(`  forced labour: ${privateEconomy}M private economy, ${sexualExploitation}M commercial sexual exploitation, ${stateImposed}M state-imposed; ${labourWomenPct}% women and girls; ${labourChildrenPct}% children (${labourChildren}M); US$${profitsBn}bn profits a year (${profitsYear})`);
for (const r of regions) console.log(`  ${r.name.padEnd(26)} ${String(r.millions).padStart(5)}M  ${r.per1000}/1000  (labour ${r.labourPer1000}, marriage ${r.marriagePer1000})`);
console.log(`  largest: ${largest.map((c) => `${c.country} ${c.millions}M`).join(", ")}`);
console.log(`  highest prevalence: ${highest.join(", ")}`);
console.log(`  lowest prevalence: ${lowest.join(", ")}`);
