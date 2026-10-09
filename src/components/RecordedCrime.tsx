import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Gavel, Info } from "@phosphor-icons/react";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";
import {
  ARMS_SEIZED,
  OFFENCES,
  OFFENCE_PLACES,
  OFFENCE_RATES,
  OFFENCE_SOURCES,
  TRAFFICKING,
  UNSENTENCED,
  WILDLIFE_SEIZED,
  type OffenceGroup,
  type OffenceKey,
  type SmallCount,
} from "../data/crimeOffences";

/**
 * Crime beyond homicide, on the Crime page: what each country's police,
 * courts, customs and prisons report to UNODC. Every figure is UNODC's own for
 * the latest year the place reported, shown with that year; a place that did
 * not report is not on a list, and nothing stands in for it.
 */

// ── Look ───────────────────────────────────────────────────────────────────

function lookOf(isLight: boolean) {
  return {
    isLight,
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    } as CSSProperties,
    head: isLight ? "#0f172a" : "#f1f0ff",
    muted: isLight ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.66)",
    accent: isLight ? "#dc2626" : "rgba(248,113,113,0.85)",
    track: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)",
    line: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    /** The part of a bar that the source does not break down. */
    rest: isLight ? "#cbd5e1" : "rgba(255,255,255,0.24)",
    tip: isLight ? "#fff" : "#1a1730",
  };
}
type Look = ReturnType<typeof lookOf>;

const GROUPS: { key: OffenceGroup; label: string; color: string }[] = [
  { key: "violence", label: "Violence", color: "#ef4444" },
  { key: "property", label: "Property", color: "#f59e0b" },
  { key: "corruption", label: "Corruption & fraud", color: "#8b5cf6" },
  { key: "cyber", label: "Computer crime", color: "#06b6d4" },
  { key: "borders", label: "Migrant smuggling", color: "#3b82f6" },
  { key: "environment", label: "Environment", color: "#10b981" },
];
const groupOf = (g: OffenceGroup) => GROUPS.find((x) => x.key === g) ?? GROUPS[0];

// ── Figures ────────────────────────────────────────────────────────────────

const whole = (n: number) => n.toLocaleString("en-US");
const rateText = (v: number) => (v >= 100 ? whole(Math.round(v)) : String(v));
const countText = (c: SmallCount) => (c === "<5" ? "<5" : whole(c));
const nameOf = (id: string) => OFFENCE_PLACES[id] ?? id;

/** The middle value of a list: half the places are above it, half below. */
function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const tidy = (v: number) => (v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100);

/** 1st, 2nd, 3rd, 4th … */
function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

type RateRow = { id: string; name: string; rate: number; year: number; count?: number };
const ratesOf = (key: OffenceKey): RateRow[] =>
  Object.entries(OFFENCE_RATES[key])
    .map(([id, [rate, year, count]]) => ({ id, name: nameOf(id), rate, year, count }))
    .sort((a, b) => b.rate - a.rate);

