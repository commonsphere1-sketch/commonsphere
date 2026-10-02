import { G7_MEMBER_CODES } from "./g7";
import { G20_MEMBER_CODES } from "./g20";
import { BRICS_MEMBER_CODES } from "./brics";

/**
 * Alliances, blocs, international agencies and human rights bodies, and
 * which countries belong.
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
/**
 * The human rights bodies were added later, each from its own page on this
 * date: the UN Human Rights Council's membership for 2026 (OHCHR), the States
 * Parties to the Rome Statute (the ICC's Assembly of States Parties), the
 * Council of Europe's member states, the states that have ratified the
 * American Convention (the Inter-American Court), and the count of states
 * party to the African Charter (the African Commission). Their cards say so.
 */
export const HUMAN_RIGHTS_CHECKED = "2 October 2026";

export type AllianceKind =
  | "Security alliance"
  | "Political & regional bloc"
  | "Economic & trade bloc"
  | "International agency"
  | "Human rights body";

/** Each kind as the filter names it: several of them. */
export const ALLIANCE_KIND_PLURAL: Record<AllianceKind, string> = {
  "Security alliance": "Security alliances",
  "Political & regional bloc": "Political & regional blocs",
  "Economic & trade bloc": "Economic & trade blocs",
  "International agency": "International agencies",
  "Human rights body": "Human rights bodies",
};

