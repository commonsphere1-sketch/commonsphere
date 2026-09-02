/**
 * Background for the commodities on the Economies page.
 *
 * Deposits name the fields, basins and mines the material actually comes
 * from, which is often a different question from who holds the reserves on
 * the card: the United States tops the gold card on its central-bank
 * holdings, not its ore, and China's grip on rare earths is mostly refining
 * rather than rock. Those distinctions are called out where they matter.
 *
 * Share and output figures are indicative — they move year to year, and the
 * modal says so rather than implying a live feed.
 */
export interface ResourceDetail {
  summary: string;
  uses: { label: string; detail: string }[];
  deposits: { place: string; detail: string }[];
  value: string[];
}

export const RESOURCE_DETAILS: Record<string, ResourceDetail> = {
  "Crude Oil": {
    summary:
      "The largest traded commodity by value, and still the backbone of transport fuel and petrochemicals despite decades of substitution efforts.",
    uses: [
      { label: "Transport fuels", detail: "Petrol, diesel, jet fuel and marine bunker — the bulk of every barrel refined." },
      { label: "Petrochemicals", detail: "Feedstock for plastics, synthetic fibres, solvents and industrial chemicals." },
      { label: "Agriculture", detail: "Indirectly, through fuel for machinery and as feedstock alongside gas for fertiliser." },
      { label: "Materials", detail: "Lubricants, waxes, bitumen for roads and roofing." },
    ],
    deposits: [
      { place: "Ghawar, Saudi Arabia", detail: "The largest conventional oil field ever found, in production since the 1950s." },
      { place: "Permian Basin, USA", detail: "Shale acreage in Texas and New Mexico that made the US the largest producer." },
      { place: "Western Siberia, Russia", detail: "The Samotlor and Priobskoye fields anchor Russian output." },
      { place: "Orinoco Belt, Venezuela", detail: "Extra-heavy crude; the largest proven reserves in the world, but costly to lift and upgrade." },
      { place: "Athabasca, Canada", detail: "Oil sands mined and steam-extracted rather than pumped conventionally." },
    ],
    value: [
      "Priced against the Brent and WTI benchmarks, quoted per barrel of 42 US gallons.",
      "OPEC+ quota decisions and spare capacity move price as much as demand does.",
      "Refining margins mean the crude price and the pump price move together but not in step.",
    ],
  },

  "Natural Gas": {
    summary:
      "A fuel and a chemical feedstock at once. Regional pipeline markets price it very differently, so there is no single world price the way there is for oil.",
    uses: [
      { label: "Power generation", detail: "Combined-cycle plants that follow demand faster than coal or nuclear can." },
      { label: "Heat", detail: "Domestic and industrial heating, and high-temperature process heat." },
      { label: "Fertiliser", detail: "Hydrogen for ammonia via Haber–Bosch — the feedstock behind most nitrogen fertiliser." },
      { label: "Petrochemicals", detail: "Ethane and other liquids cracked for plastics." },
    ],
    deposits: [
      { place: "North Dome / South Pars", detail: "Shared by Qatar and Iran; the largest gas field in the world." },
      { place: "Urengoy & Yamburg, Russia", detail: "Giant West Siberian fields that long supplied Europe by pipeline." },
      { place: "Marcellus, USA", detail: "Appalachian shale that turned the US into a net exporter via LNG." },
      { place: "Galkynysh, Turkmenistan", detail: "Among the largest fields, piped mainly toward China." },
    ],
    value: [
      "Henry Hub, TTF and JKM price the US, European and Asian markets separately.",
      "Liquefaction and shipping costs are what keep those regional prices apart.",
      "Storage levels and weather drive far sharper seasonal swings than in oil.",
    ],
  },

  Gold: {
    summary:
      "Held as a reserve asset more than consumed as a material. Almost all the gold ever mined still exists, so above-ground stocks matter more than annual output.",
    uses: [
      { label: "Reserve asset", detail: "Central bank holdings and investment bars, coins and ETFs." },
      { label: "Jewellery", detail: "The largest single category of fabrication demand, led by India and China." },
      { label: "Electronics", detail: "Connectors and bonding wire, where corrosion resistance justifies the cost." },
      { label: "Specialised", detail: "Dentistry, aerospace coatings and infrared shielding." },
    ],
    deposits: [
      { place: "Witwatersrand, South Africa", detail: "The basin that produced a large share of all gold ever mined; now deep and declining." },
      { place: "Carlin Trend, Nevada, USA", detail: "Fine-grained deposits that made large-scale heap leaching viable." },
      { place: "Muruntau, Uzbekistan", detail: "One of the largest open-pit gold mines in the world." },
      { place: "Grasberg, Indonesia", detail: "Vast gold output as a by-product of copper mining." },
    ],
    value: [
      "The card's 8,133 tonnes is the US Treasury's bullion holding — a vault figure, not an ore reserve.",
      "Quoted per troy ounce (31.1g), with London fixing the benchmark.",
      "Moves inversely to real interest rates more reliably than it tracks inflation.",
    ],
  },

  Coal: {
    summary:
      "Two distinct markets sharing a name: thermal coal burned for electricity, and metallurgical coal used to make steel. Only the first has a ready substitute.",
    uses: [
      { label: "Electricity", detail: "Still the single largest source of global power generation." },
      { label: "Steelmaking", detail: "Coking coal converted to coke reduces iron ore in a blast furnace." },
      { label: "Cement", detail: "Kiln fuel for clinker production." },
      { label: "Industrial heat", detail: "Chemicals and heavy manufacturing, and coal-to-liquids in a few markets." },
    ],
    deposits: [
      { place: "Shanxi & Inner Mongolia, China", detail: "The bulk of the world's largest producing and consuming market." },
      { place: "Powder River Basin, USA", detail: "Thick, shallow, low-sulphur seams mined at very low cost." },
      { place: "Bowen Basin, Australia", detail: "The premier source of seaborne coking coal." },
      { place: "Kuznetsk Basin, Russia", detail: "Siberia's main coal region, constrained by rail distance to ports." },
    ],
    value: [
      "Newcastle prices seaborne thermal; coking coal trades on separate hard-coking benchmarks.",
      "Energy content and sulphur decide the discount or premium to benchmark.",
      "Metallurgical demand holds up under decarbonisation far better than thermal demand.",
    ],
  },

  "Iron Ore": {
    summary:
      "Effectively a single-purpose commodity: almost all of it becomes steel, so its price tracks construction and manufacturing in China above all else.",
    uses: [
      { label: "Steel", detail: "Nearly all iron ore is smelted into pig iron and then steel." },
      { label: "Construction", detail: "Reinforcing bar, structural sections and sheet." },
      { label: "Manufacturing", detail: "Vehicles, machinery, shipbuilding and appliances." },
      { label: "Minor uses", detail: "Pigments, cement additives and heavy aggregate." },
    ],
    deposits: [
      { place: "Pilbara, Australia", detail: "The Hamersley ranges — the largest seaborne supply source." },
      { place: "Carajás, Brazil", detail: "Exceptionally high-grade ore, low in impurities." },
      { place: "Simandou, Guinea", detail: "A very large high-grade deposit, long delayed by infrastructure needs." },
      { place: "Kursk Magnetic Anomaly, Russia", detail: "One of the largest iron concentrations on earth." },
    ],
    value: [
      "Benchmarked as 62% Fe fines delivered to China, priced per dry metric tonne.",
      "Grade premiums widen when steel mills are pushed to cut emissions per tonne.",
      "Freight from Australia versus Brazil is a real component of delivered cost.",
    ],
  },

  Copper: {
    summary:
      "The metal that carries electricity, which ties its demand directly to grids, motors and electrification. Often read as a gauge of industrial activity.",
    uses: [
      { label: "Power & wiring", detail: "Transmission, distribution and building wiring." },
      { label: "Motors", detail: "Windings in industrial motors and electric vehicles, which use far more than combustion cars." },
      { label: "Construction", detail: "Plumbing, roofing and heat exchangers." },
      { label: "Renewables", detail: "Wind turbines and solar farms are copper-intensive per unit of capacity." },
    ],
    deposits: [
      { place: "Escondida, Chile", detail: "The largest copper mine in the world by output." },
      { place: "Kamoa-Kakula, DR Congo", detail: "Very high-grade, and among the fastest-growing major sources." },
      { place: "Grasberg, Indonesia", detail: "A giant copper-gold operation moving underground as the pit is exhausted." },
      { place: "Oyu Tolgoi, Mongolia", detail: "A large block-cave development with substantial gold credits." },
    ],
    value: [
      "Traded on the LME, COMEX and Shanghai; quoted per tonne or per pound.",
      "Nicknamed 'Dr. Copper' for how closely it tracks the industrial cycle.",
      "Grades at existing mines are falling, so more rock must be moved per tonne produced.",
    ],
  },

  Lithium: {
    summary:
      "Not scarce in the crust, but slow to bring to market: demand is dominated by batteries, and new brine or hard-rock capacity takes years to build.",
    uses: [
      { label: "Batteries", detail: "The overwhelming majority — EVs, grid storage and consumer electronics." },
      { label: "Glass & ceramics", detail: "Lowers melting temperature and improves thermal shock resistance." },
      { label: "Greases", detail: "Lithium soaps make high-temperature lubricating greases." },
      { label: "Pharmaceutical", detail: "Lithium salts remain a frontline treatment for bipolar disorder." },
    ],
    deposits: [
      { place: "Salar de Atacama, Chile", detail: "High-concentration brine in an exceptionally arid basin — the lowest-cost source." },
      { place: "Salar del Hombre Muerto, Argentina", detail: "Part of the 'Lithium Triangle' spanning Chile, Argentina and Bolivia." },
      { place: "Greenbushes, Australia", detail: "Hard-rock spodumene; Australia leads mined output." },
      { place: "Salar de Uyuni, Bolivia", detail: "Enormous resource, held back by high magnesium content and low extraction rates." },
    ],
    value: [
      "Sold as carbonate or hydroxide rather than as metal, on contract more than spot.",
      "Among the most volatile commodities here — capacity arrives in large, lumpy steps.",
      "Refining is concentrated in China even where the raw material is mined elsewhere.",
    ],
  },

  Wheat: {
    summary:
      "A staple calorie source for a large share of the world, which makes its price a political matter as much as an agricultural one.",
    uses: [
      { label: "Food", detail: "Milled to flour for bread, pasta, noodles and baked goods." },
      { label: "Animal feed", detail: "Lower-grade and weather-damaged crops go to livestock." },
      { label: "Industrial", detail: "Starch and gluten for paper, adhesives and processed foods." },
      { label: "Ethanol", detail: "A fuel feedstock in some markets, competing with the food supply." },
    ],
    deposits: [
      { place: "Black Sea basin", detail: "Russia and Ukraine — the swing exporters, and the reason conflict there moves world prices." },
      { place: "US Great Plains", detail: "Hard red winter wheat through the central states." },
      { place: "Canadian Prairies", detail: "High-protein spring wheat." },
      { place: "India & China", detail: "The largest producers, but they consume domestically rather than export." },
    ],
    value: [
      "The card's 17% is a share of exports, not of reserves — wheat is grown and eaten, not stockpiled underground.",
      "Chicago, Kansas City and Paris price the different varieties separately.",
      "Weather in a handful of exporting regions dominates price formation.",
    ],
  },

  "Rare Earth": {
    summary:
      "Seventeen elements that are not geologically rare, but are hard to separate from one another. The bottleneck is processing, not deposits.",
    uses: [
      { label: "Permanent magnets", detail: "Neodymium and dysprosium for EV motors, wind turbines and drives." },
      { label: "Electronics", detail: "Phosphors for displays and lighting, and precision optics." },
      { label: "Catalysts", detail: "Cerium and lanthanum in refining and vehicle catalytic converters." },
      { label: "Defence", detail: "Guidance systems, radar and lasers — the reason they are treated as strategic." },
    ],
    deposits: [
      { place: "Bayan Obo, China", detail: "The dominant single source, mined alongside iron ore in Inner Mongolia." },
      { place: "Mountain Pass, USA", detail: "Reopened to rebuild non-Chinese supply, though much output is still refined abroad." },
      { place: "Mount Weld, Australia", detail: "A high-grade deposit feeding refining capacity built outside China." },
      { place: "Lovozero, Russia", detail: "Kola Peninsula deposits worked since the Soviet period." },
    ],
    value: [
      "China's leverage rests on separation and refining capacity more than on ore in the ground.",
      "Individual elements price separately; the light ones are far more abundant than the heavy ones.",
      "Export controls, not scarcity, have driven every major price spike so far.",
    ],
  },

  Uranium: {
    summary:
      "Priced per pound of concentrate, but its cost barely registers in the price of nuclear electricity — fuel is a small fraction of a reactor's economics.",
    uses: [
      { label: "Nuclear power", detail: "Enriched to a few percent U-235 for reactor fuel; supplies roughly a tenth of world electricity." },
      { label: "Naval propulsion", detail: "Highly enriched fuel for submarines and carriers." },
      { label: "Medical isotopes", detail: "Targets for producing diagnostic and treatment isotopes." },
      { label: "Depleted uranium", detail: "Its density suits it to counterweights, shielding and armour." },
    ],
    deposits: [
      { place: "Athabasca Basin, Canada", detail: "McArthur River and Cigar Lake — grades orders of magnitude above the world average." },
      { place: "Kazakhstan", detail: "The largest producer, using low-cost in-situ recovery rather than mining." },
      { place: "Olympic Dam, Australia", detail: "Uranium recovered alongside copper and gold." },
      { place: "Namibia & Niger", detail: "Rössing and Husab, and the Sahel deposits that supply parts of Europe." },
    ],
    value: [
      "Quoted as U3O8 — yellowcake — per pound, mostly on long-term utility contracts.",
      "Enrichment and conversion are separate markets, and both became bottlenecks after 2022.",
      "Demand is unusually predictable: reactors are refuelled on schedule regardless of price.",
    ],
  },

  Aluminum: {
    summary:
      "Refined from bauxite through an electricity-hungry smelting process, which is why it is often described as solid electricity and why smelters follow cheap power.",
    uses: [
      { label: "Transport", detail: "Airframes, and increasingly car bodies where weight saving matters." },
      { label: "Packaging", detail: "Cans and foil, with a recycling loop that uses a fraction of the original energy." },
      { label: "Construction", detail: "Window frames, cladding and structural extrusions." },
      { label: "Power", detail: "Overhead transmission lines, where lightness beats copper's conductivity." },
    ],
    deposits: [
      { place: "Boké, Guinea", detail: "The largest bauxite reserves and a major share of seaborne supply." },
      { place: "Weipa & Gove, Australia", detail: "Long-established bauxite mining feeding domestic alumina refineries." },
      { place: "Pará, Brazil", detail: "Bauxite mined and refined near hydroelectric power." },
      { place: "Smelting hubs", detail: "China, Russia and the Gulf — sited for electricity, not for ore." },
    ],
    value: [
      "The card's 'N/A (produced)' is right: there is no aluminium ore, only bauxite refined to alumina then smelted.",
      "Power contracts drive the cost curve more than raw material does.",
      "Recycled metal needs around a twentieth of the energy of primary production.",
    ],
  },

  Silver: {
    summary:
      "Half precious metal, half industrial input — and mostly produced as a by-product of other mines, so supply responds only weakly to its own price.",
    uses: [
      { label: "Solar", detail: "Conductive paste in photovoltaic cells, now a major and growing share of demand." },
      { label: "Electronics", detail: "The highest electrical conductivity of any element; used in contacts and switches." },
      { label: "Brazing & alloys", detail: "Joining alloys, bearings and specialist mirrors." },
      { label: "Investment & jewellery", detail: "Bars, coins, silverware and ornament." },
    ],
    deposits: [
      { place: "Fresnillo, Mexico", detail: "The largest primary silver mine; Mexico leads world output." },
      { place: "Peru", detail: "Major output, much of it alongside lead, zinc and copper." },
      { place: "KGHM, Poland", detail: "Substantial silver recovered as a by-product of copper." },
      { place: "Chile & China", detail: "Further significant by-product production." },
    ],
    value: [
      "Quoted per troy ounce and more volatile than gold, on a much smaller market.",
      "Most supply is a by-product, so output does not rise readily when the price does.",
      "The gold-to-silver ratio is watched as a gauge of relative valuation.",
    ],
  },
};
