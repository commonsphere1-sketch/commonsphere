/**
 * A very small xlsx reader: enough to pull one sheet out as rows of strings.
 *
 * Here because the UN's national accounts are published as xlsx and nothing
 * else in this repo needed a spreadsheet before. It handles what that file
 * uses - deflated zip entries, shared strings, inline strings and numbers -
 * and deliberately nothing else: no formulas, no dates, no styles. If a future
 * source needs more than this, reach for a library rather than growing it.
 */
const fs = require("fs");
const zlib = require("zlib");

function entries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip");
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  const out = new Map();
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    const lN = buf.readUInt16LE(localOff + 26);
    const lE = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lN + lE;
    const raw = buf.subarray(start, start + compSize);
    out.set(name, method === 8 ? zlib.inflateRawSync(raw) : raw);
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unesc = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
   .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
   .replace(/&amp;/g, "&");

function sharedStrings(xml) {
  if (!xml) return [];
  // Each <si> may hold several <t> runs; concatenate them.
  return [...xml.toString("utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unesc(t[1])).join(""),
  );
}

const colNum = (ref) => {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function sheetRows(xml, strings) {
  const rows = [];
  for (const rm of xml.toString("utf8").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cm of rm[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cm[1];
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const vRaw = (cm[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const isRaw = cm[2].match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/);
      let val = "";
      if (type === "s" && vRaw !== undefined) val = strings[+vRaw] ?? "";
      else if (type === "inlineStr" && isRaw) val = unesc(isRaw[1]);
      else if (vRaw !== undefined) val = vRaw;
      if (ref) cells[colNum(ref)] = val;
    }
    rows.push(cells);
  }
  return rows;
}

function readXlsx(path, sheetName) {
  const zip = entries(fs.readFileSync(path));
  const strings = sharedStrings(zip.get("xl/sharedStrings.xml"));
  const names = [...zip.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort();
  const pick = sheetName ? sheetName : names[0];
  return { sheets: names, rows: sheetRows(zip.get(pick), strings) };
}

module.exports = { readXlsx };
