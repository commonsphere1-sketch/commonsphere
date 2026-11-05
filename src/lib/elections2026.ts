/**
 * The 2026 midterms, as asked: each state's count of its races for the US Senate, governor and the US House, from the
 * state's own official results site (build-election-2026.cjs → static/elections/2026.json), and read again in the browser
 * every five minutes from the sites that allow it (Clarity's).
 *
 * No race is called: a count is the state's, unofficial until it certifies, and who leads it is all the map says.
 */
import { useEffect, useState } from "react";
import { STATE_OFFICES } from "../data/stateOffices";

export type Office = "senate" | "governor" | "house";
export type Contest = { office: Office; special?: boolean; district?: number; title: string; cands: [name: string, party: string, votes: number][]; reporting: [number, number] | null };
export type StateCount = { source: string; url: string; live: { kind: "clarity"; st: string; eid: string } | null; readAt: string; contests: Contest[] };
export type Midterms = { election: string; builtAt: string; states: Record<string, StateCount>; refused: Record<string, string>; failed: Record<string, string> };

export const PARTY_INK: Record<string, string> = { D: "#3b82f6", R: "#ef4444" };
export const OTHER_INK = "#94a3b8";
export const PARTY_NAME: Record<string, string> = { D: "Democratic", R: "Republican" };
export const partyInk = (p: string) => PARTY_INK[p] ?? OTHER_INK;

/** Which race a contest is, by its title - as the build reads it. */
function raceOf(title: string): Pick<Contest, "office" | "special" | "district"> | null {
  const t = title.replace(/\s+/g, " ").trim();
  if (/^(United States Senator|US SENATE|U\.S\. Senator)/i.test(t)) return { office: "senate", special: /unexpired|special/i.test(t) };
  if (/^Governor\b/i.test(t)) return { office: "governor" };
  const h = t.match(/(?:United States Representative|Representative to the \d+(?:st|nd|rd|th) United States Congress|US HOUSE OF REPRESENTATIVES|U\.S\. Representative|Representative in Congress)\D*District (\d+)/i);
  return h ? { office: "house", district: +h[1] } : null;
}
const PARTY: Record<string, string> = { REP: "R", DEM: "D" };

