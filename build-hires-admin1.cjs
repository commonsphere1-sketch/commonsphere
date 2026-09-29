/**
 * Sharper outlines for the smallest places on the country map.
 *
 * The focus map fits one place to a 960×560 canvas. Natural Earth 1:10m is
 * accurate to roughly a kilometre, which is invisible for a country and
 * obvious for a place a few kilometres across: fitted to the frame, the
 * British Virgin Islands came out as six straight-edged blocks, and a single
 * atoll as a smooth blob.
 *
 * For every place whose main landmass spans under MAX_SPAN_DEG, this replaces
 * static/geo/admin1/<code>.json with geoBoundaries (Runfola et al., 2020):
 * its whole-territory outline (ADM0) where Natural Earth records a single
 * division, its first-order divisions (ADM1) where it records several and
 * geoBoundaries publishes them (the whole outline otherwise). They are traced
 * from 10 m Sentinel-2 land cover, OpenStreetMap or national mapping.
 *
 * Each replacement is checked against two independent land areas - Natural
 * Earth's and the site's own areaKm2 - and refused if it is far larger
 * than both or far smaller than either. The first run needed it: the
 * Maldives, Marshall Islands and Palau files trace administrative lines
 * round whole atolls, sea and all (the Maldives at 30,328 km² against 298),
 * and the US Virgin Islands one is missing St Thomas and St John. A place
 * refused, or not in geoBoundaries, keeps Natural Earth.
 *
 * Each file is simplified to half a pixel at the size the map draws it -
 * on the topology, so neighbouring divisions still meet - and rewound so
 * every ring runs the way d3 expects. Sources and licences are written to
 * src/data/admin1Sources.ts for the page to credit, and the codes to
 * static/geo/admin1/hires.json so build-admin1.cjs leaves them alone.
 *
 *   node build-admin1.cjs        (Natural Earth, everything else)
 *   node build-hires-admin1.cjs  (then this)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { topology } = require("topojson-server");
const {
  presimplify,
  simplify,
  planarTriangleArea,
  planarRingArea,
  filter,
  filterWeight,
} = require("topojson-simplify");
const { quantize, feature, merge } = require("topojson-client");
const RAW_NE = path.join(__dirname, "admin1-10m-raw.geojson");

const OUT = path.join(__dirname, "static/geo/admin1");
const SOURCES_TS = path.join(__dirname, "src/data/admin1Sources.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-hires-admin1");
fs.mkdirSync(CACHE, { recursive: true });
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";

/** Below this span, in degrees, 1:10m detail shows at full frame. */
const MAX_SPAN_DEG = 1.0;
/** The drawn width of the focus map, in canvas units. */
const CANVAS = 900;

/**
 * Places whose Natural Earth divisions leave out land the place has, taken
 * from geoBoundaries instead whatever their span. Found by comparing the
 * land each file draws with the area the site lists for the place.
 *
 * Åland: Natural Earth has 11 of its 16 municipalities - Finström, Geta,
 * Hammarland, Saltvik and Sund, most of the main island, are not in it.
 * geoBoundaries has no Åland file of its own; Finland's municipalities
 * (ADM3) include all sixteen, traced to the shore. With `names`, every one
 * must be found, or the place keeps Natural Earth.
 *
 * Cyprus and Somalia: Natural Earth draws Northern Cyprus and Somaliland as
 * places of their own, so the Cyprus map stopped at the Green Line and the
 * Somalia map at Somaliland. The site lists both at their full, recognised
 * extent (9,251 km² and 637,657 km²), and geoBoundaries' districts and
 * regions cover it (8,983 km² without the British base areas; 638,082 km²).
 */
/**
 * Division names a geoBoundaries file carries cut short or mis-encoded.
 * The Seychelles' were cut to ten characters ("Outer Isla", "Mont Buxto")
 * and two read as UTF-8 taken for Latin-1 ("La RiviÃ¨re"); the full names
 * are the districts' own. Its two Grand'Anses are told apart by where they
 * lie: "Grand Anse" is the one on Praslin, "Grand'Anse" the one on Mahé.
 * A name the file no longer carries is reported at the end of the run.
 */
const GB_NAMES = {
  SC: {
    "Anse Aux P": "Anse aux Pins",
    "Anse Boile": "Anse Boileau",
    "Anse Etoil": "Anse Etoile",
    "Anse Royal": "Anse Royale",
    "Baie Lazar": "Baie Lazare",
    "Baie Saint": "Baie Sainte Anne",
    "Beau Vallo": "Beau Vallon",
    "Grand Anse": "Grand'Anse Praslin",
    "Grand'Anse": "Grand'Anse Mahé",
    "La Digue a": "La Digue and Inner Islands",
    "La RiviÃ¨re": "La Rivière Anglaise",
    "Les Mamell": "Les Mamelles",
    "Mont Buxto": "Mont Buxton",
    "Mont Fleur": "Mont Fleuri",
    "Outer Isla": "Outer Islands",
    "Pointe La": "Pointe La Rue",
    "Roche CaÃ¯m": "Roche Caïman",
    "Saint Loui": "Saint Louis",
  },
};
const namesUsed = new Set();
function fixName(code, name) {
  const fixed = GB_NAMES[code]?.[name];
  if (fixed) namesUsed.add(`${code}:${name}`);
  return fixed ?? name;
}

const SUBSETS = {
  AX: {
    iso3: "FIN",
    level: "ADM3",
    names: [
      "Brändö", "Eckerö", "Finström", "Föglö", "Geta", "Hammarland", "Jomala", "Kumlinge",
      "Kökar", "Lemland", "Lumparland", "Mariehamn", "Saltvik", "Sottunga", "Sund", "Vårdö",
    ],
  },
  CY: { iso3: "CYP", level: "ADM1" },
  SO: { iso3: "SOM", level: "ADM1" },
};

/**
 * Island places that geoBoundaries does not publish (or publishes wrongly)
 * and Natural Earth draws with a few dozen points - the Minor Outlying
 * Islands came out as rectangles and wedges. Built instead from the
 * coastline mapped in OpenStreetMap (ODbL), fetched from the Overpass API
 * one island group at a time: every closed coastline ring whose centre falls
 * in the box is land. `split` cuts a shared island along a place's own
 * OpenStreetMap boundary (Saint Martin and Sint Maarten).
 *
 * Each group is one feature, named `n`, unless it has `divide`. Its land is
 * in `bbox`, or in any of `boxes`; `from` is a larger box fetched once for
 * several groups (the Cook Islands), each then taking the rings in its own.
 *
 * `divide` cuts the land along OpenStreetMap's own first-order divisions -
 * the boundary relations whose ISO 3166-2 code matches - one feature each,
 * named as OpenStreetMap names it in English. Those boundaries mostly run
 * through the sea round each atoll, so an island is in one; one they cut
 * (Babeldaob, in ten Palauan states) is split between them, and any sliver
 * their lines leave goes to the piece it touches. Land within NEAR_KM of a
 * division and in none goes to that division; land further than that from
 * every one - Kosrae, in the box fetched for the Marshall Islands - is not
 * the place's, and is left out and logged.
 *
 * `open` is for land joined to a mainland (Macau), whose coastline never
 * closes inside the box: where it leaves the box, the box's own edge closes
 * it, with the land kept on the coastline's left as OpenStreetMap draws it.
 *
 * `water` takes out the lakes and lagoons OpenStreetMap maps inside the
 * coastline rather than as sea (Kiribati's).
 *
 * Found wanting by checking each place's islands against where they are:
 * Kiribati's file had one of the eight Phoenix Islands and none of the
 * southern Line Islands, the Cook Islands' none of the northern group or
 * Palmerston, Tuvalu's no Niulakita, Micronesia's no Sorol, Gaferut, West
 * or East Fayu, Pikelot or Ant, the French Southern Lands' no Île de l'Est
 * (Crozet's second island, 130 km²), and Natural Earth's Palau drew Tobi
 * and Helen Reef as 28 km² against under one.
 */
