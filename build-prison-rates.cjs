/**
 * Builds src/data/prisonRates.ts — each country's prison population rate from
 * the World Prison Brief, with the date the count is for.
 *
 * What this replaces. socialStatsData.ts gave every country an incarceration
 * rate and a homelessness rate per 100,000, hand-written with no date. The
 * incarceration rates were broadly World Prison Brief numbers of varying age
 * (the United States at 531 against the current 542). The homelessness rates
 * have no source that could support them: there is no international series -
 * countries count homelessness under definitions so different that the OECD,
 * which collects what exists, warns against comparing them - so a country
 * table of them was always going to be invented. They are removed.
 *
 * Source. World Prison Brief (Institute for Crime & Justice Policy Research,
 * Birkbeck), the standard international compilation. The rate is taken from
 * its highest-to-lowest list; the date is taken from each country's own page,
 * because WPB's figures are for different dates in different countries -
 * some this year, some several years ago - and the date is part of the figure.
 *
 * WPB reports some countries only in parts - the United Kingdom as England &
 * Wales, Scotland and Northern Ireland; Bosnia and Herzegovina by entity - and
 * publishes no national rate for them. Neither does this: adding the parts up
 * would be a figure WPB chose not to publish. Where WPB marks a rate "c." it is
 * an approximation and is flagged as one.
 *
 * A count more than ten years old is left out, as with SIPRI's figures in
 * build-military.cjs: WPB still lists Syria's 2004 count as its latest, and
 * beside other countries' 2025 figures it would read as current.
 *
 *   node build-prison-rates.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/prisonRates.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-wpb");
fs.mkdirSync(CACHE, { recursive: true });

const BASE = "https://www.prisonstudies.org";
const LIST = BASE + "/highest-to-lowest/prison_population_rate?field_region_taxonomy_tid=All";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, file) {
  const at = path.join(CACHE, file);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  await sleep(600); // be polite: one page at a time
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const html = await res.text();
  fs.writeFileSync(at, html);
  return html;
}

const text = (h) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const list = await get(LIST, "list.html");
  const blocks = list.split('class="country views-row"').slice(1);
  if (blocks.length < 200) throw new Error(`only ${blocks.length} entries in the WPB list - page layout changed?`);

  const entries = blocks.map((b) => {
    const iso = (b.match(/class="fi fi-([a-z]{2})"/) || [])[1];
    const a = b.match(/<a href="(\/country\/[^"?]+)[^"]*"[^>]*>([^<]+)<\/a>/);
    const r = text(b).match(/Prison population rate \(per 100,000 of national population\) (?:Estimate )?(c\. )?([\d,]+)/);
    return {
      iso: iso && iso.toUpperCase(),
      name: a && a[2].trim(),
      href: a && a[1],
      rate: r ? Number(r[2].replace(/,/g, "")) : null,
      approx: !!(r && r[1]),
    };
  });

  const count = {};
  for (const e of entries) if (e.iso) count[e.iso] = (count[e.iso] || 0) + 1;

  const countries = loadCountries();
  const byCode = new Map(countries.map((c) => [c.code, c]));
  const rows = [];
  const years = {};
  const inParts = new Set();
  const noRate = [];
  const stale = [];
  for (const e of entries) {
    if (!e.iso || !byCode.has(e.iso)) continue;
    if (count[e.iso] > 1) { inParts.add(byCode.get(e.iso).name); continue; }
    if (e.rate === null) { noRate.push(e.name); continue; }
    const page = text(await get(BASE + e.href, e.href.replace(/\W+/g, "_") + ".html"));
    // "Prison population total (including ...) 1,833,700 at 31.12.2023 (source...)",
    // or "... 1,357 average 2023 (...)": the words between the count and the
    // source are the date, however WPB phrases it.
    const m = page.match(/Prison population total \(including[^)]*\) (?:(?:Estimate|Circa) )?(c\. )?[\d,]+ ([^(]{2,60}?)\s*\(/);
    const when = m && m[2].trim().replace(/^at /, "");
    // Usually a four-digit year; occasionally WPB writes "1.6.24".
    const short = when && when.match(/\b\d{1,2}\.\d{1,2}\.(\d{2})$/);
    const year = when && ((when.match(/(19|20)\d{2}/g) || []).pop() || (short && "20" + short[1]));
    if (!year) throw new Error(`${e.name}: no date found on ${e.href}`);
    if (+year < new Date().getFullYear() - 10) { stale.push(`${e.name} (${when})`); continue; }
    years[year] = (years[year] || 0) + 1;
    const c = byCode.get(e.iso);
    rows.push(`  ${JSON.stringify(c.id)}: { v: ${e.rate}, y: "${year}", at: ${JSON.stringify(when)}${e.approx ? ", approx: true" : ""} },`);
  }
  rows.sort();

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Prison population rate per country (prisoners per 100,000 people), with the
 * date the count is for.
 *
 * GENERATED by build-prison-rates.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * World Prison Brief, ICPR, Birkbeck. Counts are for different dates in
 * different countries; \`at\` is WPB's own wording of the date. \`approx\` marks
 * a rate WPB gives as "c.". Countries WPB reports only in parts (${[...inParts].join(", ")})
 * have no entry, because WPB publishes no national rate for them.
 */
export const PRISON_RATES_SOURCE = {
  label: "World Prison Brief (ICPR, Birkbeck)",
  url: "${BASE}/highest-to-lowest/prison_population_rate",
  retrieved: "${today}",
};

export interface PrisonRate {
  v: number;
  y: string;
  at: string;
  approx?: boolean;
}

export const PRISON_RATES: Record<string, PrisonRate> = {
${rows.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} countries`);
  console.log("  years: " + Object.entries(years).sort().map(([y, n]) => `${y}=${n}`).join("  "));
  console.log("  reported only in parts: " + [...inParts].join(", "));
  console.log("  left out, over ten years old: " + stale.join(", "));
  console.log("  listed without a rate: " + noRate.join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