/** A Clarity state's count, read again now. */
async function clarityNow(st: string, eid: string): Promise<Contest[]> {
  const base = `https://results.enr.clarityelections.com/${st}/${eid}`;
  const ver = (await (await fetch(`${base}/current_ver.txt`, { cache: "no-store" })).text()).trim();
  const r = await fetch(`${base}/${ver}/json/en/summary.json`, { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  const sum = (await r.json()) as { C: string; CH: string[]; P: string[]; V: number[]; PR: number; TP: number }[];
  return sum.flatMap((c) => {
    const race = raceOf(c.C);
    return race ? [{ ...race, title: c.C, cands: c.CH.map((n, i): [string, string, number] => [n, PARTY[c.P[i]] ?? c.P[i], c.V[i]]).sort((a, b) => b[2] - a[2]), reporting: [c.PR, c.TP] as [number, number] }] : [];
  });
}

const EVERY = 5 * 60 * 1000;
/** The counts, the built file first, then the live sites read again every five minutes while `on`. */
export function useMidterms(on: boolean) {
  const [data, setData] = useState<Midterms | null | undefined>(undefined);
  useEffect(() => {
    if (!on) return;
    let live = true;
    const refresh = (base: Midterms) =>
      Promise.all(
        Object.entries(base.states)
          .filter(([, s]) => s.live?.kind === "clarity")
          .map(([st, s]) =>
            clarityNow(s.live!.st, s.live!.eid)
              .then((contests) => [st, { ...s, contests, readAt: new Date().toISOString() }] as const)
              .catch(() => [st, s] as const),
          ),
      ).then((fresh) => live && setData({ ...base, states: { ...base.states, ...Object.fromEntries(fresh) } }));
    let base: Midterms | null = null;
    fetch("/elections/2026.json", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Midterms>) : Promise.reject(new Error(String(r.status)))))
      .then((m) => {
        if (!live) return;
        base = m;
        setData(m);
        void refresh(m);
      })
      .catch(() => live && setData(null));
    const timer = window.setInterval(() => base && void refresh(base), EVERY);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [on]);
  return data;
}

/** The seat each race is for, and who holds it now, by the congress-legislators data and the governors' list: [name, party letter]. */
export function holderOf(st: string, c: Contest): [string, string] | null {
  const o = STATE_OFFICES[st.toLowerCase()];
  if (!o) return null;
  const letter = (p: string) => (/^Democrat/.test(p) ? "D" : /^Republican/.test(p) ? "R" : p);
  if (c.office === "governor") return [o.governor.name, letter(o.governor.party)];
  if (c.office === "senate") {
    // The seat up: a class 2 seat, or for a special election the seat whose term the election fills.
    const s = c.special ? o.senators.find((x) => x.class === 3) : o.senators.find((x) => x.class === 2) ?? o.senators.find((x) => x.termEnd <= "2027-01-03");
    return s ? [s.name, letter(s.party)] : null;
  }
  const r = o.representatives.find((x) => +String(x.district).replace(/\D/g, "") === c.district || (c.district === 1 && /at.?large|00$/i.test(String(x.district))));
  return r ? [r.name, letter(r.party)] : null;
}

const letterOf = (party: string) => (/^Democrat/.test(party) ? "D" : /^Republican/.test(party) ? "R" : "O");

/**
 * The balance of a chamber, as the counts stand - worked out here: the seats not up this year by the party their holder
 * sits with (an independent who caucuses with a party counted with it), the races where each party leads the count, and
 * the races not yet read. For the House every seat is up.
 */
export type Balance = { notUp: Record<"D" | "R" | "O", number>; leads: Record<"D" | "R" | "O", number>; unread: number; total: number; control: number };
export function balanceOf(data: Midterms | null | undefined, office: Office): Balance {
  const notUp = { D: 0, R: 0, O: 0 };
  const leads = { D: 0, R: 0, O: 0 };
  let up = 0;
  if (office === "senate") {
    for (const [id, o] of Object.entries(STATE_OFFICES))
      for (const s of o.senators) {
        const isUp = s.class === 2 || (["fl", "oh"].includes(id) && s.class === 3);
        if (isUp) up++;
        else notUp[letterOf(s.caucus ?? s.party)]++;
      }
  } else if (office === "governor") {
    for (const [id, o] of Object.entries(STATE_OFFICES)) {
      if (RACES_2026.governor.includes(id.toUpperCase())) up++;
      else notUp[letterOf(o.governor.party)]++;
    }
  } else up = 435;

  for (const s of Object.values(data?.states ?? {}))
    for (const c of s.contests.filter((x) => x.office === office)) {

      const total = c.cands.reduce((a, x) => a + x[2], 0);
      if (total > 0) leads[c.cands[0][1] === "D" ? "D" : c.cands[0][1] === "R" ? "R" : "O"]++;
    }
  const total = office === "senate" ? 100 : office === "governor" ? 50 : 435;
  return { notUp, leads, unread: Math.max(0, up - leads.D - leads.R - leads.O), total, control: office === "senate" ? 51 : office === "governor" ? 26 : 218 };
}

/**
 * The states with a Senate or a governor's race in 2026: for the Senate, each state holding a class 2 seat by the
 * congress-legislators data, and Florida's and Ohio's special elections; for governor, the 36 states whose constitutions
 * put the election in this cycle (a governor's term end as the site holds it does not say this alone - Kentucky's ends
 * in 2027 and is filled in 2027).
 */
export const RACES_2026: Record<"senate" | "governor", string[]> = {
  senate: Object.entries(STATE_OFFICES)
    .filter(([id, o]) => o.senators.some((s) => s.class === 2) || ["fl", "oh"].includes(id))
    .map(([id]) => id.toUpperCase())
    .sort(),
  governor: ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "FL", "GA", "HI", "ID", "IL", "IA", "KS", "ME", "MD", "MA", "MI", "MN", "NE", "NV", "NH", "NM", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "VT", "WI", "WY"],
};