const NEAR_KM = 25;
/** Places drawn as islands rather than divisions: named for the page. */
const ISLAND_PARTS = new Set(["HM", "CK"]);
const COASTS = {
  UM: [
    { n: "Baker Island", bbox: [0.18, -176.49, 0.21, -176.46] },
    { n: "Howland Island", bbox: [0.79, -176.63, 0.82, -176.61] },
    { n: "Jarvis Island", bbox: [-0.39, -160.03, -0.36, -159.98] },
    { n: "Johnston Atoll", bbox: [16.7, -169.56, 16.78, -169.49] },
    { n: "Kingman Reef", bbox: [6.37, -162.46, 6.44, -162.33] },
    { n: "Midway Atoll", bbox: [28.18, -177.43, 28.29, -177.3] },
    { n: "Navassa Island", bbox: [18.38, -75.04, 18.42, -74.99] },
    { n: "Palmyra Atoll", bbox: [5.86, -162.14, 5.9, -162.0] },
    { n: "Wake Island", bbox: [19.27, 166.59, 19.32, 166.66] },
  ],
  JE: [{ n: "Jersey", bbox: [49.15, -2.27, 49.27, -2.0] }],
  PM: [
    // Saint-Pierre with Grand Colombier and Île aux Marins; Langlade reaches
    // south to 46.75, and the box stops short of Saint-Pierre's centre.
    { n: "Saint-Pierre", bbox: [46.74, -56.25, 46.83, -56.13] },
    { n: "Miquelon-Langlade", bbox: [46.73, -56.45, 47.15, -56.215] },
  ],
  NF: [{ n: "Norfolk Island", bbox: [-29.14, 167.9, -28.99, 168.0] }],
  CX: [{ n: "Christmas Island", bbox: [-10.58, 105.52, -10.4, 105.73] }],
  CC: [{ n: "Cocos (Keeling) Islands", bbox: [-12.22, 96.8, -11.8, 96.95] }],
  BV: [{ n: "Bouvet Island", bbox: [-54.47, 3.28, -54.38, 3.45] }],
  HM: [
    { n: "Heard Island", bbox: [-53.21, 73.2, -52.94, 73.85] },
    { n: "McDonald Islands", bbox: [-53.07, 72.55, -53.0, 72.65] },
  ],
  IO: [{ n: "Chagos Archipelago", bbox: [-7.5, 70.8, -4.9, 72.6] }],
  VI: [
    { n: "Saint Thomas", bbox: [18.28, -65.1, 18.41, -64.83] },
    { n: "Saint John", bbox: [18.3, -64.81, 18.37, -64.66] },
    { n: "Saint Croix", bbox: [17.66, -64.92, 17.8, -64.55] },
  ],
  MP: [
    { n: "Saipan", bbox: [15.09, 145.68, 15.3, 145.84] },
    { n: "Tinian", bbox: [14.84, 145.53, 15.08, 145.68] },
    { n: "Rota", bbox: [14.1, 145.1, 14.22, 145.3] },
    // West to 144.8 for Farallon de Pajaros, the northernmost, at 144.90°E.
    { n: "Northern Islands", bbox: [15.5, 144.8, 20.65, 146.1] },
  ],
  MF: [{ n: "Saint-Martin", bbox: [18.0, -63.16, 18.13, -62.96], split: "MF" }],
  SX: [{ n: "Sint Maarten", bbox: [18.0, -63.16, 18.13, -62.96], split: "SX" }],
  // Sonsorol and Hatohobei, the Southwest Islands, reach south to Helen Reef.
  PW: [{ n: "Palau", bbox: [2.5, 130.8, 8.35, 134.95], divide: "^PW-" }],
  WF: [
    {
      n: "Wallis and Futuna",
      boxes: [
        [-13.45, -176.3, -13.15, -176.05], // Wallis and the islets on its reef
        [-14.4, -178.25, -14.2, -177.95], // Futuna and Alofi
      ],
      divide: "^WF-",
    },
  ],
  // East of 180° throughout: Nukulaelae reaches 179.9°E, Niulakita (Niutao's) 10.8°S.
  TV: [{ n: "Tuvalu", bbox: [-11.0, 175.8, -5.3, 179.99], divide: "^TV-" }],
  // Municipalities, not the Ralik and Ratak chains they make up (MH-L, MH-T).
  MH: [{ n: "Marshall Islands", bbox: [4.2, 160.4, 15.1, 172.5], divide: "^MH-[A-Z]{3}$" }],
  FM: [{ n: "Micronesia", bbox: [0.9, 137.0, 10.35, 163.3], divide: "^FM-" }],
  MV: [{ n: "Maldives", bbox: [-0.75, 72.4, 7.2, 73.85], divide: "^MV-" }],
  SH: [
    {
      n: "Saint Helena, Ascension and Tristan da Cunha",
      boxes: [
        [-16.05, -5.85, -15.88, -5.6], // Saint Helena
        [-8.02, -14.45, -7.86, -14.2], // Ascension
        [-37.5, -12.8, -36.95, -12.15], // Tristan, Inaccessible, Nightingale
        [-40.45, -10.05, -40.2, -9.8], // Gough
      ],
      divide: "^SH-(AC|HL|TA)$",
    },
  ],
  // The three island groups, each from its own boxes: Palmyra, Kingman Reef
  // and Jarvis, American, lie between the northern and southern Line Islands.
  // `water`: Kiritimati's lagoon and salt ponds and Onotoa's lagoon are
  // mapped as water inside the coastline, and drew as 548 and 100 km² of
  // solid land (Kiritimati has 388 km² of land, Onotoa about 16).
  KI: [
    { n: "Gilbert Islands", bbox: [-3.0, 169.0, 3.7, 177.3], water: true },
    { n: "Phoenix Islands", bbox: [-5.0, -174.8, -2.5, -170.4], water: true },
    { n: "Line Islands", boxes: [[1.5, -160.7, 5.0, -157.0], [-11.7, -156.3, -3.8, -149.9]], water: true },
  ],
  // Fifteen islands; one box covers them and no one else's land.
  CK: [
    ["Rarotonga", [-21.32, -159.9, -21.15, -159.65]],
    ["Mangaia", [-22.02, -158.02, -21.84, -157.82]],
    ["Atiu", [-20.07, -158.2, -19.92, -158.03]],
    ["Takutea", [-19.86, -158.34, -19.76, -158.24]],
    ["Mitiaro", [-19.94, -157.78, -19.8, -157.64]],
    ["Mauke", [-20.22, -157.4, -20.1, -157.28]],
    ["Manuae", [-19.34, -159.04, -19.18, -158.86]],
    ["Aitutaki", [-19.02, -159.9, -18.75, -159.65]],
    ["Palmerston", [-18.14, -163.26, -17.96, -163.07]],
    ["Suwarrow", [-13.38, -163.22, -13.18, -162.98]],
    ["Nassau", [-11.61, -165.47, -11.52, -165.37]],
    ["Pukapuka", [-10.96, -165.97, -10.8, -165.76]],
    ["Rakahanga", [-10.08, -161.14, -9.97, -161.04]],
    ["Manihiki", [-10.5, -161.1, -10.33, -160.9]],
    ["Penrhyn", [-9.12, -158.12, -8.88, -157.85]],
  ].map(([n, bbox]) => ({ n, bbox, from: [-22.1, -166.0, -8.8, -157.2] })),
  // The three atolls; Swains Island, which Tokelau claims, is American Samoa's.
  TK: [
    ["Atafu", [-8.7, -172.6, -8.45, -172.4]],
    ["Nukunonu", [-9.3, -172.0, -9.05, -171.7]],
    ["Fakaofo", [-9.5, -171.35, -9.3, -171.1]],
  ].map(([n, bbox]) => ({ n, bbox, from: [-9.55, -172.65, -8.4, -171.05] })),
  // The five administrative subdivisions.
  PF: [
    { n: "Îles du Vent", bbox: [-18.0, -150.9, -16.9, -147.9] },
    { n: "Îles Sous-le-Vent", bbox: [-17.0, -154.9, -15.7, -150.9] },
    { n: "Îles Marquises", bbox: [-10.7, -141.0, -7.75, -138.3] },
    { n: "Îles Australes", bbox: [-28.2, -155.0, -21.0, -143.2] },
    { n: "Îles Tuamotu-Gambier", boxes: [[-16.9, -149.0, -14.0, -134.0], [-23.5, -147.9, -16.9, -134.0]] },
  ],
  // The four districts Natural Earth draws; Adélie Land is in Antarctica.
  TF: [
    { n: "Archipel des Kerguelen", bbox: [-50.1, 68.3, -48.4, 70.7] },
    { n: "Archipel des Crozet", bbox: [-46.6, 50.0, -45.85, 52.4] },
    { n: "Îles Saint-Paul et Nouvelle-Amsterdam", bbox: [-38.8, 77.4, -37.75, 77.7] },
    {
      n: "Îles Éparses de l'océan Indien",
      boxes: [
        [-22.45, 40.3, -22.3, 40.45], // Europa
        [-21.6, 39.6, -21.4, 39.8], // Bassas da India
        [-17.12, 42.68, -17.0, 42.8], // Juan de Nova
        [-11.65, 47.25, -11.45, 47.45], // Glorioso Islands
        [-15.95, 54.48, -15.85, 54.56], // Tromelin
      ],
    },
  ],
  // South to Beauchene Island (52.9°S), west to the Jasons.
  FK: [{ n: "Falkland Islands", bbox: [-53.0, -61.6, -50.85, -57.5] }],
  // Mona and Desecheo to Culebrita; Savana Island, the USVI's, is east of it.
  PR: [{ n: "Puerto Rico", bbox: [17.8, -68.0, 18.6, -65.15] }],
  MO: [{ n: "Macau", bbox: [22.06, 113.5, 22.235, 113.65], split: "MO", open: true }],
};

