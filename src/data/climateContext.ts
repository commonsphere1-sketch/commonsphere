/**
 * The Climate page's three columns of context - tipping points, the
 * treaties, and the places where ecology and geopolitics meet. Every item
 * says what its source says and links to it. Treaty party counts are the UN
 * Treaty Collection's as at the date in TREATIES_CHECKED.
 *
 * What these columns used to carry and no longer do, because no source
 * could be found for it: "16% of G20 members on track", "$2.4T adaptation
 * gap", Amazon deforestation of "11.5M hectares annually", Egypt depending
 * on "95% of Nile water", "climate refugees from Inuit regions", Kiribati
 * "exploring sovereign territory purchases". Some of the rest was out of
 * date: the high seas treaty is in force, and the plastics treaty was never
 * agreed.
 */

export type Source = { label: string; url: string };
export type ContextItem = { id: string; label: string; val: string; color: string; summary: string; sources: Source[] };

export const TREATIES_CHECKED = "29 September 2026";

const UNTC = (label: string, url: string): Source => ({ label: `UN Treaty Collection: ${label}`, url });

export const TIPPING_POINTS: ContextItem[] = [
  {
    id: "amazon",
    label: "Amazon dieback",
    val: "Estimated at 20–25% deforestation",
    color: "#ef4444",
    summary:
      "Lovejoy and Nobre judge that deforestation, climate change and widespread fire together could flip eastern, southern and central Amazonia to non-forest ecosystems at 20–25% deforestation, and that the droughts of 2005, 2010 and 2015–16 may be the first flickers of that tipping point.",
    sources: [{ label: "Lovejoy & Nobre 2018, Science Advances", url: "https://doi.org/10.1126/sciadv.aat2340" }],
  },
  {
    id: "wais",
    label: "West Antarctic Ice Sheet",
    val: "About 3.3 m of sea-level rise if it collapsed",
    color: "#3b82f6",
    summary:
      "Bamber and colleagues put the global sea-level rise from a collapse of the West Antarctic Ice Sheet at about 3.3 m, and about 25% more than that along the Pacific and Atlantic coasts of the United States.",
    sources: [{ label: "Bamber et al. 2009, Science", url: "https://doi.org/10.1126/science.1169335" }],
  },
  {
    id: "amoc",
    label: "Atlantic overturning circulation (AMOC)",
    val: "About 15% weaker since the mid-20th century",
    color: "#6366f1",
    summary:
      "Caesar and colleagues find the Atlantic meridional overturning circulation has weakened by about 3 ± 1 sverdrups, around 15%, since the mid-twentieth century, from its fingerprint in sea-surface temperatures.",
    sources: [{ label: "Caesar et al. 2018, Nature", url: "https://doi.org/10.1038/s41586-018-0006-5" }],
  },
  {
    id: "greenland",
    label: "Greenland Ice Sheet",
    val: "Collapse threshold 0.8–3°C of warming",
    color: "#06b6d4",
    summary:
      "Armstrong McKay and colleagues place the warming at which the Greenland Ice Sheet's collapse becomes self-sustaining between 0.8 and 3°C, and note that today's warming already lies within the lower end of some tipping points' ranges.",
    sources: [{ label: "Armstrong McKay et al. 2022, Science", url: "https://doi.org/10.1126/science.abn7950" }],
  },
  {
    id: "coral",
    label: "Warm-water coral reefs",
    val: "A further 70–90% decline at 1.5°C",
    color: "#f97316",
    summary:
      "The IPCC projects coral reefs to decline by a further 70–90% at 1.5°C of warming (high confidence), with losses of more than 99% at 2°C (very high confidence).",
    sources: [{ label: "IPCC, Global Warming of 1.5°C, SPM B.4.2", url: "https://www.ipcc.ch/sr15/chapter/spm/" }],
  },
];

