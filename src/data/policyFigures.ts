/**
 * The published figures behind a Policy page card: for a country or a US
 * state and one of the page's eight policy areas, what its government spends
 * on that area, and the measures that go with it - each with the year it is
 * for and the source it is from.
 *
 * These take the place of the "allocated" amount, the share and the score
 * the cards used to carry, which a random-number function produced. Nothing
 * here is typed in or estimated: every figure is read from data the site
 * builds from its source.
 *
 *   Countries  government spending by function (IMF, COFOG), where the IMF
 *              has it; military spending (SIPRI); and World Bank, ILO, IEA,
 *              US EIA and UNDP measures from the country data.
 *   US states  state government spending by function (Census Bureau, Annual
 *              Survey of State Government Finances); and Census, BEA, BLS,
 *              BJS, EIA, Department of Labor and Tax Foundation figures.
 *
 * A figure is the place's whole spending or measure for the area, not that
 * of the programme a card names; the page says so. Where no source has a
 * figure for an area there is none, and the card says that instead.
 */
import { countriesData, type Country, type DataSource, type ReferenceField } from "./countriesData";
import { usStatesData } from "./statesData";
import { BUDGET_SOURCE, COUNTRY_BUDGET, type BudgetDivision } from "./countryBudget";
import { COUNTRY_PANELS, panelSource, type PanelField } from "./countryPanels";
import { MILITARY_MEASURED, MILITARY_SOURCES, type MilitaryFigure } from "./militarySpending";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "./countryEnergy";
import { STATE_INDICATORS, STATE_SOURCES } from "./stateIndicators";
import { STATE_FINANCE, STATE_FINANCE_SOURCE, STATE_FINANCE_YEAR, type StateFinanceKey } from "./stateFinance";
import { STATE_ENERGY, STATE_ENERGY_SOURCE, STATE_ENERGY_YEAR } from "./stateEnergy";
import { has } from "../lib/na";
import { usdFromBillions } from "../lib/money";

export type PolicyArea = "Climate" | "Healthcare" | "Infrastructure" | "Education" | "Economy" | "Defense" | "Technology" | "Social";

/** One figure in a card's details: what it is, its value, when it is for, and where it is from. */
export type PolicyFigure = { label: string; value: string; when: string; note?: string; source: DataSource };

export type PolicyFigures = {
  /**
   * The figure on the card's face: its value, what it is, and when. `share`
   * (0-100) is given where the value is a share, for the card's bar;
   * `spending` marks a share of what the government spends, the one kind
   * of share that can be set beside another area's.
   */
  head: { value: string; label: string; when: string; share?: number; spending?: boolean } | null;
  /** What the head figure covers, in its classification's own terms. */
  covers?: { text: string; source: DataSource };
  /** Why there is no head figure, where there is none. */
  none?: string;
  figures: PolicyFigure[];
};

const COFOG_MANUAL: DataSource = {
  label: "UN Statistics Division — Classification of the Functions of Government (COFOG)",
  url: "https://unstats.un.org/unsd/classifications/Family/Detail/4",
};
const CENSUS_MANUAL: DataSource = {
  label: "US Census Bureau — Government Finance and Employment Classification Manual",
  url: "https://www.census.gov/programs-surveys/gov-finances/technical-documentation/classification-manuals.html",
};

// ── Countries ───────────────────────────────────────────────────────────────

/** The function of government nearest each area, as the IMF's figures classify spending. */
const COFOG: Partial<Record<PolicyArea, { id: BudgetDivision; name: string; covers: string }>> = {
  Climate: { id: "GF05", name: "environmental protection", covers: "Waste and waste-water management, pollution abatement, and the protection of biodiversity and landscape." },
  Healthcare: { id: "GF07", name: "health", covers: "Medical products and equipment, outpatient and hospital services, and public health services." },
  Infrastructure: {
    id: "GF04",
    name: "economic affairs",
    covers: "Transport and communication, fuel and energy, agriculture, mining, manufacturing and construction, and general economic and labour affairs.",
  },
  Education: { id: "GF09", name: "education", covers: "Education from pre-primary to tertiary, and the services that support it." },
  Defense: { id: "GF02", name: "defence", covers: "Military and civil defence, foreign military aid, and defence research." },
  Social: { id: "GF10", name: "social protection", covers: "Sickness and disability, old age, survivors, family and children, unemployment, housing and social exclusion." },
};

