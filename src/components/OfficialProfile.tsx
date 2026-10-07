/**
 * What the officials explorer says of one official once picked: schooling and
 * career, where their votes place them, the money their campaign has
 * reported, and the committees behind it.
 *
 * Every line is read from officialProfiles.ts (build-official-profiles.cjs):
 * education, service and offices from the official's Wikipedia article, a
 * member's terms from the congress-legislators data, the score from Voteview,
 * and the money from the Federal Election Commission's files. Nothing is typed
 * in here, and where a source has nothing the pane says so: a governor or a
 * mayor has no score and no FEC money, and none is made up.
 *
 * It is loaded when an official's detail is first shown, with its data, so
 * the States page does not carry either before then.
 */
import { useState, type ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { COMMITTEES, IDEOLOGY_REFERENCE, OFFICIAL_PROFILES, OFFICIAL_PROFILE_SOURCES as SRC, type Campaign } from "../data/officialProfiles";
import { TONE } from "../lib/chipTone";
import { Block, Kpi, Label, type Tokens } from "./DataExplorer";
import { ArticlePanel } from "./HistoryPanel";
import { MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Kind = "senator" | "representative" | "governor" | "mayor";

/** The committee the pane lists by name whenever it reports a gift: the one the request for this pane named. */
const NAMED = "C00797670";
const KIND_TONE: Record<string, string> = {
  "Corporate PAC": TONE.indigo,
  "Trade association PAC": TONE.sky,
  "Labor PAC": TONE.orange,
  "Membership organization PAC": TONE.violet,
  "Cooperative PAC": TONE.lime,
  "Non-stock corporation PAC": TONE.teal,
  "Leadership PAC": TONE.amber,
  "Party committee": TONE.slate,
  "Another candidate's committee": TONE.stone,
  "Super PAC": TONE.fuchsia,
  "Single-candidate super PAC": TONE.fuchsia,
  "Hybrid PAC": TONE.purple,
  "Independent spender": TONE.cyan,
};

/** Dollars as printed: to the dollar below a hundred thousand, then in thousands or millions. */
const usd = (n: number) => (n < 1e5 ? `$${Math.round(n).toLocaleString("en-US")}` : n < 1e6 ? `$${Math.round(n / 1e3)}K` : n < 1e9 ? `$${(n / 1e6).toFixed(n < 1e7 ? 2 : 1)}M` : `$${(n / 1e9).toFixed(2)}B`);
const exact = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const span = (from: number, to: number | null) => (to == null ? `since ${from}` : to === from ? String(from) : `${from}–${to}`);
const ordinal = (n: number) => {
  const v = n % 100;
  return `${n.toLocaleString("en-US")}${v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
const signed = (v: number) => `${v < 0 ? "−" : v > 0 ? "+" : ""}${Math.abs(v).toFixed(3)}`;
const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

function Said({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}
/** A line of a career or of a list of committees: what it is, and its years or its dollars. */
function Line({ t, children, figure, title }: { t: Tokens; children: ReactNode; figure: ReactNode; title?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }} title={title}>
      <span className="text-[11px] font-sans min-w-0" style={{ color: t.headText }}>
        {children}
      </span>
      <span className="text-[10px] font-mono font-semibold shrink-0 text-right" style={{ color: t.headText }}>
        {figure}
      </span>
    </div>
  );
}
function Out({ href, children, color }: { href: string; children: ReactNode; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color }}>
      {children} <ArrowSquareOut size={11} aria-hidden />
    </a>
  );
}

/** A committee as a line: its registered name, linked to its page at the FEC, what the FEC's codes say it is, and the dollars. */
function CommitteeLine({ t, id, amount }: { t: Tokens; id: string; amount: number }) {
  const [name, kind] = COMMITTEES[id] ?? [id, "Committee"];
  return (
    <Line t={t} figure={usd(amount)} title={`${name} · ${exact(amount)}`}>
      <a href={`https://www.fec.gov/data/committee/${id}/`} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {name}
      </a>{" "}
      <span className={`inline-block align-middle text-[9px] font-sans font-semibold px-1.5 py-px rounded-full ${KIND_TONE[kind] ?? TONE.zinc}`}>{kind}</span>
    </Line>
  );
}

/** Where a score falls from -1 to +1, with each party's median in the chamber marked. */
function Scale({ t, score, chamber }: { t: Tokens; score: number; chamber: "House" | "Senate" }) {
  const ref = IDEOLOGY_REFERENCE[chamber];
  const at = (v: number) => `${((v + 1) / 2) * 100}%`;
  return (
    <div role="img" aria-label={`A score of ${signed(score)} on a scale from −1, the most liberal, to +1, the most conservative. The ${chamber}'s median Democrat is at ${signed(ref.Democrat)}, its median Republican at ${signed(ref.Republican)}.`}>
      <div className="relative h-2 rounded-full" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
        <span className="absolute -top-1 -bottom-1 w-px" style={{ left: "50%", background: t.mutedText }} />
        <span className="absolute -top-1 -bottom-1 w-0.5 -ml-px rounded-full" style={{ left: at(ref.Democrat), background: "#3b82f6" }} title={`Median ${chamber} Democrat: ${signed(ref.Democrat)}`} />
        <span className="absolute -top-1 -bottom-1 w-0.5 -ml-px rounded-full" style={{ left: at(ref.Republican), background: "#ef4444" }} title={`Median ${chamber} Republican: ${signed(ref.Republican)}`} />
        <span className="absolute top-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full" style={{ left: at(score), background: t.headText, boxShadow: `0 0 0 2px ${t.cardBg}` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] font-mono" style={{ color: t.mutedText }}>
        <span>−1 · liberal</span>
        <span>0</span>
        <span>conservative · +1</span>
      </div>
    </div>
  );
}

/** A campaign's totals: what it raised, spent and holds, and where the money came from. */
function Money({ t, c, color }: { t: Tokens; c: Campaign; color: string }) {
  const from = [
    { label: "From individuals", value: c.individuals },
    { label: "From PACs and other committees", value: c.committees },
    { label: "From party committees", value: c.party },
    { label: "The candidate's own gifts and loans", value: c.self },
    { label: "Moved from the candidate's other committees", value: c.transfers },
  ].filter((r) => r.value > 0);
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Kpi t={t} label="Raised" value={usd(c.receipts)} color={t.headText} sub="total receipts" />
        <Kpi t={t} label="Spent" value={usd(c.spent)} color={t.headText} sub="disbursements" />
        <Kpi t={t} label="Cash on hand" value={usd(c.cash)} color={t.headText} sub={c.debts > 0 ? `debts ${usd(c.debts)}` : "no debts"} />
      </div>
      {from.length > 0 && <MeasureBars rows={from.map((r) => ({ label: r.label, value: r.value, text: usd(r.value) }))} max={Math.max(c.receipts, ...from.map((r) => r.value))} color={color} label="Where the campaign's money came from, each on a scale that ends at its total receipts" />}
      <Said t={t}>
        The campaign for the {c.office}'s own reports for {SRC.cycle}, to {day(c.through)}. Each line is a figure of the reports, on a scale that ends at the receipts; they need not add up to them, which also hold interest, refunds and other loans.
      </Said>
      <Out href={`https://www.fec.gov/data/candidate/${c.id}/`} color={color}>
        The campaign at the FEC
      </Out>
    </>
  );
}

export default function OfficialProfile({ t, id, kind, name, color }: { t: Tokens; /** The profile's key: a member's Biographical Directory id, "gov-<state>", "mayor-<rank>". */ id: string; kind: Kind; name: string; color: string }) {
  // The official whose biography is open: picking another closes it.
  const [open, setOpen] = useState<string | null>(null);
  const p = OFFICIAL_PROFILES[id] ?? {};
  const member = kind === "senator" || kind === "representative";
  const chamber = kind === "senator" ? "Senate" : "House";
  // A career, newest first: the stretches in Congress among the offices the article lists.
  const career = [...(p.congress ?? []).map((c) => ({ office: c.chamber === "Senate" ? "United States Senator" : "Member of the U.S. House of Representatives", from: c.from, to: c.to })), ...(p.offices ?? [])].sort((a, b) => Number(b.to == null) - Number(a.to == null) || b.from - a.from);
  const [first, ...others] = p.campaigns ?? [];
  const givers = p.givers;
  const largest = givers ? givers.top.slice(0, 8) : [];
  const alsoNamed = givers ? givers.top.slice(8) : [];
  const sources = [
    ...(p.wiki ? [{ label: `Wikipedia — ${p.wiki} (education, service and offices, from the article's infobox)`, url: wikiUrl(p.wiki) }] : []),
    ...(member ? [SRC.congress, SRC.voteview, SRC.fec, SRC.earmarks] : []),
  ];

  return (
    <>
      <Block>
        <Label t={t}>Education</Label>
        {p.education ? (
          <div className="flex flex-col">
            {p.education.map((e) => (
              <div key={e} className="py-1.5 text-[11px] font-sans" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                {e}
              </div>
            ))}
          </div>
        ) : (
          <Said t={t}>{p.wiki ? `The infobox of Wikipedia's article on ${name} lists no schooling.` : `No Wikipedia article is linked for ${name}, so no schooling is shown.`}</Said>
        )}

        <Label t={t}>Career</Label>
        {(p.occupation || p.military) && (
          <div className="flex flex-col gap-1">
            {p.occupation && (
              <p className="text-[11px] font-sans" style={{ color: t.headText }}>
                {p.occupation.join(" · ")}
              </p>
            )}
            {p.military && (
              <p className="text-[11px] font-sans" style={{ color: t.headText }}>
                <span style={{ color: t.mutedText }}>Military service · </span>
                {p.military}
              </p>
            )}
          </div>
        )}
        {career.length > 0 ? (
          <div className="flex flex-col">
            {career.map((o) => (
              <Line key={`${o.office}-${o.from}`} t={t} figure={span(o.from, o.to)}>
                {o.office}
              </Line>
            ))}
          </div>
        ) : (
          <Said t={t}>{p.wiki ? `The infobox of Wikipedia's article on ${name} lists no office with its years.` : "No office is shown."}</Said>
        )}
        {p.wiki && (
          <>
            <Said t={t}>
              Offices as the infobox of Wikipedia's article lists them, newest first{member ? "; the seats in Congress are the member's terms in the congress-legislators data" : ""}.
            </Said>
            <button type="button" onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id} className="self-start text-[11px] font-semibold font-sans cursor-pointer hover:opacity-70 transition-opacity" style={{ color }}>
              {open === id ? "Hide the biography" : "Read the biography, from Wikipedia"}
            </button>
            {open === id && <ArticlePanel title={p.wiki} name={name} mode="life" />}
          </>
        )}
      </Block>

      <Block>
        <Label t={t}>Ideology{member ? " · votes in the 119th Congress" : ""}</Label>
        {p.ideology ? (
          <>
            <p className="text-sm font-bold font-mono" style={{ color: t.headText }}>
              {signed(p.ideology.score)}
              <span className="text-[10px] font-normal" style={{ color: t.mutedText }}>
                {" "}
                · {p.ideology.rank <= p.ideology.of / 2 ? `${ordinal(p.ideology.rank)} most liberal` : `${ordinal(p.ideology.of - p.ideology.rank + 1)} most conservative`} of the {chamber}'s {p.ideology.of} members with a score
              </span>
            </p>
            <Scale t={t} score={p.ideology.score} chamber={chamber} />
            <Said t={t}>
              Voteview's DW-NOMINATE score, first dimension: where the member's {p.ideology.votes.toLocaleString("en-US")} roll-call votes place them between the most liberal (−1) and the most conservative (+1). The blue and red marks are the {chamber}'s median Democrat ({signed(IDEOLOGY_REFERENCE[chamber].Democrat)}) and Republican ({signed(IDEOLOGY_REFERENCE[chamber].Republican)}); the place in the order is counted from those scores.
            </Said>
          </>
        ) : (
          <Said t={t}>{member ? `Voteview has no score yet for ${name} in the 119th Congress.` : `None is published: Voteview's scores are drawn from votes in Congress, and a ${kind} casts none.`}</Said>
        )}
      </Block>

      <Block>
        <Label t={t}>Money raised{member ? ` · ${SRC.cycle}` : ""}</Label>
        {first ? (
          <>
            <Money t={t} c={first} color={color} />
            {others.map((c) => (
              <Said key={c.id} t={t}>
                A second committee, for the {c.office}, reports {exact(c.receipts)} raised and {exact(c.spent)} spent to {day(c.through)}; money moved between the two is counted in both.{" "}
                <a href={`https://www.fec.gov/data/candidate/${c.id}/`} target="_blank" rel="noopener noreferrer" className="underline">
                  At the FEC
                </a>
              </Said>
            ))}
          </>
        ) : (
          <Said t={t}>
            {member
              ? `The FEC's ${SRC.cycle} file holds no report from a campaign of ${name}'s.`
              : `Not in the Federal Election Commission's files: a campaign for ${kind} reports to the ${kind === "mayor" ? "city or state" : "state"}, and no figure is shown in its place.`}
          </Said>
        )}
      </Block>

      {member && (
        <Block>
          <Label t={t}>PACs and other committees · {SRC.cycle}</Label>
          {givers ? (
            <>
              <Said t={t}>
                {givers.count.toLocaleString("en-US")} {givers.count === 1 ? "committee reports" : "committees report"} giving {exact(givers.total)} in all to {name}'s {others.length ? "campaigns" : "campaign"}. The largest:
              </Said>
              <div className="flex flex-col">
                {largest.map(([c, amount]) => (
                  <CommitteeLine key={c} t={t} id={c} amount={amount} />
                ))}
              </div>
              {alsoNamed.length > 0 && (
                <>
                  <Said t={t}>Further down the list, and shown by name:</Said>
                  <div className="flex flex-col">
                    {alsoNamed.map(([c, amount]) => (
                      <CommitteeLine key={c} t={t} id={c} amount={amount} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <Said t={t}>No committee reports a gift to {name}'s campaign in {SRC.cycle}.</Said>
          )}
          {p.outside && (
            <>
              <Label t={t}>Independent spending · {SRC.cycle}</Label>
              {(
                [
                  ["To support", p.outside.for, p.outside.forTop],
                  ["To oppose", p.outside.against, p.outside.againstTop],
                ] as const
              )
                .filter(([, total]) => total > 0)
                .map(([what, total, list]) => (
                  <div key={what} className="flex flex-col">
                    <Line t={t} figure={usd(total)} title={exact(total)}>
                      <span className="font-semibold">{what}</span>
                      <span style={{ color: t.mutedText }}> · the largest spenders</span>
                    </Line>
                    {list.map(([c, amount]) => (
                      <CommitteeLine key={c} t={t} id={c} amount={amount} />
                    ))}
                  </div>
                ))}
            </>
          )}
          <Said t={t}>
            Each committee's own gifts and spending, as it reports them to the FEC, summed for the cycle. A gift an individual sends through a committee is reported as the individual's, so it is in the individuals' figure above and not on a committee's line.{" "}
            {(COMMITTEES[NAMED]?.[0] ?? "The American Israel Public Affairs Committee's PAC")
              .toLowerCase()
              .replace(/\b[a-z]/g, (m) => m.toUpperCase())
              .replace(/\bOf\b/g, "of")}{" "}
            is listed by name wherever it reports a gift; where it is absent, it reports none to this member for {SRC.cycle}.
          </Said>
        </Block>
      )}

      {sources.length > 0 && <SourceLink sources={sources} />}
    </>
  );
}