export interface Alliance {
  id: string;
  name: string;
  short: string;
  kind: AllianceKind;
  founded?: number;
  headquarters?: string;
  /** Member countries in the site's dataset, when the list is given. */
  members?: readonly string[];
  /**
   * The body's own member count. It can exceed `members` where a member is
   * not a country in this dataset (Hong Kong in APEC, Montserrat in CARICOM);
   * the note says so on those cards.
   */
  memberCount: number;
  note?: string;
  /** What the organisation is and does, in its own terms. */
  what?: string;
  /** What it is working on now. */
  agenda?: string[];
  /** Consequences and turning points worth knowing. */
  impact?: string[];
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
    what: "A military alliance of Europe and North America founded by the Washington Treaty. Its core commitment is Article 5: an armed attack on one member is treated as an attack on all.",
    agenda: ["Deterrence and defence on its eastern flank since Russia's full-scale invasion of Ukraine in 2022", "A defence investment pledge that members spend an agreed share of GDP on defence", "Integrating Finland and Sweden, which joined in 2023 and 2024"],
    impact: ["Article 5 has been invoked once, after the attacks on the United States on 11 September 2001", "Decisions are taken by consensus: every member has a veto", "Has run operations beyond its own territory, including in Afghanistan, Kosovo and the Mediterranean"],
    source: { label: "NATO — member countries", url: "https://www.nato.int/cps/en/natohq/topics_52044.htm" },
  },
  {
    id: "csto", name: "Collective Security Treaty Organization", short: "CSTO", kind: "Security alliance",
    founded: 2002, headquarters: "Moscow",
    members: ["AM", "BY", "KZ", "KG", "RU", "TJ"],
    memberCount: 6,
    note: "The CSTO lists Armenia as a member; Armenia's government has said it froze its participation in 2024.",
    what: "A post-Soviet military alliance built on the 1992 Collective Security Treaty, with a mutual-defence clause among its members.",
    agenda: ["Collective security and joint exercises among members", "Counter-terrorism and border security in Central Asia"],
    impact: ["Deployed a joint peacekeeping force to Kazakhstan during unrest in January 2022, its first such deployment", "Armenia's government has said it froze its participation after the CSTO did not act during its conflict with Azerbaijan"],
    source: { label: "CSTO — member states", url: "https://en.odkb-csto.org/" },
  },
  {
    id: "aukus", name: "AUKUS", short: "AUKUS", kind: "Security alliance",
    founded: 2021,
    members: ["AU", "GB", "US"],
    memberCount: 3,
    note: "A trilateral security partnership, centred on nuclear-powered submarines for Australia, rather than a mutual-defence treaty.",
    what: "A trilateral security partnership under which Australia is to acquire conventionally armed, nuclear-powered submarines, with wider cooperation on advanced military technology.",
    agenda: ["Pillar One: nuclear-powered submarines for Australia, with US and UK support", "Pillar Two: cooperation on undersea, quantum, hypersonic and AI capabilities"],
    impact: ["Australia's 2021 decision ended a submarine contract with France, prompting a diplomatic rift", "A 2024 agreement lets the partners share naval nuclear propulsion information"],
    source: { label: "Australian Submarine Agency — AUKUS agreement", url: "https://www.asa.gov.au/aukus-agreement" },
  },
  {
    id: "five-eyes", name: "Five Eyes", short: "Five Eyes", kind: "Security alliance",
    members: ["AU", "CA", "NZ", "GB", "US"],
    memberCount: 5,
    note: "An intelligence-sharing partnership. Its oversight bodies meet as the Five Eyes Intelligence Oversight and Review Council.",
    what: "An intelligence-sharing arrangement between five English-speaking countries, rooted in post-war signals-intelligence agreements.",
    agenda: ["Sharing signals and security intelligence", "Joint oversight through the Five Eyes Intelligence Oversight and Review Council"],
    impact: ["The oldest and deepest standing intelligence partnership between states", "Its existence and scope became widely known after the 2013 Snowden disclosures"],
    source: { label: "Australia IGIS — Five Eyes Intelligence Oversight and Review Council", url: "https://www.igis.gov.au/about/cooperation/fiorc" },
  },
  {
    id: "quad", name: "Quadrilateral Security Dialogue", short: "Quad", kind: "Security alliance",
    members: ["AU", "IN", "JP", "US"],
    memberCount: 4,
    note: "A diplomatic partnership, not a treaty alliance.",
    what: "A diplomatic grouping of four Indo-Pacific democracies. It has no treaty and no secretariat; it works through leaders' and ministers' meetings and joint initiatives.",
    agenda: ["Maritime domain awareness and security in the Indo-Pacific", "Supply chains for critical technology", "Infrastructure, health and climate cooperation"],
    impact: ["Revived in 2017 after lapsing, and raised to leader level in 2021", "Members also exercise together at sea in the Malabar naval exercise"],
    source: { label: "Australian Government DFAT — the Quad", url: "https://www.dfat.gov.au/international-relations/regional-architecture/quad" },
  },

  // ── Political & regional blocs ──
  {
    id: "eu", name: "European Union", short: "EU", kind: "Political & regional bloc",
    founded: 1993, headquarters: "Brussels",
    members: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
    memberCount: 27,
    what: "A political and economic union with its own legislature, court and currency for part of its membership. Its single market allows free movement of goods, services, capital and people.",
    agenda: ["Enlargement talks with candidate countries, including Ukraine and the Western Balkans", "The European Green Deal and climate targets", "Digital, competition and AI regulation"],
    impact: ["The single market and customs union make the EU a single trading bloc in world trade talks", "Twenty members use the euro; the rest keep their own currencies", "The United Kingdom left in 2020, the only member ever to do so"],
    source: { label: "European Union — EU countries", url: "https://european-union.europa.eu/principles-countries-history/eu-countries_en" },
  },
  {
    id: "asean", name: "Association of Southeast Asian Nations", short: "ASEAN", kind: "Political & regional bloc",
    founded: 1967, headquarters: "Jakarta",
    members: ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"],
    memberCount: 11,
    note: "Timor-Leste is the newest member, admitted in 2025.",
    what: "A regional grouping of Southeast Asian states working by consensus and non-interference, with an economic community and a web of free trade agreements.",
    agenda: ["ASEAN Economic Community integration", "Managing tensions in the South China Sea", "Admitting and integrating Timor-Leste"],
    impact: ["Its consensus rule means any member can block a common position", "It anchors the region's trade architecture: RCEP grew out of ASEAN's agreements with its partners"],
    source: { label: "ASEAN — member states", url: "https://asean.org/member-states/" },
  },
  {
    id: "au", name: "African Union", short: "AU", kind: "Political & regional bloc",
    founded: 2002, headquarters: "Addis Ababa",
    members: ["AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "ZA", "ZM", "ZW"],
    memberCount: 55,
    note: "Every African country. Western Sahara is a member as the Sahrawi Arab Democratic Republic. The AU suspends members after unconstitutional changes of government and lifts suspensions later; current suspensions are not shown.",
    what: "The continental union of every African state, successor to the Organisation of African Unity, with a Commission, a Peace and Security Council and a parliament.",
    agenda: ["Agenda 2063, its long-term development plan", "The African Continental Free Trade Area", "Peace operations and responses to coups"],
    impact: ["Suspends members after unconstitutional changes of government, a rule used repeatedly since 2020", "Became the 21st member of the G20 in 2023, giving Africa a permanent seat at that table"],
    source: { label: "African Union — member states", url: "https://au.int/en/member_states/countryprofiles2" },
  },
  {
    id: "arab-league", name: "League of Arab States", short: "Arab League", kind: "Political & regional bloc",
    founded: 1945, headquarters: "Cairo",
    members: ["DZ", "BH", "KM", "DJ", "EG", "IQ", "JO", "KW", "LB", "LY", "MR", "MA", "OM", "PS", "QA", "SA", "SO", "SD", "SY", "TN", "AE", "YE"],
    memberCount: 22,
    note: "Syria was readmitted in May 2023 after suspension in 2011. The League's own site could not be reached, so this list is from the EU External Action Service.",
    what: "A political organisation of Arab states, coordinating positions on regional affairs through its Council and summits.",
    agenda: ["The Palestinian question and the Arab Peace Initiative", "Regional conflicts, including Syria, Sudan, Libya and Yemen"],
    impact: ["Suspended Syria in 2011 and readmitted it in 2023", "Its decisions bind only the members that vote for them"],
    source: { label: "EU External Action Service — League of Arab States", url: "https://www.eeas.europa.eu/eeas/league-arab-states-las-and-eu_en" },
  },
  {
    id: "gcc", name: "Gulf Cooperation Council", short: "GCC", kind: "Political & regional bloc",
    founded: 1981, headquarters: "Riyadh",
    members: ["BH", "KW", "OM", "QA", "SA", "AE"],
    memberCount: 6,
    note: "Unchanged since its founding in 1981. The GCC Secretariat site lists no members on a reachable page, so this is from a secondary source.",
    what: "A regional union of six Gulf monarchies with a customs union, a common market and a joint defence force.",
    agenda: ["Economic diversification away from oil", "A shared defence posture, including the Peninsula Shield Force"],
    impact: ["The 2017–2021 blockade of Qatar by fellow members was resolved by the 2021 Al-Ula declaration", "Its members hold a large share of world oil and gas reserves"],
    source: { label: "Middle East Institute — the Gulf Cooperation Council", url: "https://mei.edu/backgrounder/the-gulf-cooperation-council/" },
  },
  {
    id: "mercosur", name: "Southern Common Market", short: "Mercosur", kind: "Economic & trade bloc",
    founded: 1991, headquarters: "Montevideo",
    members: ["AR", "BR", "PY", "UY", "BO", "VE"],
    memberCount: 6,
    note: "Venezuela is suspended from all rights and obligations. Bolivia is the newest State Party.",
    what: "A South American customs union with a common external tariff, founded by the Treaty of Asunción.",
    agenda: ["Concluding and ratifying the trade agreement negotiated with the European Union", "Debate among members about lowering the common external tariff"],
    impact: ["Venezuela has been suspended since 2017 under the bloc's democratic clause", "Bolivia's accession as a full member took effect after Decision 20/19"],
    source: { label: "MERCOSUR — what is MERCOSUR", url: "https://www.mercosur.int/en/about-mercosur/mercosur-in-brief/" },
  },
  {
    id: "sco", name: "Shanghai Cooperation Organisation", short: "SCO", kind: "Political & regional bloc",
    founded: 2001, headquarters: "Beijing",
    members: ["BY", "IN", "IR", "KZ", "CN", "KG", "PK", "RU", "TJ", "UZ"],
    memberCount: 10,
    note: "Also two observer states (Afghanistan, Mongolia) and 15 dialogue partners, not shown.",
    what: "A Eurasian political, economic and security organisation founded by China, Russia and Central Asian states, expanded to include India, Pakistan, Iran and Belarus.",
    agenda: ["Counter-terrorism, separatism and extremism, its stated 'three evils'", "Trade and connectivity across Eurasia"],
    impact: ["Its members together hold a large share of the world's population and land area", "It runs a Regional Anti-Terrorist Structure and joint military exercises"],
    source: { label: "SCO — about", url: "https://eng.sectsco.org/20170109/192193.html" },
  },
  {
    id: "commonwealth", name: "Commonwealth of Nations", short: "Commonwealth", kind: "Political & regional bloc",
    headquarters: "London",
    members: ["AG", "AU", "BS", "BD", "BB", "BZ", "BW", "BN", "CM", "CA", "CY", "DM", "SZ", "FJ", "GA", "GM", "GH", "GD", "GY", "IN", "JM", "KE", "KI", "LS", "MW", "MY", "MV", "MT", "MU", "MZ", "NA", "NR", "NZ", "NG", "PK", "PG", "RW", "KN", "LC", "VC", "WS", "SC", "SL", "SG", "SB", "ZA", "LK", "TZ", "TG", "TO", "TT", "TV", "UG", "GB", "VU", "ZM"],
    memberCount: 56,
    what: "A voluntary association of mostly former British Empire territories, with shared values set out in its Charter. Membership does not require ties to the monarchy.",
    agenda: ["Democracy, rule of law and human rights commitments", "Support for small and island states, including on climate"],
    impact: ["Gabon and Togo joined in 2022 with no constitutional link to Britain", "Members have been suspended for military coups and later readmitted"],
    source: { label: "The Commonwealth — member countries", url: "https://thecommonwealth.org/our-member-countries" },
  },
  {
    id: "opec", name: "Organization of the Petroleum Exporting Countries", short: "OPEC", kind: "Economic & trade bloc",
    founded: 1960, headquarters: "Vienna",
    members: ["DZ", "CG", "GQ", "GA", "IR", "IQ", "KW", "LY", "NG", "SA", "AE", "VE"],
    memberCount: 12,
    note: "Angola left on 1 January 2024. The wider OPEC+ arrangement with Russia and others is separate and not shown.",
    what: "A group of oil-exporting states that coordinates production to influence the world oil price, founded in Baghdad in 1960.",
    agenda: ["Setting production targets among members", "Coordinating with non-members through the wider OPEC+ arrangement"],
    impact: ["The 1973 embargo by Arab members triggered a global oil shock", "Angola left on 1 January 2024 over its production quota; Qatar, Ecuador and Indonesia left earlier"],
    source: { label: "OPEC — member countries", url: "https://www.opec.org/member-countries.html" },
  },
  {
    id: "oecd", name: "Organisation for Economic Co-operation and Development", short: "OECD", kind: "Economic & trade bloc",
    founded: 1961, headquarters: "Paris",
    members: ["AU", "AT", "BE", "CA", "CL", "CO", "CR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IL", "IT", "JP", "KR", "LV", "LT", "LU", "MX", "NL", "NZ", "NO", "PL", "PT", "SK", "SI", "ES", "SE", "CH", "TR", "GB", "US"],
    memberCount: 38,
    what: "An organisation of mostly high-income democracies that produces comparable statistics, policy reviews and international standards.",
    agenda: ["The global minimum corporate tax agreed through its Inclusive Framework", "AI and digital policy standards", "Accession talks with candidate countries"],
    impact: ["Its PISA tests compare school systems across countries", "Its anti-bribery convention obliges members to criminalise bribery of foreign officials"],
    source: { label: "OECD — members and partners", url: "https://www.oecd.org/en/about/members-partners.html" },
  },
  {
    id: "g7", name: "Group of Seven", short: "G7", kind: "Economic & trade bloc",
    members: G7_MEMBER_CODES, memberCount: 7,
    note: "The European Union also takes part.",
    what: "An informal group of large advanced economies whose leaders meet annually. It has no charter, secretariat or binding decisions.",
    agenda: ["Coordinating sanctions and support for Ukraine", "Economic security and supply chains", "Climate and development finance"],
    impact: ["Its members coordinated the price cap on Russian seaborne oil", "The presidency rotates annually; the EU takes part but does not hold it"],
    source: { label: "Global Affairs Canada — G7", url: "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g7/index.aspx?lang=eng" },
  },
  {
    id: "g20", name: "Group of Twenty", short: "G20", kind: "Economic & trade bloc",
    founded: 1999,
    members: G20_MEMBER_CODES, memberCount: 21,
    note: "19 countries plus the European Union and the African Union (since 2023).",
    what: "The main forum for international economic cooperation, bringing together nineteen countries, the European Union and the African Union.",
    agenda: ["Global debt treatment for distressed low-income countries", "International tax cooperation", "Climate and energy transition finance"],
    impact: ["Its 2008–09 summits coordinated the response to the global financial crisis", "The African Union became its 21st member in 2023"],
    source: { label: "Global Affairs Canada — G20", url: "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g20/index.aspx?lang=eng" },
  },
  {
    id: "brics", name: "BRICS", short: "BRICS", kind: "Economic & trade bloc",
    members: BRICS_MEMBER_CODES, memberCount: 10,
    note: "Saudi Arabia was invited in 2023 but has not confirmed accession; partner countries are a separate tier. No BRICS government page listing the members could be reached, so this is from a secondary source.",
    what: "A grouping of major emerging economies that began as an investment acronym and became a summit organisation, expanded since 2024.",
    agenda: ["Expanding use of members' own currencies in trade", "Reform of the IMF and World Bank governance", "Managing a larger and more varied membership"],
    impact: ["Founded the New Development Bank in Shanghai as an alternative lender", "Added Egypt, Ethiopia, Iran and the UAE in 2024 and Indonesia in 2025; Saudi Arabia was invited but has not confirmed"],
    source: { label: "Wikipedia — BRICS (secondary source)", url: "https://en.wikipedia.org/wiki/BRICS" },
  },

  // ── Economic & trade blocs ──
  {
    id: "usmca", name: "United States–Mexico–Canada Agreement", short: "USMCA", kind: "Economic & trade bloc",
    founded: 2020,
    members: ["US", "MX", "CA"],
    memberCount: 3,
    note: "In force since 1 July 2020, replacing NAFTA.",
    what: "The free trade agreement between the United States, Mexico and Canada that replaced NAFTA in 2020.",
    agenda: ["Joint review of the agreement by the three parties", "Rules of origin for vehicles and labour standards enforcement"],
    impact: ["Requires a higher share of North American content in cars than NAFTA did", "Has a rapid-response mechanism for labour rights complaints at specific factories"],
    source: { label: "Office of the US Trade Representative — USMCA", url: "https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement" },
  },
  {
    id: "cptpp", name: "Comprehensive and Progressive Agreement for Trans-Pacific Partnership", short: "CPTPP", kind: "Economic & trade bloc",
    founded: 2018,
    members: ["AU", "BN", "CA", "CL", "JP", "MY", "MX", "NZ", "PE", "SG", "VN", "GB"],
    memberCount: 12,
    note: "Signed by eleven countries in 2018; the United Kingdom acceded on 15 December 2024.",
    what: "A free trade agreement across the Pacific, carrying over most of the Trans-Pacific Partnership after the United States withdrew from it.",
    agenda: ["Accession requests from other economies", "Digital trade and state-owned enterprise rules"],
    impact: ["The United Kingdom's accession in 2024 was its first expansion", "Some TPP provisions, mostly on intellectual property, remain suspended"],
    source: { label: "Australian Government DFAT — CPTPP", url: "https://www.dfat.gov.au/trade/agreements/in-force/cptpp/comprehensive-and-progressive-agreement-for-trans-pacific-partnership" },
  },
  {
    id: "rcep", name: "Regional Comprehensive Economic Partnership", short: "RCEP", kind: "Economic & trade bloc",
    founded: 2022,
    members: ["AU", "BN", "KH", "CN", "JP", "LA", "NZ", "SG", "TH", "VN", "KR", "MY", "ID", "PH"],
    memberCount: 14,
    note: "The world's largest free trade agreement by members' GDP. Myanmar signed but the agreement is not in force for it, so it is not counted. India took part in negotiations and withdrew in 2019.",
    what: "A free trade agreement between ASEAN and five partners, the largest in the world by members' combined GDP.",
    agenda: ["Phasing in tariff cuts", "Common rules of origin across the region"],
    impact: ["A single set of origin rules lets firms build supply chains across all members", "India took part in negotiations and withdrew in 2019"],
    source: { label: "Australian Government DFAT — RCEP", url: "https://www.dfat.gov.au/trade/agreements/in-force/rcep" },
  },
  {
    id: "apec", name: "Asia-Pacific Economic Cooperation", short: "APEC", kind: "Economic & trade bloc",
    founded: 1989, headquarters: "Singapore",
    members: ["AU", "BN", "CA", "CL", "CN", "ID", "JP", "KR", "MY", "MX", "NZ", "PG", "PE", "PH", "RU", "SG", "TW", "TH", "US", "VN"],
    memberCount: 21,
    note: "APEC calls its members economies rather than countries. Hong Kong, China is the 21st and has no row in this dataset; Chinese Taipei appears here as Taiwan.",
    what: "A forum for Asia-Pacific economies working by non-binding commitments rather than treaty, which is why it admits economies rather than states.",
    agenda: ["The Putrajaya Vision 2040 for an open, dynamic and connected region", "Trade facilitation and digital economy work"],
    impact: ["Its non-binding, consensus approach lets China, Hong Kong and Chinese Taipei all take part", "Hosts an annual leaders' meeting alongside its ministerial process"],
    source: { label: "APEC — our members", url: "https://www.apec.org/who-we-are/our-members" },
  },
  {
    id: "efta", name: "European Free Trade Association", short: "EFTA", kind: "Economic & trade bloc",
    founded: 1960, headquarters: "Geneva",
    members: ["IS", "LI", "NO", "CH"],
    memberCount: 4,
    note: "A free trade area, not a customs union. Iceland, Liechtenstein and Norway are in the European Economic Area with the EU; Switzerland instead has bilateral agreements.",
    what: "A free trade association of four European states outside the EU, with its own network of trade agreements worldwide.",
    agenda: ["Negotiating and updating free trade agreements with third countries", "Managing EEA participation for three of its members"],
    impact: ["Iceland, Liechtenstein and Norway are in the EU single market through the EEA; Switzerland uses bilateral agreements instead", "Most of its founding members later left to join the EU"],
    source: { label: "EFTA — the European Free Trade Association", url: "https://www.efta.int/about-efta/european-free-trade-association" },
  },
  {
    id: "eaeu", name: "Eurasian Economic Union", short: "EAEU", kind: "Economic & trade bloc",
    founded: 2015, headquarters: "Moscow",
    members: ["AM", "BY", "KZ", "KG", "RU"],
    memberCount: 5,
    what: "A customs union and single market of five post-Soviet states, with a commission in Moscow and a common external tariff.",
    agenda: ["Free movement of goods, services, capital and labour among members", "Trade agreements with third countries"],
    impact: ["Its members' trade is heavily oriented towards Russia", "Free trade agreements have been concluded with states including Vietnam and Iran"],
    source: { label: "Eurasian Economic Commission", url: "https://eec.eaeunion.org/en/" },
  },
  {
    id: "ecowas", name: "Economic Community of West African States", short: "ECOWAS", kind: "Economic & trade bloc",
    founded: 1975, headquarters: "Abuja",
    members: ["BJ", "CV", "CI", "GH", "GN", "GW", "LR", "NG", "SN", "SL", "GM", "TG"],
    memberCount: 12,
    note: "Burkina Faso, Mali and Niger withdrew in January 2025, leaving the twelve ECOWAS now lists; parts of its own site still describe fifteen.",
    what: "A West African economic community that also runs a security and mediation role, with a protocol on democracy and good governance.",
    agenda: ["Restoring constitutional rule after coups", "The long-planned single currency, the eco"],
    impact: ["Has suspended members and imposed sanctions after coups, and has deployed forces in the region", "Burkina Faso, Mali and Niger left in January 2025 and formed their own Alliance of Sahel States"],
    source: { label: "ECOWAS — member states", url: "https://www.ecowas.int/member-states/" },
  },
  {
    id: "sadc", name: "Southern African Development Community", short: "SADC", kind: "Economic & trade bloc",
    founded: 1992, headquarters: "Gaborone",
    members: ["AO", "BW", "KM", "CD", "SZ", "LS", "MG", "MW", "MU", "MZ", "NA", "SC", "ZA", "TZ", "ZM", "ZW"],
    memberCount: 16,
    what: "A southern African community for economic integration, with a free trade area and a standby force for peace operations.",
    agenda: ["Regional industrialisation and infrastructure", "Peace and security deployments in member states"],
    impact: ["Deployed a mission to Mozambique's Cabo Delgado province in 2021", "Runs election observation missions across the region"],
    source: { label: "SADC — member states", url: "https://www.sadc.int/member-states" },
  },
  {
    id: "eac", name: "East African Community", short: "EAC", kind: "Economic & trade bloc",
    founded: 2000, headquarters: "Arusha",
    members: ["CD", "RW", "UG", "BI", "SO", "TZ", "KE", "SS"],
    memberCount: 8,
    note: "Somalia is the newest partner state, admitted in 2024.",
    what: "An East African community with a customs union, a common market and a stated goal of political federation.",
    agenda: ["Deepening the common market", "A monetary union protocol", "Integrating the newest partner states"],
    impact: ["The Democratic Republic of the Congo joined in 2022 and Somalia in 2024", "An earlier East African Community collapsed in 1977 and was revived in 2000"],
    source: { label: "EAC — partner states", url: "https://www.eac.int/eac-partner-states" },
  },
  {
    id: "caricom", name: "Caribbean Community", short: "CARICOM", kind: "Economic & trade bloc",
    founded: 1973, headquarters: "Georgetown",
    members: ["AG", "BS", "BB", "BZ", "DM", "GD", "GY", "HT", "JM", "LC", "KN", "VC", "SR", "TT"],
    memberCount: 15,
    note: "Montserrat is the fifteenth member and has no row in this dataset. Eight associate members, all territories, are not shown.",
    what: "The Caribbean Community, with a single market and economy among participating members, and a shared approach to external negotiations.",
    agenda: ["Food security, including a target to cut the region's food import bill", "Climate finance for small island states", "Crime and security cooperation"],
    impact: ["The oldest surviving integration movement in the developing world", "Runs shared institutions including the Caribbean Court of Justice"],
    source: { label: "CARICOM — member states and associate members", url: "https://caricom.org/member-states-and-associate-members/" },
  },
  {
    id: "andean", name: "Andean Community", short: "CAN", kind: "Economic & trade bloc",
    founded: 1969, headquarters: "Lima",
    members: ["BO", "CO", "EC", "PE"],
    memberCount: 4,
    what: "An Andean integration body with a free trade area, a common passport and shared institutions, created by the Cartagena Agreement.",
    agenda: ["Intra-regional trade and free movement of people", "Common rules on migration and border integration"],
    impact: ["Chile left in 1976 and Venezuela in 2006; both are now associated in other ways", "Its citizens can travel between members with an Andean passport"],
    source: { label: "Comunidad Andina — quiénes somos", url: "https://www.comunidadandina.org/quienes-somos/" },
  },
  {
    id: "pacific-alliance", name: "Pacific Alliance", short: "Pacific Alliance", kind: "Economic & trade bloc",
    founded: 2011,
    members: ["CL", "CO", "MX", "PE"],
    memberCount: 4,
    note: "Associated states and observers are separate tiers and are not shown.",
    what: "A Latin American bloc of four Pacific-facing economies, integrating markets and pooling trade promotion.",
    agenda: ["Free movement of goods, services, capital and people among members", "Joint trade promotion and shared embassies abroad"],
    impact: ["Members removed tariffs on the large majority of goods traded between them", "Runs an integrated stock market, MILA, linking members' exchanges"],
    source: { label: "Alianza del Pacífico", url: "https://alianzapacifico.net/" },
  },

  // ── International agencies ──
  {
    id: "un", name: "United Nations", short: "UN", kind: "International agency",
    founded: 1945, headquarters: "New York",
    memberCount: 193,
    note: "Two non-member observer states: the Holy See and the State of Palestine.",
    what: "The universal intergovernmental organisation, founded in 1945, with a General Assembly of all members and a Security Council whose decisions bind them.",
    agenda: ["The Sustainable Development Goals to 2030", "Peace operations and humanitarian response", "Long-running debate about Security Council reform"],
    impact: ["Five permanent Security Council members hold a veto: China, France, Russia, the United Kingdom and the United States", "Its specialised agencies cover health, refugees, food, labour and much else"],
    source: { label: "United Nations — member states", url: "https://www.un.org/en/about-us/member-states" },
  },
  {
    id: "wto", name: "World Trade Organization", short: "WTO", kind: "International agency",
    founded: 1995, headquarters: "Geneva",
    memberCount: 166,
    note: "166 members since 30 August 2024. Members include the European Union and separate customs territories such as Hong Kong, Macao and Chinese Taipei.",
    what: "The organisation that administers the rules of world trade, hosts negotiations and settles disputes between members.",
    agenda: ["Restoring a functioning Appellate Body", "Fisheries subsidies and agriculture negotiations", "E-commerce and digital trade work"],
    impact: ["Its Appellate Body has been unable to hear appeals since 2019 because appointments are blocked", "Members include the EU and separate customs territories such as Hong Kong and Chinese Taipei"],
    source: { label: "WTO — members and observers", url: "https://www.wto.org/english/thewto_e/whatis_e/tif_e/org6_e.htm" },
  },
  {
    id: "imf", name: "International Monetary Fund", short: "IMF", kind: "International agency",
    founded: 1944, headquarters: "Washington, D.C.",
    memberCount: 191,
    what: "The international lender of last resort to governments, which also runs surveillance of members' economies and publishes the World Economic Outlook.",
    agenda: ["Lending programmes for countries in balance-of-payments trouble", "Debt restructuring cases", "Quota reform and voting shares"],
    impact: ["Loans normally come with policy conditions, long a source of controversy", "Its Special Drawing Rights allocation in 2021 was the largest in its history"],
    source: { label: "IMF — about", url: "https://www.imf.org/en/About" },
  },

  // ── Human rights bodies ──
  // Each list is the body's own, read on HUMAN_RIGHTS_CHECKED. What each does
  // is from its founding instrument and its own account of itself.
  {
    id: "unhrc", name: "United Nations Human Rights Council", short: "UN Human Rights Council", kind: "Human rights body",
    founded: 2006, headquarters: "Geneva",
    members: ["AL", "AO", "BJ", "BO", "BR", "BG", "BI", "CL", "CN", "CO", "CI", "CU", "CY", "CZ", "CD", "DO", "EC", "EG", "EE", "ET", "FR", "GM", "GH", "IS", "IN", "ID", "IQ", "IT", "JP", "KE", "KW", "MW", "MH", "MU", "MX", "NL", "MK", "PK", "QA", "KR", "SI", "ZA", "ES", "CH", "TH", "GB", "VN"],
    memberCount: 47,
    note: "The membership for 1 January to 31 December 2026. A third of the seats change each year, so this list is for this year only. Checked 2 October 2026.",
    what: "The United Nations' main intergovernmental body for human rights: 47 states elected by the General Assembly for three-year terms. It replaced the Commission on Human Rights in 2006, and the UN's human rights office, OHCHR, serves as its secretariat.",
    agenda: ["The Universal Periodic Review, which examines the human rights record of every UN member state in turn", "Special procedures: the independent experts and rapporteurs it appoints on countries and on themes", "Commissions of inquiry and fact-finding missions"],
    impact: ["Its resolutions are not legally binding", "The General Assembly can suspend a member for gross and systematic violations: it suspended Libya in 2011 and Russia in 2022", "A state cannot be re-elected straight after two consecutive terms"],
    source: { label: "OHCHR — membership of the Human Rights Council, 2026", url: "https://www.ohchr.org/en/hr-bodies/hrc/current-members" },
  },
  {
    id: "icc", name: "International Criminal Court", short: "ICC", kind: "Human rights body",
    founded: 2002, headquarters: "The Hague",
    members: ["AF", "AL", "AD", "AG", "AR", "AM", "AU", "AT", "BD", "BB", "BE", "BZ", "BJ", "BO", "BA", "BW", "BR", "BG", "BF", "CV", "KH", "CA", "CF", "TD", "CL", "CO", "KM", "CG", "CK", "CR", "CI", "HR", "CY", "CZ", "CD", "DK", "DJ", "DM", "DO", "EC", "SV", "EE", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GY", "HN", "HU", "IS", "IE", "IT", "JP", "JO", "KE", "KI", "LV", "LS", "LR", "LI", "LT", "LU", "MG", "MW", "MV", "ML", "MT", "MH", "MU", "MX", "MN", "ME", "NA", "NR", "NL", "NZ", "NE", "NG", "MK", "NO", "PA", "PY", "PE", "PL", "PT", "KR", "MD", "RO", "KN", "LC", "VC", "WS", "SM", "SN", "RS", "SC", "SL", "SK", "SI", "ZA", "ES", "PS", "SR", "SE", "CH", "TJ", "TL", "TT", "TN", "UG", "UA", "GB", "TZ", "UY", "VU", "VE", "ZM"],
    memberCount: 125,
    note: "The 125 States Parties to the Rome Statute, as the Court's Assembly of States Parties lists them. The United States, China, Russia and India are not among them. A state that has given notice to withdraw stays on the list until the withdrawal takes effect. Checked 2 October 2026.",
    what: "The permanent court that tries individuals - not states - for genocide, crimes against humanity, war crimes and the crime of aggression. It was set up by the Rome Statute of 1998, which entered into force in 2002.",
    agenda: ["Investigations, arrest warrants and trials of individuals", "Acting only where national courts are unwilling or unable to: the principle of complementarity", "Reparations to victims through its Trust Fund for Victims"],
    impact: ["It has no police of its own and relies on states to arrest those it charges", "A case reaches it by referral from a State Party or from the UN Security Council, or on the Prosecutor's own initiative", "A withdrawal takes effect one year after a state gives notice"],
    source: { label: "ICC — the States Parties to the Rome Statute", url: "https://asp.icc-cpi.int/states-parties" },
  },
  {
    id: "coe", name: "Council of Europe", short: "Council of Europe", kind: "Human rights body",
    founded: 1949, headquarters: "Strasbourg",
    members: ["AL", "AD", "AM", "AT", "AZ", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GE", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR", "UA", "GB"],
    memberCount: 46,
    note: "Not a body of the European Union: its 46 members include all 27 EU states and 19 others. Russia ceased to be a member in March 2022. Canada, the Holy See, Japan, Mexico and the United States are observers. Checked 2 October 2026.",
    what: "Europe's human rights organisation. Its members are bound by the European Convention on Human Rights, which the European Court of Human Rights in Strasbourg enforces.",
    agenda: ["The European Court of Human Rights, which hears complaints from individuals against member states", "Monitoring bodies on torture, corruption, minorities and the rule of law", "The Register of Damage caused by Russia's aggression against Ukraine, set up in 2023"],
    impact: ["The Court's judgments bind the state they are given against", "Anyone in a member state can take a complaint to the Court once the national courts have been tried", "No execution has been carried out in a member state since 1997"],
    source: { label: "Council of Europe — member states", url: "https://www.coe.int/en/web/portal/members-states" },
  },
  {
    id: "iachr-court", name: "Inter-American Court of Human Rights", short: "Inter-American Court", kind: "Human rights body",
    founded: 1979, headquarters: "San José",
    members: ["AR", "BB", "BO", "BR", "CL", "CO", "CR", "DM", "DO", "EC", "SV", "GD", "GT", "HT", "HN", "JM", "MX", "NI", "PA", "PY", "PE", "SR", "UY"],
    memberCount: 23,
    note: "The 23 states that have ratified the American Convention on Human Rights, as the Court lists them. Trinidad and Tobago left it in 1999 and Venezuela in 2013; the United States and Canada are not among those that have ratified it. Checked 2 October 2026.",
    what: "The court of the Americas' human rights system, set up by the American Convention on Human Rights - the Pact of San José - which entered into force in 1978. It works beside the Inter-American Commission on Human Rights in Washington, D.C.",
    agenda: ["Judgments on cases brought to it by the Commission or by a state", "Advisory opinions on what the Convention and other human rights treaties require", "Provisional measures to protect people in grave and urgent danger"],
    impact: ["Its judgments bind the states that have accepted its jurisdiction", "People cannot take a case to it themselves: a petition goes first to the Inter-American Commission"],
    source: { label: "Inter-American Court of Human Rights — what is the Court?", url: "https://www.corteidh.or.cr/que_es_la_corte.cfm?lang=en" },
  },
  {
    id: "achpr", name: "African Commission on Human and Peoples' Rights", short: "African Commission", kind: "Human rights body",
    founded: 1987, headquarters: "Banjul",
    memberCount: 54,
    note: "The African Charter on Human and Peoples' Rights has been ratified by 54 member states of the African Union; South Sudan was the latest, in 2013. The count is the Commission's own. Checked 2 October 2026.",
    what: "The body that promotes and protects the rights set out in the African Charter on Human and Peoples' Rights. It was inaugurated in Addis Ababa in 1987, and its secretariat is in Banjul, The Gambia.",
    agenda: ["Examining the reports states submit on how they apply the Charter", "Hearing complaints against states, which it calls communications", "Special rapporteurs and working groups on particular rights"],
    impact: ["Its findings are recommendations to states, not binding judgments", "The African Court on Human and Peoples' Rights, in Arusha, can give binding judgments against the states that have accepted its jurisdiction"],
    source: { label: "African Commission — state parties to the African Charter", url: "https://achpr.au.int/en/states" },
  },
];
