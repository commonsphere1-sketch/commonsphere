/**
 * The Climate page's four cards on the state of the living world
 * (data/earthStatus.ts): its fresh water, its forests, its wildfires and its
 * wildlife, each from the newest figures an open source publishes.
 *
 * They stand where the cards of tipping points, treaties and flashpoints
 * stood. Every figure carries its year and whose it is; a change between two
 * years and a share are worked out from the source's own figures and say so.
 * Tree cover loss is said not to be deforestation. Of wildlife, the page
 * gives what it may: the two measures most often quoted for it as a whole
 * are under terms the site cannot use, and the card says that rather than
 * put a figure in their place.
 */
import type { ReactNode } from "react";
import { CORAL_REEFS, EARTH_STATUS_RETRIEVED, EARTH_STATUS_SOURCES as SRC, FORESTS, FRESH_WATER, WILDFIRE } from "../data/earthStatus";
import { regionName } from "../lib/regionName";
import { SourceLink } from "./SourceLink";
import { SLIM_TRACK, slimFill } from "./SlimBars";

const WATER = "#0ea5e9";
const FOREST = "#16a34a";
const LOSS = "#ea580c";
const FIRE = "#e11d48";
const REEF = "#f59e0b";
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/** A large count in millions, to one place: hectares and square kilometres. */
const millions = (v: number) => `${(v / 1e6).toFixed(1)} million`;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${whole(Math.abs(v))}`;
const pctChange = (from: number, to: number) => `${to >= from ? "+" : "−"}${Math.abs(((to - from) / from) * 100).toFixed(0)}%`;

function Card({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col min-w-0">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{kicker}</p>
        <p className="text-[10px] font-mono text-muted-foreground">read {EARTH_STATUS_RETRIEVED}</p>
      </div>
      <h3 className="text-sm font-bold font-sans text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Tiles({ tiles }: { tiles: { value: string; label: string; color?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl px-3 py-2.5 border border-border/60 bg-background/40">
          <p className="text-[15px] font-bold font-mono leading-tight" style={{ color: t.color ?? "var(--color-foreground)" }}>
            {t.value}
          </p>
          <p className="text-[10px] font-sans leading-tight mt-0.5 text-muted-foreground">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
const Sub = ({ children }: { children: ReactNode }) => <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mt-4 mb-1.5">{children}</p>;
const Note = ({ children }: { children: ReactNode }) => <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">{children}</p>;
/** Rows of a figure each with a bar on one scale, whose far end is `max`. */
function Bars({ rows, max, color }: { rows: { key: string; label: string; value: number; text: string }[]; max: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-sans text-foreground w-32 shrink-0 truncate" title={r.label}>
            {r.label}
          </span>
          <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: SLIM_TRACK }} aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${Math.max(1, Math.min(100, (r.value / max) * 100))}%`, background: slimFill(color) }} />
          </span>
          <span className="text-[11px] font-mono font-bold text-foreground w-24 text-right shrink-0">{r.text}</span>
        </div>
      ))}
    </div>
  );
}
/** A column a year, each from zero: the first and the last year named under them. */
function Columns({ years, color, label, unit }: { years: [number, number][]; color: string; label: string; unit: (v: number) => string }) {
  const max = Math.max(...years.map(([, v]) => v));
  return (
    <div role="img" aria-label={`${label}: ${years.map(([y, v]) => `${y} ${unit(v)}`).join(", ")}.`}>
      {/* Slim columns, as the site's charts have them: each year a rounded column on a faint track, filled upward in a gradient of its colour. */}
      <div className="flex items-end gap-1 h-20">
        {years.map(([y, v]) => (
          <span key={y} className="flex-1 min-w-0 h-full flex justify-center" title={`${y}: ${unit(v)}`}>
            <span className="relative w-full max-w-[14px] h-full rounded-full" style={{ background: SLIM_TRACK }}>
              <span className="absolute inset-x-0 bottom-0 rounded-full" style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: slimFill(color, true) }} />
            </span>
          </span>
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
        <span>{years[0][0]}</span>
        <span>the tallest: {unit(max)}</span>
        <span>{years[years.length - 1][0]}</span>
      </div>
    </div>
  );
}

function Water() {
  const w = FRESH_WATER;
  const top = w.stress.top;
  return (
    <Card kicker="Fresh water" title="The world's fresh water, and who is running short of it">
      <Tiles
        tiles={[
          { value: `${whole(w.perHead.latest[1])} m³`, label: `of renewable fresh water for each person, ${w.perHead.latest[0]} · ${whole(w.perHead.first[1])} m³ in ${w.perHead.first[0]}, ${pctChange(w.perHead.first[1], w.perHead.latest[1])}, worked out here`, color: WATER },
          { value: `${w.withdrawn.v}%`, label: `of the world's internal fresh water withdrawn, ${w.withdrawn.y}` },
          { value: `${w.stress.over100} of ${w.stress.countries}`, label: `countries withdraw more fresh water than is renewed, ${w.stress.year} · ${w.stress.over25} withdraw more than a quarter · counted here`, color: LOSS },
          { value: `${w.drinking.latest[1]}%`, label: `of people use safely managed drinking water, ${w.drinking.latest[0]} · ${w.drinking.first[1]}% in ${w.drinking.first[0]}` },
        ]}
      />
      <Sub>Fresh water for each person · m³ a year</Sub>
      <Bars max={w.perHead.steps[0][1]} color={WATER} rows={w.perHead.steps.map(([y, v]) => ({ key: String(y), label: String(y), value: v, text: `${whole(v)} m³` }))} />
      <Sub>
        The highest water stress · withdrawals as % of the fresh water available · {w.stress.year}
      </Sub>
      <Bars max={100} color={LOSS} rows={top.map(([code, name, v]) => ({ key: code, label: regionName(code, name), value: v, text: `${whole(v)}%` }))} />
      <Note>
        The first bars run from zero to {whole(w.perHead.steps[0][1])} m³: the water has not gone, the people sharing it have grown in number. The second run to 100%: a full bar is a country withdrawing all the fresh water that is renewed there,
        or more than that - from desalination, from water that came in across a border, or from ground water that is not being replaced.
      </Note>
      <SourceLink sources={[SRC.water]} className="mt-2" />
    </Card>
  );
}

function Forests() {
  const f = FORESTS;
  const change = f.area.latest[1] - f.area.before[1];
  const loss = f.treeLoss.years;
  const lossNow = loss[loss.length - 1];
  const most = Math.abs(f.lost[0][2]);
  return (
    <Card kicker="Deforestation" title="The world's forest, and where it is being lost">
      <Tiles
        tiles={[
          { value: `${millions(f.area.latest[1])} km²`, label: `of forest, ${f.share.latest[1]}% of the land, ${f.area.latest[0]} · ${f.share.first[1]}% in ${f.share.first[0]}`, color: FOREST },
          { value: `${signed(change)} km²`, label: `net change in forest, ${f.area.before[0]} to ${f.area.latest[0]} · worked out here from the two years`, color: change < 0 ? LOSS : FOREST },
          { value: `${millions(lossNow[1])} ha`, label: `of tree cover lost in ${lossNow[0]}, from every cause` },
          { value: String(f.treeLoss.most[0]), label: `the year of the most tree cover lost since ${loss[0][0]}: ${millions(f.treeLoss.most[1])} ha` },
        ]}
      />
      <Sub>Tree cover lost each year · hectares</Sub>
      <Columns years={loss} color={LOSS} label="Tree cover lost each year in the world" unit={(v) => `${millions(v)} ha`} />
      <Sub>
        Where forest shrank the most · km², {f.area.before[0]} to {f.area.latest[0]} · worked out here
      </Sub>
      <Bars max={most} color={LOSS} rows={f.lost.map(([code, name, v]) => ({ key: code, label: regionName(code, name), value: Math.abs(v), text: `${signed(v)}` }))} />
      <Sub>Where it grew the most · km², the same years</Sub>
      <Bars max={most} color={FOREST} rows={f.gained.map(([code, name, v]) => ({ key: code, label: regionName(code, name), value: v, text: `${signed(v)}` }))} />
      <Note>
        Both sets of bars run from zero to {whole(most)} km², the largest loss, so a gain can be read against it. Forest area is the FAO's count of land that is forest; its change is net, new forest set against forest cleared. Tree cover loss is
        a different measure, from satellites: every stand of trees lost in the year - to fire, to logging in forests that will be replanted and to storms as well as to clearing for good - so it is not deforestation, and is larger.
      </Note>
      <SourceLink sources={[SRC.forest, SRC.treeLoss]} className="mt-2" />
    </Card>
  );
}

function Fire() {
  const w = WILDFIRE;
  const now = w.years[w.years.length - 1];
  return (
    <Card kicker="Wildfire" title="The land that burns each year">
      <Tiles
        tiles={[
          { value: `${millions(now[1])} ha`, label: `burnt in ${now[0]}, the newest whole year`, color: FIRE },
          { value: String(w.most[0]), label: `the year of the most since ${w.years[0][0]}: ${millions(w.most[1])} ha` },
          ...(w.toDate ? [{ value: `${millions(w.toDate[1])} ha`, label: `burnt in ${w.toDate[0]} so far: the year is not over, and this is not set beside the whole years` }] : []),
          { value: regionName(w.top[0][0], w.top[0][1]), label: `burnt the most in ${w.year}: ${millions(w.top[0][2])} ha` },
        ]}
      />
      <Sub>Area burnt each year · hectares</Sub>
      <Columns years={w.years} color={FIRE} label="Area burnt by wildfires each year in the world" unit={(v) => `${millions(v)} ha`} />
      <Sub>
        Where the most burnt · hectares · {w.year}
      </Sub>
      <Bars max={w.top[0][2]} color={FIRE} rows={w.top.map(([code, name, v]) => ({ key: code, label: regionName(code, name), value: v, text: millions(v) }))} />
      <Note>
        The bars run from zero to the largest. The area is what satellites see burnt, of every kind of land: most of it is grassland and savanna that burns in most years, not forest, so the area alone does not say how much was lost.
      </Note>
      <SourceLink sources={[SRC.fire]} className="mt-2" />
    </Card>
  );
}

function Wildlife() {
  const r = CORAL_REEFS;
  return (
    <Card kicker="Wildlife" title="The world's coral reefs, in the bleaching event now going on">
      <Tiles
        tiles={[
          { value: `${r.share}%`, label: `of the world's coral reef area under bleaching-level heat, ${r.from} to ${r.to}`, color: REEF },
          { value: `${r.places}`, label: "countries and territories, at least, where mass bleaching has been recorded" },
        ]}
      />
      <Sub>The share of reef area under bleaching-level heat · % · this event and the one before</Sub>
      <Bars
        max={100}
        color={REEF}
        rows={[
          { key: "now", label: "The fourth event", value: r.share, text: `${r.share}%` },
          { key: "before", label: `The third, ${r.before.from}–${r.before.to}`, value: r.before.share, text: `${r.before.share}%` },
        ]}
      />
      <Note>
        The bars run to 100%, the whole of the world's reef area. This is NOAA's own account of the fourth global bleaching event, the largest on record. Of wildlife as a whole, the two measures most often quoted are not shown: the IUCN Red
        List's terms do not allow a site that takes payment to republish it, and the terms of the Living Planet Index could not be confirmed. No figure is put in their place; the species newly named and those endangered are listed further down
        this page, each from its own source.
      </Note>
      <SourceLink sources={[SRC.reefs]} className="mt-2" />
    </Card>
  );
}

export default function EarthStatus() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Water />
      <Forests />
      <Fire />
      <Wildlife />
    </div>
  );
}
