// Election countdown data for world leaders
// nextElection: ISO date string of next scheduled election
// type: the type of election
// notes: extra context

export interface ElectionInfo {
  nextElection: string | null; // ISO date or null if indefinite/unknown
  electionType: string;
  notes: string;
  isScheduled: boolean; // false = unscheduled / no elections
}

const ELECTIONS: Record<string, ElectionInfo> = {
  trump: {
    nextElection: "2028-11-07",
    electionType: "US Presidential Election",
    notes: "Constitutionally barred from running for a third term.",
    isScheduled: true,
  },
  xi: {
    nextElection: null,
    electionType: "CCP National Congress",
    notes: "Term limits removed in 2018. Next party congress ~2027.",
    isScheduled: false,
  },
  putin: {
    nextElection: "2030-03-01",
    electionType: "Russian Presidential Election",
    notes: "Re-elected in 2024. Current constitutional term ends ~2030.",
    isScheduled: true,
  },
  modi: {
    nextElection: "2029-05-01",
    electionType: "Indian General Election",
    notes: "Won third term in 2024. Next general election due 2029.",
    isScheduled: true,
  },
  macron: {
    nextElection: "2027-04-01",
    electionType: "French Presidential Election",
    notes: "Constitutionally barred from a third consecutive term.",
    isScheduled: true,
  },
  scholz: {
    nextElection: null,
    electionType: "Former",
    notes: "Left office after 2025 snap election. No longer in power.",
    isScheduled: false,
  },
  sunak: {
    nextElection: null,
    electionType: "Former",
    notes: "Lost 2024 general election. No longer in power.",
    isScheduled: false,
  },
  starmer: {
    nextElection: "2029-01-01",
    electionType: "UK General Election",
    notes: "Won 2024 landslide. Next election due by January 2029.",
    isScheduled: true,
  },
  zelensky: {
    nextElection: null,
    electionType: "Ukrainian Presidential Election",
    notes: "Elections suspended under martial law during the war.",
    isScheduled: false,
  },
  mbs: {
    nextElection: null,
    electionType: "Absolute Monarchy",
    notes: "Saudi Arabia has no elections for head of government.",
    isScheduled: false,
  },
  lula: {
    nextElection: "2026-10-04",
    electionType: "Brazilian Presidential Election",
    notes: "Current term ends 2026. Eligible to run again.",
    isScheduled: true,
  },
  kim: {
    nextElection: null,
    electionType: "Hereditary Dictatorship",
    notes: "No elections. Hereditary rule.",
    isScheduled: false,
  },
  netanyahu: {
    nextElection: "2026-10-01",
    electionType: "Israeli Legislative Election (Knesset)",
    notes: "Coalition government. Election due by Oct 2026.",
    isScheduled: true,
  },
  erdogan: {
    nextElection: "2028-06-01",
    electionType: "Turkish Presidential Election",
    notes: "Re-elected in 2023 runoff. Term expires 2028.",
    isScheduled: true,
  },
  meloni: {
    nextElection: "2027-10-01",
    electionType: "Italian General Election",
    notes: "Coalition government. Next election due by 2027.",
    isScheduled: true,
  },
  sheinbaum: {
    nextElection: "2030-06-01",
    electionType: "Mexican Presidential Election",
    notes: "Elected 2024 for a six-year term. No re-election allowed.",
    isScheduled: true,
  },
  albanese: {
    nextElection: "2028-05-01",
    electionType: "Australian Federal Election",
    notes: "Re-elected May 2025. Next election due by 2028.",
    isScheduled: true,
  },
  ramaphosa: {
    nextElection: "2029-05-01",
    electionType: "South African General Election",
    notes: "Won 2024 GNU coalition. Next election due 2029.",
    isScheduled: true,
  },
  khan: {
    nextElection: "2029-02-01",
    electionType: "Pakistani General Election",
    notes: "Won disputed 2024 election. Next election due 2029.",
    isScheduled: true,
  },
  milei: {
    nextElection: "2027-10-01",
    electionType: "Argentine Presidential Election",
    notes: "Elected 2023. Term ends 2027.",
    isScheduled: true,
  },
  carney: {
    nextElection: "2029-10-01",
    electionType: "Canadian Federal Election",
    notes: "Won April 2025 election. Next election due by 2029.",
    isScheduled: true,
  },
  ishiba: {
    nextElection: "2028-10-01",
    electionType: "Japanese General Election",
    notes: "LDP coalition. House of Representatives election due 2028.",
    isScheduled: true,
  },
  sanchez: {
    nextElection: "2027-12-01",
    electionType: "Spanish General Election",
    notes: "Fragile coalition. Next election due by 2027.",
    isScheduled: true,
  },
  bukele: {
    nextElection: "2029-02-01",
    electionType: "El Salvador Presidential Election",
    notes: "Re-elected 2024 with 85%. Term ends 2029.",
    isScheduled: true,
  },
  prabowo: {
    nextElection: "2029-02-01",
    electionType: "Indonesian Presidential Election",
    notes: "Elected 2024. Term ends 2029.",
    isScheduled: true,
  },
  pezeshkian: {
    nextElection: "2028-06-01",
    electionType: "Iranian Presidential Election",
    notes: "Elected 2024. Term ends 2028.",
    isScheduled: true,
  },
  han: {
    nextElection: null,
    electionType: "Acting President (Caretaker)",
    notes: "Snap election already scheduled and completed.",
    isScheduled: false,
  },
  tusk: {
    nextElection: "2027-10-01",
    electionType: "Polish Parliamentary Election",
    notes: "Won 2023. Next election due Oct 2027.",
    isScheduled: true,
  },
  maduro: {
    nextElection: null,
    electionType: "Incumbent (Disputed)",
    notes: "Disputed 2024 election. No credible schedule.",
    isScheduled: false,
  },
  mbz: {
    nextElection: null,
    electionType: "Absolute Monarchy (UAE)",
    notes: "No elections for the UAE presidency.",
    isScheduled: false,
  },
  mnangagwa: {
    nextElection: "2028-07-01",
    electionType: "Zimbabwean Presidential Election",
    notes: "Re-elected 2023. Term ends 2028.",
    isScheduled: true,
  },
  kagame: {
    nextElection: "2024-07-01",
    electionType: "Rwandan Presidential Election",
    notes: "Re-elected 2024 with 99%. Next election due 2031.",
    isScheduled: true,
  },
  tinubu: {
    nextElection: "2027-02-01",
    electionType: "Nigerian Presidential Election",
    notes: "Elected 2023. Term ends 2027.",
    isScheduled: true,
  },
  abiy: {
    nextElection: "2026-06-01",
    electionType: "Ethiopian General Election",
    notes: "Next general election due 2026.",
    isScheduled: true,
  },
  sisi: {
    nextElection: "2030-01-01",
    electionType: "Egyptian Presidential Election",
    notes: "Re-elected 2024 with 89.6%. Term ends 2030.",
    isScheduled: true,
  },
  yunus: {
    nextElection: null,
    electionType: "Transitional Government",
    notes: "Interim government. Election timeline TBD.",
    isScheduled: false,
  },
  dissanayake: {
    nextElection: "2030-09-01",
    electionType: "Sri Lankan Presidential Election",
    notes: "Elected 2024. Term ends 2030.",
    isScheduled: true,
  },
  marcos: {
    nextElection: "2028-05-01",
    electionType: "Philippine Presidential Election",
    notes: "Elected 2022. Single 6-year term — cannot run again.",
    isScheduled: true,
  },
  paetongtarn: {
    nextElection: "2027-05-01",
    electionType: "Thai General Election",
    notes: "PM term subject to parliamentary confidence. Election due ~2027.",
    isScheduled: true,
  },
  anwar: {
    nextElection: "2027-11-01",
    electionType: "Malaysian General Election",
    notes: "Won 2022 hung parliament. Next election due by Nov 2027.",
    isScheduled: true,
  },
  frederik: {
    nextElection: null,
    electionType: "Constitutional Monarchy",
    notes: "King of Denmark. No elections for the monarch.",
    isScheduled: false,
  },
  kristersson: {
    nextElection: "2026-09-01",
    electionType: "Swedish General Election",
    notes: "Won 2022. Next election September 2026.",
    isScheduled: true,
  },
  orpo: {
    nextElection: "2027-04-01",
    electionType: "Finnish Parliamentary Election",
    notes: "PM since 2023. Next election April 2027.",
    isScheduled: true,
  },
  khamenei: {
    nextElection: null,
    electionType: "Supreme Leader (Appointed)",
    notes: "Appointed by Assembly of Experts. No public election.",
    isScheduled: false,
  },
  aoun: {
    nextElection: "2031-01-01",
    electionType: "Lebanese Presidential Election",
    notes: "Elected by parliament Jan 2025. 6-year term ends 2031.",
    isScheduled: true,
  },
  alsharaa: {
    nextElection: null,
    electionType: "Transitional Government",
    notes: "Syria in post-Assad transition. No election date set.",
    isScheduled: false,
  },
  barzani: {
    nextElection: "2026-09-01",
    electionType: "KRG Parliamentary Election",
    notes: "KRG elections due ~2026.",
    isScheduled: true,
  },
  petro: {
    nextElection: "2026-05-01",
    electionType: "Colombian Presidential Election",
    notes: "Cannot run for re-election. Successor election May 2026.",
    isScheduled: true,
  },
  boluarte: {
    nextElection: "2026-04-01",
    electionType: "Peruvian Presidential Election",
    notes: "Term ends July 2026. General election April 2026.",
    isScheduled: true,
  },
  noboa: {
    nextElection: "2029-02-01",
    electionType: "Ecuadorian Presidential Election",
    notes: "Re-elected 2025 for full term. Next election 2029.",
    isScheduled: true,
  },
  ruto: {
    nextElection: "2027-08-01",
    electionType: "Kenyan Presidential Election",
    notes: "Elected 2022. Term ends 2027.",
    isScheduled: true,
  },
  goita: {
    nextElection: null,
    electionType: "Military Junta (Transitional)",
    notes: "No credible election timeline.",
    isScheduled: false,
  },
  traore: {
    nextElection: null,
    electionType: "Military Junta (Transitional)",
    notes: "No election timeline announced.",
    isScheduled: false,
  },
  phamminchinh: {
    nextElection: "2026-05-01",
    electionType: "Vietnamese National Assembly Election",
    notes: "National Assembly elections due 2026.",
    isScheduled: true,
  },
  hunmanet: {
    nextElection: "2028-07-01",
    electionType: "Cambodian General Election",
    notes: "Elected 2023. Next election 2028.",
    isScheduled: true,
  },
  lee: {
    nextElection: "2025-11-01",
    electionType: "Singapore General Election",
    notes: "PAP won May 2025. Next election due by 2029.",
    isScheduled: true,
  },
  muizzu: {
    nextElection: "2028-09-01",
    electionType: "Maldivian Presidential Election",
    notes: "Elected 2023. Term ends 2028.",
    isScheduled: true,
  },
  christodoulides: {
    nextElection: "2028-01-01",
    electionType: "Cypriot Presidential Election",
    notes: "Elected 2023. Term ends 2028.",
    isScheduled: true,
  },
  orban: {
    nextElection: "2026-04-01",
    electionType: "Hungarian Parliamentary Election",
    notes: "Next election April 2026.",
    isScheduled: true,
  },
  merz: {
    nextElection: "2029-09-01",
    electionType: "German Federal Election",
    notes: "Won Feb 2025 snap election. Next election due Sept 2029.",
    isScheduled: true,
  },
  "lee-jm": {
    nextElection: "2030-06-01",
    electionType: "South Korean Presidential Election",
    notes: "Won June 2025 snap election. Single 5-year term.",
    isScheduled: true,
  },
  boric: {
    nextElection: "2025-11-01",
    electionType: "Chilean Presidential Election",
    notes: "Cannot run for immediate re-election. Election Nov 2025.",
    isScheduled: true,
  },
  abdullah2: {
    nextElection: null,
    electionType: "Constitutional Monarchy (Jordan)",
    notes: "King. No presidential elections.",
    isScheduled: false,
  },
  tamim: {
    nextElection: null,
    electionType: "Absolute Monarchy (Qatar)",
    notes: "No elections for the Emir.",
    isScheduled: false,
  },
  frederiksen: {
    nextElection: "2027-11-01",
    electionType: "Danish General Election",
    notes: "Won 2022. Next election due by Nov 2027.",
    isScheduled: true,
  },
  faye: {
    nextElection: "2031-03-01",
    electionType: "Senegalese Presidential Election",
    notes: "Elected 2024. 5-year term ends 2029.",
    isScheduled: true,
  },
  tshisekedi: {
    nextElection: "2028-12-01",
    electionType: "DRC Presidential Election",
    notes: "Re-elected Dec 2023. Term ends 2028.",
    isScheduled: true,
  },
  minaungHlaing: {
    nextElection: null,
    electionType: "Military Junta",
    notes: "SAC military junta. No democratic elections.",
    isScheduled: false,
  },
  stubb: {
    nextElection: "2030-02-01",
    electionType: "Finnish Presidential Election",
    notes: "Elected Feb 2024. 6-year term ends 2030.",
    isScheduled: true,
  },
  bayrou: {
    nextElection: "2027-04-01",
    electionType: "French Presidential Election",
    notes: "PM under Macron. PM term tied to Macron's presidency.",
    isScheduled: true,
  },
  luxon: {
    nextElection: "2026-10-01",
    electionType: "New Zealand General Election",
    notes: "Won 2023. Next election October 2026.",
    isScheduled: true,
  },
  "montenegro-lu": {
    nextElection: "2028-03-01",
    electionType: "Portuguese Legislative Election",
    notes: "Won March 2024 minority election. Next election ~2028.",
    isScheduled: true,
  },
  nehammer: {
    nextElection: null,
    electionType: "Former Chancellor",
    notes: "Resigned Jan 2025 after coalition failure.",
    isScheduled: false,
  },
  kickl: {
    nextElection: "2029-09-01",
    electionType: "Austrian Parliamentary Election",
    notes: "Became Chancellor Mar 2025. Next election ~2029.",
    isScheduled: true,
  },
  fiala: {
    nextElection: "2025-10-01",
    electionType: "Czech Parliamentary Election",
    notes: "Re-elected 2025. Next election ~2029.",
    isScheduled: true,
  },
  mitsotakis: {
    nextElection: "2027-05-01",
    electionType: "Greek Parliamentary Election",
    notes: "Won second majority 2023. Next election ~2027.",
    isScheduled: true,
  },
  schoof: {
    nextElection: "2029-11-01",
    electionType: "Dutch Parliamentary Election",
    notes: "Government formed 2024. Next election ~2028.",
    isScheduled: true,
  },
  zhelyazkov: {
    nextElection: "2027-10-01",
    electionType: "Bulgarian Parliamentary Election",
    notes: "Government formed Jan 2024. Next election ~2027.",
    isScheduled: true,
  },
  vucic: {
    nextElection: "2027-04-01",
    electionType: "Serbian Presidential Election",
    notes: "Re-elected 2022. Term ends 2027.",
    isScheduled: true,
  },
  rama: {
    nextElection: "2025-05-01",
    electionType: "Albanian Parliamentary Election",
    notes: "Won fourth term 2024. Next election 2025.",
    isScheduled: true,
  },
  "keller-sutter": {
    nextElection: "2027-12-01",
    electionType: "Swiss Federal Council Election",
    notes: "Federal Council elected by parliament every 4 years.",
    isScheduled: true,
  },
  abela: {
    nextElection: "2027-03-01",
    electionType: "Maltese General Election",
    notes: "Won record majority 2022. Next election ~2027.",
    isScheduled: true,
  },
  frieden: {
    nextElection: "2028-10-01",
    electionType: "Luxembourg Parliamentary Election",
    notes: "Won Oct 2023. Next election ~2028.",
    isScheduled: true,
  },
  nauseda: {
    nextElection: "2030-05-01",
    electionType: "Lithuanian Presidential Election",
    notes: "Re-elected 2024. 5-year term ends 2029.",
    isScheduled: true,
  },
  silina: {
    nextElection: "2025-10-01",
    electionType: "Latvian Parliamentary Election",
    notes: "PM since 2023. Next Saeima election Oct 2026.",
    isScheduled: true,
  },
  karis: {
    nextElection: "2026-02-01",
    electionType: "Estonian Presidential Election",
    notes: "President elected by parliament. Next election ~2026.",
    isScheduled: true,
  },
  golob: {
    nextElection: "2026-04-01",
    electionType: "Slovenian Parliamentary Election",
    notes: "Won 2022 landslide. Next election April 2026.",
    isScheduled: true,
  },
  becirovic: {
    nextElection: "2026-10-01",
    electionType: "Bosnia & Herzegovina General Election",
    notes: "Elected 2022. BiH elections held every 4 years.",
    isScheduled: true,
  },
  spajic: {
    nextElection: "2027-06-01",
    electionType: "Montenegrin Parliamentary Election",
    notes: "PM since 2023. Next election ~2027.",
    isScheduled: true,
  },
  mickoski: {
    nextElection: "2028-05-01",
    electionType: "North Macedonian Election",
    notes: "Won May 2024. Next election ~2028.",
    isScheduled: true,
  },
  kurti: {
    nextElection: "2025-02-09",
    electionType: "Kosovo Parliamentary Election",
    notes: "Won 59% in 2021. New elections due.",
    isScheduled: true,
  },
  sandu: {
    nextElection: "2028-11-01",
    electionType: "Moldovan Presidential Election",
    notes: "Re-elected Nov 2024. 4-year term ends 2028.",
    isScheduled: true,
  },
  hichilema: {
    nextElection: "2026-08-01",
    electionType: "Zambian Presidential Election",
    notes: "Elected 2021. Term ends 2026.",
    isScheduled: true,
  },
  hassan: {
    nextElection: "2025-10-01",
    electionType: "Tanzanian General Election",
    notes: "Won March 2025 election. Next election 2030.",
    isScheduled: true,
  },
  zourabichvili: {
    nextElection: null,
    electionType: "Georgian Presidential Election",
    notes: "Disputed holdover president. Constitutional crisis ongoing.",
    isScheduled: false,
  },
  rinkevicius: {
    nextElection: "2027-06-01",
    electionType: "Latvian Presidential Election",
    notes: "Elected June 2023. 4-year term ends 2027.",
    isScheduled: true,
  },
  chakwera: {
    nextElection: "2025-09-16",
    electionType: "Malawian Presidential Election",
    notes: "Faces election Sep 2025.",
    isScheduled: true,
  },
  "akufo-addo": {
    nextElection: null,
    electionType: "Former President",
    notes: "Lost 2024 election to Mahama. Left office Jan 2025.",
    isScheduled: false,
  },
  tokayev: {
    nextElection: "2029-11-01",
    electionType: "Kazakhstani Presidential Election",
    notes: "Re-elected 2022. 7-year term ends 2029.",
    isScheduled: true,
  },
  aliyev: {
    nextElection: "2031-02-01",
    electionType: "Azerbaijani Presidential Election",
    notes: "Re-elected Feb 2024. 7-year term ends 2031.",
    isScheduled: true,
  },
  lukashenko: {
    nextElection: null,
    electionType: "Incumbent (Disputed)",
    notes: "Fraudulent 2020 election. No credible schedule.",
    isScheduled: false,
  },
  museveni: {
    nextElection: "2026-01-01",
    electionType: "Ugandan Presidential Election",
    notes: "Won 2021. Next election January 2026.",
    isScheduled: true,
  },
  mahama: {
    nextElection: "2028-12-01",
    electionType: "Ghanaian Presidential Election",
    notes: "Won Dec 2024. 4-year term ends 2028.",
    isScheduled: true,
  },
  tebboune: {
    nextElection: "2029-09-01",
    electionType: "Algerian Presidential Election",
    notes: "Re-elected Sep 2024 with 94.6%. 5-year term.",
    isScheduled: true,
  },
  ouattara: {
    nextElection: "2025-10-01",
    electionType: "Ivorian Presidential Election",
    notes: "May not seek fourth term. Election Oct 2025.",
    isScheduled: true,
  },
  decroo: {
    nextElection: null,
    electionType: "Former Prime Minister",
    notes: "Resigned after June 2024 election defeat.",
    isScheduled: false,
  },
  stoere: {
    nextElection: "2025-09-08",
    electionType: "Norwegian General Election",
    notes: "Won 2021. Next election September 2025.",
    isScheduled: true,
  },
  frostadottir: {
    nextElection: "2028-10-01",
    electionType: "Icelandic Parliamentary Election",
    notes: "Won 2024. Next election ~2028.",
    isScheduled: true,
  },
  martin: {
    nextElection: "2029-03-01",
    electionType: "Irish General Election",
    notes: "Won Nov 2024 election. Next election ~2029.",
    isScheduled: true,
  },
  fico: {
    nextElection: "2027-09-01",
    electionType: "Slovak Parliamentary Election",
    notes: "Won 2023. Next election 2027.",
    isScheduled: true,
  },
  ciolacu: {
    nextElection: "2028-12-01",
    electionType: "Romanian Parliamentary Election",
    notes: "PM since 2023. Next election ~2028.",
    isScheduled: true,
  },
  plenkovic: {
    nextElection: "2028-04-01",
    electionType: "Croatian Parliamentary Election",
    notes: "Won third term April 2024. Next election ~2028.",
    isScheduled: true,
  },
  lai: {
    nextElection: "2028-01-01",
    electionType: "Taiwanese Presidential Election",
    notes: "Elected Jan 2024. Term ends 2028. One re-election allowed.",
    isScheduled: true,
  },
  mirziyoyev: {
    nextElection: "2030-07-01",
    electionType: "Uzbek Presidential Election",
    notes: "Re-elected 2023 (reset term). New 7-year term ends 2030.",
    isScheduled: true,
  },
  rahmon: {
    nextElection: "2027-11-01",
    electionType: "Tajik Presidential Election",
    notes: "Re-elected 2020. Next election ~2027.",
    isScheduled: true,
  },
  orsi: {
    nextElection: "2030-11-01",
    electionType: "Uruguayan Presidential Election",
    notes: "Elected Nov 2024. 5-year term. No re-election.",
    isScheduled: true,
  },
  ortega: {
    nextElection: null,
    electionType: "Incumbent (Disputed)",
    notes: "All opposition jailed or exiled. No free elections.",
    isScheduled: false,
  },
  guterres: {
    nextElection: "2026-12-31",
    electionType: "UN Secretary-General Term End",
    notes: "Second term ends Dec 2026. Reappointment by Security Council.",
    isScheduled: true,
  },
  biya: {
    nextElection: "2025-10-01",
    electionType: "Cameroonian Presidential Election",
    notes: "Next election Oct 2025.",
    isScheduled: true,
  },
  kobakhidze: {
    nextElection: null,
    electionType: "Incumbent (Disputed)",
    notes: "Disputed Oct 2024 election. Constitutional crisis ongoing.",
    isScheduled: false,
  },
  yoon: {
    nextElection: null,
    electionType: "Former President (Impeached)",
    notes: "Removed from office Apr 2025 by Constitutional Court.",
    isScheduled: false,
  },
  chaves: {
    nextElection: "2026-02-01",
    electionType: "Costa Rican Presidential Election",
    notes: "Elected 2022. Cannot run for re-election.",
    isScheduled: true,
  },
  touadera: {
    nextElection: "2026-12-01",
    electionType: "CAR Presidential Election",
    notes: "Re-elected 2021. Next election ~2026.",
    isScheduled: true,
  },
  afwerki: {
    nextElection: null,
    electionType: "Indefinite Rule",
    notes: "No elections since independence in 1993.",
    isScheduled: false,
  },
  assoumani: {
    nextElection: "2029-01-01",
    electionType: "Comorian Presidential Election",
    notes: "Won disputed third term 2024. Next ~2029.",
    isScheduled: true,
  },
  deby: {
    nextElection: "2029-05-01",
    electionType: "Chadian Presidential Election",
    notes: "Won May 2024 election. 6-year term ends ~2030.",
    isScheduled: true,
  },
  akhannouch: {
    nextElection: "2026-09-01",
    electionType: "Moroccan Parliamentary Election",
    notes: "Won 2021. Next election Sept 2026.",
    isScheduled: true,
  },
  barrow: {
    nextElection: "2026-12-01",
    electionType: "Gambian Presidential Election",
    notes: "Re-elected 2021. Term ends 2026.",
    isScheduled: true,
  },
  sassou: {
    nextElection: "2027-03-01",
    electionType: "Congolese Presidential Election",
    notes: "Won 2021. Next election ~2027.",
    isScheduled: true,
  },
  gnassingbe: {
    nextElection: null,
    electionType: "President of Council of Ministers",
    notes: "New constitution removed direct presidential election.",
    isScheduled: false,
  },
  boko: {
    nextElection: "2029-10-01",
    electionType: "Botswana General Election",
    notes: "Won Oct 2024 election. Next election ~2029.",
    isScheduled: true,
  },
  arevalo: {
    nextElection: "2027-06-01",
    electionType: "Guatemalan Presidential Election",
    notes: "Elected 2023. Single 4-year term. No re-election.",
    isScheduled: true,
  },
  ali: {
    nextElection: "2025-09-01",
    electionType: "Guyanese General Election",
    notes: "PPP/C in power since 2020. Next election ~2025.",
    isScheduled: true,
  },
  lourenco: {
    nextElection: "2027-08-01",
    electionType: "Angolan General Election",
    notes: "Won 2022. Next election ~2027.",
    isScheduled: true,
  },
  chapo: {
    nextElection: null,
    electionType: "Incumbent (Disputed)",
    notes: "Disputed Oct 2024 election amid deadly protests.",
    isScheduled: false,
  },
  simina: {
    nextElection: "2027-03-01",
    electionType: "FSM Presidential Election",
    notes: "Elected 2023. 4-year term ends 2027.",
    isScheduled: true,
  },
  berdymukhamedov: {
    nextElection: "2029-03-01",
    electionType: "Turkmen Presidential Election",
    notes: "Elected 2022. 7-year term ends 2029.",
    isScheduled: true,
  },
  pashinyan: {
    nextElection: "2026-06-01",
    electionType: "Armenian Parliamentary Election",
    notes: "Won 2021. Next election June 2026.",
    isScheduled: true,
  },
  meleshanu: {
    nextElection: "2028-06-01",
    electionType: "Cook Islands General Election",
    notes: "Won 2020. Next election ~2028.",
    isScheduled: true,
  },
  fiame: {
    nextElection: null,
    electionType: "Former Prime Minister",
    notes: "Lost 2024 re-election bid.",
    isScheduled: false,
  },
  marape: {
    nextElection: "2027-06-01",
    electionType: "Papua New Guinea General Election",
    notes: "Won 2022. Next election June 2027.",
    isScheduled: true,
  },
  henry: {
    nextElection: null,
    electionType: "Transitional Government",
    notes: "Haiti has no sitting elected president since 2021.",
    isScheduled: false,
  },
  rowley: {
    nextElection: "2025-09-01",
    electionType: "T&T General Election",
    notes: "Won 2020. Next election August 2025.",
    isScheduled: true,
  },
  ngirente: {
    nextElection: "2029-07-01",
    electionType: "Rwandan Presidential Election",
    notes: "PM since 2017. Presidential election next in 2029.",
    isScheduled: true,
  },
  guelleh: {
    nextElection: "2026-04-01",
    electionType: "Djiboutian Presidential Election",
    notes: "Re-elected 2021 with 97.4%. Term ends 2026.",
    isScheduled: true,
  },
  "castro-z": {
    nextElection: "2025-11-01",
    electionType: "Honduran Presidential Election",
    notes: "Elected 2021. Single 4-year term ends 2025.",
    isScheduled: true,
  },
  dabaiba: {
    nextElection: null,
    electionType: "Transitional Government",
    notes: "Libya elections perpetually delayed. No confirmed date.",
    isScheduled: false,
  },
  kiir: {
    nextElection: null,
    electionType: "Transitional Government",
    notes: "Elections postponed indefinitely.",
    isScheduled: false,
  },
  netumbo: {
    nextElection: "2030-11-01",
    electionType: "Namibian Presidential Election",
    notes: "Elected Nov 2024. 5-year term ends 2029.",
    isScheduled: true,
  },
  mswati: {
    nextElection: null,
    electionType: "Absolute Monarchy",
    notes: "No elections for executive power in Eswatini.",
    isScheduled: false,
  },
  japarov: {
    nextElection: "2027-10-01",
    electionType: "Kyrgyz Presidential Election",
    notes: "Elected 2021. Term ends 2027.",
    isScheduled: true,
  },
  sogavare: {
    nextElection: "2027-04-01",
    electionType: "Solomon Islands General Election",
    notes: "Won April 2024. Next election ~2028.",
    isScheduled: true,
  },
  sudani: {
    nextElection: "2025-10-01",
    electionType: "Iraqi Parliamentary Election",
    notes: "Government formed 2022. Elections overdue.",
    isScheduled: true,
  },
  radev: {
    nextElection: "2027-11-01",
    electionType: "Bulgarian Presidential Election",
    notes: "Re-elected 2021. 5-year term ends 2026.",
    isScheduled: true,
  },
  pellegrini: {
    nextElection: "2029-04-01",
    electionType: "Slovak Presidential Election",
    notes: "Won April 2024. 5-year term ends 2029.",
    isScheduled: true,
  },
  talon: {
    nextElection: "2026-03-01",
    electionType: "Beninese Presidential Election",
    notes: "Re-elected 2021. Cannot stand for third term. Election 2026.",
    isScheduled: true,
  },
  nguema: {
    nextElection: "2025-04-12",
    electionType: "Gabonese Presidential Election",
    notes: "Won transitional election April 2025.",
    isScheduled: true,
  },
  doumbouya: {
    nextElection: null,
    electionType: "Military Junta (Transitional)",
    notes: "No credible transition timeline.",
    isScheduled: false,
  },
  sakellaropoulou: {
    nextElection: "2030-01-01",
    electionType: "Greek Presidential Election",
    notes: "Re-elected 2025 by parliament. Next election ~2030.",
    isScheduled: true,
  },
  abbas: {
    nextElection: null,
    electionType: "Incumbent (Expired Mandate)",
    notes: "Term expired 2009. No Palestinian elections scheduled.",
    isScheduled: false,
  },
  francis: {
    nextElection: null,
    electionType: "Deceased (April 2025)",
    notes: "Pope Francis passed away April 21, 2025.",
    isScheduled: false,
  },
  leo14: {
    nextElection: null,
    electionType: "Papal Election (Conclave)",
    notes: "Elected by Conclave May 8, 2025. Lifelong appointment.",
    isScheduled: false,
  },
  bolkiah: {
    nextElection: null,
    electionType: "Absolute Monarchy (Brunei)",
    notes: "Sultan since 1967. No elections.",
    isScheduled: false,
  },
  imrankhan: {
    nextElection: null,
    electionType: "Former PM (Imprisoned)",
    notes: "Jailed. Not in office.",
    isScheduled: false,
  },
  "suu-kyi": {
    nextElection: null,
    electionType: "Former (Imprisoned)",
    notes: "Jailed by military junta. Not in power.",
    isScheduled: false,
  },
  karzai: {
    nextElection: null,
    electionType: "Former President",
    notes: "Taliban rule. No elections.",
    isScheduled: false,
  },
  sen: {
    nextElection: null,
    electionType: "Former PM / Senate President",
    notes: "Handed power to son. Senate President.",
    isScheduled: false,
  },
  "diaz-canel": {
    nextElection: null,
    electionType: "Communist Party Rule",
    notes: "No competitive elections in Cuba.",
    isScheduled: false,
  },
  haitham: {
    nextElection: null,
    electionType: "Absolute Monarchy (Oman)",
    notes: "Sultan. No elections.",
    isScheduled: false,
  },
  marin: {
    nextElection: null,
    electionType: "Former Prime Minister",
    notes: "Left office May 2023. No longer in power.",
    isScheduled: false,
  },
  "to-lam": {
    nextElection: "2026-05-01",
    electionType: "Vietnamese National Assembly Election",
    notes: "General Secretary. National Assembly elections due 2026.",
    isScheduled: true,
  },
  tsai: {
    nextElection: null,
    electionType: "Former President",
    notes: "Left office Jan 2024. Two-term limit reached.",
    isScheduled: false,
  },
  zuma: {
    nextElection: null,
    electionType: "Former President",
    notes: "Left office 2018. Leads MK opposition party.",
    isScheduled: false,
  },
  amlo: {
    nextElection: null,
    electionType: "Former President",
    notes: "Left office Oct 2024.",
    isScheduled: false,
  },
  charles3: {
    nextElection: null,
    electionType: "Constitutional Monarchy (UK)",
    notes: "Hereditary monarch. No elections for the Crown.",
    isScheduled: false,
  },
  ardern: {
    nextElection: null,
    electionType: "Former Prime Minister",
    notes: "Resigned Jan 2023.",
    isScheduled: false,
  },
  borisjohnson: {
    nextElection: null,
    electionType: "Former Prime Minister",
    notes: "Resigned July 2022.",
    isScheduled: false,
  },
  jokowi: {
    nextElection: null,
    electionType: "Former President",
    notes: "Left office Oct 2024. Term-limited.",
    isScheduled: false,
  },
  obiang: {
    nextElection: "2028-11-01",
    electionType: "Equatorial Guinea Presidential Election",
    notes: "Won 2023 with 94.9%. Next election ~2028.",
    isScheduled: true,
  },
  saied: {
    nextElection: "2029-10-01",
    electionType: "Tunisian Presidential Election",
    notes: "Re-elected 2024 with 90%. 5-year term ends 2029.",
    isScheduled: true,
  },
  duda: {
    nextElection: null,
    electionType: "Outgoing President",
    notes: "Term ends 2025. Constitutionally barred from third term.",
    isScheduled: false,
  },
  tchiani: {
    nextElection: null,
    electionType: "Military Junta (Transitional)",
    notes: "No transition timeline.",
    isScheduled: false,
  },
  mbr: {
    nextElection: null,
    electionType: "Hereditary Monarchy (Dubai)",
    notes: "Ruler of Dubai since 2006. No elections.",
    isScheduled: false,
  },
  boakai: {
    nextElection: "2029-10-01",
    electionType: "Liberian Presidential Election",
    notes: "Elected Jan 2024. 6-year term ends 2029.",
    isScheduled: true,
  },
  arce: {
    nextElection: null,
    electionType: "Former President",
    notes: "Lost 2025 election. Left office.",
    isScheduled: false,
  },
  mohamud: {
    nextElection: "2026-05-01",
    electionType: "Somali Presidential Election",
    notes: "Elected 2022. Next indirect election ~2026.",
    isScheduled: true,
  },
  burhan: {
    nextElection: null,
    electionType: "Military Junta (SAC)",
    notes: "Civil war ongoing. No elections.",
    isScheduled: false,
  },
  ramkalawan: {
    nextElection: "2025-10-01",
    electionType: "Seychelles Presidential Election",
    notes: "Elected 2020. Next election Oct 2025.",
    isScheduled: true,
  },
  ndayishimiye: {
    nextElection: "2027-05-01",
    electionType: "Burundian Presidential Election",
    notes: "Elected 2020. Term ends 2027.",
    isScheduled: true,
  },
  embalo: {
    nextElection: "2025-11-01",
    electionType: "Guinea-Bissau Presidential Election",
    notes: "Term ends 2025. Election expected.",
    isScheduled: true,
  },
  ghazouani: {
    nextElection: "2029-06-01",
    electionType: "Mauritanian Presidential Election",
    notes: "Re-elected June 2024. 5-year term ends 2029.",
    isScheduled: true,
  },
  dodik: {
    nextElection: "2026-10-01",
    electionType: "Bosnia & Herzegovina General Election",
    notes: "Elected RS President 2022. Next BiH elections 2026.",
    isScheduled: true,
  },
};

