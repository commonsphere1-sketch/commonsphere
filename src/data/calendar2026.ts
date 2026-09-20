/**
 * calendar2026.ts
 *
 * The 2026 diary: scheduled political, economic and social meetings, national
 * and international, that the dashboard's quarter tracker lists a quarter at a
 * time.
 *
 * Hand-curated rather than generated, because no single publisher issues a
 * machine-readable calendar of these. Every entry was read off the convening
 * body's own page — or, for the two statutory US dates, off the rule the date
 * follows — and each carries that page as its source. Dates checked on
 * CALENDAR_CHECKED.
 *
 * Two entries are month-only: the convenor has announced the month but not yet
 * published the days. They are marked `monthOnly` and shown as a month rather
 * than given a day nobody has confirmed.
 */

export type EventScope = "National" | "International";
export type EventTheme = "Political" | "Economic" | "Social";

export interface CalendarEvent {
  id: string;
  /** What it is called by the body that convenes it. */
  name: string;
  /** Who convenes it. */
  org: string;
  /** First day, ISO yyyy-mm-dd. For a month-only entry, the first of the month. */
  start: string;
  /** Last day, inclusive. Omitted for a single-day event. */
  end?: string;
  /** The month is announced, the days are not. */
  monthOnly?: boolean;
  city: string;
  country: string;
  scope: EventScope;
  theme: EventTheme;
  /** One line on what is decided or discussed there. */
  what: string;
  source: { label: string; url: string };
}

export const CALENDAR_YEAR = 2026;
export const CALENDAR_CHECKED = "20 September 2026";

const FOMC_SOURCE = {
  label: "Federal Reserve, FOMC calendar",
  url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
};

/** One of the eight scheduled FOMC meetings; four also publish projections. */
function fomc(start: string, end: string, projections: boolean): CalendarEvent {
  return {
    id: `fomc-${start}`,
    name: "Federal Open Market Committee meeting",
    org: "US Federal Reserve",
    start,
    end,
    city: "Washington, DC",
    country: "United States",
    scope: "National",
    theme: "Economic",
    what: projections
      ? "Sets the federal funds target range and publishes the Summary of Economic Projections."
      : "Sets the federal funds target range; no projection materials at this meeting.",
    source: FOMC_SOURCE,
  };
}

