/**
 * Builds src/data/rights.ts - how far each kind of right is respected in each
 * country, from the V-Dem Institute's indices.
 *
 *   Source   V-Dem (Varieties of Democracy) Country-Year dataset, as Our World
 *            in Data republishes each index (V-Dem: CC BY-SA 4.0, commercial
 *            use included; Our World in Data: CC BY 4.0).
 *
 * Each index runs from 0 to 1, higher meaning the right more fully respected,
 * and is V-Dem's best estimate from its country experts' answers. The latest
 * year each country has is kept, to three places. Countries are matched to the
 * site's by their ISO 3166 alpha-3 code, through the World Bank's list.
 *
 *   node build-rights.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/rights.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-rights");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const get = (url, name) => {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "-A", UA, "-o", at, url], { stdio: "ignore" });
  return fs.readFileSync(at, "utf8");
};

/** The indices kept: Our World in Data's chart, V-Dem's name, and what it is made of in V-Dem's own terms. */
const INDICES = {
  civil: { slug: "human-rights-index-vdem", name: "Civil liberties", of: "how far people are free from government violence, and free in their private and political lives - V-Dem's civil liberties index" },
  political: { slug: "political-civil-liberties-index", name: "Political liberties", of: "freedom of expression and of association, including of political parties and civil society" },
  private: { slug: "private-civil-liberties-index", name: "Private liberties", of: "property rights, freedom from forced labour, freedom of movement and freedom of religion" },
  expression: { slug: "freedom-of-expression-index", name: "Freedom of expression", of: "freedom of the press and of discussion, and the alternative sources of information people have" },
  association: { slug: "freedom-of-association-index", name: "Freedom of association", of: "whether parties, including the opposition, and civil society organisations can form and act freely" },
  academic: { slug: "academic-freedom-index", name: "Academic freedom", of: "freedom of research and teaching, of academic exchange, and the autonomy of universities" },
  rule: { slug: "rule-of-law-index", name: "Rule of law", of: "whether laws are transparent, independently and impartially enforced, and whether officials comply with them" },
  women: { slug: "women-political-empowerment-index", name: "Women's political empowerment", of: "women's civil liberties, their participation in civil society, and their share of political power" },
};

(async () => {
  const wb = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
  const two = new Map(wb.filter((c) => c.region?.value !== "Aggregates").map((c) => [c.id, c.iso2Code]));
  two.set("XKX", "XK");
  two.set("OWID_KOS", "XK");
  two.set("TWN", "TW");
  two.set("PSE", "PS");
  const out = {};
  const years = new Set();
  for (const [key, ix] of Object.entries(INDICES)) {
    const csv = get(`https://ourworldindata.org/grapher/${ix.slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `${ix.slug}.csv`);
    const lines = csv.trim().split("\n");
    const head = lines[0].split(",");
    const vi = head.findIndex((h) => /__estimate_best$/.test(h));
    if (vi < 0) throw new Error(`${ix.slug}: no estimate column in ${head.join(",")}`);
    for (const line of lines.slice(1)) {
      // Names with commas are quoted; the code, year and value never are.
      const m = line.match(/^(?:"[^"]*"|[^,]*),([A-Z_]*),(\d{4}),(.*)$/);
      if (!m) continue;
      const cols = m[3].split(",");
      const v = Number(cols[vi - 3]);
      const cc = two.get(m[1]);
      if (!cc || !/^[A-Z]{2}$/.test(cc) || !Number.isFinite(v)) continue;
      // Only a figure of the last ten years: a state that has ceased has none since.
      if (Number(m[2]) < new Date().getFullYear() - 10) continue;
      const y = Number(m[2]);
      const e = (out[cc] ||= {});
      if (!e[key] || y > e[key][0]) e[key] = [y, Math.round(v * 1000) / 1000];
    }
  }
  for (const e of Object.values(out)) for (const [y] of Object.values(e)) years.add(y);
  // Checks against what is known: Norway's civil liberties near the top of the scale, North Korea's near the bottom.
  if (!(out.NO?.civil?.[1] > 0.9) || !(out.KP?.civil?.[1] < 0.2)) throw new Error(`civil liberties check failed: NO ${out.NO?.civil}, KP ${out.KP?.civil}`);
  const today = new Date().toISOString().slice(0, 10);
  const lines = Object.keys(out)
    .sort()
    .map((cc) => `  ${cc}: ${JSON.stringify(out[cc]).replace(/"(\w+)":/g, "$1:")},`);
  fs.writeFileSync(
    OUT,
    `/**
 * How far each kind of right is respected in each country: the V-Dem
 * Institute's indices, 0 to 1, higher meaning more fully respected.
 *
 * GENERATED by build-rights.cjs on ${today} - do not edit by hand; change the
 * script and re-run it.
 *
 * Each is V-Dem's best estimate for the latest year a country has (${[...years].sort().join(", ")}),
 * to three places. ${Object.keys(out).length} countries.
 */
export const RIGHTS_SOURCE = {
  label: "V-Dem Institute — Varieties of Democracy dataset, via Our World in Data (V-Dem: CC BY-SA 4.0; Our World in Data: CC BY 4.0)",
  url: "https://ourworldindata.org/grapher/human-rights-index-vdem",
  retrieved: "${today}",
};

export type RightsIndex = ${Object.keys(INDICES).map((k) => `"${k}"`).join(" | ")};
/** Each index: its name, and what it is made of in V-Dem's terms. */
export const RIGHTS_INDICES: Record<RightsIndex, { name: string; of: string }> = ${JSON.stringify(Object.fromEntries(Object.entries(INDICES).map(([k, v]) => [k, { name: v.name, of: v.of }])), null, 2)};

/** By ISO code: each index's [year, value]. */
export const RIGHTS: Record<string, Partial<Record<RightsIndex, [year: number, v: number]>>> = {
${lines.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} countries; years ${[...years].sort().join(", ")}`);
  console.log("US", JSON.stringify(out.US));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