export function getElectionInfo(leaderId: string): ElectionInfo | null {
  return ELECTIONS[leaderId] ?? null;
}

export function getCountdownDays(nextElection: string | null): number | null {
  if (!nextElection) return null;
  const now = new Date();
  const target = new Date(nextElection);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatCountdown(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "Due / Passed";
  if (days < 7) return `${days}d`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return d > 0 ? `${w}wk ${d}d` : `${w}wk`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    const rem = days % 30;
    const w = Math.floor(rem / 7);
    if (w > 0) return `${m}mo ${w}wk`;
    return `${m}mo`;
  }
  const y = Math.floor(days / 365);
  const remDays = days % 365;
  const m = Math.floor(remDays / 30);
  const remAfterMonths = remDays % 30;
  const w = Math.floor(remAfterMonths / 7);
  const parts: string[] = [`${y}y`];
  if (m > 0) parts.push(`${m}mo`);
  if (w > 0 && y < 2) parts.push(`${w}wk`);
  return parts.join(" ");
}

/**
 * Returns a structured breakdown of the countdown for display.
 */
export interface CountdownBreakdown {
  years: number;
  months: number;
  weeks: number;
  days: number;
  totalDays: number;
}

export function getCountdownBreakdown(
  nextElection: string | null,
): CountdownBreakdown | null {
  if (!nextElection) return null;
  const now = new Date();
  const target = new Date(nextElection);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0)
    return { years: 0, months: 0, weeks: 0, days: 0, totalDays: 0 };
  const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const rem = totalDays % 365;
  const months = Math.floor(rem / 30);
  const rem2 = rem % 30;
  const weeks = Math.floor(rem2 / 7);
  const days = rem2 % 7;
  return { years, months, weeks, days, totalDays };
}
