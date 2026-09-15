/**
 * Builds src/data/economySectors.ts — the GDP composition the Economies page
 * charts, from the World Bank's national accounts.
 *
 * What it replaces was written by hand and did not hold together. Sixty-one of
 * the seventy-seven economies had sector shares that did not sum to 100 - China
 * 127%, Germany 122%, Mexico 120% - and fifteen listed a sector beside one of
 * its own sub-sectors, "Services" next to "Finance" or "Industry" next to
 * "Manufacturing". A pie normalises whatever it is given, so every slice drawn
 * from those numbers was a share of a total no source reports.
 *
 * The three shares here partition value added, by the World Bank's own
 * definitions:
 *
 *   NV.AGR.TOTL.ZS  agriculture, forestry, fishing   ISIC rev.4 01-03
 *   NV.IND.TOTL.ZS  industry including construction  ISIC rev.4 05-43
 *   NV.SRV.TOTL.ZS  services                         ISIC rev.4 45-99
 *
 * Industry "is comprised of mining, manufacturing, construction, electricity,
 * water, and gas", and services "includes ... financial intermediation", both
 * quoted from those definitions. So manufacturing and finance are parts of
 * those sectors, never siblings of them. Manufacturing (NV.IND.MANF.ZS) is
 * carried separately as an "of which" figure and is never given a slice.
 *
 * The three are percentages of GDP, while value added is measured at basic
 * prices and GDP at purchaser prices, so they sum to somewhat less than 100.
 * The remainder is taxes less subsidies on products, plus any statistical
 * discrepancy, and it is written out as its own field rather than quietly
 * scaled away - scaling it away would misstate every other share.
 *
 * All four figures for an economy come from the same year: the most recent year
 * the World Bank reports all three core shares for. Mixing years across slices
 * of one pie would invent a composition that never existed.
 *
 *   node build-economy-sectors.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const http = require("http");
const tls = require("tls");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/economySectors.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-economy-sectors");
fs.mkdirSync(CACHE, { recursive: true });

const INDICATORS = {
  agriculture: "NV.AGR.TOTL.ZS",
  industry: "NV.IND.TOTL.ZS",
  services: "NV.SRV.TOTL.ZS",
  manufacturing: "NV.IND.MANF.ZS",
};

/**
 * Taiwan, which neither of the other two sources covers: it is not a World Bank
 * reporter and, not being a UN member, is absent from the UN's table. Its own
 * statistics office publishes the breakdown, so that is where this reads it.
 *
 * Two things make it awkward, and both are handled rather than worked around.
 *
 * The server sends only its leaf certificate and omits the TWCA intermediate,
 * so the chain cannot be built from Node's bundled roots and an ordinary fetch
 * fails with UNABLE_TO_VERIFY_LEAF_SIGNATURE. The intermediate is fetched from
 * the URL the server's own certificate names in its Authority Information
 * Access extension and supplied to the request. Verification stays on: a
 * substituted intermediate would not chain to a trusted root and would fail
 * exactly as it should. Turning verification off would have been one line and
 * is not worth a national statistic.
 *
 * And its "Addendum" rows already have import duties and VAT distributed into
 * the three sectors, which is how an industry-origin presentation is usually
 * laid out. That is why they sum to GDP less only the statistical discrepancy,
 * not to value added - so what is left over here is the discrepancy, and is
 * labelled as that rather than as taxes.
 */
const DGBAS_TABLE =
  "https://ws.dgbas.gov.tw/001/Upload/464/relfile/10320/2688/" +
  "%E7%94%9F%E7%94%A2%E5%B8%B3_%E5%B9%B4_%E5%B0%8D%E5%A4%96%E7%99%BC%E5%B8%83%E7%89%88(056)_eng.xlsx";
