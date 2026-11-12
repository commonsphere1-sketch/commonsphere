/**
 * A division's own figures from the official regional statistics of a national or international body - the OECD's
 * regional databases, Statistics Canada, the Australian Bureau of Statistics, the UK's Office for National Statistics -
 * each a file in static/regional/ built by its own script (build-regional-*.cjs) in one form:
 *
 *   { agency, source: {label, url}, defs: { key: {label, part, unit, say} }, divisions: { id: { code, name, figures: { key: [year, value, flag?] } } } }
 *
 * A division is in a file only where the body publishes a figure for it under its own name. Nothing here is worked out:
 * each value is the body's, with its year. Every file is fetched once, when the first division window opens.
 */
import { useEffect, useState } from "react";

/** The files, by name: each is fetched, and one that does not come is left out. */
const FILES = ["oecd", "statcan", "abs", "ons"] as const;

export type RegionalUnit = "pct" | "years" | "per100k" | "usd_ppp" | "cad" | "aud" | "gbp" | "count";
export type RegionalDef = { label: string; part: string; unit: RegionalUnit; say: string };
type RegionalFile = {
  agency: string;
  source: { label: string; url: string };
  defs: Record<string, RegionalDef>;
  divisions: Record<string, { code: string; name: string; figures: Record<string, [number, number, string?]> }>;
};
/** One figure of a division's, said in full. */
export type RegionalFigure = {
  key: string;
  def: RegionalDef;
  year: number;
  value: number;
  flag?: string;
  agency: string;
  /** The body's code and name for the region the figure is published for. */
  code: string;
  region: string;
  source: { label: string; url: string };
};

let all: Promise<Record<string, RegionalFigure[]>> | null = null;
const load = () =>
  (all ??= Promise.all(
    FILES.map((f) =>
      fetch(`/regional/${f}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<RegionalFile>) : null))
        .catch(() => null),
    ),
  ).then((files) => {
    const out: Record<string, RegionalFigure[]> = {};
    for (const file of files) {
      if (!file?.divisions) continue;
      for (const [id, d] of Object.entries(file.divisions))
        for (const [key, def] of Object.entries(file.defs)) {
          const f = d.figures[key];
          if (!f) continue;
          (out[id] ??= []).push({ key, def, year: f[0], value: f[1], flag: f[2], agency: file.agency, code: d.code, region: d.name, source: file.source });
        }
    }
    return out;
  }));

/** Every division's regional figures, by division id: undefined while they are fetched. */
export function useRegionalFigures(): Record<string, RegionalFigure[]> | undefined {
  const [got, setGot] = useState<Record<string, RegionalFigure[]> | undefined>(undefined);
  useEffect(() => {
    let off = false;
    load().then((f) => !off && setGot(f));
    return () => {
      off = true;
    };
  }, []);
  return got;
}

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/** A figure's value as it is printed, in its unit. */
export function regionalValue(f: RegionalFigure): string {
  switch (f.def.unit) {
    case "pct":
      return `${f.value.toFixed(1)}%`;
    case "years":
      return `${f.value.toFixed(1)} years`;
    case "per100k":
      return `${f.value.toFixed(1)} per 100,000 people`;
    case "usd_ppp":
      return `$${whole(f.value)} (PPP)`;
    case "cad":
      return `C$${whole(f.value)}`;
    case "aud":
      return `A$${whole(f.value)}`;
    case "gbp":
      return `£${whole(f.value)}`;
    default:
      return whole(f.value);
  }
}
/** What is said beneath it: its year, that it is its own, the body, what it measures, and the body's name for the region where it is spelled otherwise. */
export function regionalSaid(f: RegionalFigure, name: string): string {
  const flag = f.flag ? ` · ${f.flag.split("").map((c) => ({ B: "a break in the series", P: "provisional" })[c] ?? c).join(", ")}` : "";
  const region = f.region.toLowerCase() !== name.toLowerCase() ? ` · its region "${f.region}"` : "";
  return `${f.year} · its own · ${f.agency}, ${f.def.say}${flag}${region}`;
}
