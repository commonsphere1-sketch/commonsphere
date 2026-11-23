/**
 * The details a card on the bar of what is followed (SavedBar) gives for a leader, a monarch, an alliance, an economy or a
 * city, as asked: read from the site's own data each time, not kept from the day the star was pressed, so a card says what
 * the page says. Each set of data is loaded only when the bar shows something of its kind, and once.
 *
 * A figure the data does not hold is left out, not filled in.
 */
import { useEffect, useState } from "react";
import { has } from "./na";
import { usdFromBillions } from "./money";

export type SavedFacts = [label: string, value: string][];

const pct = (v: number, signed = false) => `${signed && v > 0 ? "+" : ""}${Number(v.toFixed(2))}%`;

async function factsOf(id: string): Promise<SavedFacts | null> {
  const [kind, key] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
  if (kind === "leader") {
    const { LEADERS } = await import("../pages/WorldleadersPage");
    const l = LEADERS.find((x) => x.id === key);
    if (!l) return null;
    const term = l.termsInOffice[l.termsInOffice.length - 1];
    const out: SavedFacts = [["Office", l.title], ["Country", l.country]];
    if (term) out.push(["In office", `${term.from} to ${term.to === "present" ? "now" : term.to}`]);
    if (l.party) out.push(["Party", l.party]);
    if (l.ideology) out.push(["Leaning", l.ideology]);
    if (l.birthYear) out.push(["Born", String(l.birthYear)]);
    return out;
  }
  if (kind === "monarch") {
    const { ROYAL_FAMILIES } = await import("../data/royalFamiliesData");
    const m = ROYAL_FAMILIES.find((x) => x.id === key);
    if (!m) return null;
    const heir = /^heir/i.test(m.successionOrder);
    const out: SavedFacts = [["Title", m.title], ["Country", m.country], [heir ? "Heir since" : "Reigning since", String(m.reignSince)], ["House", m.houseName], ["Monarchy", m.systemType]];
    if (m.born) out.push(["Born", String(m.born)]);
    return out;
  }
  if (kind === "alliance") {
    const { ALLIANCES } = await import("../data/alliances");
    const a = ALLIANCES.find((x) => x.id === key);
    if (!a) return null;
    const out: SavedFacts = [["Kind", a.kind], ["Members", String(a.memberCount)]];
    if (a.founded) out.push(["Founded", String(a.founded)]);
    if (a.headquarters) out.push(["Headquarters", a.headquarters]);
    return out;
  }
  if (kind === "economy") {
    const { economiesData } = await import("../data/economiesData");
    const e = economiesData.find((x) => x.id === key);
    if (!e) return null;
    const out: SavedFacts = [];
    if (has(e.gdpTrillions)) out.push(["GDP", usdFromBillions(e.gdpTrillions * 1000)]);
    if (has(e.gdpGrowthRate)) out.push(["GDP growth", pct(e.gdpGrowthRate, true)]);
    if (has(e.inflationRate)) out.push(["Inflation", pct(e.inflationRate)]);
    if (has(e.unemploymentRate)) out.push(["Unemployment", pct(e.unemploymentRate)]);
    if (has(e.gdpPerCapita)) out.push(["GDP per person", `$${Math.round(e.gdpPerCapita).toLocaleString("en-US")}`]);
    if (e.currencyCode) out.push(["Currency", e.currencyCode]);
    return out.slice(0, 6);
  }
  if (!kind) {
    // A profiled city is followed by its own id; one of the UN's ("un-…") has no profile here.
    const { citiesData } = await import("../data/citiesData");
    const c = citiesData.find((x) => x.id === id);
    if (!c) return null;
    const out: SavedFacts = [["Country", c.country], ["Region", c.region]];
    if (c.languages.length) out.push(["Languages", c.languages.slice(0, 2).join(", ")]);
    return out;
  }
  return null;
}

const cache = new Map<string, Promise<SavedFacts | null>>();

/** A followed thing's details: undefined while they are read, null where the site holds none for it. */
export function useSavedFacts(id: string): SavedFacts | null | undefined {
  const [facts, setFacts] = useState<SavedFacts | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    if (!cache.has(id)) cache.set(id, factsOf(id).catch(() => null));
    void cache.get(id)!.then((f) => live && setFacts(f));
    return () => {
      live = false;
    };
  }, [id]);
  return facts;
}