const COUNTRY_BY_CODE = new Map(countriesData.map((c) => [c.code.toLowerCase(), c]));
const yearOf = (s: DataSource | undefined) => /, (\d{4})$/.exec(s?.label ?? "")?.[1] ?? "";
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
const count = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

/** The country behind a code, as the site's country data has it; undefined where it has none. */
export const policyCountry = (code: string): Country | undefined => COUNTRY_BY_CODE.get(code.toLowerCase());

export function countryPolicyFigures(code: string, area: PolicyArea): PolicyFigures {
  const c = policyCountry(code);
  if (!c) return { head: null, none: "No published figure is held for this country.", figures: [] };
  const p = COUNTRY_PANELS[c.id] ?? {};
  const b = COUNTRY_BUDGET[c.code];
  const figures: PolicyFigure[] = [];
  const out: PolicyFigures = { head: null, figures };
  const basis = b ? (b.basis === "general" ? "all levels of government" : "central government only") : "";
  const budgetSource: DataSource | null = b ? { label: `${BUDGET_SOURCE.label}, ${b.y}`, url: BUDGET_SOURCE.url } : null;

  /** A measure from the country panels, where one is published. */
  const panel = (field: PanelField, label: string, fmt: (v: number) => string, note?: string) => {
    const f = p[field];
    if (f) figures.push({ label, value: fmt(f.v), when: f.y, note, source: panelSource(f) });
  };
  /** A headline figure of the country itself, where it carries a source. */
  const own = (field: ReferenceField & keyof Country, label: string, fmt: (v: number) => string, note?: string) => {
    const src = c.sources?.[field];
    const v = c[field] as unknown as number;
    if (src && has(v)) figures.push({ label, value: fmt(v), when: yearOf(src), note, source: src });
  };

  // What the government spends on the area's function, where the IMF has it.
  const fn = COFOG[area];
  if (fn && b && budgetSource && b.shares[fn.id] > 0) {
    const share = b.shares[fn.id];
    out.head = { value: `${share.toFixed(1)}%`, label: `of government spending goes on ${fn.name}`, when: b.y, share, spending: true };
    out.covers = { text: fn.covers, source: COFOG_MANUAL };
    figures.push({ label: `Spending on ${fn.name}`, value: `${share.toFixed(1)}% of government spending`, when: b.y, note: basis, source: budgetSource });
    if (b.spendingPctGdp !== undefined)
      figures.push({
        label: `Spending on ${fn.name}, against the economy`,
        value: `${((share * b.spendingPctGdp) / 100).toFixed(1)}% of GDP`,
        when: b.y,
        note: `its share of total spending, which was ${b.spendingPctGdp}% of GDP`,
        source: budgetSource,
      });
  }

  if (area === "Climate") {
    panel("evSalesShare", "Electric share of new car sales", (v) => `${v}%`);
    const e = COUNTRY_ENERGY[c.id];
    if (e) {
      const top = [...e.mix].sort((x, y) => y.pct - x.pct)[0];
      if (top) figures.push({ label: "Largest source of energy production", value: `${top.source}, ${top.pct}%`, when: e.y, source: ENERGY_SOURCE });
      figures.push({ label: "Energy used", value: `${Math.round(e.totalUseTWh).toLocaleString("en-US")} TWh`, when: e.y, source: ENERGY_SOURCE });
    }
  } else if (area === "Healthcare") {
    own("lifeExpectancy", "Life expectancy", (v) => `${v.toFixed(1)} years`);
    panel("physicians", "Physicians", (v) => `${v} per 1,000 people`);
    panel("hospitalBeds", "Hospital beds", (v) => `${v} per 1,000 people`);
    panel("maternalMortality", "Maternal deaths", (v) => `${v} per 100,000 live births`);
  } else if (area === "Infrastructure") {
    panel("electricityAccess", "People with electricity", (v) => `${v}%`);
    panel("logisticsIndex", "Logistics performance", (v) => `${v} of 5`);
    panel("railKm", "Railway lines", (v) => `${Math.round(v).toLocaleString("en-US")} km`);
    panel("broadbandPer100", "Fixed broadband", (v) => `${v} per 100 people`);
  } else if (area === "Education") {
    panel("schoolingYears", "Years of schooling, adults", (v) => `${v}`);
    panel("literacy", "Adults who can read", (v) => `${v}%`);
    panel("upperSecondaryPct", "Finished upper secondary school", (v) => `${v}%`, "of adults 25 and over");
    panel("bachelorsPct", "Hold a bachelor's degree", (v) => `${v}%`, "of adults 25 and over");
  } else if (area === "Economy") {
    if (b && budgetSource && b.spendingPctGdp !== undefined) {
      out.head = { value: `${b.spendingPctGdp}%`, label: "of GDP is spent by government", when: b.y, share: b.spendingPctGdp };
      out.covers = { text: "All government outlays, on every function, against the size of the economy.", source: COFOG_MANUAL };
      figures.push({ label: "Government spending", value: `${b.spendingPctGdp}% of GDP`, when: b.y, note: basis, source: budgetSource });
    }
    own("gdp", "GDP", (v) => usdFromBillions(v));
    own("gdpGrowth", "Real growth", (v) => `${signed(v)}%`);
    own("inflationRate", "Inflation", (v) => `${v.toFixed(1)}%`, "consumer prices");
    own("unemploymentRate", "Unemployment", (v) => `${v.toFixed(1)}%`);
    if (!out.head) {
      const src = c.sources?.gdpGrowth;
      if (src && has(c.gdpGrowth)) out.head = { value: `${signed(c.gdpGrowth)}%`, label: "real growth of the economy", when: yearOf(src) };
    }
  } else if (area === "Defense") {
    const m = MILITARY_MEASURED[c.id];
    const when = (f: MilitaryFigure) => `${f.y}${f.flag === "estimate" ? ", SIPRI's estimate" : f.flag === "uncertain" ? ", highly uncertain" : ""}`;
    if (m?.shareOfGovt) {
      // SIPRI's measure covers twice the countries the IMF's does, so it leads where both exist.
      out.head = { value: `${m.shareOfGovt.v}%`, label: "of government spending goes on the military", when: when(m.shareOfGovt), share: m.shareOfGovt.v, spending: true };
      out.covers = { text: "All current and capital spending on the armed forces, defence ministries and paramilitary forces, as SIPRI counts it.", source: MILITARY_SOURCES.sipri };
      figures.unshift({ label: "Military spending", value: `${m.shareOfGovt.v}% of government spending`, when: when(m.shareOfGovt), source: MILITARY_SOURCES.sipri });
    }
    if (m?.shareOfGDP) figures.push({ label: "Military spending, against the economy", value: `${m.shareOfGDP.v}% of GDP`, when: when(m.shareOfGDP), source: MILITARY_SOURCES.sipri });
    if (m?.spendUSDm) figures.push({ label: "Military spending", value: usdFromBillions(m.spendUSDm.v / 1000), when: when(m.spendUSDm), source: MILITARY_SOURCES.sipri });
    if (m?.personnel) figures.push({ label: "Armed forces", value: count(m.personnel.v), when: m.personnel.y, note: "with paramilitary forces", source: MILITARY_SOURCES.personnel });
    if (!out.head && m?.shareOfGDP) out.head = { value: `${m.shareOfGDP.v}%`, label: "of GDP goes on the military", when: when(m.shareOfGDP) };
  } else if (area === "Technology") {
    const f = p.internetPct;
    if (f) out.head = { value: `${f.v}%`, label: "of people use the internet", when: f.y, share: f.v };
    panel("internetPct", "People using the internet", (v) => `${v}%`);
    panel("mobilePer100", "Mobile subscriptions", (v) => `${Math.round(v)} per 100 people`);
    panel("broadbandPer100", "Fixed broadband", (v) => `${v} per 100 people`);
  } else if (area === "Social") {
    panel("povertyNationalPct", "Below the national poverty line", (v) => `${v}%`);
    panel("gini", "Income inequality (Gini)", (v) => `${v}`, "0 is equal, 100 is one person with everything");
    panel("medianDailyIncome", "Median income or spending", (v) => `$${v.toFixed(2)} a person a day`, "2021 PPP");
    panel("minimumWageMonthlyUSD", "Minimum wage", (v) => `$${v.toLocaleString("en-US")} a month`);
  }

  if (!out.head) out.none = figures.length ? "No spending figure is published for this area; the measures that are published are in the details." : "No source the site uses publishes a figure for this area here.";
  return out;
}