/**
 * Natural Earth places kept, with an island or two redrawn from the
 * OpenStreetMap coastline: Natural Earth draws Isla de Aves and Malpelo as
 * 0.7 and 7.7 km² (they are a few hundredths and 1.2), and has no Isla
 * Fuerte. `n` replaces the division of that name; `into` adds the land to
 * the named division.
 */
const PATCHES = {
  VE: [
    { n: "Isla de Aves", bbox: [15.64, -63.65, 15.7, -63.59] },
    // Natural Earth has Aves de Sotavento, not its twin 25 km east.
    { n: "Aves de Barlovento", into: "Dependencias Federales", bbox: [11.9, -67.5, 12.0, -67.38] },
  ],
  CO: [
    { n: "Malpelo Island", bbox: [3.94, -81.63, 4.03, -81.56] },
    { n: "Isla Fuerte", into: "Bolívar", bbox: [9.35, -76.21, 9.42, -76.14] },
  ],
};

/* Public Overpass servers, tried in turn: the main one answers 504, or not
   at all, when it is busy. */
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** Codes the World Bank country list does not carry. */
const EXTRA_ISO3 = {
  TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU", JE: "JEY", GG: "GGY", VA: "VAT", XK: "XKX", PS: "PSE",
  AI: "AIA", MS: "MSR", FK: "FLK", SH: "SHN", PN: "PCN", TK: "TKL", WF: "WLF", PM: "SPM", BL: "BLM",
  BQ: "BES", AX: "ALA", SJ: "SJM", NF: "NFK", CX: "CXR", CC: "CCK", GF: "GUF", GP: "GLP", MQ: "MTQ",
  RE: "REU", YT: "MYT", AQ: "ATA", BV: "BVT", HM: "HMD", GS: "SGS", TF: "ATF", IO: "IOT", UM: "UMI",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** What the map caption shows: the source and licence in a few words. */
function shortSource(src, year) {
  if (/sentinel-?2/i.test(src)) return `Sentinel-2 10 m land cover${year ? ", " + year : ""}`;
  if (/openstreetmap/i.test(src)) return "OpenStreetMap";
  // geoBoundaries lists its sources comma-separated, sometimes with URL
  // fragments and repeats ("Digitizedhttps, Digitizedhttps"): keep the names.
  const names = [
    ...new Set(
      src
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x && !/https?|www\./i.test(x)),
    ),
  ];
  const text = names.join(", ") || "geoBoundaries";
  return text.length > 60 ? text.slice(0, 57).trimEnd() + "…" : text;
}
function shortLicense(l, src) {
  const cc = /\((CC[^)]*)\)/.exec(l);
  if (cc) return cc[1].trim();
  // OpenStreetMap's attribution is owed only where the data came from it.
  if (/Open Database License/i.test(l))
    return /openstreetmap/i.test(src) ? "ODbL 1.0 (© OpenStreetMap contributors)" : "ODbL 1.0";
  const sa = /Attribution-ShareAlike ([\d.]+)/i.exec(l);
  if (sa) return `CC BY-SA ${sa[1]}`;
  const by = /Attribution ([\d.]+)/i.exec(l);
  if (by) return `CC BY ${by[1]}`;
  return l;
}

async function getText(url, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      if (attempt === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(3000 * (attempt + 1));
    }
  }
}

async function gbMeta(iso3, level) {
  const text = await getText(`https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${level}/`, `meta-${iso3}-${level}.json`);
  if (!text || text.trimStart().startsWith("<")) return null;
  return JSON.parse(text);
}

/** An Overpass query, cached like the rest; POSTed, as the API asks. */
async function overpass(query, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(OVERPASS[attempt % OVERPASS.length], {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      });
      const text = await res.text();
      if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(at, text);
      await sleep(1500); // one request at a time, gently
      return JSON.parse(text);
    } catch (e) {
      if (attempt === 7) throw new Error(`overpass ${cacheName}: ${e.message}`);
      await sleep(4000 * (attempt + 1));
    }
  }
}

/** Ways (with node ids and geometry) joined end to end into closed rings. */
function closedRings(ways) {
  const pending = ways.map((w) => ({ nodes: [...w.nodes], pts: w.geometry.map((g) => [g.lon, g.lat]) }));
  const rings = [];
  while (pending.length) {
    const cur = pending.pop();
    let guard = 0;
    while (cur.nodes[0] !== cur.nodes[cur.nodes.length - 1] && guard++ < 10000) {
      const last = cur.nodes[cur.nodes.length - 1];
      const i = pending.findIndex((w) => w.nodes[0] === last);
      if (i < 0) break; // runs out of the query: not a whole island
      const next = pending.splice(i, 1)[0];
      cur.nodes.push(...next.nodes.slice(1));
      cur.pts.push(...next.pts.slice(1));
    }
    if (cur.nodes[0] === cur.nodes[cur.nodes.length - 1] && cur.pts.length >= 4) rings.push(cur.pts);
  }
  return rings;
}

