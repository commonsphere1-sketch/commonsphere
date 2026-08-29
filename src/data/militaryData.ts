// Military statistics per country (keyed by country id)

export interface MilitaryStats {
  /** Active duty personnel (number) */
  activePers: number;
  /** Reserve personnel (number) */
  reservePers: number;
  /** Total military inventory items (aircraft, vehicles, ships combined estimate) */
  inventory: number;
  /** Number of domestic/national military bases */
  nationalBases: number;
  /** Number of international/overseas military installations */
  intlBases: number;
  /** Annual defence budget in billions USD */
  defenceBudgetB: number;
  /** Branch names (e.g. Army, Navy, Air Force) */
  branches: string[];
}

const M = (
  activePers: number,
  reservePers: number,
  inventory: number,
  nationalBases: number,
  intlBases: number,
  defenceBudgetB: number,
  branches: string[]
): MilitaryStats => ({ activePers, reservePers, inventory, nationalBases, intlBases, defenceBudgetB, branches });

// Country id → MilitaryStats
export const MILITARY: Record<string, MilitaryStats> = {
  // ── NORTH AMERICA ──
  us:   M(1400000, 850000, 138000, 800, 750, 916, ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard"]),
  ca:   M(68000,   30000,  5200,   27,  4,   26.6, ["Army", "Royal Canadian Navy", "Royal Canadian Air Force"]),
  mx:   M(205000,  82000,  4800,   62,  0,   11.6, ["Army", "Navy", "Air Force"]),
  gt:   M(17300,   9900,   280,    10,  0,   0.33,  ["Army", "Navy", "Air Force"]),
  cu:   M(49000,   39000,  1100,   18,  0,   0.67,  ["Revolutionary Army", "Navy", "Air Force"]),
  ht:   M(2100,    0,      120,    5,   0,   0.11,  ["Army", "Coast Guard"]),
  do:   M(56000,   22000,  960,    12,  0,   0.72,  ["Army", "Navy", "Air Force"]),
  hn:   M(18000,   60000,  400,    10,  0,   0.38,  ["Army", "Navy", "Air Force"]),
  sv:   M(24500,   9900,   320,    8,   0,   0.29,  ["Army", "Navy", "Air Force"]),
  ni:   M(12000,   0,      270,    7,   0,   0.10,  ["Army", "Navy", "Air Force"]),
  cr:   M(0,       9800,   40,     5,   0,   0.34,  ["Public Force", "Coast Guard"]),  // No standing army
  pa:   M(0,       12000,  110,    5,   0,   0.51,  ["National Police", "Coast Guard", "Air Naval Service"]),
  jm:   M(3300,    900,    80,     4,   0,   0.10,  ["Jamaica Defence Force"]),
  tt:   M(4200,    0,      110,    4,   0,   0.14,  ["Army", "Coast Guard", "Air Guard"]),

  // ── SOUTH AMERICA ──
  br:   M(334000,  1340000, 18000, 82, 4,   19.4, ["Army", "Navy", "Air Force"]),
  ar:   M(92000,   45000,  4100,   36,  0,   4.7,  ["Army", "Navy", "Air Force"]),
  cl:   M(78000,   40000,  3100,   26,  0,   5.4,  ["Army", "Navy", "Air Force"]),
  co_co:M(255000,  62000, 6200,    60,  0,   14.2, ["Army", "Navy", "Air Force", "National Police"]),
  pe:   M(120000,  188000, 4800,   40,  0,   3.8,  ["Army", "Navy", "Air Force"]),
  ve:   M(123000,  8000,   3600,   30,  0,   0.82, ["Army", "Navy", "Air Force", "National Guard"]),
  ec:   M(60000,   118000, 1800,   22,  0,   2.4,  ["Army", "Navy", "Air Force"]),
  bo:   M(34200,   0,      600,    16,  0,   0.62, ["Army", "Navy", "Air Force"]),
  py:   M(16000,   0,      480,    8,   0,   0.31, ["Army", "Navy", "Air Force"]),
  uy:   M(22000,   0,      640,    10,  0,   0.82, ["Army", "Navy", "Air Force"]),
  gy:   M(3400,    0,      80,     5,   0,   0.08, ["Guyana Defence Force"]),
  sr:   M(1300,    0,      40,     3,   0,   0.03, ["National Army", "Military Police"]),

  // ── EUROPE ──
  de:   M(184000,  30000,  9600,   76,  16,  90.4, ["Heer (Army)", "Deutsche Marine", "Luftwaffe (Air Force)"]),
  fr:   M(205000,  73000, 14000,   84,  30,  59.0, ["Army", "Navy", "Air & Space Force", "Gendarmerie"]),
  gb:   M(153000,  78000, 10200,   60,  14,  76.1, ["British Army", "Royal Navy", "Royal Air Force"]),
  it:   M(170000,  18000,  9400,   62,  12,  30.3, ["Army", "Navy", "Air Force", "Carabinieri"]),
  es:   M(120000,  15200,  7400,   48,   3,  19.4, ["Army", "Navy", "Air Force", "Guardia Civil"]),
  nl:   M(41000,   5000,   2400,   20,   4,  22.0, ["Army", "Navy", "Air Force", "Military Police"]),
  ch:   M(4000,   140000,  1800,   22,   0,   6.5, ["Army", "Air Force"]),  // Militia system
  se:   M(24000,   31000,  2600,   20,   1,  11.6, ["Army", "Navy", "Air Force"]),
  no:   M(17000,   40000,  2100,   18,   3,  10.1, ["Army", "Navy", "Air Force"]),
  dk:   M(17200,   53000,  1600,   14,   2,   9.3, ["Army", "Royal Danish Navy", "Royal Danish Air Force"]),
  fi:   M(30000,   280000,  3600,  22,   0,   6.9, ["Army", "Navy", "Air Force"]),
  pl:   M(195000,  75000,  7400,   54,   4,  28.1, ["Army", "Navy", "Air Force", "Special Forces"]),
  be:   M(25000,   1600,   1800,   15,   4,   7.6, ["Land Component", "Marine Component", "Air Component"]),
  at:   M(22000,   27000,  1100,   16,   1,   3.5, ["Army", "Air Force"]),
  pt:   M(28400,   211000,  2200,  18,   3,   4.5, ["Army", "Navy", "Air Force"]),
  gr:   M(140000,  220000,  6800,  40,   2,   9.9, ["Army", "Navy", "Air Force"]),
  cz:   M(28000,   0,      1600,  14,   4,   4.6, ["Army", "Air Force"]),
  ro:   M(75000,   55000,  4200,  28,   3,   8.8, ["Land Forces", "Naval Forces", "Air Force"]),
  hu:   M(37000,   20000,  2100,  16,   2,   3.2, ["Army", "Air Force"]),
  ua:   M(900000,  1000000, 22000, 80,   0,  38.0, ["Army", "Navy", "Air Force", "National Guard"]),
  sk:   M(16000,   0,      700,   8,    3,   2.4, ["Land Forces", "Air Forces"]),
  hr:   M(15000,   18000,  1100,  14,   4,   1.7, ["Army", "Navy", "Air Force"]),
  rs:   M(29000,   50000,  1900,  14,   0,   1.2, ["Army", "Air Force & Air Defence"]),
  bg:   M(28000,   3000,   2400,  16,   3,   2.6, ["Land Forces", "Naval Forces", "Air Force"]),
  ru:   M(1300000, 2000000, 45000, 520, 40, 109.0, ["Ground Forces", "Navy", "Aerospace Forces", "Strategic Missile Troops"]),
  ee:   M(7400,    30000,  500,   8,    3,   1.1, ["Army", "Navy", "Air Force"]),
  lv:   M(8200,    10500,  600,   8,    2,   0.87, ["Army", "Navy", "Air Force"]),
  lt:   M(18000,   6000,   900,   10,   2,   1.6, ["Army", "Navy", "Air Force"]),
  si:   M(7600,    1700,   640,   8,    2,   0.77, ["Army (Slovenska vojska)"]),
  ie:   M(9100,    3900,   680,   10,   1,   1.2, ["Army", "Naval Service", "Air Corps"]),
  by:   M(65000,   289000, 4600,  22,   2,   0.68, ["Army", "Air Force & Air Defence"]),
  al_al:M(9000,    500,    420,  6,    2,   0.23, ["Army", "Navy", "Air Force"]),
  mk:   M(8000,    4800,   420,  6,    2,   0.19, ["Army", "Air Force"]),
  ba:   M(10000,   5000,   660,  6,    1,   0.24, ["Army of Bosnia and Herzegovina"]),
  xk:   M(5000,    0,      140,  4,    0,   0.11, ["Kosovo Security Force"]),
  lu:   M(900,     0,      120,  3,    2,   0.70, ["Luxembourg Army"]),
  cy:   M(10000,   75000,  1100,  8,    1,   0.62, ["National Guard"]),
  is:   M(0,       0,      40,   1,    0,   0.06, ["Icelandic Coast Guard"]),  // No army
  md:   M(6500,    0,      280,  4,    0,   0.08, ["National Army"]),
  me_eu:M(2100,    0,      120,  3,    2,   0.10, ["Army"]),

  // ── ASIA ──
  cn:   M(2000000, 510000, 65000, 600, 8,  293.0, ["People's Liberation Army (Ground)", "PLA Navy", "PLA Air Force", "PLA Rocket Force", "PLA Strategic Support Force"]),
  jp:   M(247000,  56000, 11200,  90,   4,  47.6, ["Ground Self-Defense Force", "Maritime Self-Defense Force", "Air Self-Defense Force"]),
  in:   M(1450000, 1155000, 28000, 310, 2,  81.4, ["Army", "Navy", "Air Force"]),
  kr:   M(500000,  3100000, 18000, 160, 4,  48.0, ["Army", "Navy", "Air Force", "Marine Corps"]),
  sa:   M(257000,  25000,  12000, 100,  4,  75.8, ["Army", "Navy", "Air Force", "Air Defence Force", "National Guard"]),
  ae:   M(63000,   0,      2800,  22,   3,  22.0, ["Army", "Navy", "Air Force"]),
  il_as:M(170000,  465000, 12000, 36,   4,  24.4, ["Israel Defence Forces (IDF)"]),
  ir:   M(610000,  350000, 7200,  80,   2,   9.5, ["Army", "Navy", "Air Force", "IRGC"]),
  pk:   M(654000,  550000, 12800, 100,  0,  10.3, ["Army", "Navy", "Air Force"]),
  tr:   M(355000,  380000, 18000, 140,  8,  22.8, ["Land Forces", "Naval Forces", "Air Force"]),
  iq:   M(194000,  0,      4800,  60,   0,   6.9, ["Army", "Navy", "Air Force", "Popular Mobilization Forces"]),
  kz:   M(75000,   31500,  3500,  30,   0,   2.4, ["Army", "Air Defence Forces", "Naval Forces"]),
  uz:   M(48000,   0,      1200,  20,   0,   1.4, ["Army", "Air & Air Defence Forces"]),
  sg:   M(72500,   312500, 4200,  20,   2,  11.4, ["Army", "Navy", "Air Force"]),
  my:   M(113000,  51600,  3800,  34,   0,   4.7, ["Army", "Royal Malaysian Navy", "Royal Malaysian Air Force"]),
  th:   M(361000,  200000, 7800,  80,   0,   7.1, ["Army", "Navy", "Marine Corps", "Air Force"]),
  vn:   M(482000,  5000000, 8800, 60,   0,   6.1, ["Ground Forces", "Navy", "Air Defence-Air Force"]),
  ph:   M(145000,  130000,  2200, 40,   0,   5.2, ["Army", "Navy", "Air Force", "Marine Corps"]),
  id:   M(400000,  400000, 8200,  80,   0,   9.0, ["Army (TNI-AD)", "Navy (TNI-AL)", "Air Force (TNI-AU)"]),
  bd:   M(160000,  63000,  4200,  42,   0,   5.6, ["Army", "Navy", "Air Force"]),
  kp:   M(1280000, 600000, 18000, 120,  0,  10.0, ["Ground Force", "Naval Force", "Air & Anti-Air Force"]),
  mm:   M(406000,  107000, 4800,  40,   0,   2.7, ["Army", "Navy", "Air Force"]),
  kh:   M(124300,  0,      1200,  16,   0,   0.60, ["Army", "Navy", "Air Force"]),
  lk:   M(255000,  40700,  3600,  24,   0,   1.5, ["Army", "Navy", "Air Force"]),
  np:   M(96000,   0,      680,  16,    0,   0.42, ["Nepal Army"]),
  jo:   M(100500,  65000,  3400, 32,    4,   2.3, ["Army", "Royal Jordanian Air Force", "Royal Jordanian Navy"]),
  qa:   M(16000,   0,      1200,  12,   7,  21.5, ["Army", "Navy", "Air Force"]),
  kw:   M(17500,   23700,  2100,  14,   2,   8.7, ["Army", "Navy", "Air Force"]),
  sa_bh:M(8000,    0,      340,   5,    2,   1.4, ["Bahrain Defence Force"]),
  bh:   M(8000,    0,      340,   5,    2,   1.4, ["Bahrain Defence Force"]),
  om:   M(42600,   0,      2800,  18,   1,   6.0, ["Army", "Royal Navy", "Royal Air Force"]),
  tw:   M(169000,  1657000, 8400, 38,   0,  16.5, ["Army", "Navy", "Air Force", "Marine Corps"]),
  am:   M(52000,   210000,  2400, 16,   1,   0.68, ["Armed Forces"]),
  az_as:M(67000,   300000,  4200, 24,   0,   2.3, ["Ground Forces", "Air Forces & Air Defence"]),
  ge_as:M(37000,   0,      1200,  12,   0,   0.70, ["Army", "Air Force", "National Guard"]),

  // ── AFRICA ──
  ng:   M(135000,  0,      2800,  48,   0,   3.2, ["Army", "Nigerian Navy", "Nigerian Air Force"]),
  et:   M(138000,  0,      3100,  42,   0,   1.0, ["Ground Forces", "Air Force"]),
  eg:   M(440000,  479000, 14000, 120,   2,   5.4, ["Army", "Navy", "Air Force", "Air Defence"]),
  za:   M(80200,   15100,  3700,  32,   2,   2.8, ["SA Army", "SA Navy", "SA Air Force"]),
  ke:   M(24120,   0,      740,   12,   4,   1.1, ["Army", "Navy", "Air Force"]),
  dz:   M(139000,  150000, 6200,  60,   0,  22.5, ["National People's Army (Land)", "Navy", "Air Force"]),
  ma:   M(196000,  150000, 6000,  60,   0,   5.2, ["Royal Moroccan Army", "Royal Navy", "Royal Air Force"]),
  ao:   M(100000,  0,      2200,  30,   0,   1.5, ["Army", "Navy", "Air Force"]),
  gh:   M(15500,   0,      480,   10,   4,   0.32, ["Army", "Navy", "Air Force"]),
  tz:   M(27000,   80000,  980,   18,   2,   0.63, ["Tanzania People's Defence Force"]),

  // ── OCEANIA ──
  au_oc:M(59600,   29200,  4600,  56,   8,  42.1, ["Army", "Royal Australian Navy", "Royal Australian Air Force"]),
  nz:   M(10000,   2400,   820,  16,    2,   3.5, ["Army", "Royal New Zealand Navy", "Royal New Zealand Air Force"]),
  pg:   M(3100,    0,      160,  5,     0,   0.10, ["Defence Force"]),
  fj:   M(3500,    6000,   120,  4,     1,   0.05, ["Republic of Fiji Military Forces"]),
  sb:   M(0,       0,      0,    0,     0,   0.00, ["Royal Solomon Islands Police Force"]),
  vu:   M(0,       0,      0,    0,     0,   0.00, ["Vanuatu Mobile Force"]),
  ws:   M(0,       0,      0,    0,     0,   0.00, ["Samoa Police Service"]),
  to:   M(500,     0,      20,   1,     0,   0.01, ["Tonga Defence Services"]),

  // ── CENTRAL AMERICA / CARIBBEAN ──
  bz:   M(1500,    700,    60,   4,     0,   0.03, ["Belize Defence Force"]),
  bs:   M(1300,    0,      60,   3,     0,   0.06, ["Royal Bahamas Defence Force"]),
  bb:   M(600,     430,    30,   2,     0,   0.02, ["Barbados Defence Force"]),
  lc:   M(0,       0,      0,    0,     0,   0.01, ["Royal Saint Lucia Police Force"]),
  vc:   M(0,       0,      0,    0,     0,   0.01, ["Coast Guard"]),
  gd:   M(0,       0,      0,    0,     0,   0.01, ["Royal Grenada Police Force"]),
  ag:   M(340,     0,      20,   1,     0,   0.01, ["Antigua and Barbuda Defence Force"]),
  dm:   M(0,       0,      0,    0,     0,   0.01, ["State Police"]),
  kn:   M(350,     0,      20,   1,     0,   0.01, ["Saint Kitts and Nevis Defence Force"]),

  // ── AFRICA (MISSING) ──
  ug:   M(45000,   0,      1200,  20,  4,   0.88, ["Uganda People's Defence Force (UPDF)"]),
  sd:   M(109000,  0,      3200,  42,  0,   1.0,  ["Ground Forces", "Air Force", "Navy"]),
  ss:   M(185000,  0,      1400,  20,  0,   0.50, ["South Sudan People's Defence Force"]),
  so:   M(20000,   0,      600,   10,  0,   0.12, ["Somali National Army"]),
  dj:   M(10950,   0,      480,   6,   6,   0.34, ["Djibouti National Army"]),
  er:   M(200000,  120000, 3400,  30,  0,   0.09, ["Eritrean Defence Forces"]),
  li_bm:M(0,       0,      0,    0,    0,   0.00, []),
  zw:   M(29000,   0,      1200,  18,  0,   0.46, ["Zimbabwe Defence Forces"]),
  mz:   M(12000,   0,      560,   10,  0,   0.16, ["Mozambique Armed Forces (FADM)"]),
  mg:   M(13000,   8000,   400,   10,  0,   0.44, ["People's Armed Forces"]),
  zm:   M(16000,   3000,   560,  12,   0,   0.38, ["Zambia Defence Force"]),
  ml:   M(7350,    4800,   600,  10,   0,   0.35, ["Malian Armed Forces"]),
  bf:   M(6400,    8000,   500,  10,   0,   0.34, ["Armed Forces of Burkina Faso"]),
  ne:   M(12000,   12000,  800,  12,   0,   0.27, ["Nigerien Armed Forces"]),
  tn:   M(36000,   24000,  2200,  18,  1,   1.1,  ["National Army", "Navy", "Air Force"]),
  ly:   M(82000,   0,      2800,  30,  0,   1.0,  ["Libyan National Army / GNA Forces"]),
  rw:   M(33000,   6000,   840,  10,   4,   1.0,  ["Rwanda Defence Force"]),
  bj:   M(6750,    2500,   360,  8,    0,   0.24, ["Benin Armed Forces"]),
  ci:   M(25000,   10000,  1200,  20,  0,   0.64, ["Defence and Security Forces of CI"]),
  cm:   M(14000,   9000,   680,  16,   0,   0.60, ["Cameroon Armed Forces"]),
  sn:   M(15000,   15000,  860,  16,   0,   0.75, ["Senegalese Armed Forces"]),
  ga_af:M(5000,    2000,   380,  6,    0,   0.25, ["Gabonese Armed Forces"]),
  cg:   M(10000,   2000,   460,  8,    0,   0.16, ["Republic of the Congo Armed Forces"]),
  cf:   M(7150,    1200,   220,  6,    0,   0.11, ["Central African Armed Forces"]),
  td:   M(30350,   0,      1200,  22,  0,   0.75, ["National Army of Chad"]),
  mr:   M(15870,   0,      680,  10,   0,   0.24, ["Armed Forces of Mauritania"]),
  gn:   M(12000,   7500,   580,  10,   0,   0.22, ["People's Revolutionary Armed Forces"]),
  gw:   M(4450,    0,      100,  4,    0,   0.03, ["Armed Forces of Guinea-Bissau"]),
  sl:   M(10500,   0,      300,  6,    0,   0.07, ["Republic of Sierra Leone Armed Forces"]),
  lr:   M(2000,    0,      120,  4,    0,   0.07, ["Armed Forces of Liberia"]),
  tg:   M(8550,    3000,   440,  8,    0,   0.20, ["Armed Forces of Togo"]),
  bi:   M(20000,   0,      500,  8,    2,   0.36, ["National Defence Force"]),
  mw:   M(9800,    0,      240,  6,    0,   0.30, ["Malawi Defence Force"]),
  na:   M(9200,    6000,   620,  8,    0,   0.58, ["Namibian Defence Force"]),
  bw:   M(9000,    0,      620,  8,    0,   0.60, ["Botswana Defence Force"]),
  mu:   M(0,       10000,  140,  2,    0,   0.04, ["National Coast Guard", "Special Mobile Force"]),
  sz:   M(3000,    500,    120,  4,    0,   0.07, ["Umbutfo Eswatini Defence Force"]),
  ls:   M(2000,    0,      80,   3,    0,   0.04, ["Lesotho Defence Force"]),
  gm:   M(2000,    0,      80,   3,    0,   0.03, ["Gambia Armed Forces"]),
  cv:   M(1200,    0,      60,   3,    0,   0.02, ["Armed Forces of Cape Verde"]),
  sc:   M(500,     0,      40,   2,    0,   0.01, ["Seychelles People's Defence Forces"]),
  st:   M(0,       0,      0,    0,    0,   0.00, ["Armed Forces of STP"]),
  gq:   M(1320,    0,      100,  4,    0,   0.10, ["Armed Forces of Equatorial Guinea"]),
  km:   M(500,     0,      30,   2,    0,   0.02, ["National Army of the Comoros"]),
  eh:   M(4000,    0,      200,  6,    0,   0.00, ["Polisario / Royal Moroccan Army"]),
  cd:   M(134250,  0,      3200,  40,  0,   0.87, ["Armed Forces of the DRC (FARDC)"]),

  // ── ASIA (MISSING) ──
  lb:   M(80000,   0,      2200,  24,  0,   0.68, ["Lebanese Armed Forces"]),
  sy:   M(175000,  0,      4000,  40,  0,   1.0,  ["Syrian Arab Army", "Air Force"]),
  ye:   M(30000,   0,      1200,  20,  0,   0.74, ["Yemeni Armed Forces"]),
  ps:   M(0,       60000,  0,    0,    0,   0.40, ["Palestinian Authority Security Forces"]),
  la:   M(30600,   0,      680,  16,   0,   0.23, ["Lao People's Armed Forces"]),
  tl:   M(2000,    1500,   80,   3,    0,   0.05, ["Timor-Leste Defence Force"]),
  bn:   M(7000,    700,    320,  6,    0,   0.39, ["Royal Brunei Armed Forces"]),
  mn_as:M(9000,    140000, 1200, 16,   0,   0.12, ["Mongolian Armed Forces"]),
  af:   M(180000,  0,      2400,  40,  0,   0.88, ["Afghan National Army (Taliban)"]),
  tm:   M(36000,   0,      2400,  18,  0,   0.86, ["Armed Forces of Turkmenistan"]),
  kg:   M(15000,   57000,  1400,  12,  0,   0.21, ["Armed Forces of Kyrgyzstan"]),
  tj:   M(8800,    0,      740,   10,  0,   0.12, ["Armed Forces of Tajikistan"]),

  // ── EUROPE (MISSING / MICRO-STATES) ──
  sm:   M(0,       0,      0,    0,    0,   0.00, ["Corps of the Gendarmerie (police)"]),
  li:   M(0,       0,      0,    0,    0,   0.00, ["No standing army"]),
  ad:   M(0,       0,      0,    0,    0,   0.01, ["Police Force (nominal)"]),
  mc:   M(0,       0,      0,    0,    0,   0.01, ["Carabiniers du Prince"]),
  fo:   M(0,       0,      0,    0,    0,   0.00, ["Danish defence umbrella"]),
  gl:   M(0,       0,      0,    0,    0,   0.00, ["Danish defence umbrella"]),
  mt_eu:M(1950,    170,    120,  2,    1,   0.09, ["Armed Forces of Malta"]),

  // ── TERRITORIES ──
  pr:   M(0,       18000,  0,    5,    0,   0.00, ["Puerto Rico Army National Guard", "Air National Guard"]),
  gu:   M(0,       4000,   0,    4,    1,   0.00, ["Guam Army/Air National Guard"]),
  bm:   M(600,     0,      40,   1,    0,   0.01, ["Royal Bermuda Regiment"]),

  // ── SOUTH ASIA (MISSING) ──
  mv:   M(400,     100,    40,   2,    0,   0.06, ["Maldives National Defence Force"]),
  bt:   M(6000,    0,      120,  4,    0,   0.03, ["Royal Bhutan Army"]),
};

export function getMilitary(countryId: string): MilitaryStats | null {
  return MILITARY[countryId] ?? null;
}

export function fmtPers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}
