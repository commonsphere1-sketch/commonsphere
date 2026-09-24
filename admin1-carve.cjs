/**
 * Which ISO codes a Natural Earth admin-1 feature belongs to.
 *
 * Natural Earth files some places under the country they belong to - France's
 * overseas regions as French départements, Svalbard and Bouvet under Norway,
 * the Caribbean Netherlands as Dutch special municipalities - and Christmas
 * and Cocos under an "Indian Ocean Territories" group with no ISO code. The
 * site gives each of these its own card, so each also gets its own file. The
 * feature stays in its parent's file too: France's map still shows Réunion.
 *
 * Shared by build-admin1.cjs and build-hires-admin1.cjs so both agree.
 */
const CARVE = [
  ["GF", (p) => p.iso_a2 === "FR" && p.name_en === "French Guiana"],
  ["GP", (p) => p.iso_a2 === "FR" && p.name_en === "Guadeloupe"],
  ["MQ", (p) => p.iso_a2 === "FR" && p.name_en === "Martinique"],
  ["RE", (p) => p.iso_a2 === "FR" && p.name_en === "Réunion"],
  ["YT", (p) => p.iso_a2 === "FR" && p.name_en === "Mayotte"],
  ["BQ", (p) => p.iso_a2 === "NL" && p.type_en === "Special Municipality"],
  ["SJ", (p) => p.iso_a2 === "NO" && p.name === "Svalbard"],
  ["BV", (p) => p.iso_a2 === "NO" && p.name === "Bouvet Island"],
  ["CX", (p) => p.adm0_a3 === "IOA" && p.name === "Christmas Island"],
  ["CC", (p) => p.adm0_a3 === "IOA" && p.name === "Cocos (Keeling) Islands"],
];

/** Every code the feature belongs to: its own, and any it is carved out for. */
function codesOf(p) {
  const out = [];
  if (p.iso_a2 && p.iso_a2 !== "-99") out.push(p.iso_a2);
  for (const [code, test] of CARVE) if (test(p)) out.push(code);
  return out;
}

module.exports = { codesOf, CARVED: CARVE.map(([c]) => c) };
