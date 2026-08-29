export type ConflictType =
  | "War"
  | "Proxy War"
  | "Civil War"
  | "Protest"
  | "Riot"
  | "Natural Disaster"
  | "Economic Crisis"
  | "Political Instability"
  | "Terrorism";

export type IntensityLevel = "Critical" | "High" | "Medium" | "Low";

export interface EconomicImpact {
  indicator: string;
  value: string;
  detail: string;
  direction: "up" | "down" | "neutral";
}

export interface PolicyEntry {
  year: number;
  title: string;
  detail: string;
  outcome: "positive" | "negative" | "neutral";
}

export interface Background {
  origins: string;
  keyActors: { name: string; role: string }[];
  timeline: { year: number; event: string }[];
}

export interface Prioritization {
  urgencyLevel: "Critical" | "High" | "Medium" | "Low";
  internationalAttention: string;
  keyChallenges: string[];
  proposedSolutions: string[];
}

export interface BudgetEntry {
  category: string;
  amount: string;
  note: string;
}

export interface Conflict {
  id: string;
  name: string;
  type: ConflictType;
  intensity: IntensityLevel;
  region: string;
  countries: string[];
  startYear: number;
  active: boolean;
  description: string;
  casualties?: number;
  displaced?: number;
  tags: string[];
  lastUpdate: string;
  trend: "Escalating" | "Stable" | "De-escalating";
  lat: number;
  lng: number;
  economicImpacts?: EconomicImpact[];
  policyHistory?: PolicyEntry[];
  background?: Background;
  prioritization?: Prioritization;
  budgets?: BudgetEntry[];
}

