/**
 * Builds src/data/surveillance.ts — how far each government watches and
 * restricts what its people do online, from the V-Dem Institute's Digital
 * Society Project.
 *
 *   Source   Digital Society Project Dataset v8 (Mechkova, Pemstein, Seim and
 *            Wilson, 2026): its country-year CSV, downloaded whole from the
 *            project's data page. The same measures are published in the
 *            V-Dem dataset, which V-Dem issues under Creative Commons
 *            Attribution-ShareAlike 4.0, commercial use included.
 *
 * Each measure is an expert survey: country experts answer a question on a
 * scale whose every point the codebook words, and V-Dem's measurement model
 * turns their answers into a figure on that scale (the "_osp" estimate). The
 * figure is kept as V-Dem gives it, to two places, with the year; the words
 * shown beside it are the codebook's own for the nearest point of the scale.
 * Lower is more surveillance or restriction on every scale kept here.
 *
 * Countries are matched to the site's by their ISO 3166 alpha-3 code, through
 * the World Bank's list of economies; a V-Dem unit with no match (a
 * historical state, Zanzibar, Somaliland) is left out and counted.
 *
 *   node build-surveillance.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/surveillance.ts");
const ZIP_URL = "https://digitalsocietyproject.org/wp-content/uploads/2026/03/DigitalSocietyProject-v8-CSV.zip";
const CACHE = path.join(os.tmpdir(), "commonsphere-dsp");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";

/** The measures kept: the codebook's question for each, and its words for each point of the scale, lowest first. */
const MEASURES = {
  monitoring: {
    v: "v2smgovsmmon",
    name: "Government social media monitoring",
    question: "How comprehensive is the surveillance of political content in social media by the government?",
    points: ["Extremely comprehensive", "Mostly comprehensive", "Somewhat comprehensive", "Limited", "Not at all, or almost not at all"],
  },
  filtering: {
    v: "v2smgovfilprc",
    name: "Government Internet filtering in practice",
    question: "How frequently does the government censor political information (text, audio, images, or video) on the Internet by filtering (blocking access to certain websites)?",
    points: ["Extremely often", "Often", "Sometimes", "Rarely", "Never, or almost never"],
  },
  internetShutdown: {
    v: "v2smgovshut",
    name: "Government Internet shut down in practice",
    question: "How often does the government shut down domestic access to the Internet?",
    points: ["Extremely often", "Often", "Sometimes", "Rarely", "Never, or almost never"],
  },
  socialShutdown: {
    v: "v2smgovsm",
    name: "Government social media shut down in practice",
    question: "How often does the government shut down access to social media platforms?",
    points: ["Extremely often", "Often", "Sometimes", "Rarely", "Never, or almost never"],
  },
  socialCensorship: {
    v: "v2smgovsmcenprc",
    name: "Government social media censorship in practice",
    question: "To what degree does the government censor political content (i.e., deleting or filtering specific posts for political reasons) on social media in practice?",
    points: [
      "The government simply blocks all social media platforms",
      "The government successfully censors all social media with political content",
      "The government successfully censors a significant portion of political content on social media",
      "The government only censors social media with political content that deals with especially sensitive issues",
      "The government does not censor political social media content",
    ],
  },
  arrests: {
    v: "v2smarrest",
    name: "Arrests for political content",
    question: "If a citizen posts political content online that would run counter to the government and its policies, what is the likelihood that citizen is arrested?",
    points: ["Extremely likely", "Likely", "Unlikely", "Extremely unlikely"],
  },
  privacyLaw: {
    v: "v2smprivex",
    name: "Privacy protection by law exists",
    question: "Does a legal framework to protect Internet users' privacy and their data exist?",
    points: ["No", "Yes"],
  },
};

/** A CSV's rows, quotes and all. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
}

function unzip(zip, into) {
  // Windows' own tar reads a zip; elsewhere, unzip.
  const tars = ["C:\\Windows\\System32\\tar.exe", "bsdtar", "unzip"];
  for (const t of tars) {
    try {
      if (t === "unzip") execFileSync(t, ["-o", zip, "-d", into], { stdio: "ignore" });
      else execFileSync(t, ["-xf", zip, "-C", into], { stdio: "ignore" });
      return;
    } catch {
      /* the next */
    }
  }
  throw new Error("could not unpack the zip");
}