/** Twice the signed planar area: positive when a ring runs anticlockwise. */
const signedArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return a;
};
const inRing = ([x, y], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/**
 * Land inside a box, as polygons wound anticlockwise (the GeoJSON rule,
 * which polygon-clipping also uses). OpenStreetMap draws coastline with the
 * land on its left, so an island's ring runs anticlockwise and an enclosed
 * lagoon's clockwise; each lagoon becomes a hole in the island around it.
 */
function landIn(rings, [s, w, n, e]) {
  const outers = [], holes = [];
  for (const r of rings) {
    const cx = r.reduce((t, p) => t + p[0], 0) / r.length;
    const cy = r.reduce((t, p) => t + p[1], 0) / r.length;
    if (cx < w || cx > e || cy < s || cy > n) continue;
    (signedArea(r) > 0 ? outers : holes).push(r);
  }
  const polys = outers.map((o) => [o]);
  for (const h of holes) {
    const owner = polys.find((p) => inRing(h[0], p[0]));
    if (owner) owner.push(h);
  }
  return polys;
}

/** A place's own boundary from OpenStreetMap, as polygons, to cut by. */
async function boundaryOf(iso) {
  const j = await overpass(
    `[out:json][timeout:90];relation["boundary"="administrative"]["ISO3166-1"="${iso}"];out geom;`,
    `osm-boundary-${iso}.json`,
  );
  const rel = j.elements.find((e) => e.type === "relation");
  if (!rel) throw new Error(`no OpenStreetMap boundary for ${iso}`);
  return relationPolys(rel, iso);
}

/**
 * The first-order divisions OpenStreetMap maps for a place: every boundary
 * relation whose ISO 3166-2 code matches, as { n, polys, box }. Longitudes
 * are taken to within 180° of `lon0`, so a boundary drawn across 180° (Tuvalu's
 * Nukulaelae) stays one shape.
 */
async function divisionsOf(pattern, lon0) {
  const j = await overpass(
    `[out:json][timeout:180];relation["boundary"="administrative"]["ISO3166-2"~"${pattern}"];out geom;`,
    `osm-divisions-${pattern.replace(/[^A-Za-z]+/g, "_")}.json`,
  );
  const out = [];
  for (const rel of j.elements.filter((e) => e.type === "relation")) {
    let polys;
    try {
      polys = relationPolys(rel, rel.tags["ISO3166-2"], lon0);
    } catch (e) {
      console.log(`  ${e.message}; its land goes to its neighbours or is left out`);
      continue;
    }
    out.push({ n: rel.tags["name:en"] || rel.tags.name, code: rel.tags["ISO3166-2"], polys, box: boxOf(polys) });
  }
  if (!out.length) throw new Error(`no OpenStreetMap divisions match ${pattern}`);
  return out;
}

/** [west, south, east, north] round a set of polygons. */
function boxOf(polys) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const poly of polys)
    for (const [x, y] of poly[0]) {
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }
  return [w, s, e, n];
}
const boxesMeet = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

/** Kilometres from a point to the nearest edge of some polygons (flat, locally). */
function kmTo([px, py], polys) {
  const kx = 111.32 * Math.cos((py * Math.PI) / 180), ky = 110.57;
  let best = Infinity;
  for (const poly of polys)
    for (const ring of poly)
      for (let i = 1; i < ring.length; i++) {
        const ax = (ring[i - 1][0] - px) * kx, ay = (ring[i - 1][1] - py) * ky;
        const bx = (ring[i][0] - px) * kx, by = (ring[i][1] - py) * ky;
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
      }
  return best;
}
const ringCentre = (r) => [r.reduce((t, p) => t + p[0], 0) / r.length, r.reduce((t, p) => t + p[1], 0) / r.length];
/** Planar area of polygons in square degrees, holes taken off. */
const sqDeg = (polys) => polys.reduce((t, poly) => t + poly.reduce((u, r, i) => u + (i ? -1 : 1) * Math.abs(signedArea(r) / 2), 0), 0);

/** Land cut along divisions (see COASTS): { parts: Map(name → polygons), left: [where] }. */
function divideLand(polys, divisions) {
  const pc = require("polygon-clipping");
  const parts = new Map(divisions.map((d) => [d.n, []]));
  const left = [];
  for (const p of polys) {
    const box = boxOf([p]);
    const hits = [];
    for (const d of divisions) {
      if (!boxesMeet(box, d.box)) continue;
      const piece = pc.intersection([p], d.polys);
      if (piece.length) hits.push({ d, piece });
    }
    if (hits.length === 1) {
      parts.get(hits[0].d.n).push(p);
      continue;
    }
    if (!hits.length) {
      const c = ringCentre(p[0]);
      const near = divisions.map((d) => [kmTo(c, d.polys), d]).sort((a, b) => a[0] - b[0])[0];
      if (near && near[0] <= NEAR_KM) parts.get(near[1].n).push(p);
      else left.push(`${c[1].toFixed(3)},${c[0].toFixed(3)} (${(sqDeg([p]) * 12300).toFixed(2)} km²)`);
      continue;
    }
    let rest = [p];
    for (const h of hits) {
      parts.get(h.d.n).push(...h.piece);
      rest = pc.difference(rest, h.piece);
    }
    // Slivers between the divisions' lines go to the piece they touch.
    for (const r of rest) {
      const c = ringCentre(r[0]);
      const near = hits.map((h) => [kmTo(c, h.piece), h]).sort((a, b) => a[0] - b[0])[0];
      parts.get(near[1].d.n).push(r);
    }
  }
  for (const [n, list] of parts) parts.set(n, list.length > 1 ? pc.union(...list.map((x) => [x])) : list);
  return { parts, left };
}

/**
 * Land in a box where the coastline runs on out of it (see `open` in
 * COASTS). Each chain of coastline is clipped to the box; where it leaves,
 * the box's edge is followed anticlockwise - land on the left, as the
 * coastline has it - to where the next one enters.
 */
