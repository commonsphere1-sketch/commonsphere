// Royal Families & Monarchies data
// Covers all current reigning monarchs + key dynasties worldwide

export interface RoyalMember {
  id: string;
  name: string;
  title: string;
  country: string;
  countryCode: string;
  flag: string;
  dynasty: string;
  reignSince: number;
  born: number;
  age: number;
  successionOrder: string; // e.g. "1st in line: Prince X"
  photo: string;
  systemType: "Absolute" | "Constitutional" | "Semi-Constitutional";
  religionRole: string; // e.g. "Supreme Governor of the Church of England"
  background: string;
  keyFacts: string[];
  region: string;
  spouses?: string[];
  children?: string[];
  houseName: string; // e.g. "House of Windsor"
  netWorthNote?: string;
}

export const ROYAL_FAMILIES: RoyalMember[] = [
  // ── EUROPE ────────────────────────────────────────────────────────────────
  {
    id: "charles3-royal",
    name: "King Charles III",
    title: "King of the United Kingdom and 14 Commonwealth Realms",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    dynasty: "House of Windsor",
    houseName: "House of Windsor",
    reignSince: 2022,
    born: 1948,
    age: 76,
    successionOrder: "1st in line: Prince William, Prince of Wales",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/King_Charles_III_official_portrait_2023.jpg/440px-King_Charles_III_official_portrait_2023.jpg",
    systemType: "Constitutional",
    religionRole: "Supreme Governor of the Church of England",
    background:
      "Became King on September 8, 2022 after the death of Queen Elizabeth II. Waited 70 years as Prince of Wales — the longest in British history. Known for environmental activism, organic farming, and architectural criticism long before these were mainstream positions. Previously married to Diana Spencer (1981–1997, her death) and Camilla Parker Bowles (2005–present).",
    keyFacts: [
      "Head of State of 14 Commonwealth Realms including Australia, Canada, New Zealand",
      "First British monarch to be a grandfather before becoming king",
      "The Prince&#39;s Trust has helped over 1 million young people since 1976",
      "Diagnosed with cancer in early 2024 — continued public duties during treatment",
      "Coronation at Westminster Abbey, May 2023 — first coronation in 70 years",
    ],
    spouses: [
      "Diana, Princess of Wales (1981–1997)",
      "Queen Camilla (2005–present)",
    ],
    children: [
      "Prince William, Prince of Wales",
      "Prince Harry, Duke of Sussex",
    ],
    region: "Europe",
    netWorthNote:
      "Crown Estate valued at ~£15.8B (state asset, not personal); Duchy of Cornwall ~£1.1B; personal fortune estimated ~£100M+",
  },
  {
    id: "william-royal",
    name: "Prince William",
    title: "Prince of Wales, Duke of Cornwall",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    dynasty: "House of Windsor",
    houseName: "House of Windsor",
    reignSince: 2022, // as Prince of Wales
    born: 1982,
    age: 42,
    successionOrder: "Heir apparent to the throne",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Prince_William_2021_%28cropped%29.jpg/440px-Prince_William_2021_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Future Supreme Governor of the Church of England",
    background:
      "Elder son of King Charles III and the late Princess Diana. Served as an RAF Search and Rescue pilot and later an Air Ambulance pilot. Married Catherine Middleton (now Princess of Wales) in 2011. Champion of the Earthshot Prize for environmental innovation.",
    keyFacts: [
      "First in line to the British throne since September 2022",
      "Founded Earthshot Prize — £50M environmental innovation challenge",
      "Served as RAF Search and Rescue pilot 2009–2013",
      "Three children: Prince George, Princess Charlotte, Prince Louis",
      "Mental health advocacy — co-founded Heads Together campaign",
    ],
    spouses: ["Princess Catherine, Princess of Wales (2011–present)"],
    children: [
      "Prince George (b. 2013)",
      "Princess Charlotte (b. 2015)",
      "Prince Louis (b. 2018)",
    ],
    region: "Europe",
    netWorthNote:
      "Duchy of Cornwall revenues (~£23M/year); personal assets estimated ~£10M+",
  },
  {
    id: "frederik-royal",
    name: "King Frederik X",
    title: "King of Denmark",
    country: "Denmark",
    countryCode: "DK",
    flag: "🇩🇰",
    dynasty: "House of Glücksburg",
    houseName: "House of Glücksburg",
    reignSince: 2024,
    born: 1968,
    age: 56,
    successionOrder: "1st in line: Crown Prince Christian",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/King_Frederik_X_of_Denmark_%28cropped%29.jpg/440px-King_Frederik_X_of_Denmark_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Head of the Church of Denmark (informal)",
    background:
      "Became King on January 14, 2024 when his mother Queen Margrethe II abdicated — the first Danish royal abdication in 900 years. Former naval officer and member of the elite Frogman Corps (Danish special forces). Married Mary Donaldson, an Australian commoner, in 2004.",
    keyFacts: [
      "First Danish abdication in 900 years brought him to the throne",
      "Married Australian-born Queen Mary — boosted royal popularity",
      "Served in the Danish Frogman Corps (special forces)",
      "Greenland sovereignty question intensified during his reign",
      "Denmark&#39;s constitution places him as head of state with limited executive powers",
    ],
    spouses: ["Queen Mary of Denmark, née Mary Donaldson (2004–present)"],
    children: [
      "Crown Prince Christian",
      "Princess Isabella",
      "Prince Vincent",
      "Princess Josephine",
    ],
    region: "Europe",
    netWorthNote:
      "Danish Royal House funding (~€12M/year from civil list); personal assets estimated ~€40M",
  },
  {
    id: "margrete2-royal",
    name: "Queen Margrethe II",
    title: "Queen Emerita of Denmark",
    country: "Denmark",
    countryCode: "DK",
    flag: "🇩🇦",
    dynasty: "House of Glücksburg",
    houseName: "House of Glücksburg",
    reignSince: 1972,
    born: 1940,
    age: 84,
    successionOrder: "Abdicated January 2024",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Margrethe_II_of_Denmark_%28cropped%29.jpg/440px-Margrethe_II_of_Denmark_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Former Head of the Church of Denmark (informal)",
    background:
      "Reigned for 52 years (1972–2024) before becoming the first Danish monarch to abdicate in 900 years on January 14, 2024. Widely beloved artist, author, and translator who gave the Danish monarchy significant cultural prestige. Her reign was among the longest in Danish history.",
    keyFacts: [
      "Reigned 52 years — longest-serving Danish monarch",
      "First Danish abdication in 900 years",
      "Accomplished artist, watercolourist, and translator",
      "Translated Simone de Beauvoir&#39;s works and J.R.R. Tolkien&#39;s Lord of the Rings into Danish",
      "Her husband Prince Henrik died 2018 — declined to be buried beside her",
    ],
    spouses: ["Prince Henrik of Denmark (1967–2018, his death)"],
    children: ["King Frederik X", "Prince Joachim"],
    region: "Europe",
    netWorthNote:
      "Personal assets estimated ~€40M; Civil list funding transferred to Frederik X",
  },
  {
    id: "willem-royal",
    name: "King Willem-Alexander",
    title: "King of the Netherlands",
    country: "Netherlands",
    countryCode: "NL",
    flag: "🇳🇱",
    dynasty: "House of Orange-Nassau",
    houseName: "House of Orange-Nassau",
    reignSince: 2013,
    born: 1967,
    age: 57,
    successionOrder: "1st in line: Princess Amalia of Orange",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Willem-Alexander_2023_%28cropped%29.jpg/440px-Willem-Alexander_2023_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "No formal religious role",
    background:
      "The first Dutch king in 123 years — his mother Queen Beatrix abdicated in 2013. Former international water management expert with an MSc in History from Leiden University. Passionate about aviation — secretly held a commercial pilot&#39;s license for years. Married Máxima Zorreguieta of Argentina in 2002.",
    keyFacts: [
      "First Dutch king since 1890 when Beatrix abdicated",
      "International water expert — chaired UN Secretary-General&#39;s Advisory Board on Water",
      "Holds a commercial pilot&#39;s license — flew KLM passengers in secret for years",
      "Married Queen Máxima, Argentine-born, in 2002",
      "Three daughters: Princesses Amalia, Alexia, and Ariane",
    ],
    spouses: ["Queen Máxima of the Netherlands (2002–present)"],
    children: [
      "Princess Amalia of Orange (heir)",
      "Princess Alexia",
      "Princess Ariane",
    ],
    region: "Europe",
    netWorthNote:
      "Dutch Civil List ~€5.5M/year; House of Orange private assets estimated ~€800M+",
  },
  {
    id: "philippe-royal",
    name: "King Philippe",
    title: "King of the Belgians",
    country: "Belgium",
    countryCode: "BE",
    flag: "🇧🇪",
    dynasty: "House of Belgium (Saxe-Coburg and Gotha)",
    houseName: "House of Belgium",
    reignSince: 2013,
    born: 1960,
    age: 64,
    successionOrder: "1st in line: Princess Elisabeth, Duchess of Brabant",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/King_Philippe_of_Belgium_2022_%28cropped%29.jpg/440px-King_Philippe_of_Belgium_2022_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "No formal religious role",
    background:
      "Succeeded his father King Albert II who abdicated in 2013. Former F-16 fighter pilot and paratrooper. Speaks fluent Dutch, French, English and German. Has navigated Belgium&#39;s complex linguistic divide between Flemish and Walloon communities. His daughter Princess Elisabeth trained at the Royal Military Academy.",
    keyFacts: [
      "King of a deeply divided federal state — French and Dutch speaking communities",
      "Former F-16 fighter pilot and qualified paratrooper",
      "Fluent in 4 languages — essential for governing a bilingual kingdom",
      "Issued Belgium&#39;s first formal apology for colonial abuses in Congo (2020)",
      "Daughter Elisabeth is first female heir in Belgian history",
    ],
    spouses: ["Queen Mathilde of Belgium (1999–present)"],
    children: [
      "Princess Elisabeth (heir)",
      "Prince Gabriel",
      "Prince Emmanuel",
      "Princess Eléonore",
    ],
    region: "Europe",
    netWorthNote:
      "Belgian Civil List ~€11.5M/year; personal assets estimated ~€10-20M",
  },
  {
    id: "carl-royal",
    name: "King Carl XVI Gustaf",
    title: "King of Sweden",
    country: "Sweden",
    countryCode: "SE",
    flag: "🇸🇪",
    dynasty: "House of Bernadotte",
    houseName: "House of Bernadotte",
    reignSince: 1973,
    born: 1946,
    age: 78,
    successionOrder: "1st in line: Crown Princess Victoria",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Carl_XVI_Gustaf_2022_%28cropped%29.jpg/440px-Carl_XVI_Gustaf_2022_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole:
      "No formal religious role (Sweden severed state–church tie in 2000)",
    background:
      "Europe&#39;s longest-reigning monarch. Became king at 27 after his grandfather King Gustaf VI Adolf died. The 1974 Instrument of Government removed all governmental powers from the monarch — making Sweden&#39;s king purely ceremonial. Known for his commitment to environmental sustainability. Married Silvia Sommerlath, a German commoner, in 1976.",
    keyFacts: [
      "Europe&#39;s longest-reigning living monarch — over 51 years on the throne",
      "1974 constitutional reform stripped monarch of all political power",
      "Father of three children; Crown Princess Victoria is heiress",
      "Strong environmental advocate — scout and nature ambassador",
      "Married Silvia Sommerlath, a German commoner, in 1976",
    ],
    spouses: ["Queen Silvia of Sweden (1976–present)"],
    children: [
      "Crown Princess Victoria (heir)",
      "Prince Carl Philip",
      "Princess Madeleine",
    ],
    region: "Europe",
    netWorthNote:
      "Swedish state funding ~SEK 65M/year; personal assets estimated ~SEK 200M+",
  },
  {
    id: "Harald-royal",
    name: "King Harald V",
    title: "King of Norway",
    country: "Norway",
    countryCode: "NO",
    flag: "🇳🇴",
    dynasty: "House of Glücksburg",
    houseName: "House of Glücksburg",
    reignSince: 1991,
    born: 1937,
    age: 87,
    successionOrder: "1st in line: Crown Prince Haakon",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/King_Harald_V_of_Norway_%28cropped%29.jpg/440px-King_Harald_V_of_Norway_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Former Head of the Church of Norway (until 2017 separation)",
    background:
      "Became King on January 17, 1991 following his father King Olav V&#39;s death. In 2025, aged 87, he took an extended medical leave following health complications. His son Crown Prince Haakon has been handling many royal duties. Known for sailing — competed in three Olympics. Broke royal tradition by marrying a commoner, Sonja Haraldsen.",
    keyFacts: [
      "Broke royal tradition by refusing to marry a princess — waited 9 years for permission to marry Sonja",
      "Competed in sailing at 1964, 1968, and 1972 Olympics",
      "Extended medical leave in 2025 — Crown Prince Haakon handling duties",
      "Norway&#39;s most admired public figure in multiple polls",
      "His 1968 speech: &#39;All Norwegians were born equal&#39; — defining inclusivity moment",
    ],
    spouses: ["Queen Sonja of Norway (1968–present)"],
    children: ["Crown Prince Haakon", "Princess Märtha Louise"],
    region: "Europe",
    netWorthNote:
      "Norwegian Civil List ~NOK 280M/year; personal assets estimated ~NOK 50-100M",
  },
  {
    id: "margrethe-spain-royal",
    name: "King Felipe VI",
    title: "King of Spain",
    country: "Spain",
    countryCode: "ES",
    flag: "🇪🇸",
    dynasty: "House of Bourbon-Anjou",
    houseName: "House of Bourbon",
    reignSince: 2014,
    born: 1968,
    age: 56,
    successionOrder: "1st in line: Princess Leonor of Asturias",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/S.M._el_Rey_Don_Felipe_VI_%28cropped%29.jpg/440px-S.M._el_Rey_Don_Felipe_VI_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "No formal religious role",
    background:
      "Became King on June 19, 2014 when his father Juan Carlos I abdicated following a series of corruption scandals. Studied law at the Autonomous University of Madrid and international relations at Georgetown University. Married journalist Letizia Ortiz in 2004 — a commoner and divorced woman — breaking royal precedent.",
    keyFacts: [
      "Succeeded his father Juan Carlos I who abdicated amid corruption scandals",
      "First Spanish monarch to marry a divorcee — Queen Letizia",
      "Spoke Catalan during his 2018 address after independence referendum",
      "Stripped father Juan Carlos of state funding and King&#39;s allowance (2020)",
      "Princess Leonor completed military training at military academies",
    ],
    spouses: ["Queen Letizia of Spain (2004–present)"],
    children: ["Princess Leonor of Asturias (heir)", "Princess Sofía"],
    region: "Europe",
    netWorthNote:
      "Spanish Civil List ~€8M/year; personal assets modest; father Juan Carlos&#39;s offshore wealth controversially involved royal family",
  },
  {
    id: "albert2-monaco-royal",
    name: "Prince Albert II",
    title: "Sovereign Prince of Monaco",
    country: "Monaco",
    countryCode: "MC",
    flag: "🇲🇨",
    dynasty: "House of Grimaldi",
    houseName: "House of Grimaldi",
    reignSince: 2005,
    born: 1958,
    age: 66,
    successionOrder: "1st in line: Princess Gabriella (twins with Jacques)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Albert_II_of_Monaco_%282016%29_%28cropped%29.jpg/440px-Albert_II_of_Monaco_%282016%29_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole: "Catholic faith — Monaco is officially Catholic",
    background:
      "Rules the world&#39;s second-smallest sovereign state (0.7 km²) and wealthiest country per capita. The Grimaldi family has ruled Monaco since 1297 — the world&#39;s oldest reigning royal dynasty. Albert is a passionate environmentalist and Olympian (bobsled). Married Charlene Wittstock of South Africa in 2011.",
    keyFacts: [
      "House of Grimaldi has ruled since 1297 — world&#39;s oldest reigning dynasty",
      "Monaco is the world&#39;s most densely populated sovereign state",
      "Competed in 5 Winter Olympics as bobsledder",
      "Founded Prince Albert II of Monaco Foundation for environment",
      "Only ~38,000 citizens in 0.7 km² — no income tax for residents",
    ],
    spouses: ["Princess Charlene of Monaco (2011–present)"],
    children: [
      "Hereditary Prince Jacques",
      "Princess Gabriella (twins, born 2014)",
    ],
    region: "Europe",
    netWorthNote:
      "House of Grimaldi personal wealth estimated ~$1B; Monaco GDP ~$7B, largely from finance and tourism",
  },
  {
    id: "henry-lux-royal",
    name: "Grand Duke Henri",
    title: "Grand Duke of Luxembourg",
    country: "Luxembourg",
    countryCode: "LU",
    flag: "🇱🇺",
    dynasty: "House of Nassau-Weilburg",
    houseName: "House of Nassau-Weilburg",
    reignSince: 2000,
    born: 1955,
    age: 69,
    successionOrder: "1st in line: Hereditary Grand Duke Guillaume",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Grand_Duke_Henri_2018_%28cropped%29.jpg/440px-Grand_Duke_Henri_2018_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Catholic — Luxembourg is traditionally Catholic",
    background:
      "Became Grand Duke in 2000 when his father Jean abdicated. Luxembourg is the world&#39;s only grand duchy. Constitutional monarch with strictly ceremonial duties. Studied political science at the University of Geneva. Married María Teresa Mestre of Cuba in 1981.",
    keyFacts: [
      "Head of state of the world&#39;s only grand duchy",
      "Luxembourg has world&#39;s highest GDP per capita",
      "Constitutional role — no political power in practice",
      "Married Grand Duchess María Teresa, born in Cuba",
      "Five children; son Guillaume is heir and married in 2012",
    ],
    spouses: ["Grand Duchess María Teresa of Luxembourg (1981–present)"],
    children: [
      "Hereditary Grand Duke Guillaume (heir)",
      "Prince Félix",
      "Prince Louis",
      "Princess Alexandra",
      "Prince Sébastien",
    ],
    region: "Europe",
    netWorthNote:
      "Luxembourg Civil List ~€10M/year; Grand Ducal family assets estimated ~€5B",
  },
  {
    id: "margrethe-liechtenstein-royal",
    name: "Prince Hans-Adam II",
    title: "Sovereign Prince of Liechtenstein",
    country: "Liechtenstein",
    countryCode: "LI",
    flag: "🇱🇮",
    dynasty: "House of Liechtenstein",
    houseName: "House of Liechtenstein",
    reignSince: 1989,
    born: 1945,
    age: 79,
    successionOrder:
      "Day-to-day rule delegated to Hereditary Prince Alois since 2004",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Hans_Adam_II_von_und_zu_Liechtenstein_%28cropped%29.jpg/440px-Hans_Adam_II_von_und_zu_Liechtenstein_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole: "Catholic — head of the House of Liechtenstein",
    background:
      "Europe&#39;s last truly reigning prince — holds substantial constitutional executive powers unlike most European monarchs. A constitutional reform in 2003 significantly expanded his powers. The Liechtenstein Royal Family is Europe&#39;s wealthiest royal family. Delegated day-to-day governance to son Alois in 2004 while retaining formal sovereignty.",
    keyFacts: [
      "Europe&#39;s last monarch with substantial executive constitutional powers",
      "House of Liechtenstein is Europe&#39;s wealthiest royal family — estimated ~€7B",
      "Liechtenstein has ~38,000 people — one of the smallest nations",
      "Privatised the state bank and postal service — runs country like a business",
      "Delegated day-to-day duties to son Alois since 2004",
    ],
    spouses: ["Princess Marie of Liechtenstein (1967–present)"],
    children: [
      "Hereditary Prince Alois (acting regent)",
      "Prince Maximilian",
      "Prince Constantin",
      "Princess Tatjana",
    ],
    region: "Europe",
    netWorthNote:
      "House of Liechtenstein estimated ~€5–7B — largest private art collection in the world, vast real estate and banking interests",
  },
  // ── MIDDLE EAST ───────────────────────────────────────────────────────────
  {
    id: "salman-royal",
    name: "King Salman bin Abdulaziz Al Saud",
    title: "King of Saudi Arabia and Custodian of the Two Holy Mosques",
    country: "Saudi Arabia",
    countryCode: "SA",
    flag: "🇸🇦",
    dynasty: "House of Saud",
    houseName: "House of Saud",
    reignSince: 2015,
    born: 1935,
    age: 89,
    successionOrder: "Crown Prince: Mohammed bin Salman (MBS)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/King_Salman_bin_Abdulaziz_Al_Saud_%28cropped%29.jpg/440px-King_Salman_bin_Abdulaziz_Al_Saud_%28cropped%29.jpg",
    systemType: "Absolute",
    religionRole:
      "Custodian of the Two Holy Mosques (Mecca and Medina) — supreme religious legitimacy in Islam",
    background:
      "Became King on January 23, 2015 following the death of his half-brother King Abdullah. At 89, health issues mean Crown Prince MBS effectively runs the government. Saudi Arabia is the world&#39;s largest oil exporter and home to Islam&#39;s two holiest sites, giving the Al Saud family immense religious and geopolitical authority.",
    keyFacts: [
      "Custodian of the Two Holy Mosques — highest title in Islamic world",
      "Saudi Arabia controls 17% of world&#39;s proven oil reserves",
      "Crown Prince MBS effectively governs day-to-day",
      "Aramco IPO in 2019 made Saudi company world&#39;s most valuable briefly",
      "Reigned during historic first women&#39;s driving rights (2018)",
    ],
    spouses: ["Multiple wives per Islamic tradition"],
    children: [
      "Crown Prince Mohammed bin Salman (MBS)",
      "Multiple sons in senior government positions",
    ],
    region: "Middle East",
    netWorthNote:
      "House of Saud family wealth estimated ~$1.4 trillion (collective); King Salman personal ~$18B",
  },
  {
    id: "hamad-bahrain-royal",
    name: "King Hamad bin Isa Al Khalifa",
    title: "King of Bahrain",
    country: "Bahrain",
    countryCode: "BH",
    flag: "🇧🇭",
    dynasty: "House of Khalifa",
    houseName: "House of Khalifa",
    reignSince: 2002,
    born: 1950,
    age: 74,
    successionOrder: "Crown Prince: Salman bin Hamad Al Khalifa",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/King_Hamad_ibn_Isa_Al_Khalifa_2022_%28cropped%29.jpg/440px-King_Hamad_ibn_Isa_Al_Khalifa_2022_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole:
      "Head of a Sunni royal family ruling a Shia-majority population",
    background:
      "Transformed Bahrain from an emirate to a constitutional monarchy in 2002. Signed the Abraham Accords normalising relations with Israel in 2020. Bahrain hosts the US Navy&#39;s Fifth Fleet — critical to Gulf security architecture. Cracked down on Arab Spring protests in 2011 with Saudi military assistance.",
    keyFacts: [
      "First king of Bahrain (previously emir) — introduced constitutional reforms in 2002",
      "Abraham Accords signatory — normalised Bahrain–Israel relations (2020)",
      "Hosts US Navy Fifth Fleet — strategic Gulf security partner",
      "2011 Arab Spring — Saudi forces helped suppress Shia majority protests",
      "Son Crown Prince Salman handles much of day-to-day governance",
    ],
    spouses: ["Sheikha Sabika bint Ibrahim Al Khalifa"],
    children: ["Crown Prince Salman", "Multiple sons"],
    region: "Middle East",
    netWorthNote:
      "House of Khalifa personal wealth estimated ~$10B; Bahrain GDP ~$40B",
  },
  {
    id: "sabah-kuwait-royal",
    name: "Emir Sheikh Meshal Al-Ahmad Al-Sabah",
    title: "Emir of Kuwait",
    country: "Kuwait",
    countryCode: "KW",
    flag: "🇰🇼",
    dynasty: "House of Al-Sabah",
    houseName: "House of Al-Sabah",
    reignSince: 2023,
    born: 1940,
    age: 84,
    successionOrder: "Crown Prince: Sheikh Sabah Al-Khaled Al-Hamad Al-Sabah",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Sheikh_Meshal_Al-Ahmad_Al-Sabah_%28cropped%29.jpg/440px-Sheikh_Meshal_Al-Ahmad_Al-Sabah_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole: "Head of state of predominantly Sunni Islamic nation",
    background:
      "Became Emir on December 16, 2023 following the death of Sheikh Nawaf. Former head of intelligence. Kuwait has a relatively active parliament (National Assembly) that has clashed with the royal family repeatedly, making it one of the Gulf&#39;s more politically active monarchies. Kuwait holds ~6% of world oil reserves.",
    keyFacts: [
      "Became Emir December 2023 after Sheikh Nawaf&#39;s death",
      "Kuwait has the Gulf&#39;s most politically active parliament (National Assembly)",
      "Kuwait holds ~6% of world proven oil reserves",
      "Kuwait Investment Authority manages ~$900B sovereign wealth fund",
      "Parliament dissolved multiple times by the Emir due to political deadlock",
    ],
    spouses: ["Multiple wives per Islamic tradition"],
    children: ["Multiple sons and daughters"],
    region: "Middle East",
    netWorthNote:
      "Kuwait Investment Authority (KIA) ~$900B; House of Al-Sabah personal wealth ~$300B collective",
  },
  {
    id: "haitham-oman-royal",
    name: "Sultan Haitham bin Tariq",
    title: "Sultan of Oman",
    country: "Oman",
    countryCode: "OM",
    flag: "🇴🇲",
    dynasty: "House of Al Said",
    houseName: "House of Al Said",
    reignSince: 2020,
    born: 1955,
    age: 69,
    successionOrder: "Theyazin bin Haitham designated as heir",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Haitham_bin_Tariq_Al_Said_%28cropped%29.jpg/440px-Haitham_bin_Tariq_Al_Said_%28cropped%29.jpg",
    systemType: "Absolute",
    religionRole:
      "Head of state in the Ibadi Islamic tradition (unique to Oman)",
    background:
      "Succeeded the legendary Sultan Qaboos on January 11, 2020. Oxford-educated. His country plays a unique diplomatic role hosting simultaneous US military facilities, Iran back-channel negotiations, and Houthi talks. Oman Vision 2040 aims to diversify from oil dependency.",
    keyFacts: [
      "Oman maintains relations with Iran, Israel, US, and Houthis simultaneously",
      "Oman Vision 2040 — largest economic diversification in country&#39;s history",
      "Mediated 5 US–Iran prisoner swaps since 2022",
      "Ibadi Islam — unique Islamic tradition found only in Oman",
      "World&#39;s largest planned green hydrogen project (HYNO) in Oman",
    ],
    spouses: ["Her Highness Ahad bint Abdullah Al Busaidiyah"],
    children: ["Theyazin bin Haitham (designated heir)"],
    region: "Middle East",
    netWorthNote:
      "House of Al Said personal wealth estimated ~$1.5B; Oman GDP ~$104B",
  },
  {
    id: "abdullah2-jordan-royal",
    name: "King Abdullah II",
    title: "King of the Hashemite Kingdom of Jordan",
    country: "Jordan",
    countryCode: "JO",
    flag: "🇯🇴",
    dynasty: "House of Hashim",
    houseName: "Hashemite Dynasty",
    reignSince: 1999,
    born: 1962,
    age: 63,
    successionOrder: "Crown Prince Hussein bin Abdullah",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/King_Abdullah_II_of_Jordan_%28cropped%29.jpg/440px-King_Abdullah_II_of_Jordan_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole:
      "Custodian of Jerusalem&#39;s Islamic and Christian holy sites (Waqf authority)",
    background:
      "The Hashemite dynasty traces its lineage directly to the Prophet Mohammed, giving King Abdullah exceptional religious authority. Custodian of the Islamic and Christian holy sites in Jerusalem. Jordanians are among the world&#39;s highest-per-capita refugee hosts (1.3M+ Syrians). Jordan intercepted Iranian drones targeting Israel in April 2024.",
    keyFacts: [
      "Direct descendant of the Prophet Mohammed — Hashemite lineage",
      "Custodian of Jerusalem&#39;s Islamic and Christian holy sites",
      "Jordanian Air Force pilot — personally flew combat missions vs ISIS",
      "Hosts 1.3M+ Syrian refugees — world&#39;s second highest per capita",
      "Maintained Israel peace treaty for 30+ years despite public opposition",
    ],
    spouses: ["Queen Rania Al Abdullah (1993–present)"],
    children: [
      "Crown Prince Hussein bin Abdullah",
      "Princess Iman",
      "Princess Salma",
      "Prince Hashem",
    ],
    region: "Middle East",
    netWorthNote:
      "House of Hashim assets estimated ~$750M; receives ~$1.6B/year in US aid",
  },
  {
    id: "tamim-qatar-royal",
    name: "Emir Sheikh Tamim bin Hamad Al Thani",
    title: "Emir of Qatar",
    country: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    dynasty: "House of Thani",
    houseName: "House of Thani",
    reignSince: 2013,
    born: 1980,
    age: 44,
    successionOrder: "No formally designated heir",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/HH_Sheikh_Tamim_bin_Hamad_Al_Thani%2C_Emir_of_Qatar.jpg/440px-HH_Sheikh_Tamim_bin_Hamad_Al_Thani%2C_Emir_of_Qatar.jpg",
    systemType: "Absolute",
    religionRole: "Head of state of majority Sunni Islamic nation",
    background:
      "Became Emir at 33 when his father Hamad abdicated in 2013. Qatar hosts the US CENTCOM forward headquarters, Al Jazeera media network, Hamas political bureau, and has 30 trillion cubic meters of natural gas — the third largest globally. Hosted the 2022 FIFA World Cup, the first in an Arab nation.",
    keyFacts: [
      "Qatar hosts US military HQ (CENTCOM) and Hamas political bureau simultaneously",
      "Hosted 2022 FIFA World Cup — first Arab nation ever",
      "Al Jazeera Arabic — most watched Arabic news network globally",
      "Qatar&#39;s North Field — largest single natural gas reservoir in the world",
      "Survived 3.5-year Saudi/UAE/Egypt blockade (2017–2021)",
    ],
    spouses: ["Multiple wives per Islamic tradition"],
    children: ["Multiple children"],
    region: "Middle East",
    netWorthNote:
      "Qatar Investment Authority (QIA) ~$500B; House of Thani personal wealth ~$335B",
  },
  {
    id: "mbz-uae-royal",
    name: "President Sheikh Mohammed bin Zayed Al Nahyan",
    title: "President of the UAE / Ruler of Abu Dhabi",
    country: "United Arab Emirates",
    countryCode: "AE",
    flag: "🇦🇪",
    dynasty: "House of Nahyan",
    houseName: "House of Nahyan",
    reignSince: 2022,
    born: 1961,
    age: 63,
    successionOrder: "Crown Prince: Sheikh Khaled bin Mohamed bin Zayed",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Mohamed_bin_Zayed_Al_Nahyan_%28cropped%29.jpg/440px-Mohamed_bin_Zayed_Al_Nahyan_%28cropped%29.jpg",
    systemType: "Absolute",
    religionRole: "Head of state in majority Sunni Islamic state",
    background:
      "Known as MBZ. The de facto ruler of the UAE for nearly two decades before officially becoming President in 2022. Third son of UAE founder Sheikh Zayed. Architect of the UAE&#39;s transformation into a regional military, financial, and tech hub. Sandhurst-trained military officer.",
    keyFacts: [
      "Architect of modern UAE — from desert federation to global city hub",
      "Abraham Accords signatory — UAE normalised with Israel in 2020",
      "UAE&#39;s Hope Mars Mission — first Arab interplanetary spacecraft",
      "Abu Dhabi Investment Authority (ADIA) manages ~$1T in assets",
      "Positioned UAE as world&#39;s leading AI and tech investment hub",
    ],
    spouses: ["Sheikha Fatima bint Mubarak Al Ketbi (senior wife) and others"],
    children: [
      "Crown Prince Khaled bin Mohamed",
      "Multiple sons including Sheikh Hamdan",
    ],
    region: "Middle East",
    netWorthNote:
      "ADIA manages ~$1T; House of Nahyan collective wealth ~$150B+; MBZ personal ~$25B",
  },
  // ── ASIA-PACIFIC ──────────────────────────────────────────────────────────
  {
    id: "naruhito-royal",
    name: "Emperor Naruhito",
    title: "Emperor of Japan",
    country: "Japan",
    countryCode: "JP",
    flag: "🇯🇵",
    dynasty: "Imperial House of Japan (Yamato Dynasty)",
    houseName: "Imperial House of Japan",
    reignSince: 2019,
    born: 1960,
    age: 64,
    successionOrder: "1st in line: Prince Fumihito (Akishino)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Emperor_Naruhito_20190501_%28cropped%29.jpg/440px-Emperor_Naruhito_20190501_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole:
      "High Priest of State Shinto — performs ancient Shinto rituals for the state",
    background:
      "Japan&#39;s 126th emperor, ascending to the Chrysanthemum Throne in May 2019 when his father Akihito abdicated — the first abdication in 200 years. The Imperial House of Japan is the world&#39;s oldest continuous hereditary monarchy — over 2,600 years. Oxford-educated historian who specialises in water transport history.",
    keyFacts: [
      "126th emperor — oldest continuous imperial dynasty in the world (2,600+ years)",
      "Father Akihito&#39;s abdication in 2019 was first in 200 years",
      "Oxford-educated — studied at Merton College, wrote thesis on Thames transport",
      "Imperial succession crisis — only male-line succession allowed by law",
      "Deep Shinto ceremonial role — performs ancient court rituals",
    ],
    spouses: [
      "Empress Masako (1993–present) — former Harvard-educated diplomat",
    ],
    children: [
      "Princess Aiko (not currently eligible for succession under current law)",
    ],
    region: "Asia-Pacific",
    netWorthNote:
      "Imperial Household Agency budget ~¥5.9B/year; Imperial family assets managed by state",
  },
  {
    id: "bolkiah-brunei-royal",
    name: "Sultan Hassanal Bolkiah",
    title: "Sultan and Yang Di-Pertuan of Brunei Darussalam",
    country: "Brunei",
    countryCode: "BN",
    flag: "🇧🇳",
    dynasty: "House of Bolkiah",
    houseName: "House of Bolkiah",
    reignSince: 1967,
    born: 1946,
    age: 78,
    successionOrder: "Crown Prince: Al-Muhtadee Billah",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sultan_of_Brunei_2012_%28cropped%29.jpg/440px-Sultan_of_Brunei_2012_%28cropped%29.jpg",
    systemType: "Absolute",
    religionRole: "Head of Islam in Brunei — Supreme Defender of the Faith",
    background:
      "One of the world&#39;s longest-reigning monarchs and for decades its wealthiest individual. Rules an absolute monarchy — also serving as Prime Minister, Finance Minister, and Defence Minister. Known for the Istana Nurul Iman — the world&#39;s largest residential palace (1,788 rooms). Implemented sharia criminal law in 2019.",
    keyFacts: [
      "58+ year reign — among the world&#39;s longest-reigning monarchs",
      "Istana Nurul Iman — world&#39;s largest residential palace with 1,788 rooms",
      "No income tax in Brunei — oil wealth distributed as citizen welfare",
      "Also serves as own Prime Minister, Finance Minister, and Defence Minister",
      "2019 sharia law implementation including death penalty clauses — triggered boycotts",
    ],
    spouses: [
      "Raja Isteri Pengiran Anak Hajah Saleha (first and senior wife)",
      "Pengiran Isteri Azrinaz Mazhar (divorced 2010)",
      "Previously Pengiran Isteri Mariam (divorced 2003)",
    ],
    children: ["Crown Prince Al-Muhtadee Billah", "Multiple children"],
    region: "Asia-Pacific",
    netWorthNote:
      "Personal fortune estimated ~$20B; brother Prince Jefri previously held role of Finance Minister and spent lavishly",
  },
  {
    id: "maha-thai-royal",
    name: "King Vajiralongkorn (Rama X)",
    title: "King of Thailand",
    country: "Thailand",
    countryCode: "TH",
    flag: "🇹🇭",
    dynasty: "Chakri Dynasty",
    houseName: "House of Chakri",
    reignSince: 2016,
    born: 1952,
    age: 72,
    successionOrder: "Princess Bajrakitiyabha (disputed/health concerns)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/King_Vajiralongkorn_%28cropped%29.jpg/440px-King_Vajiralongkorn_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Defender and Patron of Buddhism in Thailand",
    background:
      "Became king on October 13, 2016 following the death of his father King Bhumibol Adulyadej, one of the most revered monarchs in the world. Vajiralongkorn is a trained military officer and commercial pilot. He is controversial — spends much time in Germany, has been married four times. Thailand&#39;s lèse-majesté laws (Section 112) carry up to 15 years imprisonment.",
    keyFacts: [
      "Thailand&#39;s lèse-majesté law — criticising the monarchy carries up to 15 years in prison",
      "Spends much time in Bavaria, Germany — controversial for Thai public",
      "Issued massive personal land management to Bureau of the Royal Household",
      "Father King Bhumibol was one of the world&#39;s most revered monarchs (reigned 70 years)",
      "Pro-democracy protests 2020–21 openly called for monarchy reform — unprecedented",
    ],
    spouses: [
      "Queen Suthida (2019–present)",
      "Previously three wives, all divorced",
    ],
    children: [
      "Princess Bajrakitiyabha",
      "Princess Sirivannavari Nariratana",
      "Prince Dipangkorn Rasmijoti and others",
    ],
    region: "Asia-Pacific",
    netWorthNote:
      "Crown Property Bureau assets ~$30-60B (managed by the king personally since 2017 reform); personal fortune ~$30B",
  },
  {
    id: "mswati-eswatini-royal",
    name: "King Mswati III",
    title: "King of Eswatini",
    country: "Eswatini",
    countryCode: "SZ",
    flag: "🇸🇿",
    dynasty: "House of Dlamini",
    houseName: "House of Dlamini",
    reignSince: 1986,
    born: 1968,
    age: 56,
    successionOrder:
      "Heir not formally designated (customary selection at death)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/King_Mswati_III_2018_%28cropped%29.jpg/440px-King_Mswati_III_2018_%28cropped%29.jpg",
    systemType: "Absolute",
    religionRole: "Symbolic spiritual head in Swazi traditional religion",
    background:
      "Africa&#39;s last absolute monarch — the world&#39;s only remaining traditional absolute kingdom without any form of elected parliament. Ascended aged 18 from Sherborne School in England. All political parties are banned. Inherited from father Sobhuza II who reigned 82 years — the world&#39;s longest-reigning monarch ever.",
    keyFacts: [
      "Africa&#39;s last absolute monarch — no parliament, all parties banned",
      "Father Sobhuza II held world record for longest reign — 82 years (1899–1982)",
      "Has 15 wives and 23+ children by tradition",
      "63% of Eswatinis live below the poverty line despite royal wealth",
      "2021 pro-democracy protests suppressed with deadly force",
    ],
    spouses: ["15 wives by traditional Swazi custom"],
    children: ["23+ children"],
    region: "Africa",
    netWorthNote: "Personal fortune estimated ~$200M; country GDP ~$4.7B",
  },
  // ── AFRICA ────────────────────────────────────────────────────────────────
  {
    id: "mohammed6-morocco-royal",
    name: "King Mohammed VI",
    title: "King of Morocco and Amir Al-Mouminine",
    country: "Morocco",
    countryCode: "MA",
    flag: "🇲🇦",
    dynasty: "Alaoui Dynasty",
    houseName: "House of Alaoui",
    reignSince: 1999,
    born: 1963,
    age: 61,
    successionOrder: "Crown Prince: Moulay Hassan",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/King_Mohammed_VI_of_Morocco_%28cropped%29.jpg/440px-King_Mohammed_VI_of_Morocco_%28cropped%29.jpg",
    systemType: "Semi-Constitutional",
    religionRole:
      "Amir Al-Mouminine (Commander of the Faithful) — supreme religious authority in Morocco",
    background:
      "The Alaoui dynasty traces its origins to the Prophet Mohammed through Fatima, his daughter. Morocco&#39;s dual religious-political authority makes Mohammed VI one of the most legitimised rulers in the Arab world. Has overseen significant social reforms including women&#39;s rights advances. Abraham Accords — Morocco normalised with Israel in 2020.",
    keyFacts: [
      "Amir Al-Mouminine — Commander of the Faithful, supreme Islamic authority in Morocco",
      "Alaoui dynasty claims descent from Prophet Mohammed through Fatima",
      "Abraham Accords signatory — Morocco normalised Israel relations (2020) in exchange for Western Sahara recognition",
      "Morocco reached FIFA World Cup semifinals 2022 — first African and Arab nation",
      "Social reforms — Mudawwana family code (2004) expanded women&#39;s rights significantly",
    ],
    spouses: ["Princess Lalla Salma (2002–present, separated)"],
    children: ["Crown Prince Moulay Hassan", "Princess Lalla Khadija"],
    region: "Africa",
    netWorthNote:
      "Personal assets estimated ~$5.7B; controls significant business interests through Société Nationale d&#39;Investissement",
  },
  {
    id: "haile-lesotho-royal",
    name: "King Letsie III",
    title: "King of Lesotho",
    country: "Lesotho",
    countryCode: "LS",
    flag: "🇱🇸",
    dynasty: "House of Moshoeshoe",
    houseName: "House of Moshoeshoe",
    reignSince: 1996,
    born: 1963,
    age: 61,
    successionOrder: "Crown Prince: Lerotholi Seeiso",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/King_Letsie_III_%28cropped%29.jpg/440px-King_Letsie_III_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "No formal religious role",
    background:
      "King of the mountain kingdom of Lesotho — a country entirely surrounded by South Africa. A constitutional monarch with limited formal powers. His dynasty was founded by King Moshoeshoe I who united the Basotho people and secured British protection to prevent Boer expansion. Lesotho is known as the &#39;Kingdom in the Sky&#39;.",
    keyFacts: [
      "Kingdom of Lesotho is entirely landlocked within South Africa",
      "Moshoeshoe dynasty founded to protect Basotho from Boer expansion",
      "Constitutional monarchy — limited executive powers",
      "Lesotho is one of the world&#39;s highest countries — high plateau at 1,400m+ minimum",
      "Major water exporter to South Africa via Lesotho Highlands Water Project",
    ],
    spouses: ["Queen &#39;Masenate Mohato Seeiso (1990–present)"],
    children: ["Crown Prince Lerotholi Seeiso", "Daughter Letsebe Lydia"],
    region: "Africa",
    netWorthNote:
      "Civil List funded by Lesotho government; modest personal assets",
  },
  {
    id: "zwelithini-royal",
    name: "King Misuzulu kaZwelithini",
    title: "King of the Zulu Nation",
    country: "South Africa",
    countryCode: "ZA",
    flag: "🇿🇦",
    dynasty: "House of Zulu",
    houseName: "Royal Zulu House",
    reignSince: 2021,
    born: 1974,
    age: 50,
    successionOrder: "Heir not formally designated",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Misuzulu_kaZwelithini_%282022_cropped%29.jpg/440px-Misuzulu_kaZwelithini_%282022_cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Cultural and spiritual leader of the Zulu nation",
    background:
      "Became King of the Zulu Nation in 2021 following the death of his father King Goodwill Zwelithini who reigned 50 years. The Zulu are South Africa&#39;s largest ethnic group (~12 million people). The position is recognised by the South African government which provides funding. His succession was contested within the royal family.",
    keyFacts: [
      "King of South Africa&#39;s largest ethnic group — ~12 million Zulu people",
      "Ingonyama Trust — holds 2.8 million hectares of KwaZulu-Natal land in trust",
      "Father King Goodwill Zwelithini reigned 50 years — South Africa&#39;s longest-reigning traditional leader",
      "South African government recognises and funds the Zulu monarchy",
      "Zulu royal house contested his succession — court battles in 2022",
    ],
    spouses: ["Multiple wives per Zulu royal tradition"],
    children: ["Multiple children"],
    region: "Africa",
    netWorthNote:
      "South African government provides R71M/year for royal household; Ingonyama Trust land valued at ~$2B",
  },
  // ── PACIFIC ───────────────────────────────────────────────────────────────
  {
    id: "tupou6-tonga-royal",
    name: "King Tupou VI",
    title: "King of Tonga",
    country: "Tonga",
    countryCode: "TO",
    flag: "🇹🇴",
    dynasty: "House of Tupou",
    houseName: "Tupou Dynasty",
    reignSince: 2012,
    born: 1959,
    age: 65,
    successionOrder: "Crown Prince: Tupoutoʻa ʻUlukalala",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/King_Tupou_VI_of_Tonga_%28cropped%29.jpg/440px-King_Tupou_VI_of_Tonga_%28cropped%29.jpg",
    systemType: "Constitutional",
    religionRole: "Methodist Christian — Tonga is deeply Christian",
    background:
      "The Kingdom of Tonga is the Pacific&#39;s only remaining monarchy. The Tupou dynasty dates from 1875 when King George Tupou I united the islands. A constitutional monarchy since 2010 reforms that transferred significant powers from the king to an elected parliament. Tonga was devastated by the Hunga Tonga–Hunga Haʻapai volcanic eruption in January 2022.",
    keyFacts: [
      "Only remaining monarchy in the Pacific",
      "Tupou dynasty has reigned since 1845 — longest-ruling Pacific dynasty",
      "2010 constitutional reforms transferred most powers to elected parliament",
      "2022 Hunga Tonga volcanic eruption — one of the most powerful in modern history",
      "Tonga is deeply Christian — Sunday is completely closed by law",
    ],
    spouses: ["Queen Nanasipauʻu Tukuʻaho (1990–present)"],
    children: ["Crown Prince Tupoutoʻa ʻUlukalala", "Lady Salamasina Taufa"],
    region: "Asia-Pacific",
    netWorthNote: "Tonga GDP ~$500M; Royal House assets modest",
  },
];

export function getMonarchs(): RoyalMember[] {
  return ROYAL_FAMILIES;
}

export function getMonarchsByRegion(region: string): RoyalMember[] {
  if (region === "All Regions") return ROYAL_FAMILIES;
  return ROYAL_FAMILIES.filter((r) => r.region === region);
}