const PLACE_OPTIONS = Object.entries(OFFENCE_PLACES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** The newest year any place reported an offence for. */
const NEWEST = Math.max(...OFFENCES.flatMap((o) => Object.values(OFFENCE_RATES[o.key]).map((f) => f[1])));

// ── Pieces ─────────────────────────────────────────────────────────────────

function Card({ look, children, className = "" }: { look: Look; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 min-w-0 ${className}`} style={look.card}>
      {children}
    </div>
  );
}

function Head({ look, sub, title, children }: { look: Look; sub: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 mb-3">
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: look.accent }}>
          {sub}
        </p>
        <h3 className="text-base font-bold font-sans" style={{ color: look.head }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Toggle<T extends string>({ look, value, onChange, options, color = "#ef4444", label }: { look: Look; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; color?: string; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg overflow-hidden text-[10px] font-semibold shrink-0" style={{ border: `1px solid ${look.line}` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="px-2.5 py-1 transition-colors"
          style={{ background: value === o.value ? color : "transparent", color: value === o.value ? "#fff" : look.muted }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Note({ look, children }: { look: Look; children: ReactNode }) {
  return (
    <div
      className="mt-3 rounded-xl p-3 flex items-start gap-2"
      style={{
        background: look.isLight ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.1)",
        border: look.isLight ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(99,102,241,0.2)",
      }}
    >
      <Info size={12} weight="fill" style={{ color: "#6366f1", flexShrink: 0, marginTop: 1 }} />
      <p className="text-[10px] font-sans leading-relaxed" style={{ color: look.muted }}>
        {children}
      </p>
    </div>
  );
}

function Legend({ look, items }: { look: Look; items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
      {items.map((l) => (
        <span key={l.label} className="inline-flex items-center gap-1.5 text-[10px] font-sans" style={{ color: look.muted }}>
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

type Seg = { label: string; color: string; value: number };
type StackRow = { id: string; name: string; total: number; year: number; segs: Seg[]; extra?: string; title: string };

/** Places as bars, each bar in the parts the source gives and, in grey, the part it does not. */
function StackList({ look, rows, restLabel, totalHead, extraHead }: { look: Look; rows: StackRow[]; restLabel: string; totalHead: string; extraHead?: string }) {
  const top = Math.max(...rows.map((r) => r.total), 1);
  const cols = extraHead ? "grid-cols-[minmax(0,7.5rem)_1fr_auto_auto] sm:grid-cols-[minmax(0,9rem)_1fr_auto_auto_5.5rem]" : "grid-cols-[minmax(0,7.5rem)_1fr_auto_auto] sm:grid-cols-[minmax(0,9rem)_1fr_auto_auto]";
  return (
    <ul className="flex flex-col gap-2">
      <li aria-hidden className={`grid ${cols} items-center gap-x-2 text-[9px] font-mono uppercase tracking-wider`} style={{ color: look.muted }}>
        <span />
        <span />
        <span className="text-right">{totalHead}</span>
        <span className="text-right">Year</span>
        {extraHead && <span className="hidden sm:block text-right">{extraHead}</span>}
      </li>
      {rows.map((r) => {
        const parts = r.segs.reduce((a, s) => a + s.value, 0);
        // Parts that add to more than the total (two tables of one source) fill the bar between them.
        const of = Math.max(r.total, parts);
        const rest = Math.max(0, r.total - parts);
        return (
          <li key={r.id} className={`grid ${cols} items-center gap-x-2`} title={r.title}>
            <span className="text-[11px] font-sans truncate" style={{ color: look.head }}>
              {r.name}
            </span>
            <span className="h-3 rounded-full overflow-hidden" style={{ background: look.track }}>
              <span className="flex h-full gap-px sm:gap-[2px]" style={{ width: `${Math.max(1.5, (100 * r.total) / top)}%` }}>
                {r.segs.map((s) => (s.value > 0 ? <span key={s.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(100 * s.value) / of}%`, background: s.color }} /> : null))}
                {rest > 0 && <span className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(100 * rest) / of}%`, background: look.rest }} aria-label={restLabel} />}
              </span>
            </span>
            <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: look.head }}>
              {whole(r.total)}
            </span>
            <span className="text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
              {r.year}
            </span>
            {extraHead && (
              <span className="hidden sm:block text-[10px] font-mono text-right tabular-nums truncate" style={{ color: look.muted }}>
                {r.extra ?? "—"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Offences recorded by the police ────────────────────────────────────────

const SHOWN = 15;

function OffenceExplorer({ look }: { look: Look }) {
  const [key, setKey] = useState<OffenceKey>("corruption");
  const [all, setAll] = useState(false);
  const def = OFFENCES.find((o) => o.key === key) ?? OFFENCES[0];
  const group = groupOf(def.group);
  const rows = useMemo(() => ratesOf(key), [key]);
  const shown = all ? rows : rows.slice(0, SHOWN);
  const top = rows[0]?.rate ?? 1;
  const mid = tidy(median(rows.map((r) => r.rate)));

  return (
    <Card look={look} className="lg:col-span-3">
      <Head look={look} sub="Recorded by the police · per 100,000 people" title="Offences by Country" />
      <div className="flex flex-wrap gap-1.5 mb-2">
        {GROUPS.map((g) => {
          const on = g.key === def.group;
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const first = OFFENCES.find((o) => o.group === g.key);
                if (first) setKey(first.key);
                setAll(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
              style={{ border: `1px solid ${on ? g.color : look.line}`, background: on ? g.color : "transparent", color: on ? "#fff" : look.muted }}
            >
              {!on && <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />}
              {g.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {OFFENCES.filter((o) => o.group === def.group).map((o) => {
          const on = o.key === key;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setKey(o.key);
                setAll(false);
              }}
              className="text-[11px] font-sans pb-0.5 transition-colors"
              style={{ color: on ? look.head : look.muted, fontWeight: on ? 700 : 400, borderBottom: `2px solid ${on ? group.color : "transparent"}` }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] font-sans leading-relaxed mb-3" style={{ color: look.muted }}>
        <strong style={{ color: look.head }}>{rows.length} places</strong> reported {def.label.toLowerCase()} to UNODC in the last ten years. Half of them recorded more than{" "}
        <strong style={{ color: look.head }}>{rateText(mid)}</strong> per 100,000 people, half fewer. {all ? "All of them" : `The ${shown.length} highest rates`}, each for its latest year:
      </p>
      <ul className={`flex flex-col gap-1.5 ${all ? "max-h-[26rem] overflow-y-auto pr-1" : ""}`}>
        {shown.map((r, i) => (
          <li
            key={r.id}
            className="grid grid-cols-[1.25rem_minmax(0,8rem)_1fr_auto_auto] sm:grid-cols-[1.25rem_minmax(0,10rem)_1fr_auto_auto_6rem] items-center gap-x-2"
            title={`${r.name}: ${rateText(r.rate)} per 100,000 people in ${r.year}${r.count !== undefined ? ` — ${whole(r.count)} recorded` : ""}`}
          >
            <span className="text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
              {i + 1}
            </span>
            <span className="text-[11px] font-sans truncate" style={{ color: look.head }}>
              {r.name}
            </span>
            <span className="h-2.5 rounded-full overflow-hidden" style={{ background: look.track }}>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(1, (100 * r.rate) / top)}%`, background: group.color }} />
            </span>
            <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: look.head }}>
              {rateText(r.rate)}
            </span>
            <span className="text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
              {r.year}
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
              {r.count !== undefined ? `${whole(r.count)} recorded` : "—"}
            </span>
          </li>
        ))}
      </ul>
      {rows.length > SHOWN && (
        <button type="button" onClick={() => setAll((v) => !v)} className="show-more mt-3 text-[10px] font-semibold underline underline-offset-2 decoration-dotted" style={{ color: look.head }}>
          {all ? `Show the ${SHOWN} highest only` : `Show all ${rows.length} places`}
        </button>
      )}
      <Note look={look}>
        These are offences the police <strong style={{ color: look.head }}>recorded</strong>, counted under UNODC’s category “{def.unodc}”. A high rate can mean more crime, or a force that records more of it and people more willing to report it; countries also
        define offences differently, so these figures compare a country with its own past better than with other countries.
      </Note>
      <SourceLink sources={OFFENCE_SOURCES[def.source]} className="mt-3" />
    </Card>
  );
}

