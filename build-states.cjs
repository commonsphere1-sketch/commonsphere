/**
 * Builds src/data/stateIndicators.ts — the figures on each US state, from the
 * federal agency (or the standard compiler) that publishes them, each with
 * the year or date it is for.
 *
 * What this replaces. statesData.ts was written by hand, with no year on
 * anything. Spot checks against the sources below found it a mixture of real
 * but stale figures and ones no source supports: Alabama's 2024 vote given as
 * 57% Republican against the FEC's official 64.6%; incarceration rates with
 * no stated measure (Alabama 565 per 100,000, where BJS's imprisonment rate is
 * 394); a "makeTrends" formula generating monthly GDP and
 * employment series out of two numbers. Everything below replaces a written
 * figure with a published one.
 *
 * Sources (all public, no keys):
 *   Census Bureau, Vintage 2025 population estimates  population; ethnicity
 *     and age groups summed from the characteristics file (sc-est2025-alldata6)
 *   Census Bureau, ACS 2024 1-year (table-based summary files)
 *     median household income (B19013), median age (B01002), income relative
 *     to the poverty line (C17002); housing (B25077 value, B25064 rent,
 *     B25003 tenure, B25002 vacancy, B25070 rent burden); commuting (B08301
 *     mode, B08013 aggregate travel time, B08201 vehicles); education
 *     (B15003 attainment, adults 25+)
 *   BEA regional accounts (bulk files)  GDP (SAGDP1 line 3), per capita
 *     personal income (SAINC1 line 3)
 *   BLS LAUS via the public API  unemployment rate, seasonally adjusted,
 *     latest month (the most recent is preliminary and flagged)
 *   BJS, Prisoners in 2023, table 7  imprisonment rate (sentenced prisoners
 *     under state jurisdiction per 100,000 residents)
 *   FEC, Official 2024 Presidential General Election Results
 *   EIA, annual generation by state  electricity generation mix
 *   Department of Labor, state minimum wage table
 *   Tax Foundation, 2026 state income tax rates; sales tax rates as of
 *     January 1, 2026 (state plus population-weighted average local)
 *   unitedstates/congress-legislators  current senators and representatives
 *   Census Bureau, 2020 apportionment  House seats per state
 *   Wikidata  current governors, checked for exactly one per state
 *
 * Homelessness is not here. HUD's point-in-time counts are behind an
 * automated-traffic check that this script does not try to get around, so
 * the page cannot show a current HUD figure and shows none.
 *
 *   node build-states.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx, unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/stateIndicators.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-states");
fs.mkdirSync(CACHE, { recursive: true });

const U = {
  nst: "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv",
  asrh: "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/sc-est2025-alldata6.csv",
  acs: (t) => `https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/1YRData/acsdt1y2024-${t}.dat`,
  sagdp: "https://apps.bea.gov/regional/zip/SAGDP.zip",
  sainc: "https://apps.bea.gov/regional/zip/SAINC.zip",
  bls: "https://api.bls.gov/publicAPI/v1/timeseries/data/",
  bjs: "https://bjs.ojp.gov/document/p23st.zip",
  fec: "https://www.fec.gov/documents/5645/2024presgeresults.xlsx",
  eia: "https://www.eia.gov/electricity/data/state/annual_generation_state.xlsx",
  dol: "https://www.dol.gov/agencies/whd/minimum-wage/state",
  tfIncome: "https://taxfoundation.org/wp-content/uploads/2026/02/2026-State-Individual-Income-Tax-Rates-Brackets.xlsx",
  tfSales: "https://taxfoundation.org/wp-content/uploads/2026/01/2026-Sales-Tax-Data.xlsx",
  congress: "https://unitedstates.github.io/congress-legislators/legislators-current.json",
  apportion: "https://www2.census.gov/programs-surveys/decennial/2020/data/apportionment/apportionment-2020-table01.xlsx",
  wikidata: "https://query.wikidata.org/sparql",
};

async function get(url, name, opts = {}) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    const res = await fetch(url, { headers: { "User-Agent": UA, ...(opts.headers || {}) }, method: opts.method, body: opts.body, redirect: "follow" });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  return at;
}
const text = async (url, name, opts) => fs.readFileSync(await get(url, name, opts), "utf8");

function csv(t) {
  return t.trim().split(/\r?\n/).map((line) => {
    const out = [];
    let cur = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  });
}

function loadStates() {
  const bundle = path.join(CACHE, "statesData.cjs");
  execSync(
    `npx esbuild src/data/statesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).usStatesData;
}

const r1 = (v) => Math.round(v * 10) / 10;

(async () => {
  const states = loadStates();
  if (states.length !== 50) throw new Error(`expected 50 states, found ${states.length}`);
  const byName = new Map(states.map((s) => [s.name, s]));
  const byAbbr = new Map(states.map((s) => [s.abbreviation, s]));
  const out = Object.fromEntries(states.map((s) => [s.id, {}]));
  const set = (s, k, v) => { out[s.id][k] = v; };
  const need = (label, map) => {
    const missing = states.filter((s) => !(label in out[s.id])).map((s) => s.name);
    if (missing.length) throw new Error(`${label}: no value for ${missing.join(", ")}`);
  };

  // ── Census population estimates ──────────────────────────────────────────
  const fips = {};
  {
    const rows = csv(await text(U.nst, "nst.csv"));
    const H = rows[0];
    const iN = H.indexOf("NAME"), iP = H.indexOf("POPESTIMATE2025"), iS = H.indexOf("STATE"), iL = H.indexOf("SUMLEV");
    for (const r of rows.slice(1)) {
      const s = byName.get(r[iN]);
      if (!s || r[iL] !== "040") continue;
      fips[s.id] = r[iS];
      set(s, "population", { v: +r[iP], y: "2025" });
    }
    need("population");
  }
  {
    const rows = csv(await text(U.asrh, "asrh.csv"));
    const H = rows[0];
    const ix = (k) => H.indexOf(k);
    const [iN, iSex, iO, iR, iA, iP] = ["NAME", "SEX", "ORIGIN", "RACE", "AGE", "POPESTIMATE2025"].map(ix);
    const acc = {};
    for (const r of rows.slice(1)) {
      const s = byName.get(r[iN]);
      if (!s || r[iSex] !== "0") continue;
      const a = (acc[s.id] ||= { total: 0, hisp: 0, white: 0, black: 0, asian: 0, ages: [0, 0, 0, 0, 0] });
      const v = +r[iP], age = +r[iA];
      if (r[iO] === "0") {
        a.total += v;
        a.ages[age < 18 ? 0 : age < 35 ? 1 : age < 55 ? 2 : age < 65 ? 3 : 4] += v;
      } else if (r[iO] === "2") a.hisp += v;
      else if (r[iO] === "1") {
        if (r[iR] === "1") a.white += v;
        else if (r[iR] === "2") a.black += v;
        else if (r[iR] === "4") a.asian += v;
      }
    }
    for (const s of states) {
      const a = acc[s.id];
      if (!a) throw new Error(`no characteristics for ${s.name}`);
      const pop = out[s.id].population.v;
      if (a.total !== pop) throw new Error(`${s.name}: characteristics total ${a.total} != estimate ${pop}`);
      const pct = (n) => r1((n / a.total) * 100);
      const other = a.total - a.hisp - a.white - a.black - a.asian;
      set(s, "ethnicity", {
        y: "2025",
        groups: [
          { group: "White", pct: pct(a.white) },
          { group: "Black", pct: pct(a.black) },
          { group: "Hispanic", pct: pct(a.hisp) },
          { group: "Asian", pct: pct(a.asian) },
          { group: "Other", pct: pct(other) },
        ],
      });
      set(s, "ageGroups", {
        y: "2025",
        groups: ["Under 18", "18–34", "35–54", "55–64", "65+"].map((g, i) => ({ group: g, pct: pct(a.ages[i]) })),
      });
    }
  }

  // ── ACS 2024 1-year ──────────────────────────────────────────────────────
  const acs = async (table) => {
    const rows = (await text(U.acs(table), `acs-${table}.dat`)).trim().split(/\r?\n/).map((l) => l.split("|"));
    const H = rows[0];
    const m = {};
    for (const r of rows.slice(1)) {
      const g = r[0].match(/^0400000US(\d{2})$/);
      if (g) m[g[1]] = Object.fromEntries(H.map((h, i) => [h, r[i]]));
    }
    return m;
  };
  {
    const inc = await acs("b19013"), age = await acs("b01002"), pov = await acs("c17002");
    for (const s of states) {
      const f = fips[s.id];
      set(s, "medianIncome", { v: +inc[f].B19013_E001, y: "2024" });
      set(s, "medianAge", { v: +age[f].B01002_E001, y: "2024" });
      // C17002: ratio of income to poverty level. 002 under .50, 003 .50-.99,
      // 004 1.00-1.24, 005 1.25-1.49, 006 1.50-1.84, 007 1.85-1.99, 008 2.00+.
      const p = pov[f], t = +p.C17002_E001;
      const sum = (...k) => k.reduce((a, c) => a + +p[`C17002_E00${c}`], 0);
      const below = sum(2, 3), near = sum(4, 5, 6, 7), above = +p.C17002_E008;
      if (below + near + above !== t) throw new Error(`${s.name}: C17002 parts do not add up`);
      set(s, "poverty", {
        y: "2024",
        groups: [
          { label: "Below poverty line", pct: r1((below / t) * 100) },
          { label: "1–2× poverty line", pct: r1((near / t) * 100) },
          { label: "Over 2× poverty line", pct: r1((above / t) * 100) },
        ],
      });
    }
  }

  // Housing, commuting and education, ACS 2024 1-year. Line numbers checked
  // against the Census Bureau's 2024 table shells.
  {
    const t = {};
    for (const id of ["b25077", "b25064", "b25003", "b25002", "b25070", "b08301", "b08013", "b08201", "b15003"]) t[id] = await acs(id);
    const n = (tab, f, code) => {
      const v = Number(t[tab][f][code]);
      if (!Number.isFinite(v)) throw new Error(`ACS ${code}: not a number for FIPS ${f}`);
      return v;
    };
    const pct = (a, b) => r1((a / b) * 100);
    for (const s of states) {
      const f = fips[s.id];
      const rentTotal = n("b25070", f, "B25070_E001") - n("b25070", f, "B25070_E011");
      const burdened = ["07", "08", "09", "10"].reduce((a, k) => a + n("b25070", f, `B25070_E0${k}`), 0);
      const workers = n("b08301", f, "B08301_E001");
      const commuters = workers - n("b08301", f, "B08301_E021");
      const adults = n("b15003", f, "B15003_E001");
      const sumEdu = (from, to) => { let a = 0; for (let k = from; k <= to; k++) a += n("b15003", f, `B15003_E0${String(k).padStart(2, "0")}`); return a; };
      set(s, "housing", {
        y: "2024",
        medianHomeValue: n("b25077", f, "B25077_E001"),
        medianRent: n("b25064", f, "B25064_E001"),
        homeOwnershipPct: pct(n("b25003", f, "B25003_E002"), n("b25003", f, "B25003_E001")),
        vacancyPct: pct(n("b25002", f, "B25002_E003"), n("b25002", f, "B25002_E001")),
        rentBurdenPct: pct(burdened, rentTotal),
      });
      set(s, "commute", {
        y: "2024",
        carTruckVanPct: pct(n("b08301", f, "B08301_E002"), workers),
        transitPct: pct(n("b08301", f, "B08301_E010"), workers),
        walkBikePct: pct(n("b08301", f, "B08301_E018") + n("b08301", f, "B08301_E019"), workers),
        workFromHomePct: pct(n("b08301", f, "B08301_E021"), workers),
        meanCommuteMin: r1(n("b08013", f, "B08013_E001") / commuters),
        householdsWithVehiclePct: pct(n("b08201", f, "B08201_E001") - n("b08201", f, "B08201_E002"), n("b08201", f, "B08201_E001")),
      });
      set(s, "education", {
        y: "2024",
        highSchoolOrHigherPct: pct(sumEdu(17, 25), adults),
        bachelorsOrHigherPct: pct(sumEdu(22, 25), adults),
      });
    }
  }

  // ── BEA ──────────────────────────────────────────────────────────────────
  const bea = async (zipUrl, name, table, line) => {
    const z = unzip(await get(zipUrl, name));
    const file = [...z.keys()].find((k) => new RegExp(`^${table}__ALL_AREAS_\\d{4}_\\d{4}\\.csv$`).test(k));
    if (!file) throw new Error(`${table}: no ALL_AREAS file`);
    const rows = csv(z.get(file).toString("latin1"));
    const H = rows[0];
    const years = H.map((h, i) => [h, i]).filter(([h]) => /^\d{4}$/.test(h));
    const m = {};
    for (const r of rows.slice(1)) {
      if (r[H.indexOf("LineCode")]?.trim() !== String(line)) continue;
      const name = r[H.indexOf("GeoName")]?.trim().replace(/ \*$/, "");
      for (let k = years.length - 1; k >= 0; k--) {
        const v = Number(r[years[k][1]]);
        if (Number.isFinite(v) && r[years[k][1]] !== "") { m[name] = { v, y: years[k][0] }; break; }
      }
    }
    return m;
  };
  {
    const gdp = await bea(U.sagdp, "SAGDP.zip", "SAGDP1", 3);
    const pci = await bea(U.sainc, "SAINC.zip", "SAINC1", 3);
    for (const s of states) {
      const g = gdp[s.name], p = pci[s.name];
      if (!g || !p) throw new Error(`BEA: missing ${s.name}`);
      set(s, "gdp", { v: Math.round(g.v / 100) / 10, y: g.y }); // millions → billions, 1 dp
      set(s, "averageIncome", { v: Math.round(p.v), y: p.y });
    }
  }

  // ── BLS unemployment ─────────────────────────────────────────────────────
  {
    const ids = states.map((s) => `LASST${fips[s.id]}0000000000003`);
    const yr = new Date().getFullYear();
    const series = [];
    // The keyless v1 API refuses large batches at busy times; ten at a time,
    // with a pause, has been reliable.
    for (let i = 0; i < ids.length; i += 10) {
      if (i) await new Promise((r) => setTimeout(r, 1500));
      const t = await text(U.bls, `bls-${yr}-${i}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesid: ids.slice(i, i + 10), startyear: String(yr - 1), endyear: String(yr) }),
      });
      const j = JSON.parse(t);
      if (j.status !== "REQUEST_SUCCEEDED") throw new Error("BLS: " + j.status + " " + j.message);
      series.push(...j.Results.series);
    }
    for (const s of states) {
      const ser = series.find((x) => x.seriesID === `LASST${fips[s.id]}0000000000003`);
      const d = ser?.data?.find((x) => /^M\d\d$/.test(x.period));
      if (!d) throw new Error(`BLS: no data for ${s.name}`);
      const prelim = (d.footnotes || []).some((f) => f && f.code === "P");
      set(s, "unemploymentRate", { v: +d.value, y: `${d.periodName} ${d.year}`, ...(prelim ? { prelim: true } : {}) });
    }
  }

  // ── BJS imprisonment rates ───────────────────────────────────────────────
  {
    const rows = csv(unzip(await get(U.bjs, "p23st.zip")).get("p23stt07.csv").toString("latin1"));
    // Columns: blank, jurisdiction, 2022 total, M, F, 18+, blank, 2023 total, ...
    const head = rows.findIndex((r) => r[0] === "Jurisdiction");
    if (head < 0 || !/2023/.test(rows[head - 2].join(" "))) throw new Error("BJS table 7 layout changed");
    // Footnote rows read "b/Prisons and jails form one integrated system..."
    const notes = {};
    for (const r of rows) {
      const m = (r[0] || "").match(/^([a-z])\/(.+)$/);
      if (m) notes[m[1]] = m[2].trim();
    }
    for (const r of rows.slice(head + 1)) {
      const m = (r[1] || "").match(/^(.*?)(?:\/([a-z,]+))?$/);
      const s = byName.get(m[1].trim());
      if (!s) continue;
      const note = m[2] ? m[2].split(",").map((l) => notes[l]).filter(Boolean).join(" ") : undefined;
      set(s, "incarcerationRate", { v: +r[7].replace(/,/g, ""), y: "2023", ...(note ? { note } : {}) });
    }
    need("incarcerationRate");
  }

  // ── FEC 2024 presidential results ────────────────────────────────────────
  {
    const { rows } = readXlsx(await get(U.fec, "fec2024.xlsx"));
    const H = rows[0];
    const iH = H.indexOf("HARRIS"), iT = H.indexOf("TRUMP"), iTot = H.indexOf("TOTAL VOTES");
    if (iH < 0 || iT < 0 || iTot < 0) throw new Error("FEC layout changed");
    for (const r of rows.slice(1)) {
      const s = byAbbr.get(r[0]);
      if (!s) continue;
      const tot = +r[iTot], d = +r[iH], rep = +r[iT];
      set(s, "voterShare", {
        y: "2024",
        groups: [
          { party: "Democrat", pct: r1((d / tot) * 100) },
          { party: "Republican", pct: r1((rep / tot) * 100) },
          { party: "Other", pct: r1(((tot - d - rep) / tot) * 100) },
        ],
      });
    }
    need("voterShare");
    const al = out.al.voterShare.groups[1].pct;
    if (Math.abs(al - 64.6) > 0.1) throw new Error(`FEC check: Alabama Trump share ${al}, expected 64.6`);
  }

  // ── EIA generation mix ───────────────────────────────────────────────────
  {
    const { rows } = readXlsx(await get(U.eia, "eia-gen.xlsx"));
    const head = rows.findIndex((r) => r[0] === "YEAR");
    const latest = Math.max(...rows.slice(head + 1).map((r) => +r[0]).filter(Number.isFinite));
    const buckets = {
      Coal: ["Coal"], "Natural Gas": ["Natural Gas"], Nuclear: ["Nuclear"], Hydro: ["Hydroelectric Conventional"],
      Solar: ["Solar Thermal and Photovoltaic"], Wind: ["Wind"],
    };
    const acc = {};
    for (const r of rows.slice(head + 1)) {
      if (+r[0] !== latest || r[2] !== "Total Electric Power Industry") continue;
      const s = byAbbr.get(r[1]);
      if (!s) continue;
      (acc[s.id] ||= {})[r[3]] = +r[4];
    }
    for (const s of states) {
      const a = acc[s.id];
      if (!a?.Total) throw new Error(`EIA: no ${latest} total for ${s.name}`);
      const mix = Object.entries(buckets).map(([name, keys]) => ({ source: name, mwh: keys.reduce((t, k) => t + (a[k] || 0), 0) }));
      const named = mix.reduce((t, m) => t + m.mwh, 0);
      mix.push({ source: "Other", mwh: Math.max(0, a.Total - named) }); // oil, biomass, geothermal, net pumped storage...
      set(s, "energyMix", { y: String(latest), groups: mix.map((m) => ({ source: m.source, pct: r1((m.mwh / a.Total) * 100) })) });
    }
  }

  // ── DOL minimum wage ─────────────────────────────────────────────────────
  {
    const h = await text(U.dol, "dol-mw.html");
    const t = h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    const updated = (t.match(/Updated ([A-Z][a-z]+ \d{1,2}, \d{4})/) || [])[1];
    if (!updated) throw new Error("DOL: no 'Updated' date");
    const names = [...states.map((s) => s.name), "District of Columbia", "Guam", "Puerto Rico", "U.S. Virgin Islands"];
    const pos = names.map((n) => [n, t.indexOf(` ${n} `, t.indexOf("Table of minimum wage by state"))]).filter(([, i]) => i > 0).sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < pos.length; k++) {
      const [n, i] = pos[k];
      const s = byName.get(n);
      if (!s) continue;
      const seg = t.slice(i, k + 1 < pos.length ? pos[k + 1][1] : i + 3000);
      const m = seg.match(/Basic Minimum Rate \(per hour\): \$(\d+\.\d\d)/);
      // No state law, or a state rate below the federal one, means covered
      // employers pay the federal $7.25; the site's convention is 0 for that.
      const rate = m ? +m[1] : null;
      if (rate === null && !/No state minimum wage law/.test(seg)) throw new Error(`DOL: cannot read ${n}`);
      set(s, "minimumWage", { v: rate === null || rate < 7.25 ? 0 : rate, y: updated });
    }
    need("minimumWage");
  }

  // ── Tax Foundation ───────────────────────────────────────────────────────
  {
    const AP = {
      "Ala.": "AL", Alaska: "AK", "Ariz.": "AZ", "Ark.": "AR", "Calif.": "CA", "Colo.": "CO", "Conn.": "CT", "Del.": "DE",
      "Fla.": "FL", "Ga.": "GA", Hawaii: "HI", Idaho: "ID", "Ill.": "IL", "Ind.": "IN", Iowa: "IA", "Kans.": "KS",
      "Ky.": "KY", "La.": "LA", Maine: "ME", "Md.": "MD", "Mass.": "MA", "Mich.": "MI", "Minn.": "MN", "Miss.": "MS",
      "Mo.": "MO", "Mont.": "MT", "Nebr.": "NE", "Nev.": "NV", "N.H.": "NH", "N.J.": "NJ", "N.M.": "NM", "N.Y.": "NY",
      "N.C.": "NC", "N.D.": "ND", Ohio: "OH", "Okla.": "OK", "Ore.": "OR", "Pa.": "PA", "R.I.": "RI", "S.C.": "SC",
      "S.D.": "SD", "Tenn.": "TN", "Tex.": "TX", Utah: "UT", "Vt.": "VT", "Va.": "VA", "Wash.": "WA", "W.Va.": "WV",
      "Wis.": "WI", "Wyo.": "WY", "D.C.": "DC",
    };
    const { rows } = readXlsx(await get(U.tfIncome, "tf-income.xlsx"));
    let cur = null;
    const top = {};
    const capGainsOnly = new Set();
    for (const r of rows.slice(2)) {
      const label = (r[0] || "").replace(/\s*\(.*$/, "").trim();
      if (label && AP[label]) cur = AP[label];
      else if (label && !label.startsWith("(") && label.length < 12 && /^[A-Z]/.test(label) && !/^(State|Note|Source)/.test(label)) cur = null;
      if (!cur) continue;
      // Washington taxes capital gains only; its 7% and 9% are not a tax on
      // wages or salaries and must not be read as a top income tax rate.
      if (/capital gains income only/i.test(r[1] || "")) capGainsOnly.add(cur);
      if (capGainsOnly.has(cur)) continue;
      const v = Number(r[1]);
      if (r[1] && /none/i.test(r[1])) top[cur] = top[cur] ?? 0;
      else if (Number.isFinite(v) && r[1] !== "" && r[1] !== " ") top[cur] = Math.max(top[cur] ?? 0, v);
    }
    for (const ab of capGainsOnly) top[ab] = 0;
    for (const s of states) {
      if (!(s.abbreviation in top)) throw new Error(`Tax Foundation income: no rate for ${s.name}`);
      if (capGainsOnly.has(s.abbreviation)) {
        set(s, "stateTaxRate", { v: 0, y: "2026", note: "No tax on wage income; capital gains only" });
        continue;
      }
      set(s, "stateTaxRate", { v: Math.round(top[s.abbreviation] * 10000) / 100, y: "2026" });
    }
    const sales = readXlsx(await get(U.tfSales, "tf-sales.xlsx")).rows;
    const asOf = (sales[0][0].match(/as of (.*)$/) || [])[1] || "January 1, 2026";
    const sh = sales.findIndex((r) => r[0] === "State");
    const iC = sales[sh].indexOf("Combined Tax Rate");
    for (const r of sales.slice(sh + 1)) {
      const s = byName.get((r[0] || "").replace(/\s*\(.*$/, "").trim());
      if (s) set(s, "salesTaxRate", { v: Math.round(+r[iC] * 10000) / 100, y: asOf });
    }
    need("salesTaxRate");
  }

  // ── Congress ─────────────────────────────────────────────────────────────
  {
    const people = JSON.parse(await text(U.congress, "legislators-current.json"));
    const sen = {}, reps = {};
    const party = (p) => (p === "Democrat" || p === "Republican" ? p : "Independent");
    for (const p of people) {
      const t = p.terms[p.terms.length - 1];
      const s = byAbbr.get(t.state);
      if (!s) continue;
      const name = p.name.official_full || `${p.name.first} ${p.name.last}`;
      if (t.type === "sen") (sen[s.id] ||= []).push({ name, party: party(t.party), termEnd: +t.end.slice(0, 4) });
      else if (t.type === "rep") (reps[s.id] ||= []).push({ name, party: party(t.party), district: t.district === 0 ? `${s.abbreviation}-At Large` : `${s.abbreviation}-${t.district}`, n: t.district });
    }
    const { rows } = readXlsx(await get(U.apportion, "apportionment-2020.xlsx"));
    for (const r of rows) {
      const s = byName.get(r[0]);
      if (s) set(s, "houseSeats", { v: +r[2], y: "2020 apportionment" });
    }
    need("houseSeats");
    for (const s of states) {
      const ss = (sen[s.id] || []).sort((a, b) => a.termEnd - b.termEnd);
      if (ss.length > 2) throw new Error(`${s.name}: ${ss.length} senators`);
      set(s, "senators", ss);
      const rr = (reps[s.id] || []).sort((a, b) => a.n - b.n).map(({ n, ...x }) => x);
      if (rr.length > out[s.id].houseSeats.v) throw new Error(`${s.name}: more representatives than seats`);
      set(s, "representatives", rr);
    }
  }

  // ── Governors (Wikidata) ─────────────────────────────────────────────────
  {
    const q = `SELECT ?stateLabel ?govLabel ?start (GROUP_CONCAT(DISTINCT ?partyLabel;separator="|") AS ?parties) WHERE {
      ?state wdt:P31 wd:Q35657 ; wdt:P1313 ?office .
      ?gov p:P39 ?st . ?st ps:P39 ?office ; pq:P580 ?start .
      FILTER NOT EXISTS { ?st pq:P582 ?end }
      FILTER NOT EXISTS { ?gov wdt:P570 ?died }
      FILTER(YEAR(?start) >= 2010)
      OPTIONAL { ?gov p:P102 ?ps . ?ps ps:P102 ?party . FILTER NOT EXISTS { ?ps pq:P582 ?pend }
                 ?party rdfs:label ?partyLabel . FILTER(LANG(?partyLabel) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } GROUP BY ?stateLabel ?govLabel ?start`;
    const t = await text(`${U.wikidata}?query=${encodeURIComponent(q)}`, "governors.csv", { headers: { Accept: "text/csv" } });
    const rows = csv(t).slice(1);
    const seen = {};
    for (const [st, gov, start, parties] of rows) {
      const s = byName.get(st);
      if (!s) continue;
      if (seen[s.id]) throw new Error(`${st}: more than one current governor on Wikidata (${seen[s.id]}, ${gov})`);
      seen[s.id] = gov;
      const party = /Republican/.test(parties) ? "Republican" : /Democratic/.test(parties) ? "Democrat" : "Independent";
      set(s, "governor", { name: gov, party, since: start.slice(0, 10) });
    }
    need("governor");
  }

  // ── Write ────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const body = states
    .map((s) => `  ${s.id}: ${JSON.stringify(out[s.id]).replace(/"(\w+)":/g, "$1:")},`)
    .join("\n");
  fs.writeFileSync(
    OUT,
    `/**
 * Figures per US state, each with the year or date it is for.
 *
 * GENERATED by build-states.cjs on ${today} — do not edit by hand; change the
 * script and re-run it. See that script for every source.
 */