const DGBAS_INTERMEDIATE = "http://sslserver.twca.com.tw/cacert/secure_sha2_2023G3.crt";
/** Current prices; sheet 4 is the chained-dollar version, which cannot give shares. */
const DGBAS_SHEET = "xl/worksheets/sheet3.xml";

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https:") ? https : http;
    mod
      .get(url, opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(httpGet(new URL(res.headers.location, url).toString(), opts));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

const derToPem = (der) =>
  "-----BEGIN CERTIFICATE-----\n" +
  (der.toString("base64").match(/.{1,64}/g) || []).join("\n") +
  "\n-----END CERTIFICATE-----\n";

async function loadTaiwan() {
  const at = path.join(CACHE, "taiwan-gdp-by-activity.xlsx");
  if (!fs.existsSync(at)) {
    const der = await httpGet(DGBAS_INTERMEDIATE);
    const pem = der.subarray(0, 1).toString() === "-" ? der.toString("utf8") : derToPem(der);
    const agent = new https.Agent({
      ca: [...tls.rootCertificates, pem],
      rejectUnauthorized: true,
    });
    const body = await httpGet(DGBAS_TABLE, {
      agent,
      headers: { "User-Agent": UA, Referer: "https://eng.stat.gov.tw/cp.aspx?n=2334" },
    });
    fs.writeFileSync(at, body);
  }

  const { rows } = readXlsx(at, DGBAS_SHEET);
  const header = rows[3] || [];
  const cols = new Map();
  header.forEach((c, i) => {
    const t = String(c || "").trim();
    if (/^(19|20)\d\d$/.test(t)) cols.set(t, i);
  });
  const years = [...cols.keys()].sort();
  if (!years.length) throw new Error("Taiwan: no year columns; the table layout changed");

  /* The three sector names appear twice - once as ISIC letter rows, once in the
     Addendum - so only the Addendum copies are read. */
  const afterAddendum = (label) => {
    let seen = false;
    for (const r of rows) {
      const t = (r[0] || "").trim();
      if (/^Addendum/i.test(t)) { seen = true; continue; }
      if (seen && t === label) return r;
    }
    return null;
  };
  const anyRow = (re) => rows.find((r) => re.test((r[0] || "").trim())) ?? null;
  const num = (r, y) => (r ? Number(String(r[cols.get(y)] ?? "").replace(/,/g, "")) : NaN);

  // Newest year with every figure present.
  for (let i = years.length - 1; i >= 0; i--) {
    const y = years[i];
    const a = num(afterAddendum("Agriculture"), y);
    const ind = num(afterAddendum("Industry"), y);
    const srv = num(afterAddendum("Services"), y);
    const gdp = num(anyRow(/^GDP$/), y);
    const manu = num(anyRow(/^\s*C\. Manufacturing/), y);
    if (![a, ind, srv, gdp].every(Number.isFinite) || gdp <= 0) continue;
    const pct = (v) => (v / gdp) * 100;
    return {
      year: y,
      agriculture: pct(a),
      industry: pct(ind),
      services: pct(srv),
      manufacturing: Number.isFinite(manu) ? +pct(manu).toFixed(1) : null,
    };
  }
  throw new Error("Taiwan: no complete year found");
}

/**
 * The UN Statistics Division's national accounts, used only where the World
 * Bank has nothing. Its "Percentage Distribution (Shares) of GDP" table covers
 * economies the World Bank does not report, Venezuela among them.
 *
 * Its breakdown is by ISIC group rather than the World Bank's three sectors, so
 * the groups are added up to the same three. The mapping follows the World
 * Bank's own definitions: industry is mining, manufacturing, utilities and
 * construction; services is everything from wholesale trade onwards.
 *
 * These shares sum to 100 across value added, not GDP, so anything sourced here
 * is charted on the value-added basis the type already supports.
 */
const UN_SHARES_URL = "https://unstats.un.org/unsd/amaapi/api/file/22";
const UN_AGRICULTURE = ["Agriculture, hunting, forestry, fishing (ISIC A-B)"];
const UN_INDUSTRY = ["Mining, Manufacturing, Utilities (ISIC C-E)", "Construction (ISIC F)"];
const UN_SERVICES = [
  "Wholesale, retail trade, restaurants and hotels (ISIC G-H)",
  "Transport, storage and communication (ISIC I)",
  "Other Activities (ISIC J-P)",
];
const UN_MANUFACTURING = "Manufacturing (ISIC D)";

/** The UN's name for an economy, where it differs from the site's. */
const UN_ALIAS = {
  Venezuela: "Venezuela (Bolivarian Republic of)",
};

/**
 * Reads the UN table once and returns a lookup of economy name to its three
 * sector shares, for the latest year all of them are reported.
 */
async function loadUnShares() {
  const at = path.join(CACHE, "un-shares.xlsx");
  if (!fs.existsSync(at)) {
    const res = await fetch(UN_SHARES_URL, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`UN shares: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  const { rows } = readXlsx(at);
  const headerRow = rows.findIndex((r) => (r[0] || "").trim() === "CountryID");
  if (headerRow < 0) throw new Error("UN shares: header row not found");
  const years = rows[headerRow].slice(3);

  // name -> indicator -> year index -> value
  const byCountry = new Map();
  for (const r of rows.slice(headerRow + 1)) {
    const name = (r[1] || "").trim();
    const indicator = (r[2] || "").trim();
    if (!name || !indicator) continue;
    if (!byCountry.has(name)) byCountry.set(name, new Map());
    byCountry.get(name).set(indicator, r.slice(3));
  }

  return (siteName) => {
    const unName = UN_ALIAS[siteName] ?? siteName;
    const table = byCountry.get(unName);
    if (!table) return null;
    const needed = [...UN_AGRICULTURE, ...UN_INDUSTRY, ...UN_SERVICES];
    if (!needed.every((k) => table.has(k))) return null;

    // Latest year every needed group reports.
    let idx = -1;
    for (let i = years.length - 1; i >= 0; i--) {
      if (needed.every((k) => { const v = table.get(k)[i]; return v !== undefined && v !== "" && Number.isFinite(+v); })) { idx = i; break; }
    }
    if (idx < 0) return null;

    const sum = (keys) => keys.reduce((n, k) => n + Number(table.get(k)[idx]), 0);
    const manuRaw = table.get(UN_MANUFACTURING)?.[idx];
    return {
      year: String(years[idx]),
      agriculture: sum(UN_AGRICULTURE),
      industry: sum(UN_INDUSTRY),
      services: sum(UN_SERVICES),
      manufacturing: manuRaw !== undefined && manuRaw !== "" && Number.isFinite(+manuRaw) ? Number(manuRaw) : null,
    };
  };
}

/**
 * Where the site's name for an economy differs from the World Bank's. Each is
 * the World Bank's own code, not a guess at its spelling; anything not listed
 * has to match by name exactly or the build reports it.
 */
const ALIAS = {
  "United States": "USA",
  "South Korea": "KOR",
  Russia: "RUS",
  Turkey: "TUR",
  Egypt: "EGY",
  Iran: "IRN",
  Venezuela: "VEN",
  Vietnam: "VNM",
  Slovakia: "SVK",
  "Hong Kong": "HKG",
  "European Union": "EUU",
  Czechia: "CZE",
  Laos: "LAO",
  Syria: "SYR",
  Brunei: "BRN",
  "Cape Verde": "CPV",
  "Ivory Coast": "CIV",
  "Democratic Republic of the Congo": "COD",
  "Republic of the Congo": "COG",
  Gambia: "GMB",
  Bahamas: "BHS",
  Kyrgyzstan: "KGZ",
  Moldova: "MDA",
  "North Macedonia": "MKD",
  Yemen: "YEM",
  Micronesia: "FSM",
  "Saint Lucia": "LCA",
};

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(
    `npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

async function fetchIndicator(code) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=12&per_page=25000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
  // code -> year -> value
  const by = new Map();
  for (const row of json[1]) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    if (!/^\d{4}$/.test(String(row.date))) continue;
    const id = row.countryiso3code || row.country.id;
    if (!id) continue;
    if (!by.has(id)) by.set(id, new Map());
    by.get(id).set(String(row.date), row.value);
  }
  return by;
}

(async () => {
  const economies = loadEconomies();

  // The World Bank's own list, so names are matched against what it publishes.
  const cRes = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=500", { headers: { "User-Agent": UA } });
  const cJson = await cRes.json();
  const byName = new Map();
  for (const c of cJson[1] || []) byName.set(c.name.toLowerCase(), c.id);

  const series = {};
  for (const [key, code] of Object.entries(INDICATORS)) series[key] = await fetchIndicator(code);

  const resolved = [];
  const unmatched = [];
  const noData = [];

  const unShares = await loadUnShares();
  let taiwan = null;
  try {
    taiwan = await loadTaiwan();
  } catch (e) {
    console.log("  Taiwan: " + e.message + " — it will have no breakdown");
  }
  let fromUn = 0;
  let fromDgbas = 0;

  for (const e of economies) {
    const code = ALIAS[e.name] ?? byName.get(e.name.toLowerCase());

    /* The World Bank first, because it is the source the rest of the page
       already uses and its three shares are percentages of GDP. */
    let a, i, s2, manu, year, source, entity;
    const agr = code && series.agriculture.get(code);
    const ind = code && series.industry.get(code);
    const srv = code && series.services.get(code);
    const years =
      agr && ind && srv
        ? [...agr.keys()].filter((y) => ind.has(y) && srv.has(y)).sort((x, y) => +y - +x)
        : [];

    if (years.length) {
      year = years[0];
      a = agr.get(year); i = ind.get(year); s2 = srv.get(year);
      manu = series.manufacturing.get(code)?.get(year) ?? null;
      source = "worldBank";
      entity = code;
    } else if (e.name === "Taiwan" && taiwan) {
      year = taiwan.year;
      a = taiwan.agriculture; i = taiwan.industry; s2 = taiwan.services;
      manu = taiwan.manufacturing;
      source = "dgbas";
      entity = "TWN";
      fromDgbas++;
    } else {
      /* Only where the World Bank has nothing. The UN reports shares of value
         added rather than of GDP, which the basis field records. */
      const un = unShares(e.name);
      if (!un) {
        if (!code) unmatched.push(e.name);
        else noData.push(`${e.name} (${code})`);
        continue;
      }
      year = un.year;
      a = un.agriculture; i = un.industry; s2 = un.services;
      manu = un.manufacturing;
      source = "un";
      entity = code ?? "UN";
      fromUn++;
    }

    const s = s2;
    const residual = 100 - (a + i + s);

    /* Normally the three shares fall short of 100 and the gap is taxes less
       subsidies on products - a real part of GDP, so it gets a slice.

       In a few economies the gap is negative: subsidies on products exceed
       taxes on them, so value added at basic prices comes to more than GDP at
       purchaser prices. Kuwait reports 114.2%. A pie cannot draw a negative
       part, and quietly dropping it would leave three slices whose labels add
       to more than the whole. Those are charted as shares of value added
       instead, which is a total that does exist, and the basis is recorded so
       the page can say which it is showing. */
    /* The UN's table is already a distribution across value added - its rows
       sum to 100 - so there is no remainder of GDP to show. Treating it as a
       GDP breakdown would label it wrongly and add a 0% slice for taxes that
       the source never reported. */
    const onGdp = source !== "un" && residual >= 0;
    /* What the remainder of GDP actually is. For the World Bank's value-added
       shares it is taxes on products less subsidies. Taiwan's figures already
       have those taxes inside the sectors, so what is left there is only the
       statistical discrepancy - calling it taxes would be wrong. */
    const residualLabel =
      source === "dgbas" ? "Statistical discrepancy" : "Taxes less subsidies";
    const parts = onGdp
      ? [
          ["Agriculture", a],
          ["Industry", i],
          ["Services", s],
          [residualLabel, residual],
        ]
      : [
          ["Agriculture", a],
          ["Industry", i],
          ["Services", s],
        ];

    /* Round to one decimal and give the rounding error to the largest slice,
       so the printed numbers add to exactly 100 and match the geometry. */
    const total = parts.reduce((n, [, v]) => n + v, 0);
    const scaled = parts.map(([n, v]) => [n, (v / total) * 100]);
    const rounded = scaled.map(([n, v]) => [n, Math.round(v * 10) / 10]);
    const drift = +(100 - rounded.reduce((n, [, v]) => n + v, 0)).toFixed(1);
    if (drift !== 0) {
      let big = 0;
      for (let k = 1; k < rounded.length; k++) if (rounded[k][1] > rounded[big][1]) big = k;
      rounded[big][1] = +(rounded[big][1] + drift).toFixed(1);
    }

    resolved.push({
      id: e.id,
      name: e.name,
      code: entity,
      source,
      year,
      basis: onGdp ? "gdp" : "valueAdded",
      slices: rounded.map(([n, v]) => ({ name: n, pct: v })),
      manufacturing: manu === null ? null : +manu.toFixed(1),
    });
  }

  resolved.sort((x, y) => x.name.localeCompare(y.name));
  const today = new Date().toISOString().slice(0, 10);
  const rows = resolved
    .map(
      (r) =>
        `  "${r.id}": {\n` +
        `    name: ${JSON.stringify(r.name)}, code: "${r.code}", year: "${r.year}", basis: "${r.basis}", source: "${r.source}",\n` +
        `    manufacturing: ${r.manufacturing === null ? "null" : r.manufacturing},\n` +
        `    slices: [${r.slices.map((x) => `{ name: ${JSON.stringify(x.name)}, pct: ${x.pct} }`).join(", ")}],\n` +
        `  },`,
    )
    .join("\n");

  const years = [...new Set(resolved.map((r) => r.year))].sort();
  fs.writeFileSync(
    OUT,
    `/**
 * GDP composition by sector, per economy.
 *
 * GENERATED by build-economy-sectors.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Three shares that partition value added, from the World Bank's national
 * accounts, all four figures for an economy taken from the same year:
 *
 *   agriculture    NV.AGR.TOTL.ZS   ISIC rev.4 01-03
 *   industry       NV.IND.TOTL.ZS   ISIC rev.4 05-43, including construction
 *   services       NV.SRV.TOTL.ZS   ISIC rev.4 45-99
 *
 * \`manufacturing\` (NV.IND.MANF.ZS) is part of industry, not a fourth sector —
 * the World Bank's definition has industry "comprised of mining, manufacturing,
 * construction, electricity, water, and gas". It is here to be quoted as an
 * "of which" figure and must never be given a slice of its own. Finance is
 * likewise inside services, whose definition covers "financial intermediation".
 *
 * \`other\` is what is left of GDP once the three are counted: taxes less
 * subsidies on products, plus any statistical discrepancy, arising because
 * value added is measured at basic prices and GDP at purchaser prices. It is
 * kept rather than scaled away, because scaling it away would overstate every
 * other share.
 *
 * ${resolved.length} of the ${economies.length} economies on the page have a figure${years.length === 1 ? `, all from ${years[0]}` : `; years ${years.join(", ")}`}.
 */
export const ECONOMY_SECTORS_SOURCE = {
  label: "World Bank — national accounts, value added by sector (% of GDP)",
  url: "https://data.worldbank.org/indicator/NV.AGR.TOTL.ZS",
  retrieved: "${today}",
};

export type EconomySectors = {
  name: string;
  /** World Bank entity code the figures were read from. */
  code: string;
  year: string;
  /**
   * What the slices are shares of. "gdp" is the usual case, and the slices
   * include taxes less subsidies on products. "valueAdded" is used where
   * subsidies on products exceed taxes, so value added comes to more than GDP
   * and there is no positive remainder to draw.
   */
  basis: "gdp" | "valueAdded";
  /** Sums to exactly 100, so each slice's size is the number printed on it. */
  slices: { name: string; pct: number }[];
  /** Part of the industry slice, never a slice of its own. Percent of GDP. */
  manufacturing: number | null;
  /**
   * Which body published the figures. The World Bank covers all but a few; the
   * UN Statistics Division fills gaps the World Bank does not report, and its
   * shares are of value added rather than of GDP. Taiwan comes from its own
   * statistics office, which neither of the others covers.
   */
  source: "worldBank" | "un" | "dgbas";
};

/** Keyed by the economy id used in economiesData.ts. */
export const ECONOMY_SECTORS: Record<string, EconomySectors> = {
${rows}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  ${resolved.length} of ${economies.length} economies; years ${years.join(", ")}`);
  if (unmatched.length) console.log(`  no World Bank entity (${unmatched.length}): ${unmatched.join(", ")}`);
  if (noData.length) console.log(`  matched but no figures (${noData.length}): ${noData.join(", ")}`);
  const worst = Math.max(
    ...resolved.map((r) => Math.abs(r.slices.reduce((n, x) => n + x.pct, 0) - 100)),
  );
  const va = resolved.filter((r) => r.basis === "valueAdded");
  console.log(`  every pie sums to 100 within ${worst.toFixed(2)} points`);
  console.log(`  charted on GDP: ${resolved.length - va.length}; on value added: ${va.length}${va.length ? ` (${va.map((r) => r.name).join(", ")})` : ""}`);
  const named = (src) => resolved.filter((r) => r.source === src).map((r) => r.name).join(", ");
  console.log(`  from the World Bank: ${resolved.length - fromUn - fromDgbas}`);
  if (fromUn) console.log(`  from the UN: ${fromUn} (${named("un")})`);
  if (fromDgbas) console.log(`  from DGBAS: ${fromDgbas} (${named("dgbas")})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
