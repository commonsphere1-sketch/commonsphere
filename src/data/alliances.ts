import { G7_MEMBER_CODES } from "./g7";
import { G20_MEMBER_CODES } from "./g20";
import { BRICS_MEMBER_CODES } from "./brics";

/**
 * Alliances, blocs and international agencies, and which countries belong.
 *
 * Every membership list was checked against the organisation's own page on
 * the date below (the source is on each entry), except where noted. Wikidata
 * was tried first and rejected: its "member of" data had NATO without
 * Denmark, OPEC still including Angola (which left on 1 January 2024),
 * Mexico in Mercosur and the SCO at eight members, so none of it is used.
 *
 * Countries are ISO 3166-1 alpha-2 codes, matched against the site's country
 * dataset. For bodies nearly every country belongs to (UN, IMF, WTO) only the
 * count is given, from the body itself, rather than a 190-row list.
 *
 * Membership changes. Suspensions in particular (the African Union suspends
 * members after coups, and lifts suspensions) move faster than a static file,
 * so they are described in each note rather than encoded, and the date this
 * was checked is shown on the page.
 */
export const ALLIANCES_CHECKED = "18 September 2026";

export type AllianceKind = "Security alliance" | "Political & economic bloc" | "International agency";

export interface Alliance {
  id: string;
  name: string;
  short: string;
  kind: AllianceKind;
  founded?: number;
  headquarters?: string;
  /** Member countries in the site's dataset, when the list is given. */
  members?: readonly string[];
  /** The body's own member count, when the list is not given or differs. */
  memberCount: number;
  note?: string;
  source: { label: string; url: string };
}

