/**
 * Builds src/data/flagColors.ts — one colour for each country, read off its
 * flag, for the bars on the country cards.
 *
 * Every card's bar was the site's one accent. A country's colour is its
 * flag's: this reads the flag image the cards already show (flagcdn.com, the
 * 80-pixel PNG), counts its pixels by colour, and keeps the most widespread
 * colour that is a colour - not white, black or grey. A flag with no such
 * colour has no entry, and its bar keeps the accent.
 *
 * The rule, so it can be checked: pixels are grouped to the nearest of 32
 * levels a channel, which folds the blended pixels at an edge into the field
 * beside them; a group counts as a colour when its saturation is at least 0.25
 * and its brightness at least 0.2; the largest such group wins, and the colour
 * written is the average of the pixels in it.
 *
 * The PNGs are decoded here - they are small palette images - so the script
 * needs nothing installed.
 *
 *   node build-flag-colors.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/flagColors.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-flag-colors");
fs.mkdirSync(CACHE, { recursive: true });

/** A PNG's pixels as [r, g, b, a] rows: 8-bit palette, grey, RGB or RGBA, with or without alpha, not interlaced. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let at = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0, palette = null, alpha = null;
  const data = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), kind = buf.toString("latin1", at + 4, at + 8), body = buf.subarray(at + 8, at + 8 + len);
    if (kind === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      interlace = body[12];
    } else if (kind === "PLTE") palette = body;
    else if (kind === "tRNS") alpha = body;
    else if (kind === "IDAT") data.push(body);
    at += 12 + len;
  }
  if (interlace) throw new Error("interlaced");
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels || (depth !== 8 && type !== 3 && type !== 0)) throw new Error(`colour type ${type}, depth ${depth}`);
  const bpp = Math.max(1, (channels * depth) >> 3);
  const stride = Math.ceil((width * channels * depth) / 8);
  const raw = zlib.inflateSync(Buffer.concat(data));
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let p = 0;
      if (f === 1) p = a;
      else if (f === 2) p = b;
      else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = (v + p) & 255;
    }
  }
  const px = [];
  const sample = (row, i) => {
    // The i-th sample of a row, at the image's bit depth.
    if (depth === 8) return out[row * stride + i];
    const bit = i * depth;
    return (out[row * stride + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (type === 3) {
        const i = sample(y, x);
        px.push([palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2], alpha && i < alpha.length ? alpha[i] : 255]);
      } else if (type === 0) {
        const g = Math.round((sample(y, x) * 255) / ((1 << depth) - 1));
        px.push([g, g, g, 255]);
      } else {
        const o = y * stride + x * channels;
        if (type === 4) px.push([out[o], out[o], out[o], out[o + 1]]);
        else px.push([out[o], out[o + 1], out[o + 2], type === 6 ? out[o + 3] : 255]);
      }
    }
  return px;
}

const hsv = ([r, g, b]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return { s: max === 0 ? 0 : (max - min) / max, v: max / 255 };
};
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** The flag's most widespread colour that is not white, black or grey, or null. */
function flagColor(px) {
  const groups = new Map();
  let seen = 0;
  for (const [r, g, b, a] of px) {
    if (a < 128) continue;
    seen++;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const e = groups.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    groups.set(key, e);
  }
  const best = [...groups.values()]
    .map((e) => ({ n: e.n, c: [e.r / e.n, e.g / e.n, e.b / e.n] }))
    .filter((e) => {
      const { s, v } = hsv(e.c);
      return s >= 0.25 && v >= 0.2;
    })
    .sort((a, b) => b.n - a.n)[0];
  // A colour on a sliver of the flag - a small emblem on a white field - is not the flag's colour.
  return best && best.n / seen >= 0.04 ? hex(best.c) : null;
}

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const countries = loadCountries();
  const out = {};
  const none = [];
  for (const c of countries) {
    const code = c.code.toLowerCase();
    const at = path.join(CACHE, `${code}.png`);
    if (!fs.existsSync(at)) {
      const res = await fetch(`https://flagcdn.com/w80/${code}.png`, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        none.push(`${c.name} (no flag image)`);
        continue;
      }
      fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
    }
    let colour = null;
    try {
      colour = flagColor(decodePng(fs.readFileSync(at)));
    } catch (e) {
      none.push(`${c.name} (${e.message})`);
      continue;
    }
    if (colour) out[c.code] = colour;
    else none.push(c.name);
  }
  const n = Object.keys(out).length;
  if (n < countries.length * 0.9) throw new Error(`only ${n} of ${countries.length} flags gave a colour`);
  // Flags whose colour is not in doubt: a wrong decoder would not get these.
  const near = (a, b) => [1, 3, 5].every((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) < 40);
  for (const [code, want] of [["JP", "#bc002d"], ["CN", "#ee1c25"], ["IE", "#169b62"], ["UA", "#0057b7"], ["SE", "#006aa7"]]) {
    if (!out[code] || !near(out[code], want)) console.log(`  check ${code}: read ${out[code]}, its flag's is about ${want}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * One colour for each country, read off its flag: the most widespread colour
 * in the flag image that is not white, black or grey.
 *
 * GENERATED by build-flag-colors.cjs on ${today} — do not edit by hand; change
 * the script and re-run it. The script states the rule. A flag with no such
 * colour has no entry.
 */
export const FLAG_COLORS_SOURCE = { label: "Flag images: flagcdn.com", url: "https://flagcdn.com/", retrieved: "${today}" };

/** Keyed by ISO 3166-1 alpha-2 code. */
export const FLAG_COLOR: Record<string, string> = {
${Object.entries(out).map(([code, c]) => `  ${code}: "${c}",`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${n} of ${countries.length} countries`);
  console.log(`  none for: ${none.join(", ") || "-"}`);
  for (const code of ["US", "GB", "FR", "DE", "JP", "CN", "IN", "BR", "ZA", "CA", "AU", "NG", "SA", "IT"]) process.stdout.write(`${code} ${out[code]}  `);
  console.log();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