export const STATE_SOURCES = {
  population: { label: "US Census Bureau — Vintage 2025 population estimates", url: "https://www.census.gov/programs-surveys/popest.html" },
  acs: { label: "US Census Bureau — American Community Survey 2024, 1-year", url: "https://www.census.gov/programs-surveys/acs" },
  bea: { label: "US BEA — regional GDP and personal income", url: "https://apps.bea.gov/regional/downloadzip.htm" },
  bls: { label: "US BLS — Local Area Unemployment Statistics", url: "https://www.bls.gov/lau/" },
  bjs: { label: "US BJS — Prisoners in 2023, table 7", url: "https://bjs.ojp.gov/library/publications/prisoners-2023-statistical-tables" },
  fec: { label: "FEC — Official 2024 Presidential General Election Results", url: "https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/" },
  eia: { label: "US EIA — electricity generation by state", url: "https://www.eia.gov/electricity/data/state/" },
  dol: { label: "US Department of Labor — state minimum wage laws", url: "${U.dol}" },
  taxIncome: { label: "Tax Foundation — 2026 state income tax rates", url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/" },
  taxSales: { label: "Tax Foundation — 2026 sales tax rates", url: "https://taxfoundation.org/data/all/state/sales-tax-rates/" },
  congress: { label: "congress-legislators (current members)", url: "https://github.com/unitedstates/congress-legislators" },
  apportionment: { label: "US Census Bureau — 2020 apportionment", url: "https://www.census.gov/data/tables/2020/dec/2020-apportionment-data.html" },
  governors: { label: "Wikidata — current governors", url: "https://www.wikidata.org/" },
  retrieved: "${today}",
};

type Fig = { v: number; y: string; prelim?: boolean; note?: string };

export interface StateIndicators {
  population: Fig;
  gdp: Fig;
  averageIncome: Fig;
  medianIncome: Fig;
  medianAge: Fig;
  unemploymentRate: Fig;
  incarcerationRate: Fig;
  minimumWage: Fig;
  stateTaxRate: Fig;
  salesTaxRate: Fig;
  houseSeats: Fig;
  ethnicity: { y: string; groups: { group: string; pct: number }[] };
  ageGroups: { y: string; groups: { group: string; pct: number }[] };
  poverty: { y: string; groups: { label: string; pct: number }[] };
  voterShare: { y: string; groups: { party: string; pct: number }[] };
  energyMix: { y: string; groups: { source: string; pct: number }[] };
  senators: { name: string; party: "Democrat" | "Republican" | "Independent"; termEnd: number }[];
  representatives: { name: string; party: "Democrat" | "Republican" | "Independent"; district: string }[];
  governor: { name: string; party: "Democrat" | "Republican" | "Independent"; since: string };
  housing: { y: string; medianHomeValue: number; medianRent: number; homeOwnershipPct: number; vacancyPct: number; rentBurdenPct: number };
  commute: { y: string; carTruckVanPct: number; transitPct: number; walkBikePct: number; workFromHomePct: number; meanCommuteMin: number; householdsWithVehiclePct: number };
  education: { y: string; highSchoolOrHigherPct: number; bachelorsOrHigherPct: number };
}

export const STATE_INDICATORS: Record<string, StateIndicators> = {
${body}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  const al = out.al, ca = out.ca;
  console.log("  AL:", JSON.stringify({ pop: al.population, gdp: al.gdp, pci: al.averageIncome, inc: al.medianIncome, unemp: al.unemploymentRate, prison: al.incarcerationRate, mw: al.minimumWage, tax: al.stateTaxRate, sales: al.salesTaxRate, gov: al.governor, seats: al.houseSeats.v, reps: al.representatives.length }));
  console.log("  CA:", JSON.stringify({ mw: ca.minimumWage, tax: ca.stateTaxRate, sales: ca.salesTaxRate, energy: ca.energyMix, vote: ca.voterShare }));
  const vac = states.filter((s) => out[s.id].representatives.length < out[s.id].houseSeats.v).map((s) => `${s.abbreviation} ${out[s.id].representatives.length}/${out[s.id].houseSeats.v}`);
  console.log("  House seats currently vacant: " + (vac.join(", ") || "none"));
})().catch((e) => { console.error(e); process.exit(1); });
