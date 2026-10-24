import { useEffect, useState } from "react";
import { countriesData } from "../data/countriesData";
import type { CountryLegalStatus, LegalItem } from "../data/countryLegalStatus";
import { SourceLink } from "./SourceLink";

/**
 * What is legal and illegal in a country, subject by subject, as its window lists it under Law: a row a subject, with its
 * note under it and its status beside it, drawn as a state's window draws its list. For the Worldview page's law panel,
 * as asked, so that it carries the same longer list. The list is fetched when it is first shown; a country with no list
 * shows none.
 */
type Data = { list: Record<string, CountryLegalStatus>; sources: { label: string; url: string }[] };
let loaded: Promise<Data> | null = null;
const load = () =>
  (loaded ??= import("../data/countryLegalStatus").then((m) => ({ list: m.COUNTRY_LEGAL_STATUS, sources: m.LEGAL_STATUS_SOURCES })));

const BADGE: Record<LegalItem["status"], string> = {
  legal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  illegal: "text-red-400 bg-red-500/10 border-red-500/30",
  restricted: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  decriminalized: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
};
const DOT: Record<LegalItem["status"], string> = { legal: "#34d399", illegal: "#f87171", restricted: "#facc15", decriminalized: "#22d3ee" };
const WORD: Record<LegalItem["status"], string> = { legal: "Legal", illegal: "Illegal", restricted: "Restricted", decriminalized: "Decriminalised" };

export function LegalStatusList({ code, name }: { /** The country's ISO code. */ code: string; name: string }) {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    let off = false;
    load().then((d) => !off && setData(d));
    return () => {
      off = true;
    };
  }, []);
  const id = countriesData.find((c) => c.code === code)?.id;
  const items = data && id ? data.list[id]?.items : undefined;
  if (!items?.length) return null;
  const count = (s: LegalItem["status"]) => items.filter((i) => i.status === s).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="text-sm font-bold font-sans text-foreground">What&#39;s Legal &amp; Illegal in {name}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          {(["legal", "illegal", "restricted", "decriminalized"] as const)
            .filter((s) => count(s) > 0)
            .map((s) => (
              <span key={s} className={`px-2 py-0.5 rounded-full border ${BADGE[s]}`}>
                {count(s)} {WORD[s].toLowerCase()}
              </span>
            ))}
        </div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-background/40 border border-border/30">
          <span aria-hidden className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: DOT[item.status] }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-sans font-semibold text-foreground leading-snug">{item.label}</p>
            {item.note && <p className="text-[11px] font-sans text-muted-foreground mt-1 leading-snug">{item.note}</p>}
          </div>
          <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${BADGE[item.status]}`}>{WORD[item.status]}</span>
        </div>
      ))}
      <SourceLink sources={data!.sources} className="mt-1" />
    </div>
  );
}