function landOpen(ways, [s, w, n, e]) {
  const pc = require("polygon-clipping");
  // Join ways end to end into chains, closed or not.
  const pending = ways.map((x) => ({ nodes: [...x.nodes], pts: x.geometry.map((g) => [g.lon, g.lat]) }));
  const chains = [];
  while (pending.length) {
    const cur = pending.pop();
    for (let joined = true; joined && cur.nodes[0] !== cur.nodes[cur.nodes.length - 1]; ) {
      joined = false;
      const after = pending.findIndex((x) => x.nodes[0] === cur.nodes[cur.nodes.length - 1]);
      if (after >= 0) {
        const next = pending.splice(after, 1)[0];
        cur.nodes.push(...next.nodes.slice(1));
        cur.pts.push(...next.pts.slice(1));
        joined = true;
        continue;
      }
      const before = pending.findIndex((x) => x.nodes[x.nodes.length - 1] === cur.nodes[0]);
      if (before >= 0) {
        const prev = pending.splice(before, 1)[0];
        cur.nodes.unshift(...prev.nodes.slice(0, -1));
        cur.pts.unshift(...prev.pts.slice(0, -1));
        joined = true;
      }
    }
    chains.push(cur);
  }
  const inside = ([x, y]) => x >= w && x <= e && y >= s && y <= n;
  // Position round the box's edge, anticlockwise from its south-west corner.
  const along = ([x, y]) => {
    const eps = 1e-12;
    if (Math.abs(y - s) < eps) return (x - w) / (e - w);
    if (Math.abs(x - e) < eps) return 1 + (y - s) / (n - s);
    if (Math.abs(y - n) < eps) return 2 + (e - x) / (e - w);
    return 3 + (n - y) / (n - s);
  };
  const corners = [[e, s], [e, n], [w, n], [w, s]];
  // Liang-Barsky: the part of a segment inside the box, or null.
  const clip = ([x0, y0], [x1, y1]) => {
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dy = y1 - y0;
    for (const [p, q] of [[-dx, x0 - w], [dx, e - x0], [-dy, y0 - s], [dy, n - y0]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [[x0 + t0 * dx, y0 + t0 * dy], [x0 + t1 * dx, y0 + t1 * dy], t0 > 0, t1 < 1];
  };
  const rings = [], pieces = [];
  for (const c of chains) {
    if (c.nodes[0] === c.nodes[c.nodes.length - 1]) {
      if (c.pts.length >= 4) rings.push(c.pts);
      continue;
    }
    if (inside(c.pts[0]) || inside(c.pts[c.pts.length - 1]))
      throw new Error(`coastline ends inside the box at ${inside(c.pts[0]) ? c.pts[0] : c.pts[c.pts.length - 1]}`);
    let cur = null;
    for (let i = 1; i < c.pts.length; i++) {
      const seg = clip(c.pts[i - 1], c.pts[i]);
      if (!seg) continue;
      const [a, b, enters, leaves] = seg;
      if (enters || !cur) cur = [a];
      cur.push(b);
      if (leaves) {
        pieces.push(cur);
        cur = null;
      }
    }
  }
  for (const piece of pieces) piece.t = [along(piece[0]), along(piece[piece.length - 1])];
  const used = new Set();
  for (const first of pieces) {
    if (used.has(first)) continue;
    const ring = [];
    let cur = first;
    for (let guard = 0; guard < 10000; guard++) {
      used.add(cur);
      ring.push(...cur);
      const tEnd = cur.t[1];
      // The next piece to enter, going anticlockwise round the edge.
      const gap = (p) => (p.t[0] - tEnd + 4) % 4;
      const next = pieces.filter((p) => p === first || !used.has(p)).sort((a, b) => gap(a) - gap(b))[0];
      for (let k = Math.floor(tEnd) + 1; k < tEnd + gap(next); k++) ring.push(corners[(k - 1) % 4]);
      if (next === first) break;
      cur = next;
    }
    ring.push(ring[0]);
    rings.push(ring);
  }
  const outers = rings.filter((r) => signedArea(r) > 0).map((r) => [r]);
  const holes = rings.filter((r) => signedArea(r) < 0).map((r) => [[...r].reverse()]);
  const land = outers.length ? pc.union(...outers) : [];
  return holes.length ? pc.difference(land, ...holes) : land;
}

/**
 * Outer rings of a boundary relation joined into polygons, wound
 * anticlockwise. With `lon0`, longitudes are first taken to within 180° of
 * it, so a ring drawn across 180° neither breaks nor winds the wrong way.
 */
function relationPolys(rel, iso, lon0) {
  const lon = lon0 === undefined ? (x) => x : (x) => x + 360 * Math.round((lon0 - x) / 360);
  // Member ways carry coordinates but not node ids, so they join on points.
  const pending = rel.members
    .filter((m) => m.type === "way" && m.role === "outer" && m.geometry)
    .map((m) => ({ pts: m.geometry.map((g) => [lon(g.lon), g.lat]) }));
  const key = (p) => `${p[1]},${p[0]}`;
  const rings = [];
  while (pending.length) {
    const cur = pending.pop();
    let guard = 0;
    while (key(cur.pts[0]) !== key(cur.pts[cur.pts.length - 1]) && guard++ < 10000) {
      const endKey = key(cur.pts[cur.pts.length - 1]);
      let i = pending.findIndex((w) => key(w.pts[0]) === endKey);
      if (i < 0) {
        i = pending.findIndex((w) => key(w.pts[w.pts.length - 1]) === endKey);
        if (i >= 0) pending[i].pts.reverse();
      }
      if (i < 0) break;
      cur.pts.push(...pending.splice(i, 1)[0].pts.slice(1));
    }
    if (key(cur.pts[0]) === key(cur.pts[cur.pts.length - 1])) rings.push(cur.pts);
  }
  if (!rings.length) throw new Error(`OpenStreetMap boundary for ${iso} does not close`);
  return rings.map((r) => [signedArea(r) > 0 ? r : [...r].reverse()]);
}

/** The coastline in a box, fetched once per run: { ways, rings, named, date }. */
const coastCache = new Map();
/** Islands named on the coastline each place was built from: [lon, lat, name, island?]. */
const coastNames = {
  byCode: new Map(),
  add(code, x) {
    if (!this.byCode.has(code)) this.byCode.set(code, []);
    this.byCode.get(code).push(x);
  },
};
async function coastIn(code, name, box) {
  const [s, w, n, e] = box;
  // The box is in the name, so changing it cannot reuse an older answer.
  const file = `osm-coast-${code}-${name.replace(/[^A-Za-z]+/g, "_")}-${box.join("_")}.json`;
  const key = box.join("_");
  if (!coastCache.has(key)) {
    const j = await overpass(`[out:json][timeout:180];way["natural"="coastline"](${s},${w},${n},${e});out geom;`, file);
    const ways = j.elements.filter((x) => x.type === "way" && x.geometry && x.nodes);
    // An island drawn as one closed way often carries its name on it (Niulakita).
    const named = ways
      .filter((x) => x.tags?.name && x.nodes[0] === x.nodes[x.nodes.length - 1])
      .map((x) => [...ringCentre(x.geometry.map((g) => [g.lon, g.lat])), x.tags["name:en"] || x.tags.name, x.tags.place === "island" ? 1 : 0]);
    coastCache.set(key, { ways, rings: closedRings(ways), named, date: (j.osm3s?.timestamp_osm_base || "").slice(0, 10) });
  }
  return coastCache.get(key);
}

/**
 * Water mapped inside a box - lakes, ponds, and lagoons OpenStreetMap
 * draws inside the coastline rather than as sea - as polygons to take out
 * of the land (`water` in COASTS).
 */
async function waterIn(code, name, [s, w, n, e]) {
  const j = await overpass(
    `[out:json][timeout:180];(way["natural"="water"](${s},${w},${n},${e});relation["natural"="water"](${s},${w},${n},${e}););out geom;`,
    `osm-water-${code}-${name.replace(/[^A-Za-z]+/g, "_")}-${[s, w, n, e].join("_")}.json`,
  );
  const out = [];
  for (const el of j.elements) {
    if (el.type === "way" && el.nodes?.length >= 4 && el.nodes[0] === el.nodes[el.nodes.length - 1]) {
      const r = el.geometry.map((g) => [g.lon, g.lat]);
      out.push([signedArea(r) > 0 ? r : [...r].reverse()]);
    } else if (el.type === "relation") {
      try {
        out.push(...relationPolys(el, `water ${el.id}`));
      } catch {
        // A lake relation that does not close is left as land, as before.
      }
    }
  }
  return out;
}

/**
 * Names for the islands of a division spread across open ocean. The page
 * gives such a division's outlying island groups insets of their own when
 * one inset would shrink them all below legibility - Tristan da Cunha's
 * Gough Island lies 400 km from Tristan, Niutao's Niulakita 530 km from
 * Niutao - and titles each after the island OpenStreetMap names there.
 * Each feature wider than ISLAND_SPREAD_DEG carries them as `i`:
 * [[lon, lat, name, 1 for an island or 0 for an islet]], from the named
 * islands within NAME_KM of its land - OpenStreetMap's place=island points,
 * and the names on the closed coastline ways the place was built from.
 */
const ISLAND_SPREAD_DEG = 0.75;
const NAME_KM = 30;
/** geoBoundaries island places with divisions spread that far. */
const NAMED_ISLANDS = new Set(["SC", "MU", "TO"]);
const polysIn = (g) => (g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : []);
async function nameIslands(code, features) {
  const spread = features
    .map((f) => ({ f, polys: polysIn(f.geometry) }))
    .filter(({ polys }) => {
      const [w, s, e, n] = boxOf(polys);
      return polys.length > 1 && Math.max(e - w, n - s) > ISLAND_SPREAD_DEG;
    });
  if (!spread.length) return;
  const boxes = spread.map(({ polys }) => {
    const [w, s, e, n] = boxOf(polys);
    return [s - 0.1, Math.max(-180, w - 0.1), n + 0.1, Math.min(180, e + 0.1)].map((v) => +v.toFixed(2));
  });
  const q = boxes
    .map((b) => ["node", "way", "relation"].map((t) => `${t}["place"="island"]["name"](${b.join(",")});`).join(""))
    .join("");
  const j = await overpass(`[out:json][timeout:180];(${q});out center tags;`, `osm-islands-${code}-${boxes.flat().join("_").slice(0, 150)}.json`);
  const points = [
    ...j.elements
      .map((el) => [el.type === "node" ? el : el.center, el.tags["name:en"] || el.tags.name])
      .filter(([at, name]) => at && name)
      .map(([at, name]) => [at.lon, at.lat, name, 1]),
    ...(coastNames.byCode.get(code) ?? []),
  ];
  for (const [x, y, name, island] of points) {
    const pt = [x, y];
    let best = NAME_KM, owner = null;
    for (const { f, polys } of spread)
      for (const poly of polys) {
        const [w, s, e, n] = boxOf([poly]);
        if (pt[0] < w - 0.3 || pt[0] > e + 0.3 || pt[1] < s - 0.3 || pt[1] > n + 0.3) continue;
        const km = inRing(pt, poly[0]) ? 0 : kmTo(pt, [poly]);
        if (km < best) [best, owner] = [km, f];
      }
    if (owner && !(owner.properties.i ??= []).some((x) => x[2] === name))
      owner.properties.i.push([+pt[0].toFixed(3), +pt[1].toFixed(3), name, island]);
  }
}

/** One feature per island group (or division), from OpenStreetMap coastline. */
async function coastFeatures(code) {
  const polygonClipping = require("polygon-clipping");
  const out = [];
  let osmDate = "";
  const taken = new Map(); // ring → the group that took it, so none is drawn twice
  const fetched = new Set();
  for (const g of COASTS[code]) {
    let polys = [];
    for (const box of g.boxes ?? [g.bbox]) {
      const c = await coastIn(code, g.from ? code : g.n, g.from ?? box);
      if (g.from) fetched.add(c);
      osmDate = osmDate || c.date;
      for (const x of c.named) coastNames.add(code, x);
      const land = g.open ? landOpen(c.ways, box) : landIn(c.rings, box);
      if (!g.open)
        for (const r of c.rings) {
          if (!land.some((p) => p[0] === r)) continue;
          if (taken.has(r)) throw new Error(`${code}: ${g.n} and ${taken.get(r)} both take the island at ${ringCentre(r)}`);
          taken.set(r, g.n);
        }
      if (!land.length) console.log(`  ${code}: no coastline in ${box.join(",")} for ${g.n}`);
      polys.push(...land);
    }
    if (g.split && polys.length) polys = polygonClipping.intersection(polys, await boundaryOf(g.split));
    if (g.water && polys.length) {
      const water = [];
      for (const box of g.boxes ?? [g.bbox]) water.push(...(await waterIn(code, g.n, box)));
      if (water.length) polys = polygonClipping.difference(polys, ...water);
    }
    if (!polys.length) {
      console.log(`  ${code}: no coastline found for ${g.n}; left out`);
      continue;
    }
    if (g.divide) {
      const box = g.bbox ?? g.boxes[0];
      const { parts, left } = divideLand(polys, await divisionsOf(g.divide, (box[1] + box[3]) / 2));
      if (left.length) console.log(`  ${code}: in no division, left out: ${left.join("; ")}`);
      for (const [n, p] of parts) {
        if (!p.length) console.log(`  ${code}: no land in ${n}`);
        else out.push({ type: "Feature", properties: { n }, geometry: { type: "MultiPolygon", coordinates: p } });
      }
      continue;
    }
    out.push({ type: "Feature", properties: { n: g.n }, geometry: { type: "MultiPolygon", coordinates: polys } });
  }
  // Land fetched for a set of groups that none of them took is named, so a
  // box drawn short is seen rather than silently dropping an island.
  for (const c of fetched)
    for (const r of c.rings)
      if (signedArea(r) > 0 && !taken.has(r)) {
        const [x, y] = ringCentre(r);
        console.log(`  ${code}: island at ${y.toFixed(3)},${x.toFixed(3)} (${(sqDeg([[r]]) * 12300).toFixed(3)} km²) is in no group`);
      }
  if (out.length) out[0].osmDate = osmDate;
  return out;
}

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
  const d3 = await import("d3-geo");
  const { geoArea, geoBounds } = d3;
  const polysOf = (g) =>
    g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : [];
  /** d3 reads a ring by its direction; one covering most of the globe is backwards. */
  const rewind = (g) => {
    for (const poly of polysOf(g))
      if (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI) for (const ring of poly) ring.reverse();
  };
  /** Span of the largest landmass: what the focus map is framed on. */
  const mainSpan = (g) => {
    const polys = polysOf(g).map((c) => ({ type: "Polygon", coordinates: c }));
    if (!polys.length) return Infinity;
    const big = polys.map((p) => [geoArea(p), p]).sort((a, b) => b[0] - a[0])[0][1];
    const [[x0, y0], [x1, y1]] = geoBounds(big);
    return Math.max((x1 < x0 ? x1 + 360 : x1) - x0, (y1 - y0) * 1.7);
  };

  const R = 6371.0088;
  /** Land area in km², whatever way each ring was wound. */
  const areaKm2 = (geoms) => {
    let sr = 0;
    for (const g of geoms)
      for (const poly of polysOf(g)) {
        const a = geoArea({ type: "Polygon", coordinates: poly });
        sr += a > 2 * Math.PI ? 4 * Math.PI - a : a;
      }
    return sr * R * R;
  };

  /* Targets and the area check are measured on Natural Earth's own source,
     not on whatever file is there now, so a re-run picks the same places. */
  if (!fs.existsSync(RAW_NE)) throw new Error("admin1-10m-raw.geojson is missing: see build-admin1.cjs");
  const neByCode = new Map();
  const { codesOf } = require("./admin1-carve.cjs");
  for (const f of JSON.parse(fs.readFileSync(RAW_NE, "utf8")).features) {
    for (const code of codesOf(f.properties)) {
      if (!neByCode.has(code)) neByCode.set(code, []);
      neByCode.get(code).push(f.geometry);
    }
  }
  const previous = new Set(
    fs.existsSync(path.join(OUT, "hires.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "hires.json"), "utf8")) : [],
  );
  const refused = [];

  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
  const wb = JSON.parse(
    (await getText("https://api.worldbank.org/v2/country?format=json&per_page=500", "wb-countries.json")) || "[]",
  )[1] || [];
  const iso3Of = new Map(wb.map((c) => [c.iso2Code, c.id]));
  for (const [k, v] of Object.entries(EXTRA_ISO3)) iso3Of.set(k, v);

  const countries = loadCountries().filter((c) => c.code !== "US" && manifest[c.code]);
  const sources = {};
  const done = [];
  const skipped = [];
  const fellBack = [];

  for (const c of countries) {
    const ne = neByCode.get(c.code);
    if (!ne) continue;
    const neGeoms = ne.map((g) => JSON.parse(JSON.stringify(g)));
    neGeoms.forEach(rewind);
    // The divisions merged into the place itself: its largest landmass, not
    // its largest division, is what the map is framed on.
    const neTopo = topology({
      a: { type: "FeatureCollection", features: neGeoms.map((geometry) => ({ type: "Feature", properties: {}, geometry })) },
    });
    const neMerged = merge(neTopo, neTopo.objects.a.geometries);
    rewind(neMerged);
    const subset = SUBSETS[c.code];
    const coast = COASTS[c.code];
    let span = mainSpan(neMerged);
    if (!subset && !coast && !(span < MAX_SPAN_DEG)) continue;
    const neArea = areaKm2(neGeoms);
    // From Natural Earth's source, not the manifest a previous run changed.
    const neDivisions = ne.length;
    const ref = Number.isFinite(c.areaKm2) && c.areaKm2 > 0 ? c.areaKm2 : neArea;
    const inRange = (km2) => km2 >= 0.75 * Math.min(neArea, ref) && km2 <= 1.5 * Math.max(neArea, ref);

    let level, meta, features;
    if (coast) {
      /* A server that will not answer leaves the place as it was, rather
         than stopping every other place's build. */
      try {
        features = await coastFeatures(c.code);
      } catch (e) {
        refused.push(`${c.name} (OpenStreetMap did not answer: ${e.message})`);
        continue;
      }
      for (const f of features) rewind(f.geometry);
      const km2 = areaKm2(features.map((f) => f.geometry));
      if (!features.length || !inRange(km2)) {
        refused.push(`${c.name} (coastline ${km2.toFixed(0)} km² against ${neArea.toFixed(0)} Natural Earth, ${ref} listed)`);
        continue;
      }
      const date = features[0].osmDate || "";
      for (const f of features) delete f.osmDate;
      level = "OSM";
      meta = {
        boundarySource: "OpenStreetMap coastline",
        boundaryLicense: "Open Data Commons Open Database License 1.0",
        boundaryYearRepresented: date,
      };
    } else {
      const iso3 = subset ? subset.iso3 : iso3Of.get(c.code);
      if (!iso3) { skipped.push(`${c.name} (no ISO3)`); continue; }

      level = subset ? subset.level : neDivisions > 1 ? "ADM1" : "ADM0";
      meta = await gbMeta(iso3, level);
      /* No divisions published: the whole-territory outline instead. For a
         place this small the coastline is what reads; Natural Earth's internal
         lines here are drawn to the same coarse 1:10m as its coast. */
      if (!meta && level === "ADM1") {
        level = "ADM0";
        meta = await gbMeta(iso3, level);
      }
      if (!meta) { skipped.push(c.name); continue; }

      const load = async (lvl, m) => {
        const gj = JSON.parse(await getText(m.gjDownloadURL, `${iso3}-${lvl}.geojson`));
        const fs2 = gj.features
          .filter((f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"))
          // A subset keeps only its own divisions out of the country's file.
          .filter((f) => !subset?.names || subset.names.includes(f.properties.shapeName))
          .map((f) => ({
            type: "Feature",
            properties: { n: lvl === "ADM0" ? c.name : fixName(c.code, f.properties.shapeName || "") },
            geometry: f.geometry,
          }));
        for (const f of fs2) rewind(f.geometry);
        const km2 = areaKm2(fs2.map((f) => f.geometry));
        const ok = inRange(km2);
        return { features: fs2, km2, ok };
      };
      let got = await load(level, meta);
      /* Divisions drawn round whole atolls, sea and all, fail the check; the
         whole-territory outline may still be traced from the land. */
      if (!got.ok && level === "ADM1") {
        const m0 = await gbMeta(iso3, "ADM0");
        if (m0) {
          const g0 = await load("ADM0", m0);
          if (g0.ok) { level = "ADM0"; meta = m0; got = g0; }
        }
      }
      if (!got.ok) {
        refused.push(`${c.name} (${got.km2.toFixed(0)} km² against ${neArea.toFixed(0)} Natural Earth, ${ref} listed)`);
        continue;
      }
      features = got.features;
      if (subset) {
        const found = new Set(features.map((f) => f.properties.n));
        const missing = (subset.names ?? []).filter((n) => !found.has(n));
        if (missing.length) {
          refused.push(`${c.name} (not in ${iso3} ${level}: ${missing.join(", ")})`);
          continue;
        }
      }

    }
    if (coast || NAMED_ISLANDS.has(c.code))
      try {
        await nameIslands(c.code, features);
      } catch (e) {
        console.log(`  ${c.code}: island names not fetched (${e.message}); insets keep the division's name`);
      }

    /* Natural Earth's span is of the land it has, which for these places is
       the wrong land. Frame on the new outline's own main landmass. */
    if (subset || coast) {
      const t = topology({ a: { type: "FeatureCollection", features: JSON.parse(JSON.stringify(features)) } });
      const m = merge(t, t.objects.a.geometries);
      rewind(m);
      span = mainSpan(m);
    }

    /* Across 180° (Kiribati), longitudes west of it are moved up by 360° so
       quantisation spans the place, not the globe: across the globe each
       step was about 400 m and Tarawa drew as a staircase. d3 reads 190° as
       -170°, so nothing downstream changes. */
    let lo = Infinity, hi = -Infinity, lo2 = Infinity, hi2 = -Infinity, east = false, west = false;
    for (const ft of features)
      for (const poly of polysOf(ft.geometry))
        for (const ring of poly)
          for (const [l] of ring) {
            const l2 = l < 0 ? l + 360 : l;
            if (l < lo) lo = l;
            if (l > hi) hi = l;
            if (l2 < lo2) lo2 = l2;
            if (l2 > hi2) hi2 = l2;
            if (l > 90) east = true;
            if (l < -90) west = true;
          }
    if (east && west && hi2 - lo2 < hi - lo)
      for (const ft of features) for (const poly of polysOf(ft.geometry)) for (const ring of poly) for (const pt of ring) if (pt[0] < 0) pt[0] += 360;

    // Half a pixel at the size the map draws the main landmass.
    const tol = Math.max(span, 0.02) / CANVAS / 2;
    let topo = topology({ a: { type: "FeatureCollection", features } });
    topo = presimplify(topo, planarTriangleArea);
    topo = simplify(topo, tol * tol);
    /* Islets smaller than about two pixels are dropped: simplifying can
       collapse one to a sliver wound the wrong way (Saint Helena's did), and
       at this size nothing that small can be drawn anyway. */
    topo = filter(topo, filterWeight(topo, (2 * tol) * (2 * tol), planarRingArea));
    /* Quantised no coarser than the simplification. Across a scatter of
       islands - the Minor Outlying Islands span 120° - 1e5 steps is about
       130 m, several pixels of an island a kilometre wide. */
    let qx0 = Infinity, qx1 = -Infinity, qy0 = Infinity, qy1 = -Infinity;
    for (const ft of features)
      for (const poly of polysOf(ft.geometry))
        for (const ring of poly)
          for (const [x, y] of ring) {
            if (x < qx0) qx0 = x;
            if (x > qx1) qx1 = x;
            if (y < qy0) qy0 = y;
            if (y > qy1) qy1 = y;
          }
    const steps = Math.min(1e7, Math.max(1e5, Math.ceil(Math.max(qx1 - qx0, qy1 - qy0) / tol)));
    topo = quantize(topo, steps);

    // The rewind has to survive simplification: check the result, and keep
    // Natural Earth rather than ship a ring that draws inside out.
    const check = feature(topo, topo.objects.a);
    const backwards = check.features.some((f) =>
      polysOf(f.geometry).some((poly) => geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI),
    );
    if (backwards) {
      refused.push(`${c.name} (a ring still backwards after simplifying)`);
      continue;
    }

    const json = JSON.stringify(topo);
    fs.writeFileSync(path.join(OUT, `${c.code}.json`), json);
    manifest[c.code] = features.length;
    const year = String(meta.boundaryYearRepresented || "");
    sources[c.code] = {
      level,
      source: meta.boundarySource || "",
      license: meta.boundaryLicense || "",
      year,
      sourceShort: shortSource(meta.boundarySource || "", year),
      licenseShort: shortLicense(meta.boundaryLicense || "", meta.boundarySource || ""),
      ...(ISLAND_PARTS.has(c.code) ? { parts: "islands" } : {}),
    };
    if (level === "ADM0" && neDivisions > 1) fellBack.push(c.name);
    done.push(`${c.code} ${level} ${features.length} feature(s), ${(json.length / 1024).toFixed(0)} KB — ${meta.boundaryLicense}`);
  }

  const stale = Object.entries(GB_NAMES)
    .flatMap(([code, m]) => Object.keys(m).map((n) => `${code}:${n}`))
    .filter((k) => !namesUsed.has(k));
  if (stale.length) refused.push(`names in GB_NAMES the files no longer carry: ${stale.join(", ")}`);

  /* Natural Earth kept, with islands redrawn from the coastline (PATCHES).
     Rebuilt from Natural Earth first, so a re-run patches a fresh file. */
  for (const [code, patches] of Object.entries(PATCHES)) {
    if (sources[code]) throw new Error(`${code} is in PATCHES and replaced as well`);
    execSync(`node build-admin1.cjs ${code}`, { cwd: __dirname, stdio: "inherit" });
    const t = JSON.parse(fs.readFileSync(path.join(OUT, `${code}.json`), "utf8"));
    const fc = feature(t, t.objects.a);
    let date = "";
    try {
      for (const p of patches) {
        const c = await coastIn(code, p.n, p.bbox);
        date = date || c.date;
        const land = { type: "MultiPolygon", coordinates: landIn(c.rings, p.bbox) };
        if (!land.coordinates.length) throw new Error(`no coastline for ${p.n}`);
        rewind(land);
        const target = fc.features.find((f) => f.properties.n === (p.into ?? p.n));
        if (!target) throw new Error(`no division named ${p.into ?? p.n}`);
        target.geometry = {
          type: "MultiPolygon",
          coordinates: p.into ? [...polysOf(target.geometry), ...land.coordinates] : land.coordinates,
        };
      }
    } catch (e) {
      refused.push(`${code} kept as Natural Earth drew it (${e.message})`);
      continue;
    }
    // Finer than build-admin1's 1e4 steps, which is 200 m across Colombia -
    // Malpelo, 1.6 km long, would be eight steps.
    const json = JSON.stringify(topology({ a: fc }, 1e5));
    fs.writeFileSync(path.join(OUT, `${code}.json`), json);
    manifest[code] = fc.features.length;
    sources[code] = {
      level: "NE",
      source: "Natural Earth; OpenStreetMap coastline",
      license: "Public domain (Natural Earth); Open Data Commons Open Database License 1.0 (OpenStreetMap)",
      year: date,
      sourceShort: "Natural Earth",
      licenseShort: "ODbL 1.0 (© OpenStreetMap contributors)",
      islands: patches.map((p) => p.n).join(", "),
    };
    done.push(`${code} Natural Earth with ${sources[code].islands} from OpenStreetMap, ${(json.length / 1024).toFixed(0)} KB`);
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(OUT, "hires.json"), JSON.stringify(Object.keys(sources).sort()));

  /* Anything replaced on an earlier run that is not replaced now goes back
     to Natural Earth, so no file is left from a source it no longer credits. */
  const restore = [...previous].filter((code) => !sources[code]);
  if (restore.length) {
    execSync(`node build-admin1.cjs ${restore.join(" ")}`, { cwd: __dirname, stdio: "inherit" });
    console.log(`restored Natural Earth for: ${restore.join(", ")}`);
  }
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    SOURCES_TS,
    `/**
 * Which focus-map outlines come from geoBoundaries or the OpenStreetMap
 * coastline rather than Natural Earth, and which Natural Earth ones have
 * islands redrawn from that coastline.
 *
 * GENERATED by build-hires-admin1.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * geoBoundaries (Runfola et al., 2020, "geoBoundaries: A global database of
 * political administrative boundaries", PLoS ONE 15(4)). Each entry keeps
 * the licence of its own source - CC BY 4.0 for the Sentinel-2 tracings, the
 * ODbL for OpenStreetMap, and CC BY-SA, CC BY, CC0 or public domain for
 * national mapping - and a share-alike file stays under its licence. The
 * page names the licence of the place in view.
 */
export const GEOBOUNDARIES_URL = "https://www.geoboundaries.org/";

export const ADMIN1_SOURCES: Record<
  string,
  {
    /**
     * ADM3 where the place is a subset of its country's file (see SUBSETS
     * in the script); OSM for the OpenStreetMap coastline (COASTS); NE for
     * Natural Earth with a few islands redrawn from it (PATCHES).
     */
    level: "ADM0" | "ADM1" | "ADM3" | "OSM" | "NE";
    source: string;
    license: string;
    year: string;
    /** As the map caption shows them. */
    sourceShort: string;
    licenseShort: string;
    /** Drawn as islands rather than divisions. */
    parts?: "islands";
    /** NE: the islands redrawn from OpenStreetMap. */
    islands?: string;
  }
> = ${JSON.stringify(sources, null, 2)};
`,
  );

  console.log(`replaced ${done.length} file(s) with geoBoundaries:`);
  for (const d of done) console.log("  " + d);
  if (fellBack.length) console.log(`outline only (geoBoundaries has no divisions): ${fellBack.join(", ")}`);
  if (skipped.length) console.log(`kept Natural Earth for ${skipped.length} (not in geoBoundaries): ${skipped.join(", ")}`);
  if (refused.length) console.log(`kept Natural Earth for ${refused.length} (area check failed): ${refused.join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