export const ALLIANCES: Alliance[] = [
  // ── Security alliances ──
  {
    id: "nato", name: "North Atlantic Treaty Organization", short: "NATO", kind: "Security alliance",
    founded: 1949, headquarters: "Brussels",
    members: ["BE", "CA", "DK", "FR", "IS", "IT", "LU", "NL", "NO", "PT", "GB", "US", "GR", "TR", "DE", "ES", "CZ", "HU", "PL", "BG", "EE", "LV", "LT", "RO", "SK", "SI", "AL", "HR", "ME", "MK", "FI", "SE"],
    memberCount: 32,
    note: "Finland joined in 2023 and Sweden in 2024, the most recent members.",
    source: { label: "NATO — member countries", url: "https://www.nato.int/cps/en/natohq/topics_52044.htm" },
  },
  {
    id: "csto", name: "Collective Security Treaty Organization", short: "CSTO", kind: "Security alliance",
    founded: 2002, headquarters: "Moscow",
    members: ["AM", "BY", "KZ", "KG", "RU", "TJ"],
    memberCount: 6,
    note: "The CSTO lists Armenia as a member; Armenia's government has said it froze its participation in 2024.",
    source: { label: "CSTO — member states", url: "https://en.odkb-csto.org/" },
  },
  {
    id: "aukus", name: "AUKUS", short: "AUKUS", kind: "Security alliance",
    founded: 2021,
    members: ["AU", "GB", "US"],
    memberCount: 3,
    note: "A trilateral security partnership, centred on nuclear-powered submarines for Australia, rather than a mutual-defence treaty.",
    source: { label: "Australian Submarine Agency — AUKUS agreement", url: "https://www.asa.gov.au/aukus-agreement" },
  },
  {
    id: "five-eyes", name: "Five Eyes", short: "Five Eyes", kind: "Security alliance",
    members: ["AU", "CA", "NZ", "GB", "US"],
    memberCount: 5,
    note: "An intelligence-sharing partnership. Its oversight bodies meet as the Five Eyes Intelligence Oversight and Review Council.",
    source: { label: "Australia IGIS — Five Eyes Intelligence Oversight and Review Council", url: "https://www.igis.gov.au/about/cooperation/fiorc" },
  },
  {
    id: "quad", name: "Quadrilateral Security Dialogue", short: "Quad", kind: "Security alliance",
    members: ["AU", "IN", "JP", "US"],
    memberCount: 4,
    note: "A diplomatic partnership, not a treaty alliance.",
    source: { label: "Australian Government DFAT — the Quad", url: "https://www.dfat.gov.au/international-relations/regional-architecture/quad" },
  },

  // ── Political & economic blocs ──
  {
    id: "eu", name: "European Union", short: "EU", kind: "Political & economic bloc",
    founded: 1993, headquarters: "Brussels",
    members: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
    memberCount: 27,
    source: { label: "European Union — EU countries", url: "https://european-union.europa.eu/principles-countries-history/eu-countries_en" },
  },
  {
    id: "asean", name: "Association of Southeast Asian Nations", short: "ASEAN", kind: "Political & economic bloc",
    founded: 1967, headquarters: "Jakarta",
    members: ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"],
    memberCount: 11,
    note: "Timor-Leste is the newest member, admitted in 2025.",
    source: { label: "ASEAN — member states", url: "https://asean.org/member-states/" },
  },
  {
    id: "au", name: "African Union", short: "AU", kind: "Political & economic bloc",
    founded: 2002, headquarters: "Addis Ababa",
    members: ["AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "ZA", "ZM", "ZW"],
    memberCount: 55,
    note: "Every African country. Western Sahara is a member as the Sahrawi Arab Democratic Republic. The AU suspends members after unconstitutional changes of government and lifts suspensions later; current suspensions are not shown.",
    source: { label: "African Union — member states", url: "https://au.int/en/member_states/countryprofiles2" },
  },
  {
    id: "arab-league", name: "League of Arab States", short: "Arab League", kind: "Political & economic bloc",
    founded: 1945, headquarters: "Cairo",
    members: ["DZ", "BH", "KM", "DJ", "EG", "IQ", "JO", "KW", "LB", "LY", "MR", "MA", "OM", "PS", "QA", "SA", "SO", "SD", "SY", "TN", "AE", "YE"],
    memberCount: 22,
    note: "Syria was readmitted in May 2023 after suspension in 2011. The League's own site could not be reached, so this list is from the EU External Action Service.",
    source: { label: "EU External Action Service — League of Arab States", url: "https://www.eeas.europa.eu/eeas/league-arab-states-las-and-eu_en" },
  },
  {
    id: "gcc", name: "Gulf Cooperation Council", short: "GCC", kind: "Political & economic bloc",
    founded: 1981, headquarters: "Riyadh",
    members: ["BH", "KW", "OM", "QA", "SA", "AE"],
    memberCount: 6,
    note: "Unchanged since its founding in 1981. The GCC Secretariat site lists no members on a reachable page, so this is from a secondary source.",
    source: { label: "Middle East Institute — the Gulf Cooperation Council", url: "https://mei.edu/backgrounder/the-gulf-cooperation-council/" },
  },
  {
    id: "mercosur", name: "Southern Common Market", short: "Mercosur", kind: "Political & economic bloc",
    founded: 1991, headquarters: "Montevideo",
    members: ["AR", "BR", "PY", "UY", "BO", "VE"],
    memberCount: 6,
    note: "Venezuela is suspended from all rights and obligations. Bolivia is the newest State Party.",
    source: { label: "MERCOSUR — what is MERCOSUR", url: "https://www.mercosur.int/en/about-mercosur/mercosur-in-brief/" },
  },
  {
    id: "sco", name: "Shanghai Cooperation Organisation", short: "SCO", kind: "Political & economic bloc",
    founded: 2001, headquarters: "Beijing",
    members: ["BY", "IN", "IR", "KZ", "CN", "KG", "PK", "RU", "TJ", "UZ"],
    memberCount: 10,
    note: "Also two observer states (Afghanistan, Mongolia) and 15 dialogue partners, not shown.",
    source: { label: "SCO — about", url: "https://eng.sectsco.org/20170109/192193.html" },
  },
  {
    id: "commonwealth", name: "Commonwealth of Nations", short: "Commonwealth", kind: "Political & economic bloc",
    headquarters: "London",
    members: ["AG", "AU", "BS", "BD", "BB", "BZ", "BW", "BN", "CM", "CA", "CY", "DM", "SZ", "FJ", "GA", "GM", "GH", "GD", "GY", "IN", "JM", "KE", "KI", "LS", "MW", "MY", "MV", "MT", "MU", "MZ", "NA", "NR", "NZ", "NG", "PK", "PG", "RW", "KN", "LC", "VC", "WS", "SC", "SL", "SG", "SB", "ZA", "LK", "TZ", "TG", "TO", "TT", "TV", "UG", "GB", "VU", "ZM"],
    memberCount: 56,
    source: { label: "The Commonwealth — member countries", url: "https://thecommonwealth.org/our-member-countries" },
  },
  {
    id: "opec", name: "Organization of the Petroleum Exporting Countries", short: "OPEC", kind: "Political & economic bloc",
    founded: 1960, headquarters: "Vienna",
    members: ["DZ", "CG", "GQ", "GA", "IR", "IQ", "KW", "LY", "NG", "SA", "AE", "VE"],
    memberCount: 12,
    note: "Angola left on 1 January 2024. The wider OPEC+ arrangement with Russia and others is separate and not shown.",
    source: { label: "OPEC — member countries", url: "https://www.opec.org/member-countries.html" },
  },
  {
    id: "oecd", name: "Organisation for Economic Co-operation and Development", short: "OECD", kind: "Political & economic bloc",
    founded: 1961, headquarters: "Paris",
    members: ["AU", "AT", "BE", "CA", "CL", "CO", "CR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IL", "IT", "JP", "KR", "LV", "LT", "LU", "MX", "NL", "NZ", "NO", "PL", "PT", "SK", "SI", "ES", "SE", "CH", "TR", "GB", "US"],
    memberCount: 38,
    source: { label: "OECD — members and partners", url: "https://www.oecd.org/en/about/members-partners.html" },
  },
  {
    id: "g7", name: "Group of Seven", short: "G7", kind: "Political & economic bloc",
    members: G7_MEMBER_CODES, memberCount: 7,
    note: "The European Union also takes part.",
    source: { label: "Global Affairs Canada — G7", url: "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g7/index.aspx?lang=eng" },
  },
  {
    id: "g20", name: "Group of Twenty", short: "G20", kind: "Political & economic bloc",
    founded: 1999,
    members: G20_MEMBER_CODES, memberCount: 21,
    note: "19 countries plus the European Union and the African Union (since 2023).",
    source: { label: "Global Affairs Canada — G20", url: "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g20/index.aspx?lang=eng" },
  },
  {
    id: "brics", name: "BRICS", short: "BRICS", kind: "Political & economic bloc",
    members: BRICS_MEMBER_CODES, memberCount: 10,
    note: "Saudi Arabia was invited in 2023 but has not confirmed accession; partner countries are a separate tier. No BRICS government page listing the members could be reached, so this is from a secondary source.",
    source: { label: "Wikipedia — BRICS (secondary source)", url: "https://en.wikipedia.org/wiki/BRICS" },
  },

  // ── International agencies ──
  {
    id: "un", name: "United Nations", short: "UN", kind: "International agency",
    founded: 1945, headquarters: "New York",
    memberCount: 193,
    note: "Two non-member observer states: the Holy See and the State of Palestine.",
    source: { label: "United Nations — member states", url: "https://www.un.org/en/about-us/member-states" },
  },
  {
    id: "wto", name: "World Trade Organization", short: "WTO", kind: "International agency",
    founded: 1995, headquarters: "Geneva",
    memberCount: 166,
    note: "166 members since 30 August 2024. Members include the European Union and separate customs territories such as Hong Kong, Macao and Chinese Taipei.",
    source: { label: "WTO — members and observers", url: "https://www.wto.org/english/thewto_e/whatis_e/tif_e/org6_e.htm" },
  },
  {
    id: "imf", name: "International Monetary Fund", short: "IMF", kind: "International agency",
    founded: 1944, headquarters: "Washington, D.C.",
    memberCount: 191,
    source: { label: "IMF — about", url: "https://www.imf.org/en/About" },
  },
];