(async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  const zip = path.join(CACHE, "dsp.zip");
  if (!fs.existsSync(zip)) {
    execFileSync("curl", ["-sL", "-A", UA, "-o", zip, ZIP_URL]);
  }
  const csvPath = path.join(CACHE, "DigitalSocietyProject-v8-CSV", "DSP_CY_v8.csv");
  if (!fs.existsSync(csvPath)) unzip(zip, CACHE);
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const head = rows[0];
  const col = (name) => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`no column ${name}`);
    return i;
  };
  const iso3 = col("country_text_id");
  const year = col("year");
  const cols = Object.fromEntries(Object.entries(MEASURES).map(([k, m]) => [k, col(`${m.v}_osp`)]));

  // ISO3 to ISO2, from the World Bank's list of economies.
  const wb = JSON.parse(execFileSync("curl", ["-sL", "-A", UA, "https://api.worldbank.org/v2/country?format=json&per_page=400"]).toString())[1];
  const two = new Map(wb.filter((c) => c.region?.value !== "Aggregates").map((c) => [c.id, c.iso2Code]));
  // The few the World Bank codes apart from V-Dem.
  two.set("XKX", "XK");
  two.set("KOS", "XK");
  two.set("PSE", "PS");
  two.set("TWN", "TW");

  const latest = new Map();
  for (const r of rows.slice(1)) {
    if (!r[iso3]) continue;
    const y = Number(r[year]);
    const prev = latest.get(r[iso3]);
    if (!prev || y > Number(prev[year])) latest.set(r[iso3], r);
  }
  const out = {};
  const left = [];
  for (const [code3, r] of latest) {
    const cc = two.get(code3);
    if (!cc || !/^[A-Z]{2}$/.test(cc)) {
      left.push(`${r[col("country_name")]} (${code3})`);
      continue;
    }
    const e = { y: Number(r[year]) };
    for (const [k, i] of Object.entries(cols)) if (r[i] !== "" && r[i] !== "NA" && Number.isFinite(Number(r[i]))) e[k] = Math.round(Number(r[i]) * 100) / 100;
    if (Object.keys(e).length > 1) out[cc] = e;
  }
  const today = new Date().toISOString().slice(0, 10);
  const lines = Object.keys(out)
    .sort()
    .map((cc) => `  ${cc}: ${JSON.stringify(out[cc]).replace(/"(\w+)":/g, "$1:")},`);
  fs.writeFileSync(
    OUT,
    `/**
 * How far each government watches and restricts what its people do online:
 * the V-Dem Institute's Digital Society Project, Dataset v8.
 *
 * GENERATED by build-surveillance.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each figure is V-Dem's estimate on the scale of an expert-survey question,
 * to two places, for the latest year (${[...new Set(Object.values(out).map((e) => e.y))].join(", ")}); lower is more surveillance
 * or restriction on every scale. The words for each point of a scale are the
 * codebook's own. ${Object.keys(out).length} countries; left out for want of a code the site
 * knows: ${left.join(", ") || "none"}.
 */
export const SURVEILLANCE_SOURCE = {
  label: "V-Dem Institute — Digital Society Project Dataset v8 (Mechkova, Pemstein, Seim & Wilson 2026), CC BY-SA 4.0",
  url: "https://digitalsocietyproject.org/data/",
  retrieved: "${today}",
};

export type SurveillanceMeasure = ${Object.keys(MEASURES).map((k) => `"${k}"`).join(" | ")};
/** Each measure: the codebook's name and question, and its words for each point of the scale, lowest first. */
export const SURVEILLANCE_SCALES: Record<SurveillanceMeasure, { name: string; question: string; points: string[] }> = ${JSON.stringify(
      Object.fromEntries(Object.entries(MEASURES).map(([k, m]) => [k, { name: m.name, question: m.question, points: m.points }])),
      null,
      2,
    )};

export type Surveillance = { y: number } & Partial<Record<SurveillanceMeasure, number>>;

export const SURVEILLANCE: Record<string, Surveillance> = {
${lines.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} countries; left out ${left.length}: ${left.join(", ")}`);
  console.log("US:", JSON.stringify(out.US), "CN:", JSON.stringify(out.CN), "GB:", JSON.stringify(out.GB));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
