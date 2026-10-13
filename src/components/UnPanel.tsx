/**
 * A country's place in the United Nations, in its window: when it was
 * admitted, the regional group it sits in, and its seat on the Security
 * Council - now, and the terms it has been elected to (data/countryUn.ts,
 * read from the United Nations' own pages).
 *
 * A state that is not a member is given no panel, except the two the UN
 * invites to take part as observers, which are said to be that. Nothing
 * here is a judgement of standing or influence: it is the record.
 */
import { COUNTRY_UN, COUNTRY_UN_RETRIEVED, COUNTRY_UN_SOURCES, UN_GROUPS, UN_GROUP_SIZE, UN_OBSERVERS } from "../data/countryUn";
import { ChartNote } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const ordinal = (n: number) => {
  const t = n % 100;
  return `${n}${t >= 11 && t <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
const MEMBERS = Object.keys(COUNTRY_UN).length;
const THIS_YEAR = Number(COUNTRY_UN_RETRIEVED.slice(0, 4));

type Tile = { label: string; value: string; sub: string };

export default function UnPanel({ code, country, className = "" }: { /** The country's ISO 3166-1 code. */ code: string; country: string; className?: string }) {
  const m = COUNTRY_UN[code];
  const observer = UN_OBSERVERS[code];
  if (!m && !observer) return null;
  const head = (
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🇺🇳 In the United Nations</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
  if (!m)
    return (
      <section className={className}>
        {head}
        <div className="modal-tile rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-sans">Standing</p>
          <p className="text-base font-bold font-sans text-foreground">Non-member observer state</p>
          <p className="text-xs text-muted-foreground font-sans leading-snug">
            {observer} is not a member: it has a standing invitation to take part in the General Assembly's work as an observer, without a vote.
          </p>
        </div>
        <SourceLink sources={[COUNTRY_UN_SOURCES.observers]} className="mt-2" />
      </section>
    );

  // The terms it has sat for, or is sitting for: one it has been elected to and has not begun is said apart.
  const served = (m.terms ?? []).filter(([from]) => from <= THIS_YEAR);
  const ahead = (m.terms ?? []).filter(([from]) => from > THIS_YEAR);
  const span = ([from, to]: [number, number]) => (from === to ? String(from) : `${from}–${String(to).slice(2)}`);
  const tiles: Tile[] = [
    {
      label: "Member Since",
      value: day(m.admitted),
      // No count is given of the original members: two of them no longer exist, so the number admitted in 1945 that are members now is not the number there were.
      sub: m.admitted.startsWith("1945") ? "an original member: admitted in the year the Charter came into force" : `the ${ordinal(m.nth)} of ${MEMBERS} to be admitted, counted here`,
    },
    ...(m.group != null
      ? [{ label: "Regional Group", value: UN_GROUPS[m.group], sub: `${UN_GROUP_SIZE[m.group]} members${m.groupNote ? ` · ${m.groupNote}` : ""}` }]
      : [{ label: "Regional Group", value: "None", sub: "it sits in none of the five groups" }]),
    m.council === "permanent"
      ? { label: "Security Council", value: "Permanent member", sub: "one of the five, each with a veto" }
      : typeof m.council === "number"
        ? { label: "Security Council", value: "Elected member", sub: `one of the ten elected; its term ends on 31 December ${m.council}` }
        : { label: "Security Council", value: "Not a member now", sub: "the Council has five permanent members and ten elected for two years" },
    ...(m.council === "permanent"
      ? []
      : [
          served.length
            ? { label: "Terms On The Council", value: String(served.length), sub: `${served.map(span).join(", ")} · counted here` }
            : { label: "Terms On The Council", value: "None", sub: "it has never been elected to the Council" },
        ]),
  ];
  return (
    <section className={className}>
      {head}
      <div className="tile-fill gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`modal-tile rounded-lg p-3 ${t.sub.length > 70 ? "tile-wide" : ""}`}>
            <p className="text-xs text-muted-foreground font-sans">{t.label}</p>
            <p className="text-base font-bold font-sans text-foreground leading-snug">{t.value}</p>
            <p className="text-xs text-muted-foreground font-sans leading-snug">{t.sub}</p>
          </div>
        ))}
      </div>
      <ChartNote className="mt-2">
        {m.name !== country ? `The United Nations writes its name as “${m.name}”. ` : ""}
        {ahead.length ? `It has been elected to the Council for ${ahead.map(span).join(" and ")}, a term that has not yet begun. ` : ""}
        As the United Nations' own pages stood on {day(COUNTRY_UN_RETRIEVED)}.
      </ChartNote>
      <SourceLink sources={[COUNTRY_UN_SOURCES.members, COUNTRY_UN_SOURCES.groups, COUNTRY_UN_SOURCES.council, ...(m.council === "permanent" ? [] : [COUNTRY_UN_SOURCES.terms])]} className="mt-1" />
    </section>
  );
}