// ── One country, everything it reported ────────────────────────────────────

function CountryRecord({ look }: { look: Look }) {
  const [place, setPlace] = useState(OFFENCE_PLACES.us ? "us" : PLACE_OPTIONS[0].value);
  const lines = useMemo(
    () =>
      OFFENCES.flatMap((o) => {
        const f = OFFENCE_RATES[o.key][place];
        if (!f) return [];
        const all = ratesOf(o.key);
        return [{ def: o, rate: f[0], year: f[1], count: f[2], rank: all.findIndex((r) => r.id === place) + 1, of: all.length }];
      }),
    [place],
  );
  const tip = TRAFFICKING[place];
  const arms = ARMS_SEIZED[place];
  const held = UNSENTENCED[place];
  const others: { label: string; value: string; when: number; note?: string }[] = [];
  if (tip?.victims !== undefined && tip.y !== undefined) others.push({ label: "Trafficking victims detected", value: countText(tip.victims), when: tip.y });
  if (tip?.prosecuted) others.push({ label: "Prosecuted for trafficking in persons", value: countText(tip.prosecuted[0]), when: tip.prosecuted[1] });
  if (tip?.convicted) others.push({ label: "Convicted of trafficking in persons", value: countText(tip.convicted[0]), when: tip.convicted[1] });
  if (arms) others.push({ label: "Firearms seized", value: whole(arms.total), when: arms.y });
  if (held) others.push({ label: "Prisoners held without a sentence", value: `${held[0]}%`, when: held[1] });

  return (
    <Card look={look} className="lg:col-span-2">
      <Head look={look} sub="One place · everything it reported" title="Country Record">
        <StyledSelect value={place} onValueChange={setPlace} ariaLabel="Choose a country" options={PLACE_OPTIONS} triggerClassName="chip-selected px-3 py-1.5 rounded-full font-medium" />
      </Head>
      {lines.length === 0 ? (
        <p className="text-[11px] font-sans" style={{ color: look.muted }}>
          {nameOf(place)} reported none of these {OFFENCES.length} offences to UNODC in the last ten years.
        </p>
      ) : (
        <>
          <p className="text-[10px] font-sans leading-relaxed mb-2" style={{ color: look.muted }}>
            {nameOf(place)} reported <strong style={{ color: look.head }}>{lines.length} of {OFFENCES.length}</strong> offences. Rates are per 100,000 people; the rank is among the places that reported that offence, highest rate first.
          </p>
          <ul className="flex flex-col max-h-[22rem] overflow-y-auto pr-1">
            {lines.map((l) => (
              <li
                key={l.def.key}
                className="grid grid-cols-[0.5rem_1fr_auto_auto] items-baseline gap-x-2 py-1.5"
                style={{ borderBottom: `1px solid ${look.grid}` }}
                title={l.count !== undefined ? `${whole(l.count)} recorded in ${l.year}` : undefined}
              >
                <span className="w-2 h-2 rounded-full self-center" style={{ background: groupOf(l.def.group).color }} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-sans truncate" style={{ color: look.head }}>
                    {l.def.label}
                  </span>
                  <span className="block text-[10px] font-mono" style={{ color: look.muted }}>
                    {ordinal(l.rank)} of {l.of}
                    {l.count !== undefined ? ` · ${whole(l.count)} recorded` : ""}
                  </span>
                </span>
                <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: look.head }}>
                  {rateText(l.rate)}
                </span>
                <span className="text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
                  {l.year}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {others.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {others.map((o) => (
            <li key={o.label} className="rounded-xl px-3 py-2" style={{ background: look.track }}>
              <span className="block text-sm font-bold font-mono" style={{ color: look.head }}>
                {o.value}
              </span>
              <span className="block text-[10px] font-sans leading-snug" style={{ color: look.muted }}>
                {o.label} · {o.when}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Legend look={look} items={GROUPS.map((g) => ({ label: g.label, color: g.color }))} />
      <SourceLink sources={[OFFENCE_SOURCES.violent, OFFENCE_SOURCES.economic, OFFENCE_SOURCES.trafficking, OFFENCE_SOURCES.firearms, OFFENCE_SOURCES.prisons]} className="mt-3" />
    </Card>
  );
}

// ── Trafficking in persons ─────────────────────────────────────────────────

// The four colours of a broken-down bar, in an order whose neighbours stay
// apart for colour-blind readers on both the light and the dark card.
const PARTS = ["#2563eb", "#d97706", "#c026d3", "#0d9488"];
const WHO = [
  { key: "women", label: "Women", color: PARTS[0] },
  { key: "men", label: "Men", color: PARTS[1] },
  { key: "girls", label: "Girls", color: PARTS[2] },
  { key: "boys", label: "Boys", color: PARTS[3] },
] as const;
const PURPOSE = [
  { key: "sexual", label: "Sexual exploitation", color: PARTS[2] },
  { key: "labour", label: "Forced labour", color: PARTS[1] },
] as const;
const TOP = 12;

function Trafficking({ look }: { look: Look }) {
  const [by, setBy] = useState<"who" | "purpose">("who");
  const parts = by === "who" ? WHO : PURPOSE;
  const reporting = Object.values(TRAFFICKING).filter((t) => t.victims !== undefined).length;
  const rows: StackRow[] = useMemo(
    () =>
      Object.entries(TRAFFICKING)
        .flatMap(([id, t]) => (typeof t.victims === "number" && t.y !== undefined ? [{ id, t, victims: t.victims, y: t.y }] : []))
        .sort((a, b) => b.victims - a.victims)
        .slice(0, TOP)
        .map(({ id, t, victims, y }) => {
          const given = parts.flatMap((p) => {
            const v = t[p.key];
            return v === undefined ? [] : [{ label: p.label, color: p.color, value: typeof v === "number" ? v : 0, text: countText(v) }];
          });
          return {
            id,
            name: nameOf(id),
            total: victims,
            year: y,
            segs: given,
            extra: t.convicted ? `${countText(t.convicted[0])} · ${t.convicted[1]}` : undefined,
            title: `${nameOf(id)}, ${y}: ${whole(victims)} victims detected${given.length ? ` — ${given.map((g) => `${g.label.toLowerCase()} ${g.text}`).join(", ")}` : ""}${t.convicted ? `. Convicted: ${countText(t.convicted[0])} (${t.convicted[1]})` : ""}`,
          };
        }),
    [parts],
  );

  return (
    <Card look={look}>
      <Head look={look} sub="Detected victims · latest year reported" title="Trafficking in Persons">
        <Toggle
          look={look}
          label="Break the bars down by"
          value={by}
          onChange={setBy}
          options={[
            { value: "who", label: "Who" },
            { value: "purpose", label: "For what" },
          ]}
        />
      </Head>
      <p className="text-[10px] font-sans leading-relaxed mb-3" style={{ color: look.muted }}>
        The {rows.length} places that detected the most victims, of <strong style={{ color: look.head }}>{reporting}</strong> reporting, with the people each convicted of trafficking and the year of that figure.
      </p>
      <StackList look={look} rows={rows} restLabel="Not broken down" totalHead="Victims" extraHead="Convicted" />
      <Legend look={look} items={[...parts.map((p) => ({ label: p.label, color: p.color })), { label: by === "who" ? "Not given by sex and age" : "Other purposes, or not given", color: look.rest }]} />
      <Note look={look}>
        A <strong style={{ color: look.head }}>detected</strong> victim is one the authorities identified. Countries that look harder find more, so a long bar is not proof of more trafficking, and a short one is not proof of less.
      </Note>
      <SourceLink sources={OFFENCE_SOURCES.trafficking} className="mt-3" />
    </Card>
  );
}

/** The trafficking card on its own: the Crime page draws it in its section on trafficking and modern slavery. */
export function TraffickingByPlace({ isLight }: { isLight: boolean }) {
  return <Trafficking look={lookOf(isLight)} />;
}

// ── Held without a sentence ────────────────────────────────────────────────

const HELD_COLOR = "#f97316";

function Unsentenced({ look }: { look: Look }) {
  const [view, setView] = useState<"highest" | "lowest">("highest");
  const all = useMemo(
    () =>
      Object.entries(UNSENTENCED)
        .map(([id, [pct, year]]) => ({ id, name: nameOf(id), pct, year }))
        .sort((a, b) => b.pct - a.pct),
    [],
  );
  const rows = view === "highest" ? all.slice(0, SHOWN) : all.slice(-SHOWN).reverse();
  const mid = tidy(median(all.map((r) => r.pct)));
  return (
    <Card look={look}>
      <Head look={look} sub="Share of people in prison · latest year reported" title="Held Without a Sentence">
        <Toggle
          look={look}
          label="Which end of the list"
          value={view}
          onChange={setView}
          color={HELD_COLOR}
          options={[
            { value: "highest", label: "Highest" },
            { value: "lowest", label: "Lowest" },
          ]}
        />
      </Head>
      <p className="text-[10px] font-sans leading-relaxed mb-3" style={{ color: look.muted }}>
        People in prison awaiting trial or sentence, as a share of everyone held — the UN’s measure of access to justice (SDG 16.3.2). Of <strong style={{ color: look.head }}>{all.length}</strong> places reporting, half hold more than{" "}
        <strong style={{ color: look.head }}>{mid}%</strong> of their prisoners this way.
      </p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[minmax(0,8rem)_1fr_auto_auto] sm:grid-cols-[minmax(0,10rem)_1fr_auto_auto] items-center gap-x-2" title={`${r.name}: ${r.pct}% of people held were unsentenced in ${r.year}`}>
            <span className="text-[11px] font-sans truncate" style={{ color: look.head }}>
              {r.name}
            </span>
            <span className="h-2.5 rounded-full overflow-hidden" style={{ background: look.track }}>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(1, r.pct)}%`, background: HELD_COLOR }} />
            </span>
            <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: look.head }}>
              {r.pct}%
            </span>
            <span className="text-[10px] font-mono text-right tabular-nums" style={{ color: look.muted }}>
              {r.year}
            </span>
          </li>
        ))}
      </ul>
      <Note look={look}>Each bar runs to 100% of the prison population. Jordan is left out: UNODC’s file gives it more unsentenced prisoners than prisoners.</Note>
      <SourceLink sources={OFFENCE_SOURCES.prisons} className="mt-3" />
    </Card>
  );
}

// ── Wildlife seized ────────────────────────────────────────────────────────

const WILDLIFE_COLOR: Record<string, string> = {
  Ivory: "#f59e0b",
  "Rhino horn": "#ef4444",
  Rosewood: "#b45309",
  "Dried seahorse": "#06b6d4",
  "Live orchid": "#d946ef",
};

function Wildlife({ look }: { look: Look }) {
  const [name, setName] = useState(WILDLIFE_SEIZED[0].group);
  const g = WILDLIFE_SEIZED.find((x) => x.group === name) ?? WILDLIFE_SEIZED[0];
  const color = WILDLIFE_COLOR[g.group] ?? "#10b981";
  const weighed = g.unit !== "Number";
  // Weights are published in kilograms; a thousand of them are written as a tonne.
  const amount = (v: number) => (v === 0 ? "0" : !weighed ? whole(Math.round(v)) : v >= 1000 ? `${whole(Math.round(v / 100) / 10)} t` : `${whole(Math.round(v * 10) / 10)} kg`);
  const top = g.regions[0]?.[1] ?? 1;
  const data = g.world.map(([year, value]) => ({ year: String(year), value }));
  return (
    <Card look={look}>
      <Head look={look} sub={`Seized worldwide · ${weighed ? "weight" : "number of plants"}`} title="Wildlife Seized" />
      <div className="flex flex-wrap gap-1.5 mb-3">
        {WILDLIFE_SEIZED.map((x) => {
          const on = x.group === g.group;
          const c = WILDLIFE_COLOR[x.group] ?? "#10b981";
          return (
            <button
              key={x.group}
              type="button"
              aria-pressed={on}
              onClick={() => setName(x.group)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
              style={{ border: `1px solid ${on ? c : look.line}`, background: on ? c : "transparent", color: on ? "#fff" : look.muted }}
            >
              {!on && <span className="w-2 h-2 rounded-full" style={{ background: c }} />}
              {x.group}
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: look.muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: look.muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => amount(v)} />
          <Tooltip
            contentStyle={{ background: look.tip, border: `1px solid ${look.line}`, borderRadius: 10, fontSize: 11, fontFamily: "monospace", color: look.head }}
            formatter={(v: number) => [amount(v), `${g.group} seized`]}
            cursor={{ fill: look.isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] font-mono uppercase tracking-widest mt-3 mb-2" style={{ color: look.muted }}>
        By region · {g.span.replace("-", "–")} together
      </p>
      <ul className="flex flex-col gap-1.5">
        {g.regions.slice(0, 6).map(([region, value]) => (
          <li key={region} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-x-2" title={`${region}: ${amount(value)} of ${g.group.toLowerCase()} seized, ${g.span}`}>
            <span className="text-[11px] font-sans truncate" style={{ color: look.head }}>
              {region}
            </span>
            <span className="h-2.5 rounded-full overflow-hidden" style={{ background: look.track }}>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(1, (100 * value) / top)}%`, background: color }} />
            </span>
            <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: look.head }}>
              {amount(value)}
            </span>
          </li>
        ))}
      </ul>
      <Note look={look}>
        UNODC’s wildlife seizure figures{weighed ? ", which it gives as a weight (“kilogram equivalent”)" : ""}. They run to {g.world[g.world.length - 1]?.[0]}, the last year in UNODC’s file, and cover the five kinds of wildlife it publishes there.
      </Note>
      <SourceLink sources={OFFENCE_SOURCES.wildlife} className="mt-3" />
    </Card>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

export function RecordedCrime({ isLight }: { isLight: boolean }) {
  const look = lookOf(isLight);
  return (
    <>
      <div
        className="rounded-2xl px-6 py-4 flex flex-wrap items-center gap-3"
        style={{
          background: isLight ? "linear-gradient(130deg, #fef2f2 0%, #eef2ff 100%)" : "linear-gradient(130deg, #2d0a0a 0%, #12102a 100%)",
          border: isLight ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(239,68,68,0.25)",
        }}
      >
        <div className="p-2.5 rounded-xl shrink-0" style={{ background: isLight ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.2)" }}>
          <Gavel size={18} weight="fill" style={{ color: "#ef4444" }} />
        </div>
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: look.accent }}>
            UNODC · crime and criminal justice statistics
          </p>
          <h2 className="text-base font-bold font-sans" style={{ color: look.head }}>
            Offences and Law Violations Around the World
          </h2>
          <p className="text-[11px] font-sans mt-0.5" style={{ color: look.muted }}>
            Corruption, fraud, computer crime, kidnapping, sexual violence, migrant smuggling, environmental offences, human trafficking, firearms and wildlife — as each country reported them to the United Nations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {[
            { v: String(Object.keys(OFFENCE_PLACES).length), l: "Places reporting" },
            { v: String(OFFENCES.length), l: "Offence types" },
            { v: String(NEWEST), l: "Newest year" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl px-3 py-1.5 text-center"
              style={{ background: isLight ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.07)", border: isLight ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.1)" }}
            >
              <p className="text-sm font-bold font-mono" style={{ color: look.head }}>
                {s.v}
              </p>
              <p className="text-[10px] font-sans" style={{ color: look.muted }}>
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <OffenceExplorer look={look} />
        <CountryRecord look={look} />
      </div>
      {/* Trafficking in persons has its own section lower on the page, with modern slavery. The Firearms Seized card
          that stood here was removed as asked; a place's own count of firearms seized is still in its record above. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Unsentenced look={look} />
        <Wildlife look={look} />
      </div>
    </>
  );
}
