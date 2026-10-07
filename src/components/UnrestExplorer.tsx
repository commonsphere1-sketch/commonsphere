/**
 * Revolutions, protests, boycotts and internal conflicts: an explorer of
 * events old and recent, well known and little known, each with its cause,
 * what it cost and how it ended.
 *
 * Every line is read from unrest.ts (build-unrest.cjs), which takes each
 * event from one of Wikipedia's lists and says it in the words of its own
 * article's summary box - or, for a boycott, of the list's own table. Nothing
 * is typed in here and nothing is ranked by size: these are accounts, not
 * statistics, and the list is in order of date. Where a box gives no cause,
 * cost or outcome the pane says that it gives none, and puts nothing in its
 * place.
 *
 * Each kind has a colour of its own - amber for a boycott, blue for a
 * protest, red for a revolution, violet for an internal conflict - on its
 * count, on the bar of every row and in the kind's name beside it, so no kind
 * is told by colour alone. Under each account are the works to read on it:
 * those the account itself cites, the Encyclopaedia Britannica article and
 * Library of Congress heading where Wikidata records them, and the Wikipedia
 * article last.
 *
 * It is made of the pieces the site's other explorers are made of
 * (DataExplorer), and is loaded when the page reaches it.
 */
import { useMemo, useState } from "react";
import { Megaphone, MagnifyingGlass, X } from "@phosphor-icons/react";
import { UNREST_ERAS, UNREST_EVENTS, UNREST_KINDS, UNREST_SOURCES, type UnrestEvent, type UnrestKind } from "../data/unrest";
import { Block, Empty, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const ACCENT = "#f97316";
/** A colour to each kind of event, far apart in hue: amber, blue, red, violet. */
const KIND_COLOR: Record<UnrestKind, string> = { Boycott: "#f59e0b", Protest: "#0ea5e9", Revolution: "#ef4444", "Internal conflict": "#a855f7" };
const KIND_PLURAL: Record<UnrestKind, string> = { Boycott: "Boycotts", Protest: "Protests, strikes and riots", Revolution: "Revolutions and rebellions", "Internal conflict": "Internal conflicts" };
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
const eraOf = (year: number) => UNREST_ERAS.find(([, from, to]) => year >= from && year <= to)?.[0] ?? "";

/** What an event's record says under one heading, or that it says nothing. */
const NONE: Record<"cause" | "effect" | "outcome", (e: UnrestEvent) => string> = {
  cause: (e) => (e.kind === "Boycott" ? "The list gives no cause for it." : "The article's summary box gives no cause."),
  effect: () => "No count of the dead, injured or arrested is given.",
  outcome: (e) => (e.ongoing ? "The list gives it as still going on." : e.kind === "Boycott" ? "The list gives no outcome, and no article that says how it ended." : "No outcome is given."),
};

export function UnrestExplorer() {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<UnrestKind | null>(null);
  const [era, setEra] = useState<string | null>(null);
  const [oldest, setOldest] = useState(false);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const key = (e: UnrestEvent) => `${e.kind}|${e.title}|${e.year}`;
  const q = search.trim().toLowerCase();
  const list = useMemo(() => {
    const rows = UNREST_EVENTS.filter(
      (e) => (!kind || e.kind === kind) && (!era || eraOf(e.year) === era) && (!q || [e.title, e.where ?? "", e.cause ?? "", e.outcome ?? "", e.target ?? "", e.participants ?? ""].some((s) => s.toLowerCase().includes(q))),
    );
    return oldest ? [...rows].reverse() : rows;
  }, [q, kind, era, oldest]);
  const shown = (pickedKey ? UNREST_EVENTS.find((e) => key(e) === pickedKey) : null) ?? list[0] ?? null;
  const said = (label: string, text: string | undefined, none?: string) =>
    text || none ? (
      <>
        <Label t={t}>{label}</Label>
        <p className="text-[11px] font-sans leading-snug" style={{ color: text ? t.bodyText : t.mutedText }}>
          {text ?? none}
        </p>
      </>
    ) : null;

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <Megaphone size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Revolutions, protests, boycotts and internal conflicts</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {UNREST_EVENTS.length}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search the events"
          placeholder="Search an event, a place, a cause or an outcome…"
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="explorer-panes flex flex-col md:flex-row md:h-[560px]">
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[340px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {/* How many of each kind are held: pick one to see only those. */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3">
            {UNREST_KINDS.map((k) => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setKind(on ? null : k);
                    setPickedKey(null);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? KIND_COLOR[k] + "22" : t.tile, border: `1px solid ${on ? KIND_COLOR[k] + "88" : t.gridLine}` }}
                >
                  <span className="block text-sm font-bold font-mono" style={{ color: KIND_COLOR[k] }}>
                    {UNREST_EVENTS.filter((e) => e.kind === k).length}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {KIND_PLURAL[k]}
                  </span>
                </button>
              );
            })}
          </div>
          {/* The eras, and the order. */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5 pb-1">
            {UNREST_ERAS.map(([label]) => {
              const on = era === label;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setEra(on ? null : label);
                    setPickedKey(null);
                  }}
                  className="text-[9px] font-mono px-2 py-1 rounded-full cursor-pointer"
                  style={{ background: on ? ACCENT + "22" : t.tile, border: `1px solid ${on ? ACCENT + "88" : t.gridLine}`, color: on ? t.headText : t.mutedText }}
                >
                  {label}
                </button>
              );
            })}
            <button type="button" aria-pressed={oldest} onClick={() => setOldest((o) => !o)} className="ml-auto text-[9px] font-mono px-2 py-1 rounded-full cursor-pointer" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}>
              {oldest ? "Oldest first" : "Newest first"}
            </button>
          </div>
          <div className="px-4 pt-2 pb-1">
            <Label t={t}>
              {list.length} of {UNREST_EVENTS.length} · in order of date
            </Label>
          </div>
          {list.map((e) => (
            <Row key={key(e)} t={t} selected={shown ? key(shown) === key(e) : false} color={KIND_COLOR[e.kind]} onClick={() => setPickedKey(key(e))}>
              <span className="w-2 h-8 rounded-full shrink-0" style={{ background: KIND_COLOR[e.kind] }} aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                  {e.title}
                </span>
                <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                  <span className="font-bold" style={{ color: KIND_COLOR[e.kind] }}>
                    {e.kind}
                  </span>{" "}
                  · {e.when}
                  {e.where ? ` · ${e.where}` : ""}
                </span>
              </span>
            </Row>
          ))}
          {list.length === 0 && <Empty t={t}>No event matches.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {shown ? (
            <>
              <Block>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: KIND_COLOR[shown.kind] }}>
                    {shown.kind} · {eraOf(shown.year)}
                    {shown.ongoing ? " · ongoing" : ""}
                  </p>
                  <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                    {shown.title}
                  </p>
                  <p className="text-[11px] font-sans mt-0.5" style={{ color: t.mutedText }}>
                    {shown.when}
                    {shown.where ? ` · ${shown.where}` : ""}
                  </p>
                </div>
                {shown.said && (
                  <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {shown.said}
                  </p>
                )}
                {said("Who took part", shown.participants)}
                {said("What was boycotted", shown.target)}
              </Block>
              <Block>
                {said("Cause", shown.cause, NONE.cause(shown))}
                {said("What it sought", shown.goals)}
                {said("How it was carried on", shown.methods)}
                {said(shown.kind === "Internal conflict" && shown.effect && !/\d/.test(shown.effect) ? "Effect · what changed hands" : "Effect · what it cost", shown.effect, NONE.effect(shown))}
                {said("Outcome", shown.outcome, NONE.outcome(shown))}
              </Block>
              <Block>
                <Label t={t}>Sources to read · {(shown.sources?.length ?? 0) + (shown.article ? 1 : 0)}</Label>
                <SourceLink
                  sources={[...(shown.sources ?? []), ...(shown.article ? [{ label: `Wikipedia — ${shown.article}`, url: wiki(shown.article) }] : [])]}
                />
                {!shown.sources?.length && (
                  <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                    {shown.article ? "The opening of its article cites no work that could be read from it, and Wikidata records no other reference work for it; the article's own footnotes are the place to look." : "The list cites no work for this row."}
                  </p>
                )}
                <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                  {shown.kind === "Boycott"
                    ? "A row of Wikipedia's list of boycotts, in its words; how it ended is from the article the row names, where there is one."
                    : "From the summary box and the opening of its Wikipedia article, in their words: links, notes and flags removed, a long entry cut at the end of an item."}
                </p>
              </Block>
            </>
          ) : (
            <Empty t={t}>Nothing to show.</Empty>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t flex flex-col gap-1.5" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
          Accounts, not statistics: {UNREST_SOURCES.withAccount.toLocaleString("en-US")} events in Wikipedia's lists had a dated account that could be read, and {UNREST_EVENTS.length} are kept - from each kind in each era, half
          those with the longest articles and half taken evenly from the rest, so the well known and the little known stand alike. Nothing is ranked by size; no source counts these on one footing. The wording of each account is Wikipedia's, which is open to reuse; the works it cites, and
          Britannica's and the Library of Congress's where there is one, are linked under it to read and to cite. Read on{" "}
          {UNREST_SOURCES.retrieved}.
        </span>
        <SourceLink sources={UNREST_SOURCES.lists} />
      </div>
    </div>
  );
}

export default UnrestExplorer;