// ── US states ───────────────────────────────────────────────────────────────

const STATE_BY_ID = new Map(usStatesData.map((s) => [s.id, s]));

/** The state finance functions, as the Census Bureau names them. */
const FUNCTION_NAME: Partial<Record<StateFinanceKey, string>> = {
  education: "Education",
  publicWelfare: "Public welfare",
  hospitals: "Hospitals",
  health: "Health",
  highways: "Highways",
  police: "Police protection",
  correction: "Correction",
  naturalResources: "Natural resources",
  parks: "Parks and recreation",
};

/** The functions nearest each area, what they are called together, and what they cover. */
const STATE_FUNCTIONS: Partial<Record<PolicyArea, { keys: StateFinanceKey[]; name: string; covers: string }>> = {
  Climate: {
    keys: ["naturalResources", "parks"],
    name: "natural resources and parks",
    covers: "Conserving and developing soil, water, forests, minerals and energy, with agriculture, fish and game; and parks and recreation.",
  },
  Healthcare: {
    keys: ["health", "hospitals"],
    name: "health and hospitals",
    covers: "Public health and outpatient services, and the state's own and supported hospitals. Medicaid is counted under public welfare, not here.",
  },
  Infrastructure: { keys: ["highways"], name: "highways", covers: "Building, maintaining and running highways, streets, bridges and tunnels, toll roads among them." },
  Education: { keys: ["education"], name: "education", covers: "State colleges and universities, aid to local school districts, and other education programmes." },
  Defense: {
    keys: ["police", "correction"],
    name: "police and correction",
    covers: "States do not pay for national defence. Their own public safety spending: state police, and prisons, probation and parole.",
  },
  Social: { keys: ["publicWelfare"], name: "public welfare", covers: "Support for people in need: Medicaid and other medical payments, cash assistance, and welfare institutions and services." },
};

