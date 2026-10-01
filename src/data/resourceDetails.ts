/**
 * Background for the commodities on the Economies page: what each is used
 * for, how it is produced, where it comes from and how it is priced.
 *
 * This is the site's own summary, written to explain the figures beside it,
 * and it is kept to what is settled and can be said without a number. The
 * numbers in the window - prices, production, reserves, shares - come from
 * the generated files (commodityPrices.ts, resourceProducers.ts,
 * energyProducers.ts, otherProducers.ts), each with its source. The few
 * figures written here are definitions (a barrel, a troy ounce) or are marked
 * as approximate in the text.
 *
 * Deposits name the fields, basins and mines the material actually comes
 * from, which is often a different question from who holds the reserves in
 * the table: China's grip on rare earths is mostly refining rather than rock,
 * and aluminium smelters follow cheap power, not ore.
 */
export interface ResourceDetail {
  summary: string;
  uses: { label: string; detail: string }[];
  /** How it gets from the ground (or the field) to the form it is sold in, in order. */
  made: string[];
  /** What the price's unit and benchmark mean. */
  unit: string;
  deposits: { place: string; detail: string }[];
  value: string[];
}

export const RESOURCE_DETAILS: Record<string, ResourceDetail> = {
  "Crude Oil": {
    summary:
      "The largest traded commodity by value, and still the backbone of transport fuel and petrochemicals despite decades of substitution efforts.",
    uses: [
      { label: "Transport fuels", detail: "Petrol, diesel, jet fuel and marine bunker fuel take the bulk of every barrel refined. Road vehicles, aircraft and ships have few ready substitutes, which is why oil demand follows the movement of people and goods so closely." },
      { label: "Petrochemicals", detail: "Naphtha and other refinery streams are the feedstock for plastics, synthetic fibres, solvents, detergents and synthetic rubber. It is the part of demand that keeps growing as fuels are displaced." },
      { label: "Heating and power", detail: "Heating oil warms buildings beyond the reach of gas grids, and fuel oil or crude is still burned for electricity on islands and in some oil-producing states." },
      { label: "Agriculture", detail: "Indirectly: diesel for tractors, pumps and haulage, and - alongside gas - a feedstock for fertilisers and pesticides." },
      { label: "Materials", detail: "The heaviest fractions of the barrel become lubricants, waxes, and the bitumen in roads and roofing." },
      { label: "Industry", detail: "Petroleum coke fuels cement kilns and makes the anodes used to smelt aluminium; refineries also supply sulphur to the chemical industry." },
    ],
    made: [
      "Pumped from wells onshore and offshore. In shale the rock is fractured to release it, and in Canada's oil sands it is mined or melted out with steam.",
      "Moved by pipeline and tanker to refineries, where distillation separates the crude by boiling point and cracking units break heavy molecules into lighter fuels.",
      "Crudes differ. Light, low-sulphur (\"sweet\") grades yield more petrol and diesel and sell at a premium to heavy, sour ones.",
    ],
    unit: "A barrel is 42 US gallons, about 159 litres. Brent is a blend of North Sea crudes and the benchmark against which most of the world's traded oil is priced.",
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
      { label: "Power generation", detail: "Gas-fired plants can be turned up and down quickly, so they follow demand and stand behind wind and solar in a way coal and nuclear plants cannot." },
      { label: "Heat", detail: "Burned directly for space and water heating in homes, and for high-temperature process heat in industry - glass, ceramics, steel and food processing." },
      { label: "Fertiliser", detail: "The hydrogen in ammonia comes mostly from gas, through the Haber-Bosch process, which makes gas the feedstock behind most nitrogen fertiliser." },
      { label: "Petrochemicals", detail: "Ethane and other liquids separated from the gas stream are cracked into ethylene for plastics; methane itself is made into methanol." },
      { label: "Hydrogen", detail: "Most of the hydrogen used by refineries and chemical plants is made by reforming natural gas with steam." },
      { label: "Transport", detail: "Compressed gas fuels buses and trucks in some countries, and liquefied gas is increasingly used as a fuel for ships." },
    ],
    made: [
      "Produced from gas fields and alongside oil; shale gas is released by fracturing the rock.",
      "Processed to strip out water, sulphur compounds and the heavier gas liquids, then moved by pipeline.",
      "To cross an ocean it is chilled to about −162°C until it becomes a liquid (LNG), shipped in insulated tankers, and turned back into gas at the receiving terminal.",
    ],
    unit: "A million British thermal units (MMBtu) measures the energy in the gas, not its volume. Henry Hub is a pipeline junction in Louisiana where the United States' benchmark is set.",
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
      { label: "Reserve asset", detail: "Central banks hold bullion as part of their reserves, and investors hold bars, coins and exchange-traded funds backed by metal in vaults." },
      { label: "Jewellery", detail: "The largest single use of newly fabricated gold, led by buyers in India and China, where it is also a store of household savings." },
      { label: "Electronics", detail: "Connectors, contacts and bonding wire, where gold's resistance to corrosion justifies its cost." },
      { label: "Dentistry and medicine", detail: "Dental alloys, and small amounts in medical devices and diagnostic tests." },
      { label: "Coatings", detail: "Thin films of gold reflect infrared heat - on aircraft and spacecraft parts, visors and some architectural glass." },
      { label: "Financial contracts", detail: "Futures and other contracts settle against the gold price, so far more gold changes hands on paper than is ever delivered." },
    ],
    made: [
      "Mined from hard-rock deposits and river gravels; a good deal is also recovered as a by-product of copper mining.",
      "The ore is crushed and the gold dissolved out with a cyanide solution, or concentrated by gravity and flotation, then smelted into doré bars and refined to pure metal.",
      "Gold does not corrode and is rarely thrown away, so recycled jewellery and scrap are a large part of each year's supply.",
    ],
    unit: "A troy ounce is 31.1 grams, about a tenth heavier than an ordinary ounce.",
    deposits: [
      { place: "Witwatersrand, South Africa", detail: "The basin that produced a large share of all gold ever mined; now deep and declining." },
      { place: "Carlin Trend, Nevada, USA", detail: "Fine-grained deposits that made large-scale heap leaching viable." },
      { place: "Muruntau, Uzbekistan", detail: "One of the largest open-pit gold mines in the world." },
      { place: "Grasberg, Indonesia", detail: "Vast gold output as a by-product of copper mining." },
    ],
    value: [
      "The United States Treasury's bullion, about 8,133 tonnes, is the largest holding of any central bank - a vault figure, not an ore reserve like those in the table above.",
      "Quoted per troy ounce (31.1g), with London fixing the benchmark.",
      "Moves inversely to real interest rates more reliably than it tracks inflation.",
    ],
  },

  Coal: {
    summary:
      "Two distinct markets sharing a name: thermal coal burned for electricity, and metallurgical coal used to make steel. Only the first has a ready substitute.",
    uses: [
      { label: "Electricity", detail: "Thermal coal is burned in power stations; it is still the largest single source of the world's electricity." },
      { label: "Steelmaking", detail: "Coking coal is baked into coke, which both fuels the blast furnace and strips the oxygen from iron ore." },
      { label: "Cement", detail: "Kilns burn coal to reach the temperatures at which limestone becomes clinker." },
      { label: "Industrial heat", detail: "Boilers and furnaces in chemicals, paper, brick-making and other heavy industry." },
      { label: "Chemicals and fuels", detail: "Gasified into the feedstock for methanol, ammonia and, in a few countries, liquid fuels - chiefly in China." },
      { label: "Home heating", detail: "Still burned in stoves and small boilers in parts of Asia and eastern Europe." },
    ],
    made: [
      "Mined from the surface where seams are shallow, by stripping away the rock above them, and underground where they are deep.",
      "Washed to remove rock and ash, then moved in bulk by rail and ship.",
      "Ranked by energy and carbon content: lignite the lowest, then sub-bituminous and bituminous coal, and anthracite the highest. Coking coal is a bituminous coal with the properties needed to form coke.",
    ],
    unit: "Priced per tonne at the port of Newcastle, New South Wales, for thermal coal of a stated energy content - the benchmark for coal traded by sea in Asia.",
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
      { label: "Steel", detail: "Almost all iron ore is smelted into pig iron and then refined into steel; everything else here is a use of that steel." },
      { label: "Construction", detail: "Reinforcing bar, beams and sheet for buildings, bridges and railways - the largest use of steel." },
      { label: "Vehicles and machinery", detail: "Cars, trucks, ships, industrial machinery and domestic appliances." },
      { label: "Energy and infrastructure", detail: "Pipelines, wind turbine towers, pylons and rails." },
      { label: "Packaging and goods", detail: "Tinplate cans, tools and countless small metal goods." },
      { label: "Minor uses", detail: "Iron oxides as pigments, in cement, in heavy concrete and in water treatment." },
    ],
    made: [
      "Mined in vast open pits, then crushed and screened into lump and fines; lower-grade ores are concentrated and formed into pellets.",
      "Carried by dedicated heavy-haul railways to port and shipped in the largest bulk carriers afloat.",
      "Reduced in a blast furnace with coke, or in a direct-reduction plant with gas, and the iron then made into steel.",
    ],
    unit: "The benchmark is for fines containing 62% iron, delivered to a Chinese port with cost and freight included. The World Bank prints the unit as \"dmtu\"; its description of the series gives it as US dollars per dry ton, the ore weighed without its moisture.",
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
      { label: "Power and wiring", detail: "Cables for transmission and distribution, and the wiring in every building; copper is the conductor against which others are measured." },
      { label: "Motors and transformers", detail: "The windings in industrial motors, generators and transformers." },
      { label: "Electric vehicles", detail: "An electric car uses several times as much copper as a combustion car - in its motor, battery and cabling - and more again in the chargers that serve it." },
      { label: "Construction", detail: "Plumbing pipe, roofing, and the heat exchangers in heating and cooling systems." },
      { label: "Renewables", detail: "Wind and solar farms need more copper for each unit of capacity than conventional power stations, in generators, cabling and grid connections." },
      { label: "Electronics", detail: "Circuit boards, connectors and the wiring inside appliances and data centres." },
    ],
    made: [
      "Mostly mined in large open pits from ores holding well under one percent copper, so vast amounts of rock are moved for each tonne of metal.",
      "Sulphide ores are concentrated by flotation, smelted, and refined by electrolysis into cathode; oxide ores are leached with acid and the copper plated out of the solution.",
      "Copper can be recycled again and again without loss of quality, and scrap meets a substantial part of demand.",
    ],
    unit: "Priced per tonne of grade A cathode on the London Metal Exchange.",
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
      { label: "Electric vehicles", detail: "Battery packs for cars, buses and trucks - by far the largest and fastest-growing use." },
      { label: "Grid storage", detail: "Large battery installations that hold electricity from solar and wind until it is needed." },
      { label: "Consumer electronics", detail: "Phones, laptops, power tools and other rechargeable devices." },
      { label: "Glass and ceramics", detail: "Lowers the melting temperature and improves resistance to thermal shock, as in ceramic hobs." },
      { label: "Greases", detail: "Lithium soaps thicken the lubricating greases used at high temperatures." },
      { label: "Other", detail: "Lithium salts treat bipolar disorder; lithium also goes into air treatment, light alloys and the making of polymers." },
    ],
    made: [
      "From brine: salty groundwater beneath salt flats is pumped into ponds and left to evaporate in the sun over many months, concentrating the lithium.",
      "From hard rock: the mineral spodumene is mined, concentrated and roasted, then treated with chemicals to extract the lithium.",
      "Either way it is refined into lithium carbonate or hydroxide, the chemicals battery makers buy.",
    ],
    unit: "The IMF's series is for battery-grade lithium, 99% pure, per tonne. Most lithium is in fact sold as carbonate or hydroxide on contract, at prices that differ from this one.",
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
      { label: "Bread and baking", detail: "Milled into flour for bread, flatbreads, biscuits and cakes; hard, high-protein wheats make the strongest bread flour." },
      { label: "Pasta and noodles", detail: "Durum wheat is milled into semolina for pasta and couscous; softer wheats make most Asian noodles." },
      { label: "Animal feed", detail: "Lower-grade and weather-damaged grain goes to livestock, as does the bran left over from milling." },
      { label: "Starch and gluten", detail: "Separated for use in processed foods, paper, adhesives and packaging." },
      { label: "Ethanol and brewing", detail: "Distilled into fuel ethanol and spirits in some markets, and malted for certain beers." },
      { label: "Seed and stocks", detail: "Part of each harvest is kept back as seed, and governments hold stocks as a buffer against bad years." },
    ],
    made: [
      "Sown in autumn (winter wheat) or in spring and harvested once a year; yields depend heavily on rain at the right moments.",
      "Stored in silos and elevators, graded by protein and quality, and shipped in bulk by rail, barge and ship.",
      "Milled into flour, with the bran and germ separated for other uses.",
    ],
    unit: "Priced per tonne for hard red winter wheat loaded at United States Gulf ports - a common benchmark for bread wheat in world trade. US futures are quoted per bushel instead.",
    deposits: [
      { place: "Black Sea basin", detail: "Russia and Ukraine — the swing exporters, and the reason conflict there moves world prices." },
      { place: "US Great Plains", detail: "Hard red winter wheat through the central states." },
      { place: "Canadian Prairies", detail: "High-protein spring wheat." },
      { place: "India & China", detail: "The largest producers, but they consume domestically rather than export." },
    ],
    value: [
      "Wheat has no reserves in the ground - it is grown and eaten each year - so the table gives exports where other commodities give reserves.",
      "Chicago, Kansas City and Paris price the different varieties separately.",
      "Weather in a handful of exporting regions dominates price formation.",
    ],
  },

  "Rare Earth": {
    summary:
      "Seventeen elements that are not geologically rare, but are hard to separate from one another. The bottleneck is processing, not deposits.",
    uses: [
      { label: "Permanent magnets", detail: "Neodymium and praseodymium, with dysprosium and terbium for heat resistance, make the strongest magnets known - in electric vehicle motors, wind turbines, hard drives and loudspeakers." },
      { label: "Catalysts", detail: "Cerium and lanthanum in the catalysts that crack crude oil in refineries and clean vehicle exhausts." },
      { label: "Polishing and glass", detail: "Cerium oxide polishes glass and screens; lanthanum goes into camera and telescope lenses." },
      { label: "Lighting and displays", detail: "Europium, terbium and yttrium are the phosphors that give screens and lamps their colours." },
      { label: "Batteries and alloys", detail: "Lanthanum in nickel-metal hydride batteries; small additions strengthen steels and light alloys." },
      { label: "Defence", detail: "Guidance systems, radar, lasers and sonar - the reason governments treat them as strategic." },
    ],
    made: [
      "Mined mostly from the minerals bastnäsite and monazite, and from clays in southern China and Myanmar that hold the scarcer heavy rare earths.",
      "The ore is concentrated and dissolved, and the elements - chemically almost identical - are separated from one another through a long series of solvent-extraction stages.",
      "The separated oxides are reduced to metals and alloyed, mostly for magnets.",
    ],
    unit: "The IMF's series is for a mixed rare earth carbonate holding 42 to 45% rare earth oxide, per tonne. Each separated element has its own, very different, price.",
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
      { label: "Nuclear power", detail: "Enriched to a few percent uranium-235 and made into fuel for reactors, which supply roughly a tenth of the world's electricity." },
      { label: "Naval propulsion", detail: "Highly enriched fuel drives the reactors of submarines and aircraft carriers, which can run for years without refuelling." },
      { label: "Research and medicine", detail: "Research reactors make the isotopes used in medical scans and cancer treatment." },
      { label: "Weapons", detail: "Highly enriched uranium is one of the two materials from which nuclear weapons are made, which is why its trade is controlled by treaty and inspection." },
      { label: "Depleted uranium", detail: "The dense metal left over from enrichment is used for radiation shielding, counterweights and armour-piercing munitions." },
      { label: "Heat", detail: "Some reactors also supply heat to nearby towns and industry." },
    ],
    made: [
      "Mined in open pits and underground, or - for most of today's output - dissolved where it lies underground and pumped to the surface (in-situ recovery).",
      "Milled into a uranium oxide concentrate known as yellowcake, the form in which it is priced and traded.",
      "Converted to a gas, enriched to raise its share of uranium-235, and made into ceramic fuel pellets sealed in metal rods.",
    ],
    unit: "Priced per pound of uranium oxide concentrate (U3O8). Most uranium is sold to utilities on long-term contracts rather than at this spot price.",
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
      { label: "Transport", detail: "Airframes, and increasingly car bodies, engine parts and battery housings, where saving weight saves fuel or extends range." },
      { label: "Packaging", detail: "Drinks cans and foil; cans are recycled back into cans in a loop that uses a small fraction of the energy of making new metal." },
      { label: "Construction", detail: "Window frames, cladding, roofing and structural extrusions." },
      { label: "Power", detail: "Overhead transmission lines, where aluminium's lightness outweighs copper's better conductivity." },
      { label: "Machinery and goods", detail: "Heat exchangers, appliances, cookware and the casings of electronics." },
      { label: "Solar", detail: "The frames and mounting structures of solar panels." },
    ],
    made: [
      "Bauxite ore is mined at the surface, mostly in the tropics, and refined into alumina, a white powder, by the Bayer process.",
      "Alumina is dissolved in a molten bath and split by a powerful electric current (the Hall-Héroult process) - which is why smelters are built where electricity is cheap.",
      "Scrap is remelted with around a twentieth of the energy needed to make new metal.",
    ],
    unit: "Priced per tonne of high-grade primary ingot on the London Metal Exchange. Buyers also pay a regional premium for delivery.",
    deposits: [
      { place: "Boké, Guinea", detail: "The largest bauxite reserves and a major share of seaborne supply." },
      { place: "Weipa & Gove, Australia", detail: "Long-established bauxite mining feeding domestic alumina refineries." },
      { place: "Pará, Brazil", detail: "Bauxite mined and refined near hydroelectric power." },
      { place: "Smelting hubs", detail: "China, Russia and the Gulf — sited for electricity, not for ore." },
    ],
    value: [
      "No reserves are given for aluminium because its ore is bauxite, a separate commodity that is refined to alumina and then smelted.",
      "Power contracts drive the cost curve more than raw material does.",
      "Recycled metal needs around a twentieth of the energy of primary production.",
    ],
  },

  Silver: {
    summary:
      "Half precious metal, half industrial input — and mostly produced as a by-product of other mines, so supply responds only weakly to its own price.",
    uses: [
      { label: "Solar", detail: "Silver paste forms the conductive lines on photovoltaic cells - now one of its largest industrial uses." },
      { label: "Electronics", detail: "Contacts, switches and conductive inks; silver conducts electricity better than any other metal." },
      { label: "Brazing and solder", detail: "Alloys that join metals in plumbing, refrigeration and electrical equipment." },
      { label: "Investment", detail: "Bars, coins and exchange-traded funds, bought as a cheaper alternative to gold." },
      { label: "Jewellery and silverware", detail: "Sterling silver for jewellery, cutlery and ornament." },
      { label: "Medical and chemical", detail: "Silver kills bacteria, so it goes into wound dressings and coatings; it is also the catalyst for making ethylene oxide, a building block of plastics and antifreeze." },
    ],
    made: [
      "Most silver is a by-product, recovered from ores mined for lead, zinc, copper and gold; only a minority comes from mines worked chiefly for silver.",
      "It is separated during the smelting and refining of the main metal, then refined by electrolysis to pure silver.",
      "Recycling of industrial scrap, jewellery and silverware adds to each year's supply.",
    ],
    unit: "A troy ounce is 31.1 grams. The price is the London benchmark for 99.9% pure silver.",
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