export const CALENDAR_2026: CalendarEvent[] = [
  // ── Q1 ──────────────────────────────────────────────────────────────────
  {
    id: "wef-davos",
    name: "World Economic Forum Annual Meeting 2026",
    org: "World Economic Forum",
    start: "2026-01-19",
    end: "2026-01-23",
    city: "Davos-Klosters",
    country: "Switzerland",
    scope: "International",
    theme: "Economic",
    what: "The 56th annual meeting, under the theme “A Spirit of Dialogue”.",
    source: {
      label: "World Economic Forum",
      url: "https://www.weforum.org/meetings/world-economic-forum-annual-meeting-2026/",
    },
  },
  fomc("2026-01-27", "2026-01-28", false),
  {
    id: "csocd64",
    name: "Commission for Social Development, 64th session",
    org: "United Nations ECOSOC",
    start: "2026-02-02",
    end: "2026-02-10",
    city: "New York",
    country: "United States",
    scope: "International",
    theme: "Social",
    what: "The UN's social policy commission: poverty eradication, employment and social inclusion.",
    source: {
      label: "UN DESA, CSocD64",
      url: "https://social.desa.un.org/csocd/64th-session",
    },
  },
  {
    id: "msc-2026",
    name: "Munich Security Conference 2026",
    org: "Munich Security Conference",
    start: "2026-02-13",
    end: "2026-02-15",
    city: "Munich",
    country: "Germany",
    scope: "International",
    theme: "Political",
    what: "The main annual gathering on defence and foreign policy outside the treaty bodies.",
    source: {
      label: "Munich Security Conference",
      url: "https://securityconference.org/en/msc-2026/",
    },
  },
  {
    id: "au-39",
    name: "African Union Assembly, 39th Ordinary Session",
    org: "African Union",
    start: "2026-02-14",
    end: "2026-02-15",
    city: "Addis Ababa",
    country: "Ethiopia",
    scope: "International",
    theme: "Political",
    what: "AU heads of state, under the 2026 theme of water availability and safe sanitation.",
    source: { label: "African Union, 39th Summit", url: "https://au.int/en/summit/39" },
  },
  {
    id: "csw70",
    name: "Commission on the Status of Women, 70th session",
    org: "United Nations ECOSOC and UN Women",
    start: "2026-03-09",
    end: "2026-03-19",
    city: "New York",
    country: "United States",
    scope: "International",
    theme: "Social",
    what: "The UN's principal intergovernmental body on gender equality and women's rights.",
    source: {
      label: "UN Women, CSW70",
      url: "https://www.unwomen.org/en/how-we-work/commission-on-the-status-of-women/csw70-2026",
    },
  },
  fomc("2026-03-17", "2026-03-18", true),
  {
    id: "wto-mc14",
    name: "WTO 14th Ministerial Conference (MC14)",
    org: "World Trade Organization",
    start: "2026-03-26",
    end: "2026-03-30",
    city: "Yaoundé",
    country: "Cameroon",
    scope: "International",
    theme: "Economic",
    what: "The WTO's top decision-making body, which meets roughly every two years.",
    source: {
      label: "WTO, MC14",
      url: "https://www.wto.org/english/thewto_e/minist_e/mc14_e/mc14_e.htm",
    },
  },

  // ── Q2 ──────────────────────────────────────────────────────────────────
  {
    id: "imf-spring",
    name: "IMF–World Bank Spring Meetings 2026",
    org: "IMF and World Bank Group",
    start: "2026-04-13",
    end: "2026-04-18",
    city: "Washington, DC",
    country: "United States",
    scope: "International",
    theme: "Economic",
    what: "Finance ministers and central bank governors, with the World Economic Outlook.",
    source: {
      label: "IMF Meetings",
      url: "https://meetings.imf.org/en/2026/spring/schedule",
    },
  },
  fomc("2026-04-28", "2026-04-29", false),
  {
    id: "asean-48",
    name: "48th ASEAN Summit",
    org: "ASEAN, Philippine chairship",
    start: "2026-05-08",
    city: "Cebu",
    country: "Philippines",
    scope: "International",
    theme: "Political",
    what: "ASEAN leaders under the 2026 chairship theme “Navigating Our Future, Together”.",
    source: {
      label: "ASEAN, Chair's Statement",
      url: "https://asean.org/chairs-statement-of-the-48th-asean-summit/",
    },
  },
  {
    id: "wuf13",
    name: "13th World Urban Forum (WUF13)",
    org: "UN-Habitat",
    start: "2026-05-17",
    end: "2026-05-22",
    city: "Baku",
    country: "Azerbaijan",
    scope: "International",
    theme: "Social",
    what: "Housing, urbanisation and city policy, under “Housing the world”.",
    source: {
      label: "UN-Habitat, WUF13",
      url: "https://unhabitat.org/events/world-urban-forum-wuf13",
    },
  },
  {
    id: "wha79",
    name: "79th World Health Assembly",
    org: "World Health Organization",
    start: "2026-05-18",
    end: "2026-05-23",
    city: "Geneva",
    country: "Switzerland",
    scope: "International",
    theme: "Social",
    what: "WHO's decision-making body: the programme budget and global health resolutions.",
    source: {
      label: "WHO, WHA79",
      url: "https://www.who.int/about/governance/world-health-assembly/seventy-ninth",
    },
  },
  {
    id: "ilc114",
    name: "International Labour Conference, 114th session",
    org: "International Labour Organization",
    start: "2026-06-01",
    end: "2026-06-12",
    city: "Geneva",
    country: "Switzerland",
    scope: "International",
    theme: "Social",
    what: "Tripartite delegations on platform work, gender equality at work and social dialogue.",
    source: {
      label: "ILO, 114th ILC",
      url: "https://www.ilo.org/resource/other/ilc/ilc114/guide-114th-session-international-labour-conference-2026",
    },
  },
  {
    id: "g7-evian",
    name: "G7 Summit",
    org: "G7, French presidency",
    start: "2026-06-15",
    end: "2026-06-17",
    city: "Évian-les-Bains",
    country: "France",
    scope: "International",
    theme: "Political",
    what: "The 52nd G7 summit, hosted by France.",
    source: {
      label: "European Council",
      url: "https://www.consilium.europa.eu/en/meetings/international-summit/2026/06/15-17/",
    },
  },
  fomc("2026-06-16", "2026-06-17", true),

  // ── Q3 ──────────────────────────────────────────────────────────────────
  {
    id: "nato-ankara",
    name: "NATO Summit 2026",
    org: "NATO",
    start: "2026-07-07",
    end: "2026-07-08",
    city: "Ankara",
    country: "Türkiye",
    scope: "International",
    theme: "Political",
    what: "Allied leaders on defence investment, industrial production and Ukraine.",
    source: {
      label: "NATO",
      url: "https://www.nato.int/en/news-and-events/events/2026/07/overview---2026-nato-summit-in-ankara-",
    },
  },
  fomc("2026-07-28", "2026-07-29", false),
  {
    id: "asa-121",
    name: "American Sociological Association, 121st Annual Meeting",
    org: "American Sociological Association",
    start: "2026-08-07",
    end: "2026-08-11",
    city: "New York",
    country: "United States",
    scope: "National",
    theme: "Social",
    what: "The largest annual gathering of sociologists in the United States.",
    source: {
      label: "ASA Annual Meeting",
      url: "https://www.asanet.org/annual-meeting/",
    },
  },
  {
    id: "brics-18",
    name: "18th BRICS Summit",
    org: "BRICS, Indian chairship",
    start: "2026-09-12",
    end: "2026-09-13",
    city: "New Delhi",
    country: "India",
    scope: "International",
    theme: "Economic",
    what: "BRICS leaders under India's 2026 chairship.",
    source: { label: "BRICS India 2026", url: "https://www.brics2026.gov.in/brics-india-2026/" },
  },
  fomc("2026-09-15", "2026-09-16", true),
  {
    id: "unga81-debate",
    name: "UN General Assembly, 81st session — general debate",
    org: "United Nations",
    start: "2026-09-22",
    end: "2026-09-28",
    city: "New York",
    country: "United States",
    scope: "International",
    theme: "Political",
    what: "Heads of state and government address the Assembly; the session itself opened on 8 September.",
    source: {
      label: "UN, general debate",
      url: "https://www.un.org/pga/81/event/general-debate-of-the-eighty-first-session-of-the-general-assembly/",
    },
  },

  // ── Q4 ──────────────────────────────────────────────────────────────────
  {
    id: "scotus-ot2026",
    name: "US Supreme Court, October Term 2026 opens",
    org: "Supreme Court of the United States",
    start: "2026-10-05",
    city: "Washington, DC",
    country: "United States",
    scope: "National",
    theme: "Political",
    what: "The term begins by statute on the first Monday in October, which in 2026 is 5 October.",
    source: {
      label: "Supreme Court of the United States",
      url: "https://www.supremecourt.gov/about/courtatwork.aspx",
    },
  },
  {
    id: "imf-annual",
    name: "IMF–World Bank Annual Meetings 2026",
    org: "IMF and World Bank Group",
    start: "2026-10-12",
    end: "2026-10-18",
    city: "Bangkok",
    country: "Thailand",
    scope: "International",
    theme: "Economic",
    what: "The Boards of Governors meet; the first Annual Meetings held in Thailand since 1991.",
    source: { label: "IMF Meetings", url: "https://www.imf.org/en/meetings/2026/annual" },
  },
  fomc("2026-10-27", "2026-10-28", false),
  {
    id: "g20-fmm",
    name: "G20 Foreign Ministers' Meeting",
    org: "G20, US presidency",
    start: "2026-10-30",
    end: "2026-10-31",
    city: "Atlanta",
    country: "United States",
    scope: "International",
    theme: "Political",
    what: "Foreign ministers meet ahead of the leaders' summit in December.",
    source: { label: "G20 Miami 2026", url: "https://g20.org/" },
  },
  {
    id: "us-midterms",
    name: "United States midterm elections",
    org: "US states and territories",
    start: "2026-11-03",
    city: "Nationwide",
    country: "United States",
    scope: "National",
    theme: "Political",
    what: "All 435 House seats, 35 Senate seats and 39 governorships; federal election day is set by statute as the Tuesday after the first Monday in November.",
    source: {
      label: "Federal Election Commission",
      url: "https://www.fec.gov/introduction-campaign-finance/election-and-voting-information/",
    },
  },
  {
    id: "cop31",
    name: "UN Climate Change Conference (COP31)",
    org: "UNFCCC",
    start: "2026-11-09",
    end: "2026-11-20",
    city: "Antalya",
    country: "Türkiye",
    scope: "International",
    theme: "Political",
    what: "The 31st Conference of the Parties, with a World Leaders' Summit on 11–12 November.",
    source: { label: "UNFCCC, COP31", url: "https://unfccc.int/cop31" },
  },
  {
    id: "asean-49",
    name: "49th ASEAN Summit and Related Summits",
    org: "ASEAN, Philippine chairship",
    start: "2026-11-01",
    monthOnly: true,
    city: "Manila",
    country: "Philippines",
    scope: "International",
    theme: "Political",
    what: "ASEAN's own 2026 calendar gives the month; the days were not published when this was checked.",
    source: {
      label: "ASEAN 2026 public calendar",
      url: "https://asean.org/wp-content/uploads/2026/02/Public-ASEAN-2026-Notional-Calendar-as-of-2-Feb.pdf",
    },
  },
  {
    id: "apec-aelm",
    name: "APEC Economic Leaders' Week",
    org: "APEC, Chinese host year",
    start: "2026-11-01",
    monthOnly: true,
    city: "Shenzhen",
    country: "China",
    scope: "International",
    theme: "Economic",
    what: "APEC's own meetings page gives the month; the days were not published when this was checked.",
    source: { label: "APEC China 2026", url: "https://www.apec2026.cn/node_196_2.html" },
  },
  fomc("2026-12-08", "2026-12-09", true),
  {
    id: "un-water-2026",
    name: "2026 UN Water Conference",
    org: "United Nations",
    start: "2026-12-08",
    end: "2026-12-10",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    scope: "International",
    theme: "Social",
    what: "Co-hosted by Senegal and the UAE, on water governance and SDG 6.",
    source: { label: "UN DESA, Water 2026", url: "https://sdgs.un.org/conferences/water2026" },
  },
  {
    id: "g20-miami",
    name: "G20 Leaders' Summit",
    org: "G20, US presidency",
    start: "2026-12-14",
    end: "2026-12-15",
    city: "Miami",
    country: "United States",
    scope: "International",
    theme: "Political",
    what: "The first G20 leaders' summit hosted by the United States since 2009.",
    source: { label: "G20 Miami 2026", url: "https://g20.org/" },
  },
];

/** The 0-based calendar quarter an entry falls in. */
export function eventQuarter(e: CalendarEvent): number {
  return Math.floor((Number(e.start.slice(5, 7)) - 1) / 3);
}