export const conflictsData: Conflict[] = [
  {
    id: "russia-ukraine",
    name: "Russia–Ukraine War",
    type: "War",
    intensity: "Critical",
    region: "Eastern Europe",
    countries: ["Russia", "Ukraine"],
    startYear: 2022,
    active: true,
    description:
      "Full-scale Russian invasion of Ukraine launched in February 2022. Largest conventional land war in Europe since WWII, involving NATO weapon supplies to Ukraine, prolonged trench warfare in the Donbas, and massive civilian displacement.",
    casualties: 500000,
    displaced: 8.2,
    tags: ["NATO", "nuclear threat", "sanctions", "energy crisis"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 49.8,
    lng: 35.2,
    background: {
      origins:
        "Russia and Ukraine share deep historical, cultural, and linguistic ties dating to Kievan Rus. After Ukraine's 1991 independence, tensions grew over NATO expansion, Russian gas pricing disputes, and Ukraine's political orientation. The 2014 Euromaidan revolution, Russia's annexation of Crimea, and the outbreak of war in Donbas set the stage for full-scale invasion. Putin framed NATO's eastward expansion as an existential threat to Russia.",
      keyActors: [
        {
          name: "Vladimir Putin",
          role: "President of Russia, architect of the invasion",
        },
        {
          name: "Volodymyr Zelensky",
          role: "President of Ukraine, leading wartime resistance",
        },
        {
          name: "NATO",
          role: "Provides weapons, intelligence, and logistical support to Ukraine",
        },
        {
          name: "Wagner Group / Russian Forces",
          role: "Russian paramilitary and regular forces conducting offensive operations",
        },
        {
          name: "United States",
          role: "Largest single provider of military and financial aid to Ukraine",
        },
        {
          name: "European Union",
          role: "Coordinated sanctions against Russia; major aid donor",
        },
      ],
      timeline: [
        {
          year: 1991,
          event:
            "Ukraine declares independence following dissolution of the USSR",
        },
        {
          year: 1994,
          event:
            "Budapest Memorandum — Ukraine gives up nuclear weapons in exchange for security assurances from Russia, US, and UK",
        },
        {
          year: 2004,
          event:
            "Orange Revolution in Kyiv; pro-Western Viktor Yushchenko wins presidency",
        },
        {
          year: 2014,
          event:
            "Euromaidan revolution ousts pro-Russian President Yanukovych; Russia annexes Crimea; war begins in Donbas",
        },
        {
          year: 2015,
          event:
            "Minsk II ceasefire agreement signed; low-intensity conflict continues in eastern Ukraine",
        },
        {
          year: 2022,
          event:
            "Russia launches full-scale invasion on February 24; Ukraine repels initial assault on Kyiv",
        },
        {
          year: 2023,
          event:
            "Ukraine's summer counteroffensive makes limited gains; front lines largely stabilize",
        },
        {
          year: 2024,
          event:
            "Russia advances in eastern Donbas; Western aid packages debated amid war fatigue",
        },
        {
          year: 2025,
          event:
            "Ceasefire negotiations begin under US pressure; frontlines remain contested",
        },
      ],
    },
  },
  {
    id: "israel-gaza",
    name: "Israel–Hamas War (Gaza)",
    type: "War",
    intensity: "Critical",
    region: "Middle East",
    countries: ["Israel", "Palestine", "Lebanon"],
    startYear: 2023,
    active: true,
    description:
      "Military conflict ignited by Hamas's October 7, 2023 attack on Israel, followed by a massive Israeli ground and air offensive in the Gaza Strip. Escalated to include Hezbollah in Lebanon and regional proxy exchanges.",
    casualties: 45000,
    displaced: 1.9,
    tags: [
      "humanitarian crisis",
      "Hezbollah",
      "ceasefire talks",
      "regional escalation",
    ],
    lastUpdate: "2026-04",
    trend: "De-escalating",
    lat: 31.5,
    lng: 34.5,
    background: {
      origins:
        "The Israeli-Palestinian conflict stems from competing national claims to the same land stretching back over a century. The 1948 Arab-Israeli War, the 1967 occupation of Gaza and the West Bank, and decades of failed peace processes created a protracted cycle of violence. Hamas, which won Palestinian legislative elections in 2006 and took control of Gaza in 2007, has fought multiple wars with Israel. The blockade of Gaza, settlement expansion in the West Bank, and repeated failures of two-state negotiations radicalized populations on both sides.",
      keyActors: [
        {
          name: "Hamas",
          role: "Islamist militant group governing Gaza; launched October 7 attack",
        },
        {
          name: "Israel Defense Forces (IDF)",
          role: "Conducting ground, air, and naval operations across Gaza and Lebanon",
        },
        {
          name: "Hezbollah",
          role: "Iran-backed Lebanese militant group; opened northern front against Israel",
        },
        {
          name: "Benjamin Netanyahu",
          role: "Israeli Prime Minister overseeing military campaign",
        },
        {
          name: "Yahya Sinwar (d. 2024)",
          role: "Hamas political chief in Gaza; killed by IDF in October 2024",
        },
        {
          name: "United States",
          role: "Key military supplier to Israel; mediating ceasefire negotiations",
        },
        {
          name: "Qatar / Egypt",
          role: "Primary mediators between Israel and Hamas for hostage-ceasefire deals",
        },
      ],
      timeline: [
        {
          year: 1948,
          event:
            "Israel declared independent; Arab-Israeli War results in 700,000 Palestinian refugees (Nakba)",
        },
        {
          year: 1967,
          event:
            "Six-Day War — Israel occupies Gaza Strip, West Bank, and Sinai; begins settlement construction",
        },
        {
          year: 1993,
          event:
            "Oslo Accords signed; Palestinian Authority established; peace process begins",
        },
        {
          year: 2007,
          event:
            "Hamas seizes control of Gaza; Israel and Egypt impose blockade",
        },
        {
          year: 2008,
          event:
            "Operation Cast Lead — first major Israel-Gaza war; 1,400 Palestinians killed",
        },
        {
          year: 2014,
          event:
            "Operation Protective Edge — 50-day war; 2,200 Palestinians and 73 Israelis killed",
        },
        {
          year: 2021,
          event:
            "11-day conflict following Sheikh Jarrah evictions; brokered ceasefire",
        },
        {
          year: 2023,
          event:
            "October 7 — Hamas attacks kill 1,200 Israelis, 251 taken hostage; Israel launches full-scale offensive",
        },
        {
          year: 2024,
          event:
            "Ground invasion of Rafah; Sinwar killed; Hezbollah ceasefire brokered in November",
        },
        {
          year: 2025,
          event:
            "Phase 1 ceasefire and hostage deal; Gaza reconstruction talks begin amid political deadlock",
        },
      ],
    },
  },
  {
    id: "sudan-civil-war",
    name: "Sudan Civil War",
    type: "Civil War",
    intensity: "Critical",
    region: "East Africa",
    countries: ["Sudan"],
    startYear: 2023,
    active: true,
    description:
      "Armed conflict between the Sudanese Armed Forces and the Rapid Support Forces erupted in April 2023. Characterized by urban combat in Khartoum, mass atrocities in Darfur, and a catastrophic humanitarian emergency.",
    casualties: 18000,
    displaced: 7.1,
    tags: ["RSF", "Darfur", "hunger", "humanitarian collapse"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 15.5,
    lng: 32.5,
    background: {
      origins:
        "Sudan has been wracked by instability since independence in 1956, including decades of civil war between the Arab-dominated north and the African south — a conflict that eventually led to South Sudan's secession in 2011. In 2019, a popular uprising ousted longtime dictator Omar al-Bashir. A transitional civilian-military government formed, but a 2021 coup by the Sudanese Armed Forces (SAF) under General Burhan upended the democratic transition. The Rapid Support Forces (RSF), a powerful paramilitary descended from the Janjaweed militias of Darfur infamy, grew into a rival power center under General Dagalo ('Hemedti'). Tensions over RSF integration into the formal military exploded into open war in April 2023.",
      keyActors: [
        {
          name: "Sudanese Armed Forces (SAF)",
          role: "National military led by General Abdel Fattah al-Burhan",
        },
        {
          name: "Rapid Support Forces (RSF)",
          role: "Paramilitary force led by General Mohamed Hamdan Dagalo ('Hemedti')",
        },
        {
          name: "General al-Burhan",
          role: "SAF commander and de facto head of state",
        },
        {
          name: "General 'Hemedti' Dagalo",
          role: "RSF commander; rival claimant to power",
        },
        {
          name: "UAE",
          role: "Alleged supporter of RSF through arms and funding",
        },
        {
          name: "African Union / UN",
          role: "Attempting mediation; largely sidelined by both parties",
        },
      ],
      timeline: [
        {
          year: 1956,
          event: "Sudan gains independence from Anglo-Egyptian Condominium",
        },
        {
          year: 2003,
          event:
            "Darfur genocide begins; Janjaweed militias (RSF precursor) massacre non-Arab communities",
        },
        {
          year: 2011,
          event:
            "South Sudan secedes following referendum; Sudan loses its oil-rich south",
        },
        {
          year: 2019,
          event:
            "Mass protests topple Omar al-Bashir after 30 years; transitional council formed",
        },
        {
          year: 2021,
          event:
            "Military coup by SAF and RSF ousts civilian government; protests brutally suppressed",
        },
        {
          year: 2023,
          event:
            "April 15 — SAF and RSF clash in Khartoum; war spreads across Sudan within days",
        },
        {
          year: 2024,
          event:
            "RSF captures most of Darfur; mass atrocities documented; 7M+ displaced",
        },
        {
          year: 2025,
          event:
            "SAF retakes parts of Khartoum; conflict grinds on with no peace process in sight",
        },
      ],
    },
  },
  {
    id: "myanmar-civil-war",
    name: "Myanmar Civil War",
    type: "Civil War",
    intensity: "High",
    region: "Southeast Asia",
    countries: ["Myanmar"],
    startYear: 2021,
    active: true,
    description:
      "Intensified multi-front civil war following the 2021 military coup. Armed resistance by the People's Defence Force and ethnic armed organizations has dramatically expanded in 2023–24, with the junta losing territory.",
    casualties: 50000,
    displaced: 2.6,
    tags: ["military junta", "ethnic armies", "coup", "resistance"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 21.9,
    lng: 96.1,
    background: {
      origins:
        "Myanmar (Burma) has experienced near-continuous civil conflict since independence in 1948, with numerous ethnic armed organizations (EAOs) fighting for autonomy in border regions. A decade of partial democratic reform under Aung San Suu Kyi ended abruptly when the military (Tatmadaw) seized power in a February 2021 coup, claiming fraud in the 2020 elections. The coup triggered a nationwide civil disobedience movement and, after brutal crackdowns, armed resistance flourished under the People's Defence Force (PDF) and aligned EAOs.",
      keyActors: [
        {
          name: "Tatmadaw (Myanmar Military)",
          role: "Ruling junta led by Senior General Min Aung Hlaing",
        },
        {
          name: "People's Defence Force (PDF)",
          role: "Armed wing of the National Unity Government; formed by pro-democracy civilians",
        },
        {
          name: "Three Brotherhood Alliance",
          role: "Coalition of EAOs (TNLA, MNDAA, AA) that launched Operation 1027 in late 2023",
        },
        {
          name: "Arakan Army (AA)",
          role: "Dominant force in Rakhine State; controls most of the region",
        },
        {
          name: "Aung San Suu Kyi",
          role: "Elected leader imprisoned by junta; symbol of resistance movement",
        },
        {
          name: "China",
          role: "Maintains influence over northern EAOs; concerned about border stability",
        },
      ],
      timeline: [
        {
          year: 1948,
          event:
            "Burma gains independence; ethnic conflicts begin almost immediately",
        },
        {
          year: 1962,
          event: "Military coup establishes junta rule that would last decades",
        },
        {
          year: 2010,
          event:
            "Myanmar begins democratic transition; Aung San Suu Kyi released from house arrest",
        },
        {
          year: 2015,
          event:
            "Nationwide Ceasefire Agreement signed with some EAOs; Suu Kyi's NLD wins elections",
        },
        {
          year: 2021,
          event:
            "February 1 coup; military arrests Suu Kyi; mass protests met with lethal force",
        },
        {
          year: 2022,
          event:
            "PDF and EAO resistance intensifies; junta loses control of rural areas",
        },
        {
          year: 2023,
          event:
            "Operation 1027 — Three Brotherhood Alliance seizes major towns in northern Shan State",
        },
        {
          year: 2024,
          event:
            "Arakan Army controls most of Rakhine; junta territory shrinks to cities and highways",
        },
        {
          year: 2025,
          event:
            "Junta loses Lashio, the largest city in northern Myanmar; collapse scenarios debated",
        },
      ],
    },
  },
  {
    id: "ethiopia-tigray",
    name: "Ethiopia Tigray Conflict",
    type: "Civil War",
    intensity: "Medium",
    region: "East Africa",
    countries: ["Ethiopia"],
    startYear: 2020,
    active: false,
    description:
      "Two-year war between the Ethiopian government and Tigray People's Liberation Front. Ceasefire signed in November 2022, but fragile peace remains with ongoing Amhara and Oromia unrest.",
    casualties: 300000,
    displaced: 2.2,
    tags: ["TPLF", "ceasefire", "famine risk", "Amhara"],
    lastUpdate: "2026-01",
    trend: "De-escalating",
    lat: 14.1,
    lng: 38.7,
  },
  {
    id: "sahel-insurgency",
    name: "Sahel Jihadist Insurgency",
    type: "Terrorism",
    intensity: "High",
    region: "West Africa",
    countries: ["Mali", "Burkina Faso", "Niger", "Chad"],
    startYear: 2012,
    active: true,
    description:
      "Expanding Islamic extremist insurgencies (JNIM, ISGS) across the Sahel. Military juntas in Mali, Burkina Faso, and Niger replaced western partnerships with Russian Wagner Group forces.",
    casualties: 20000,
    displaced: 3.1,
    tags: ["Wagner Group", "JNIM", "ISGS", "junta", "France withdrawal"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 15.0,
    lng: -2.0,
    background: {
      origins:
        "The Sahel crisis traces back to the 2011 collapse of Libya under NATO intervention, which flooded the region with weapons and displaced Tuareg fighters who had served in Gaddafi's forces. A 2012 Tuareg rebellion in northern Mali created a power vacuum exploited by jihadist groups. Al-Qaeda affiliate JNIM and later the Islamic State in the Greater Sahara (ISGS) expanded across ungoverned territory. Poverty, climate change, inter-ethnic competition over land and water, and weak governance provided fertile recruitment ground.",
      keyActors: [
        {
          name: "JNIM (Jama'at Nusrat al-Islam wal-Muslimin)",
          role: "Al-Qaeda-linked coalition; dominant jihadist force in Mali and Burkina Faso",
        },
        {
          name: "ISGS (Islamic State Greater Sahara)",
          role: "ISIS affiliate operating in the tri-border area of Mali, Niger, Burkina Faso",
        },
        {
          name: "Wagner Group / Africa Corps",
          role: "Russian mercenaries replacing French forces across Mali and Burkina Faso",
        },
        {
          name: "Alliance of Sahel States (AES)",
          role: "Political and security bloc formed by Mali, Burkina Faso, and Niger juntas",
        },
        {
          name: "France",
          role: "Former lead counter-terror power; expelled from Mali (2022), Burkina Faso (2023), Niger (2023)",
        },
        {
          name: "ECOWAS",
          role: "West African bloc attempting diplomatic pressure on juntas",
        },
      ],
      timeline: [
        {
          year: 2011,
          event:
            "Libyan civil war collapses Gaddafi regime; weapons flood the Sahel",
        },
        {
          year: 2012,
          event:
            "Tuareg rebellion and jihadist takeover of northern Mali; French Operation Serval halts advance",
        },
        {
          year: 2013,
          event:
            "Operation Barkhane begins — France deploys 5,000 troops across the Sahel",
        },
        {
          year: 2017,
          event:
            "JNIM formed as an al-Qaeda merger of four Sahel militant groups",
        },
        {
          year: 2020,
          event: "Mali military coup; Wagner Group begins deployment",
        },
        {
          year: 2022,
          event:
            "France expelled from Mali; second Burkina Faso coup; insurgency spreads south",
        },
        {
          year: 2023,
          event:
            "Niger coup; France expelled; AES formed; ECOWAS imposing sanctions",
        },
        {
          year: 2024,
          event:
            "Jihadist attacks reach coastal states (Benin, Togo, Ivory Coast border regions)",
        },
        {
          year: 2025,
          event:
            "JNIM controls more territory than ever; Wagner/Africa Corps unable to reverse tide",
        },
      ],
    },
  },
  {
    id: "drc-eastern-conflict",
    name: "DR Congo Eastern Conflict (M23)",
    type: "Civil War",
    intensity: "Critical",
    region: "Central Africa",
    countries: ["DR Congo", "Rwanda", "Uganda"],
    startYear: 2021,
    active: true,
    description:
      "Resurgent M23 rebel movement backed by Rwanda seized Goma in January 2025. Widespread civilian massacres, mass displacement, and a brewing regional war involving multiple armed groups.",
    casualties: 10000,
    displaced: 6.9,
    tags: ["M23", "Rwanda", "minerals", "regional war", "Goma"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: -1.7,
    lng: 29.2,
    background: {
      origins:
        "Eastern DRC has been in near-continuous conflict since the 1994 Rwandan genocide, which sent millions of Hutu refugees — including genocidaires — across the border. Successive Congo Wars (1996–1997, 1998–2003) drew in nine African nations. The eastern provinces of North and South Kivu became home to over 100 armed groups competing over mineral wealth (coltan, gold, tin) critical for global electronics supply chains. M23 ('March 23 Movement') formed in 2012 from Congolese Tutsi ex-soldiers who claimed the DRC government violated peace commitments. Rwanda's support for M23 is widely documented by UN experts, driven by security concerns (FDLR Hutu militants in DRC) and economic interests in Congolese minerals.",
      keyActors: [
        {
          name: "M23 / AFC",
          role: "Rwandan-backed Congolese Tutsi rebel movement; controls Goma and surroundings as of 2025",
        },
        {
          name: "Rwanda (RDF)",
          role: "Provides direct military support to M23; denies formal involvement",
        },
        {
          name: "FARDC",
          role: "DRC national army; outgunned and demoralized in the east",
        },
        {
          name: "FDLR",
          role: "Hutu militant group with roots in Rwanda genocide; DRC government's unofficial ally",
        },
        {
          name: "Felix Tshisekedi",
          role: "DRC President; struggling to respond to eastern collapse",
        },
        {
          name: "Paul Kagame",
          role: "Rwandan President; accused by UN of backing M23",
        },
        {
          name: "MONUSCO",
          role: "UN peacekeeping mission in DRC; widely criticized as ineffective; withdrawing",
        },
      ],
      timeline: [
        {
          year: 1994,
          event:
            "Rwandan genocide kills ~800,000 Tutsi; Hutu perpetrators flee to eastern Zaire (DRC)",
        },
        {
          year: 1996,
          event:
            "First Congo War — Rwanda and Uganda invade to pursue Hutu militants; Mobutu toppled",
        },
        {
          year: 1998,
          event:
            "Second Congo War ('Africa's World War') — 9 nations involved; 5M+ deaths by conflict's end",
        },
        {
          year: 2012,
          event:
            "M23 forms; seizes Goma briefly before withdrawing under international pressure",
        },
        {
          year: 2013,
          event:
            "M23 defeated by UN intervention; rebels disband and flee to Uganda and Rwanda",
        },
        {
          year: 2021,
          event:
            "M23 re-emerges after DRC fails to integrate fighters; offensive begins in North Kivu",
        },
        {
          year: 2022,
          event:
            "UN Group of Experts reports Rwanda's direct military support for M23",
        },
        {
          year: 2024,
          event:
            "M23 surrounds Goma; fighting displaces millions; DRC-Rwanda relations collapse",
        },
        {
          year: 2025,
          event:
            "M23 seizes Goma (January) and Bukavu; regional war fears grow; AU mediation attempts fail",
        },
      ],
    },
  },
  {
    id: "yemen-civil-war",
    name: "Yemen War",
    type: "Proxy War",
    intensity: "High",
    region: "Middle East",
    countries: ["Yemen", "Saudi Arabia", "Iran"],
    startYear: 2015,
    active: true,
    description:
      "Multi-sided war between the Saudi-led coalition backing the Yemeni government and Iran-backed Houthi forces. Houthis have also attacked Red Sea shipping, drawing US/UK military strikes.",
    casualties: 150000,
    displaced: 4.5,
    tags: ["Houthis", "Saudi Arabia", "Iran", "Red Sea", "famine"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 15.6,
    lng: 44.2,
    background: {
      origins:
        "Yemen has been the Arab world's poorest country for decades, plagued by tribal fragmentation, weak central government, and a north-south divide from its 1990 unification. The 2011 Arab Spring forced longtime President Ali Abdullah Saleh from power. His successor, Abd Rabbuh Mansur Hadi, faced a Houthi rebellion in the north and a southern separatist movement. In 2014, Houthi forces (Ansar Allah), backed by Iran's Revolutionary Guard, swept south and captured the capital Sanaa. Saudi Arabia launched a military coalition in 2015 to restore Hadi's government, beginning what became the world's worst humanitarian crisis.",
      keyActors: [
        {
          name: "Houthis (Ansar Allah)",
          role: "Iran-backed Shia movement controlling Sanaa and northern Yemen",
        },
        {
          name: "Saudi-led Coalition",
          role: "Military alliance of Arab states conducting airstrikes; backing internationally recognized government",
        },
        {
          name: "Iran (IRGC)",
          role: "Supplies Houthis with drones, missiles, and training",
        },
        {
          name: "Southern Transitional Council (STC)",
          role: "UAE-backed southern separatist movement",
        },
        {
          name: "United States",
          role: "Conducted strikes on Houthi missile/drone infrastructure after Red Sea attacks began",
        },
        {
          name: "UN Special Envoy",
          role: "Mediating negotiations between Houthis and Yemeni government",
        },
      ],
      timeline: [
        {
          year: 1990,
          event:
            "North and South Yemen unify; tensions persist between regions",
        },
        {
          year: 2011,
          event:
            "Arab Spring protests force President Saleh to transfer power to Hadi",
        },
        {
          year: 2014,
          event:
            "Houthis seize Sanaa; Hadi flees to Saudi Arabia; state collapses",
        },
        {
          year: 2015,
          event:
            "Saudi-led coalition begins airstrikes; UAE deploys ground forces; blockade imposed",
        },
        {
          year: 2018,
          event:
            "Battle of Hodeidah port; UN-brokered Stockholm Agreement pauses fighting",
        },
        {
          year: 2022,
          event:
            "UN-mediated truce — longest pause in fighting since 2015; Saudi-Iran talks begin",
        },
        {
          year: 2023,
          event:
            "Saudi-Iran rapprochement brokered by China; Houthis launch Red Sea drone/missile attacks",
        },
        {
          year: 2024,
          event:
            "US and UK conduct over 500 airstrikes against Houthi targets; Red Sea shipping routes disrupted",
        },
        {
          year: 2025,
          event:
            "Ceasefire deal reached; Houthis agree to halt Red Sea attacks in exchange for aid easing",
        },
      ],
    },
  },
  {
    id: "somalia-al-shabaab",
    name: "Somalia – Al-Shabaab Insurgency",
    type: "Terrorism",
    intensity: "High",
    region: "East Africa",
    countries: ["Somalia", "Kenya"],
    startYear: 2006,
    active: true,
    description:
      "Long-running insurgency by al-Shabaab against the Somali Federal Government and ATMIS peacekeepers. Regular bombings, raids, and contested rural territory, with cross-border attacks into Kenya.",
    casualties: 500000,
    displaced: 3.8,
    tags: ["al-Shabaab", "AU forces", "ATMIS", "piracy"],
    lastUpdate: "2026-03",
    trend: "Stable",
    lat: 5.1,
    lng: 45.3,
  },
  {
    id: "south-sudan-conflict",
    name: "South Sudan Instability",
    type: "Political Instability",
    intensity: "High",
    region: "East Africa",
    countries: ["South Sudan"],
    startYear: 2013,
    active: true,
    description:
      "Recurring inter-communal violence, political power struggles and periodic armed confrontations. Peace deal remains fragile; elections repeatedly delayed.",
    casualties: 400000,
    displaced: 2.2,
    tags: ["inter-communal", "oil", "famine", "aid"],
    lastUpdate: "2026-02",
    trend: "Stable",
    lat: 6.8,
    lng: 31.3,
  },
  {
    id: "nagorno-karabakh",
    name: "Nagorno-Karabakh",
    type: "War",
    intensity: "Low",
    region: "South Caucasus",
    countries: ["Azerbaijan", "Armenia"],
    startYear: 2020,
    active: false,
    description:
      "Azerbaijan's September 2023 offensive retook all of Nagorno-Karabakh, ending Armenian control. Over 100,000 Armenians fled. Peace negotiations ongoing over final borders.",
    casualties: 7000,
    displaced: 0.1,
    tags: ["ceasefire", "Armenia", "Azerbaijan", "peace talks"],
    lastUpdate: "2025-12",
    trend: "De-escalating",
    lat: 39.9,
    lng: 46.8,
  },
  {
    id: "kashmir-line-of-control",
    name: "India–Pakistan Kashmir Tensions",
    type: "Political Instability",
    intensity: "High",
    region: "South Asia",
    countries: ["India", "Pakistan"],
    startYear: 1947,
    active: true,
    description:
      "Longstanding dispute over Jammu & Kashmir. Periodic cross-LoC firing, militant attacks, and aerial confrontations. Pahalgam tourist massacre in April 2025 sparked severe bilateral crisis including suspension of Indus Waters Treaty.",
    casualties: 0,
    displaced: 0,
    tags: [
      "nuclear powers",
      "LoC",
      "militants",
      "Indus Waters",
      "diplomatic crisis",
    ],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 34.0,
    lng: 74.8,
    background: {
      origins:
        "Kashmir's disputed status dates to the chaotic partition of British India in 1947, when Muslim-majority Kashmir's Hindu Maharaja acceded to India rather than Pakistan following a Pakistani-backed tribal invasion. India and Pakistan have fought three wars (1947, 1965, 1971) and a limited conflict (Kargil, 1999) over the territory. Both nations acquired nuclear weapons by 1998, transforming the dispute into the world's most dangerous live territorial standoff. India controls the Kashmir Valley and Ladakh; Pakistan controls Azad Kashmir and Gilgit-Baltistan; China occupies Aksai Chin. A decades-long insurgency in Indian-administered Kashmir, backed at various times by Pakistan's intelligence service (ISI), has killed tens of thousands.",
      keyActors: [
        {
          name: "India (Government / Army)",
          role: "Controls J&K; revoked Article 370 special status in 2019; pursuing counter-insurgency",
        },
        {
          name: "Pakistan (ISI / Army)",
          role: "Supports militant groups; contests Indian sovereignty; nuclear deterrent posture",
        },
        {
          name: "Lashkar-e-Taiba / Jaish-e-Mohammed",
          role: "Pakistan-based militant groups responsible for major attacks in Kashmir and India",
        },
        {
          name: "Narendra Modi",
          role: "Indian PM; revoked J&K autonomy in 2019; hardline stance on Pakistan",
        },
        {
          name: "Shehbaz Sharif",
          role: "Pakistani PM navigating severe economic crisis alongside military standoff",
        },
        {
          name: "China",
          role: "Controls Aksai Chin; tacit support for Pakistan; adversary of India in Himalayas",
        },
      ],
      timeline: [
        {
          year: 1947,
          event:
            "Partition of British India; Kashmir accedes to India; first India-Pakistan war begins",
        },
        {
          year: 1965,
          event:
            "Second India-Pakistan war over Kashmir; ends in UN-mediated ceasefire",
        },
        {
          year: 1971,
          event:
            "Third war; India helps East Pakistan become Bangladesh; Pakistan humiliated",
        },
        {
          year: 1989,
          event:
            "Armed insurgency begins in Indian-administered Kashmir; thousands killed over next decade",
        },
        {
          year: 1998,
          event:
            "Both India and Pakistan conduct nuclear tests; become declared nuclear powers",
        },
        {
          year: 1999,
          event:
            "Kargil War — Pakistan-backed fighters seize Indian positions; nuclear brinkmanship; India retakes territory",
        },
        {
          year: 2001,
          event:
            "Attack on Indian parliament blamed on Pakistan-based militants; 700,000 troops mass at border",
        },
        {
          year: 2019,
          event:
            "India revokes Article 370; bifurcates J&K into two union territories; Pakistan suspends trade and diplomatic ties",
        },
        {
          year: 2025,
          event:
            "Pahalgam massacre of tourists; India suspends Indus Waters Treaty, expels diplomats; surgical strikes launched",
        },
      ],
    },
  },
  {
    id: "haiti-gang-crisis",
    name: "Haiti Gang Crisis",
    type: "Political Instability",
    intensity: "Critical",
    region: "Caribbean",
    countries: ["Haiti"],
    startYear: 2021,
    active: true,
    description:
      "Armed gang coalitions control much of Port-au-Prince after PM Ariel Henry's resignation in 2024. Kenya-led multinational security mission deployed. State near collapse.",
    casualties: 5000,
    displaced: 0.6,
    tags: ["gangs", "state collapse", "Kenya mission", "MSS"],
    lastUpdate: "2026-03",
    trend: "Stable",
    lat: 18.5,
    lng: -72.3,
  },
  {
    id: "taiwan-strait-tensions",
    name: "Taiwan Strait Tensions",
    type: "Political Instability",
    intensity: "High",
    region: "East Asia",
    countries: ["China", "Taiwan", "United States"],
    startYear: 1950,
    active: true,
    description:
      "Ongoing Chinese military pressure on Taiwan through air and naval incursions, large-scale drills, and economic coercion. US arms sales and increasing military presence in the region escalate tensions.",
    tags: ["PLA", "TSMC", "semiconductor war", "US-China"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 24.0,
    lng: 121.5,
  },
  {
    id: "south-china-sea",
    name: "South China Sea Disputes",
    type: "Political Instability",
    intensity: "High",
    region: "East/Southeast Asia",
    countries: ["China", "Philippines", "Vietnam", "Malaysia", "Taiwan"],
    startYear: 1974,
    active: true,
    description:
      "Territorial disputes over islands, reefs and maritime zones. Chinese coast guard water cannon attacks on Philippine resupply missions to Second Thomas Shoal in 2023–24 sparked direct confrontations.",
    tags: ["Spratly Islands", "UNCLOS", "maritime", "PLA Navy"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 12.0,
    lng: 114.0,
  },
  {
    id: "turkey-earthquake-2023",
    name: "Turkey–Syria Earthquake",
    type: "Natural Disaster",
    intensity: "Critical",
    region: "Middle East / Eastern Mediterranean",
    countries: ["Turkey", "Syria"],
    startYear: 2023,
    active: false,
    description:
      "Devastating M7.8 earthquake struck on February 6, 2023. Over 59,000 killed, 100,000+ buildings destroyed. Reconstruction ongoing; worst natural disaster in Turkey's modern history.",
    casualties: 59259,
    displaced: 3.5,
    tags: ["earthquake", "reconstruction", "WHO response"],
    lastUpdate: "2025-06",
    trend: "De-escalating",
    lat: 37.0,
    lng: 37.2,
  },
  {
    id: "morocco-earthquake-2023",
    name: "Morocco High Atlas Earthquake",
    type: "Natural Disaster",
    intensity: "High",
    region: "North Africa",
    countries: ["Morocco"],
    startYear: 2023,
    active: false,
    description:
      "M6.8 earthquake struck the High Atlas region on September 8, 2023, killing 2,946 and injuring 5,674. Remote mountain villages suffered near-total destruction.",
    casualties: 2946,
    displaced: 0.3,
    tags: ["earthquake", "Marrakech", "reconstruction"],
    lastUpdate: "2025-04",
    trend: "De-escalating",
    lat: 31.1,
    lng: -8.4,
  },
  {
    id: "libya-derna-flood",
    name: "Libya Derna Floods",
    type: "Natural Disaster",
    intensity: "High",
    region: "North Africa",
    countries: ["Libya"],
    startYear: 2023,
    active: false,
    description:
      "Storm Daniel caused catastrophic flooding in September 2023 after two dams burst near Derna, sweeping entire neighborhoods into the sea. Over 11,000 killed.",
    casualties: 11300,
    displaced: 0.1,
    tags: ["flood", "dam failure", "Mediterranean storm"],
    lastUpdate: "2025-03",
    trend: "De-escalating",
    lat: 32.7,
    lng: 22.7,
  },
  {
    id: "afghanistan-earthquakes-2023",
    name: "Afghanistan Earthquake Series",
    type: "Natural Disaster",
    intensity: "High",
    region: "Central/South Asia",
    countries: ["Afghanistan"],
    startYear: 2023,
    active: false,
    description:
      "Multiple severe earthquakes struck Herat province in October 2023, killing over 1,400. Taliban restrictions on female aid workers hampered relief. Afghanistan remains the world's worst humanitarian crisis.",
    casualties: 1400,
    displaced: 0.2,
    tags: ["earthquake", "Taliban", "humanitarian access"],
    lastUpdate: "2024-12",
    trend: "De-escalating",
    lat: 34.3,
    lng: 62.2,
  },
  {
    id: "vanuatu-earthquake-2024",
    name: "Vanuatu Earthquake 2024",
    type: "Natural Disaster",
    intensity: "High",
    region: "Pacific",
    countries: ["Vanuatu"],
    startYear: 2024,
    active: false,
    description:
      "M7.3 earthquake struck Port Vila on December 17, 2024, killing at least 14 and injuring hundreds. Severe building damage and communications disruption across the capital.",
    casualties: 14,
    displaced: 0.04,
    tags: ["earthquake", "Pacific", "Port Vila"],
    lastUpdate: "2025-02",
    trend: "De-escalating",
    lat: -17.7,
    lng: 168.3,
  },
  {
    id: "argentina-economic-crisis",
    name: "Argentina Economic Crisis",
    type: "Economic Crisis",
    intensity: "High",
    region: "South America",
    countries: ["Argentina"],
    startYear: 2023,
    active: true,
    description:
      "Annual inflation reached 211% in 2023. President Milei implemented deep austerity under the 'chainsaw plan.' IMF negotiations, peso devaluation, and social unrest from spending cuts continue.",
    tags: ["hyperinflation", "Milei", "IMF", "austerity"],
    lastUpdate: "2026-04",
    trend: "De-escalating",
    lat: -34.6,
    lng: -58.4,
  },
  {
    id: "venezuela-economic-collapse",
    name: "Venezuela Economic Collapse",
    type: "Economic Crisis",
    intensity: "High",
    region: "South America",
    countries: ["Venezuela"],
    startYear: 2014,
    active: true,
    description:
      "Decade-long economic collapse under Maduro. Hyperinflation, mass emigration (7M+ Venezuelans abroad), oil sector collapse, and fraudulent 2024 election results triggered street protests.",
    casualties: 0,
    displaced: 7.7,
    tags: ["Maduro", "embargo", "oil", "migration crisis"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 10.5,
    lng: -66.9,
  },
  {
    id: "sri-lanka-economic-crisis",
    name: "Sri Lanka Economic Crisis",
    type: "Economic Crisis",
    intensity: "Medium",
    region: "South Asia",
    countries: ["Sri Lanka"],
    startYear: 2022,
    active: false,
    description:
      "Worst economic crisis since independence in 2022. Foreign exchange depletion, fuel and food shortages led to mass protests forcing President Rajapaksa to flee. IMF bailout stabilizing situation.",
    tags: ["IMF bailout", "debt restructuring", "Rajapaksa"],
    lastUpdate: "2025-06",
    trend: "De-escalating",
    lat: 7.9,
    lng: 80.8,
  },
  {
    id: "lebanon-economic-collapse",
    name: "Lebanon Economic Collapse",
    type: "Economic Crisis",
    intensity: "Critical",
    region: "Middle East",
    countries: ["Lebanon"],
    startYear: 2019,
    active: true,
    description:
      "Banking system collapse, currency losing 98% of value, fuel and electricity shortages. Beirut port explosion in 2020 compounded the crisis. Prolonged political deadlock prevented reforms.",
    tags: ["banking collapse", "political deadlock", "port explosion", "IMF"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 33.9,
    lng: 35.5,
  },
  {
    id: "pakistan-debt-crisis",
    name: "Pakistan Debt & IMF Crisis",
    type: "Economic Crisis",
    intensity: "High",
    region: "South Asia",
    countries: ["Pakistan"],
    startYear: 2022,
    active: true,
    description:
      "Pakistan narrowly avoided default in 2023. 28%+ inflation, rupee devaluation, IMF emergency program, and political crisis with Imran Khan imprisonement triggered ongoing instability.",
    tags: ["IMF", "default risk", "Khan", "inflation"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 33.7,
    lng: 73.1,
  },
  {
    id: "iran-israel-conflict",
    name: "Iran–Israel Direct Conflict",
    type: "War",
    intensity: "High",
    region: "Middle East",
    countries: ["Iran", "Israel", "United States"],
    startYear: 2024,
    active: true,
    description:
      "Iran launched its first direct strikes on Israeli territory in April 2024 (300+ drones and missiles) in retaliation for the Israeli strike on its Damascus consulate. Israel counter-struck Iranian air-defense systems in October 2024. Represents a historic escalation from shadow war to open exchanges between the two countries.",
    casualties: 0,
    tags: [
      "drones",
      "missile strike",
      "shadow war",
      "nuclear program",
      "IRGC",
      "regional escalation",
    ],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 32.1,
    lng: 48.6,
    background: {
      origins:
        "Iran and Israel have been locked in a covert 'shadow war' for decades, rooted in Iran's 1979 Islamic Revolution and the Khomeinist doctrine rejecting Israel's legitimacy. Iran built a 'Axis of Resistance' — Hezbollah, Hamas, Palestinian Islamic Jihad, and Houthi forces — as proxy instruments of pressure. Israel responded with a campaign of sabotage targeting Iran's nuclear program (Stuxnet, assassinations of scientists), strikes on Iranian weapons convoys in Syria, and targeted killings of IRGC commanders. The conflict turned overtly military in 2024 when Iran broke the taboo of direct strikes on Israeli soil.",
      keyActors: [
        {
          name: "IRGC (Islamic Revolutionary Guard Corps)",
          role: "Commands Iran's missile, drone, and proxy network",
        },
        {
          name: "Israel Defense Forces (IDF)",
          role: "Conducted strikes on Iranian assets in Syria and inside Iran",
        },
        {
          name: "Mossad",
          role: "Israeli intelligence behind assassinations of Iranian nuclear scientists and IRGC officers",
        },
        {
          name: "Benjamin Netanyahu",
          role: "Israeli PM; authorized retaliatory strikes inside Iran",
        },
        {
          name: "Ali Khamenei",
          role: "Supreme Leader of Iran; authorizes strategic decisions",
        },
        {
          name: "United States",
          role: "Helped Israel intercept April 2024 Iranian missiles; urges restraint",
        },
      ],
      timeline: [
        {
          year: 1979,
          event:
            "Iranian Revolution; Ayatollah Khomeini declares Israel illegitimate; diplomatic ties severed",
        },
        {
          year: 1982,
          event:
            "Iran establishes Hezbollah in Lebanon as a strategic proxy against Israel",
        },
        {
          year: 2010,
          event:
            "Stuxnet cyberattack — US and Israel sabotage Iranian nuclear centrifuges",
        },
        {
          year: 2020,
          event:
            "Assassination of top nuclear scientist Mohsen Fakhrizadeh; Israel blamed by Iran",
        },
        {
          year: 2022,
          event:
            "Israel escalates strikes on IRGC convoys and officers in Syria",
        },
        {
          year: 2024,
          event:
            "April 1 — Israel strikes Iranian consulate in Damascus killing IRGC generals; April 13 — Iran retaliates with 300+ drones and missiles; mostly intercepted",
        },
        {
          year: 2024,
          event:
            "October — Israel strikes Iranian air defense facilities; signals capability to reach nuclear sites",
        },
        {
          year: 2025,
          event:
            "Nuclear negotiations resume under US pressure; covert sabotage operations continue",
        },
      ],
    },
    economicImpacts: [
      {
        indicator: "Oil Price Spike",
        value: "+8%",
        detail:
          "Brent crude surged ~8% in the week following April 2024 strikes on fears of Strait of Hormuz disruption",
        direction: "up",
      },
      {
        indicator: "Strait of Hormuz Risk",
        value: "~20% global oil",
        detail:
          "Iran has repeatedly threatened to close the strait; any closure would remove ~21M barrels/day from world markets",
        direction: "up",
      },
      {
        indicator: "Israeli Shekel",
        value: "−3.8%",
        detail:
          "NIS fell sharply against USD following the April 2024 attack before partial recovery as interceptors proved effective",
        direction: "down",
      },
      {
        indicator: "Israeli GDP Impact",
        value: "−1.5% est.",
        detail:
          "Ongoing conflict footing has raised defense spending to ~8% of GDP, weighing on 2024–25 growth forecasts",
        direction: "down",
      },
      {
        indicator: "Iranian Rial",
        value: "Record low",
        detail:
          "Fresh US-led sanctions following the April strike drove the rial to all-time lows against the dollar on black-market exchanges",
        direction: "down",
      },
      {
        indicator: "Gold & Safe Havens",
        value: "+2.1%",
        detail:
          "Gold briefly touched $2,400/oz on April 14 2024 as investors sought safe-haven assets amid escalation fears",
        direction: "up",
      },
    ],
  },
  {
    id: "iran-woman-life-freedom",
    name: "Iran – Woman Life Freedom Protests",
    type: "Protest",
    intensity: "Medium",
    region: "Middle East",
    countries: ["Iran"],
    startYear: 2022,
    active: false,
    description:
      "Mass protests erupted in September 2022 following Mahsa Amini's death in morality police custody. Hundreds killed, thousands arrested. Movement reframed as revolution; suppressed by late 2023.",
    casualties: 530,
    tags: ["women's rights", "hijab", "protests", "crackdown"],
    lastUpdate: "2025-12",
    trend: "De-escalating",
    lat: 35.7,
    lng: 51.4,
  },
  {
    id: "taiwan-strait-tensions",
    name: "Taiwan Strait Tensions",
    type: "Political Instability",
    intensity: "High",
    region: "East Asia",
    countries: ["China", "Taiwan", "United States"],
    startYear: 1950,
    active: true,
    description:
      "Ongoing Chinese military pressure on Taiwan through air and naval incursions, large-scale drills, and economic coercion. US arms sales and increasing military presence in the region escalate tensions.",
    tags: ["PLA", "TSMC", "semiconductor war", "US-China"],
    lastUpdate: "2026-04",
    trend: "Escalating",
    lat: 24.0,
    lng: 121.5,
    background: {
      origins:
        "The Taiwan dispute emerged from the Chinese Civil War (1927–1949), in which the Nationalist government (ROC) defeated by Mao Zedong's Communists retreated to Taiwan. Both sides claimed to be the legitimate government of all China. The US 7th Fleet prevented a PRC invasion in 1950. Taiwan democratized in the 1990s, developing a distinct identity. Today, Taiwan produces over 90% of the world's most advanced semiconductors (via TSMC), making it central to the global technology supply chain — and its potential absorption by China a matter of Western strategic concern.",
      keyActors: [
        {
          name: "People's Liberation Army (PLA)",
          role: "Conducts regular air and naval incursions; plans for potential Taiwan operation",
        },
        {
          name: "Xi Jinping",
          role: "Chinese President; has called unification a 'historical inevitability'",
        },
        {
          name: "Taiwan (ROC Government)",
          role: "Self-governing democracy; invests in asymmetric defense capabilities",
        },
        {
          name: "Lai Ching-te",
          role: "Taiwan's President since 2024; considered pro-independence by Beijing",
        },
        {
          name: "United States",
          role: "Bound by Taiwan Relations Act to provide defensive arms; strategic ambiguity on defense commitment",
        },
        {
          name: "TSMC",
          role: "World's dominant chip foundry; its protection is a core Western strategic interest",
        },
      ],
      timeline: [
        {
          year: 1949,
          event:
            "Chinese Civil War ends; Nationalists (ROC) retreat to Taiwan; PRC founded on mainland",
        },
        {
          year: 1950,
          event:
            "Korean War — US 7th Fleet deployed to Taiwan Strait; prevents PRC invasion",
        },
        {
          year: 1979,
          event:
            "US switches recognition from ROC to PRC; Taiwan Relations Act passed, maintaining unofficial ties",
        },
        {
          year: 1996,
          event:
            "Third Taiwan Strait Crisis — China fires missiles near Taiwan; US deploys two carrier groups",
        },
        {
          year: 2016,
          event:
            "DPP's Tsai Ing-wen elected president; China increases military pressure",
        },
        {
          year: 2022,
          event:
            "Pelosi visits Taiwan; China conducts largest-ever military drills surrounding the island",
        },
        {
          year: 2024,
          event:
            "Lai Ching-te elected president; China launches 'Joint Sword 2024A' drills",
        },
        {
          year: 2025,
          event:
            "PLA incursions into Taiwan's ADIZ reach record frequency; US arms sales package approved",
        },
      ],
    },
  },
  {
    id: "bangladesh-protests-2024",
    name: "Bangladesh Student Revolution",
    type: "Protest",
    intensity: "High",
    region: "South Asia",
    countries: ["Bangladesh"],
    startYear: 2024,
    active: false,
    description:
      "Student-led protests against quota system turned into a revolution in July 2024. PM Sheikh Hasina fled to India. Interim government led by Nobel laureate Muhammad Yunus assumed power.",
    casualties: 400,
    tags: ["student protests", "Hasina", "Yunus", "interim government"],
    lastUpdate: "2026-01",
    trend: "De-escalating",
    lat: 23.8,
    lng: 90.4,
  },
  {
    id: "kenya-protests-2024",
    name: "Kenya Anti-Finance Bill Protests",
    type: "Protest",
    intensity: "High",
    region: "East Africa",
    countries: ["Kenya"],
    startYear: 2024,
    active: false,
    description:
      "Gen Z-led protests against tax hike Finance Bill 2024 stormed parliament in June 2024. President Ruto withdrew the bill after protesters were shot. Movement reshaped Kenyan political landscape.",
    casualties: 39,
    tags: ["Gen Z", "tax protests", "parliament", "finance bill"],
    lastUpdate: "2025-03",
    trend: "De-escalating",
    lat: -1.3,
    lng: 36.8,
  },
  {
    id: "georgia-protests-2024",
    name: "Georgia EU Protests",
    type: "Protest",
    intensity: "Medium",
    region: "South Caucasus",
    countries: ["Georgia"],
    startYear: 2024,
    active: true,
    description:
      "Massive protests erupted in November 2024 after ruling party suspended EU accession talks. Protesters gathered nightly in Tbilisi for months; police used water cannons and tear gas.",
    tags: [
      "EU accession",
      "Tbilisi protests",
      "democracy",
      "Russian influence",
    ],
    lastUpdate: "2026-02",
    trend: "De-escalating",
    lat: 41.7,
    lng: 44.8,
  },
  {
    id: "venezuela-protests-2024",
    name: "Venezuela Post-Election Protests",
    type: "Protest",
    intensity: "High",
    region: "South America",
    countries: ["Venezuela"],
    startYear: 2024,
    active: false,
    description:
      "Widespread protests followed disputed July 2024 presidential election results claiming Maduro won. Security forces cracked down, killing dozens and arresting hundreds.",
    casualties: 24,
    tags: ["election fraud", "Maduro", "Edmundo González", "crackdown"],
    lastUpdate: "2025-06",
    trend: "De-escalating",
    lat: 10.5,
    lng: -66.9,
  },
  {
    id: "china-tech-crackdown",
    name: "China – Xinjiang & Hong Kong Suppression",
    type: "Political Instability",
    intensity: "Medium",
    region: "East Asia",
    countries: ["China"],
    startYear: 2019,
    active: true,
    description:
      "Ongoing political suppression in Hong Kong under National Security Law and mass detention of Uyghurs in Xinjiang. International sanctions and human rights condemnations have followed.",
    tags: ["Uyghurs", "Hong Kong", "NSL", "human rights"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 39.9,
    lng: 116.4,
  },
  {
    id: "niger-mali-burkina-coups",
    name: "Sahel Military Coups",
    type: "Political Instability",
    intensity: "High",
    region: "West Africa",
    countries: ["Niger", "Mali", "Burkina Faso", "Guinea", "Gabon"],
    startYear: 2020,
    active: true,
    description:
      "Series of military coups swept West Africa: Mali (2020), Guinea (2021), Burkina Faso (2022), Niger (2023), Gabon (2023). Juntas formed the Alliance of Sahel States, expelled French forces, and aligned with Russia.",
    tags: ["military coups", "Wagner", "ECOWAS", "anti-France", "AES"],
    lastUpdate: "2026-04",
    trend: "Stable",
    lat: 17.6,
    lng: -3.9,
  },
];

export const conflictTypeColors: Record<ConflictType, string> = {
  War: "text-red-400 bg-red-500/10 border-red-500/30",
  "Proxy War": "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "Civil War": "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Protest: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Riot: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "Natural Disaster": "text-sky-400 bg-sky-500/10 border-sky-500/30",
  "Economic Crisis": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "Political Instability":
    "text-orange-300 bg-orange-400/10 border-orange-400/20",
  Terrorism: "text-red-300 bg-red-600/10 border-red-600/20",
};

export const intensityColors: Record<IntensityLevel, string> = {
  Critical: "text-red-400 bg-red-500/15 border-red-500/40",
  High: "text-orange-400 bg-orange-500/15 border-orange-500/40",
  Medium: "text-yellow-400 bg-yellow-500/15 border-yellow-500/40",
  Low: "text-green-400 bg-green-500/15 border-green-500/40",
};

export const trendColors = {
  Escalating: "text-red-400",
  Stable: "text-yellow-400",
  "De-escalating": "text-green-400",
};