export const TREATIES: ContextItem[] = [
  {
    id: "paris",
    label: "Paris Agreement",
    val: "194 Parties · 2.8°C on current policies",
    color: "#f59e0b",
    summary:
      "Adopted in 2015, it commits its Parties to hold warming well below 2°C and to pursue efforts to limit it to 1.5°C. UNEP's Emissions Gap Report 2025 projects 2.8°C of warming this century under current policies, and 2.3–2.5°C if countries' pledges are met in full. The United States' withdrawal took effect on 27 January 2026.",
    sources: [
      UNTC("Paris Agreement", "https://treaties.un.org/pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXVII-7-d&chapter=27&clang=_en"),
      { label: "UNEP Emissions Gap Report 2025", url: "https://www.unep.org/resources/emissions-gap-report-2025" },
    ],
  },
  {
    id: "kunming-montreal",
    label: "Kunming-Montreal Global Biodiversity Framework",
    val: "$200bn a year by 2030 · a $700bn yearly gap",
    color: "#10b981",
    summary:
      "Adopted in December 2022 under the Convention on Biological Diversity, which has 196 Parties. Its Target 19 is to mobilise at least $200 billion a year by 2030, including international finance of at least $20 billion a year by 2025 and $30 billion by 2030; its Goal D speaks of progressively closing a biodiversity finance gap of $700 billion a year.",
    sources: [
      { label: "CBD: Target 19", url: "https://www.cbd.int/gbf/targets/19" },
      { label: "CBD: Goal D", url: "https://www.cbd.int/gbf/goals" },
      UNTC("Convention on Biological Diversity", "https://treaties.un.org/Pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXVII-8&chapter=27&clang=_en"),
    ],
  },
  {
    id: "plastics",
    label: "Global plastics treaty",
    val: "No agreement: talks adjourned in August 2025",
    color: "#f97316",
    summary:
      "The UN Environment Assembly resolved on 2 March 2022 to negotiate a legally binding instrument on plastic pollution across its whole life cycle. The negotiations adjourned in Geneva in August 2025 without consensus on a text, and a session in February 2026 elected a new chair without negotiating; talks are to resume.",
    sources: [
      { label: "UNEP: negotiating committee on plastic pollution", url: "https://www.unep.org/inc-plastic-pollution" },
      { label: "Earth Negotiations Bulletin: INC-5.3", url: "https://enb.iisd.org/plastic-pollution-marine-environment-negotiating-committee-inc5.3" },
    ],
  },
  {
    id: "bbnj",
    label: "High Seas Treaty (BBNJ)",
    val: "In force since 17 January 2026 · 101 Parties",
    color: "#3b82f6",
    summary:
      "The agreement on marine biodiversity beyond national jurisdiction, adopted in June 2023 under the UN Convention on the Law of the Sea, entered into force on 17 January 2026, 120 days after its sixtieth ratification. It has 101 Parties and 145 signatories.",
    sources: [
      UNTC("BBNJ Agreement", "https://treaties.un.org/Pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXI-10&chapter=21&clang=_en"),
    ],
  },
  {
    id: "nagoya",
    label: "Nagoya Protocol",
    val: "143 Parties · in force since 2014",
    color: "#a855f7",
    summary:
      "Adopted in 2010 under the Convention on Biological Diversity and in force since 12 October 2014, it governs access to genetic resources and the fair and equitable sharing of the benefits arising from their use. It has 143 Parties.",
    sources: [
      UNTC("Nagoya Protocol", "https://treaties.un.org/Pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXVII-8-b&chapter=27&clang=_en"),
    ],
  },
];

export const FLASHPOINTS: ContextItem[] = [
  {
    id: "nile",
    label: "Nile Basin (Ethiopia–Egypt)",
    val: "Grand Ethiopian Renaissance Dam, inaugurated September 2025",
    color: "#ef4444",
    summary:
      "Ethiopia inaugurated Africa's largest hydroelectric dam, on the Blue Nile, on 9 September 2025. Downstream, Egypt fears reduced Nile flows, and Sudan has joined its calls for a legally binding agreement on the dam's filling and operation - which does not exist.",
    sources: [{ label: "France 24, 9 September 2025", url: "https://www.france24.com/en/africa/20250909-ethiopia-africa-hydropower-dam-egypt" }],
  },
  {
    id: "mekong",
    label: "Lancang–Mekong",
    val: "Upstream dams outside the downstream treaty",
    color: "#f97316",
    summary:
      "The Mekong River Commission's members are the four lower-basin states - Cambodia, Laos, Thailand and Vietnam - under the 1995 Mekong Agreement. China and Myanmar, upstream, have been dialogue partners rather than members since 1996; the Commission describes cooperation with them as essential to manage the increased flow regulation by storage dams built on the upper Mekong.",
    sources: [{ label: "Mekong River Commission: dialogue partners", url: "https://www.mrcmekong.org/about/mrc/dialogue-partners/" }],
  },
  {
    id: "amazon-governance",
    label: "Brazilian Amazon",
    val: "5,796 km² cleared in the year to July 2025",
    color: "#22c55e",
    summary:
      "Brazil's official PRODES satellite monitoring recorded 5,796 km² of deforestation in the Legal Amazon between August 2024 and July 2025, 11% less than a year earlier and the lowest in eleven years.",
    sources: [{ label: "INPE PRODES: Legal Amazon deforestation rates", url: "https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates" }],
  },
  {
    id: "arctic",
    label: "The Arctic",
    val: "Warming nearly four times as fast as the globe",
    color: "#06b6d4",
    summary:
      "Since 1979 the Arctic has warmed nearly four times faster than the globe as a whole, Rantanen and colleagues found. Arctic coastal states have made submissions to the UN Commission on the Limits of the Continental Shelf to extend their seabed rights beyond 200 nautical miles.",
    sources: [
      { label: "Rantanen et al. 2022, Communications Earth & Environment", url: "https://doi.org/10.1038/s43247-022-00498-3" },
      { label: "UN: submissions to the Commission on the Limits of the Continental Shelf", url: "https://www.un.org/depts/los/clcs_new/commission_submissions.htm" },
    ],
  },
  {
    id: "pacific",
    label: "Pacific atoll states",
    val: "Statehood guaranteed despite sea-level rise",
    color: "#6366f1",
    summary:
      "Under the Australia–Tuvalu Falepili Union, signed in November 2023 and in force since 28 August 2024, Australia recognises that Tuvalu's statehood and sovereignty will continue notwithstanding sea-level rise, and opens a pathway for Tuvaluans to move to Australia. Kiribati bought a 2,210-hectare estate on Fiji's Vanua Levu in 2014 to grow food for its people.",
    sources: [
      { label: "Carnegie Endowment: the Falepili Union", url: "https://carnegieendowment.org/research/2025/09/australia-tuvalu-falepili-union-the-first-bilateral-climate-mobility-treaty" },
      { label: "Fiji Times: Kiribati's land in Fiji", url: "https://www.fijitimes.com.fj/kiribati-government-invests-in-2210-hectares/" },
    ],
  },
];