/** Thousands of dollars, as the Census Bureau publishes them, as "$136.8B". */
const dollars = (thousands: number) => usdFromBillions(thousands / 1e6);

export function statePolicyFigures(id: string, area: PolicyArea): PolicyFigures {
  const s = STATE_BY_ID.get(id);
  const fin = STATE_FINANCE[id];
  const ind = STATE_INDICATORS[id];
  if (!s || !ind) return { head: null, none: "No published figure is held for this state.", figures: [] };
  const figures: PolicyFigure[] = [];
  const out: PolicyFigures = { head: null, figures };
  const fy = `fiscal ${STATE_FINANCE_YEAR}`;
  const years = s.figureYears ?? {};
  const general = fin?.generalExpenditure;
  const ofGeneral = (v: number) => (general ? `${((100 * v) / general).toFixed(1)}% of its general spending` : "");

  const fns = STATE_FUNCTIONS[area];
  if (fns && fin && general) {
    const parts = fns.keys.map((k) => [k, fin[k]] as const).filter((x): x is readonly [StateFinanceKey, number] => x[1] !== undefined);
    if (parts.length === fns.keys.length) {
      const total = parts.reduce((t, [, v]) => t + v, 0);
      const share = (100 * total) / general;
      out.head = { value: dollars(total), label: `spent by the state on ${fns.name}`, when: fy, share, spending: true };
      out.covers = { text: fns.covers, source: CENSUS_MANUAL };
      for (const [k, v] of parts) figures.push({ label: FUNCTION_NAME[k] ?? k, value: `${dollars(v)} · ${ofGeneral(v)}`, when: fy, note: "state government only", source: STATE_FINANCE_SOURCE });
    }
  }

  if (area === "Climate") {
    const mix = [...s.energyMix].filter((m) => m.pct > 0).sort((a, b) => b.pct - a.pct);
    if (mix[0]) figures.push({ label: "Largest source of electricity", value: `${mix[0].source}, ${mix[0].pct}%`, when: years.energyMix ?? "", source: STATE_SOURCES.eia });
    if (mix[1]) figures.push({ label: "Second source of electricity", value: `${mix[1].source}, ${mix[1].pct}%`, when: years.energyMix ?? "", source: STATE_SOURCES.eia });
    const e = STATE_ENERGY[id];
    if (e) figures.push({ label: "Energy produced and used", value: `${e.totalProductionTWh.toLocaleString("en-US")} and ${e.totalUseTWh.toLocaleString("en-US")} TWh`, when: `${STATE_ENERGY_YEAR}`, source: STATE_ENERGY_SOURCE });
  } else if (area === "Infrastructure") {
    figures.push(
      { label: "Mean journey to work", value: `${ind.commute.meanCommuteMin} minutes`, when: ind.commute.y, source: STATE_SOURCES.acs },
      { label: "Commute by public transport", value: `${ind.commute.transitPct}%`, when: ind.commute.y, source: STATE_SOURCES.acs },
      { label: "Households with a vehicle", value: `${ind.commute.householdsWithVehiclePct}%`, when: ind.commute.y, source: STATE_SOURCES.acs },
    );
  } else if (area === "Education") {
    figures.push(
      { label: "Finished high school or more", value: `${ind.education.highSchoolOrHigherPct}%`, when: ind.education.y, note: "of adults 25 and over", source: STATE_SOURCES.acs },
      { label: "Bachelor's degree or more", value: `${ind.education.bachelorsOrHigherPct}%`, when: ind.education.y, note: "of adults 25 and over", source: STATE_SOURCES.acs },
    );
  } else if (area === "Economy") {
    if (fin && general) {
      out.head = { value: dollars(general), label: "general spending by the state government", when: fy };
      out.covers = { text: "Everything the state government spends other than on its utilities, liquor stores and insurance trusts, aid to local governments included.", source: CENSUS_MANUAL };
      figures.push({ label: "General spending", value: dollars(general), when: fy, note: "state government only", source: STATE_FINANCE_SOURCE });
      if (fin.totalTaxes !== undefined) figures.push({ label: "Taxes collected", value: dollars(fin.totalTaxes), when: fy, source: STATE_FINANCE_SOURCE });
      if (fin.federalAndLocalGrants !== undefined) figures.push({ label: "Received from other governments", value: dollars(fin.federalAndLocalGrants), when: fy, note: "mostly federal grants", source: STATE_FINANCE_SOURCE });
      if (fin.debt !== undefined) figures.push({ label: "Debt at the end of the year", value: dollars(fin.debt), when: fy, source: STATE_FINANCE_SOURCE });
    }
    figures.push(
      { label: "GDP", value: usdFromBillions(s.gdp), when: years.gdp ?? "", source: STATE_SOURCES.bea },
      { label: "Unemployment", value: `${s.unemploymentRate}%`, when: years.unemploymentRate ?? "", source: STATE_SOURCES.bls },
      { label: "Median household income", value: `$${Math.round(s.medianIncome).toLocaleString("en-US")}`, when: years.medianIncome ?? "", source: STATE_SOURCES.acs },
      { label: "Top income tax rate", value: s.stateTaxRate > 0 ? `${s.stateTaxRate}%` : "None", when: years.stateTaxRate ?? "", source: STATE_SOURCES.taxIncome },
      { label: "Sales tax, with local", value: `${s.salesTaxRate}%`, when: years.salesTaxRate ?? "", source: STATE_SOURCES.taxSales },
    );
  } else if (area === "Defense") {
    figures.push({ label: "People in state prisons", value: `${s.incarcerationRate} per 100,000 residents`, when: years.incarcerationRate ?? "", source: STATE_SOURCES.bjs });
  } else if (area === "Technology") {
    figures.push({ label: "Working from home", value: `${ind.commute.workFromHomePct}%`, when: ind.commute.y, note: "of workers", source: STATE_SOURCES.acs });
    out.none = "The Census Bureau's functions of state spending have none for technology.";
  } else if (area === "Social") {
    const poor = s.wealthPoverty.find((g) => g.label === "Below poverty line");
    if (poor) figures.push({ label: "Below the poverty line", value: `${poor.pct}%`, when: years.wealthPoverty ?? "", source: STATE_SOURCES.acs });
    figures.push(
      { label: "Renters paying 30% or more of income", value: `${ind.housing.rentBurdenPct}%`, when: ind.housing.y, source: STATE_SOURCES.acs },
      { label: "Median rent", value: `$${ind.housing.medianRent.toLocaleString("en-US")} a month`, when: ind.housing.y, source: STATE_SOURCES.acs },
      {
        label: "Minimum wage",
        value: s.minimumWage > 0 ? `$${s.minimumWage.toFixed(2)} an hour` : "The federal rate",
        when: years.minimumWage ?? "",
        source: STATE_SOURCES.dol,
      },
    );
  }

  if (!out.head && !out.none) out.none = "No published figure is held for this area here.";
  return out;
}
