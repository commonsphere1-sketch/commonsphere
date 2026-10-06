/**
 * Justice, on the Crime page: the kinds of justice, the legal traditions
 * countries follow and how each tries a case, the steps of a criminal case,
 * and a justice system in figures - the people at each stage of it and the
 * people who staff it.
 *
 * What is explained is explained in a source's words, not the site's: the
 * opening of the Wikipedia article on each kind, tradition and step, fetched
 * when it is shown and linked. What is counted is counted by its publisher:
 *
 *   legal systems     the CIA World Factbook's line for each country, and
 *                     which of four traditions that line names
 *   stages            people arrested, cautioned or suspected; prosecuted;
 *                     brought before the criminal courts; convicted - as each
 *                     country reported them to UNODC, for one year
 *   staff             police, prosecutors, judges and prison staff, UNODC's
 *                     counts, each also per 100,000 people (the one figure
 *                     worked out, in build-justice.cjs)
 *   prisons           the share of prisoners with no sentence (UNODC) and the
 *                     prison population rate (World Prison Brief), which the
 *                     page already held
 *
 * The stages are not a funnel and are not drawn as one: they are counted by
 * different bodies, in ways that differ, and are not one group of people
 * followed through. No stage is divided by another.
 */
import { useMemo, useState } from "react";
import { countriesData } from "../data/countriesData";
import { OFFENCE_SOURCES, UNSENTENCED } from "../data/crimeOffences";
import { JUSTICE_ARTICLES, JUSTICE_PROCESS, JUSTICE_SOURCES, JUSTICE_STAFF, LEGAL_SYSTEMS, TRADITIONS, type ArticleGroup, type StaffKind, type Stage, type Tradition } from "../data/justice";
import { PRISON_RATES, PRISON_RATES_SOURCE } from "../data/prisonRates";
import { ACCENT, Pick, RankCard, SectionHead, type Look, type Ranked } from "./CrimeParts";
import { ArticleLead } from "./HistoryPanel";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const PLACE = new Map(countriesData.map((c) => [c.id, c]));
const whole = (n: number) => Math.round(n).toLocaleString("en-US");
const articles = (group: ArticleGroup) => JUSTICE_ARTICLES.filter((a) => a.group === group).map((a) => ({ id: a.id, label: a.label }));
const articleOf = (id: string) => JUSTICE_ARTICLES.find((a) => a.id === id)!;

const BRANCHES = articles("branch");
const IDEAS = articles("idea");
const STEPS = articles("step");

/** Every country with a legal-system line, by name. */
const LEGAL = Object.entries(LEGAL_SYSTEMS)
  .flatMap(([id, l]) => {
    const p = PLACE.get(id);
    return p ? [{ id, name: p.name, ...l }] : [];
  })
  .sort((a, b) => a.name.localeCompare(b.name));
const BY_TRADITION = TRADITIONS.map((t) => {
  const all = LEGAL.filter((l) => l.traditions.includes(t.id));
  return { ...t, all, alone: all.filter((l) => l.traditions.length === 1), mixed: all.filter((l) => l.traditions.length > 1) };
});
const UNPLACED = LEGAL.filter((l) => !l.traditions.length);
const TRADITION_NAME = Object.fromEntries(TRADITIONS.map((t) => [t.id, t.name])) as Record<Tradition, string>;
/** The lines naming religious law that name Islamic law. */
const ISLAMIC = BY_TRADITION.find((t) => t.id === "religious")!.all.filter((l) => /islamic|sharia|shari['’]a|muslim/i.test(l.text.split(";")[0])).length;

/** The article on how a case is tried under a tradition, where Wikipedia's own opening ties the two. */
const TRIAL: Partial<Record<Tradition, string>> = { civil: "inquisitorial", common: "adversarial", religious: "sharia" };

const STAGES: { id: Stage; label: string }[] = [
  { id: "suspected", label: "Arrested, cautioned or suspected" },
  { id: "prosecuted", label: "Prosecuted" },
  { id: "courts", label: "Brought before the criminal courts" },
  { id: "convicted", label: "Convicted" },
];
const STAFF: { id: StaffKind; label: string }[] = [
  { id: "police", label: "Police" },
  { id: "prosecutors", label: "Prosecutors" },
  { id: "judges", label: "Judges and magistrates" },
  { id: "prisonStaff", label: "Prison staff" },
];
const rate = (v: number) => (v >= 100 ? whole(v) : v >= 10 ? v.toFixed(1) : String(v));

/** Each kind of staff per 100,000 people across the places reporting it: the middle one, and how many report. */
const MEDIAN = Object.fromEntries(
  STAFF.map((s) => {
    const vs = Object.values(JUSTICE_STAFF)
      .map((x) => x[s.id]?.[2])
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);
    const mid = vs.length % 2 ? vs[(vs.length - 1) / 2] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2;
    return [s.id, { places: vs.length, value: mid }];
  }),
) as Record<StaffKind, { places: number; value: number }>;

const ranked = (kind: StaffKind): Ranked[] =>
  Object.entries(JUSTICE_STAFF).flatMap(([id, s]) => {
    const f = s[kind];
    const p = PLACE.get(id);
    return f && f[2] !== null && p ? [{ id, name: p.name, population: p.population, value: f[2], text: rate(f[2]), sub: `${whole(f[0])} in ${f[1]}` }] : [];
  });
const JUDGES = ranked("judges");
const POLICE = ranked("police");

/** The countries the figures card can show: every one with a legal line, stages or staff. */
const COUNTRIES = [...new Set([...LEGAL.map((l) => l.id), ...Object.keys(JUSTICE_PROCESS), ...Object.keys(JUSTICE_STAFF)])]
  .flatMap((id) => {
    const p = PLACE.get(id);
    return p ? [{ value: id, label: p.name, population: p.population }] : [];
  })
  .sort((a, b) => a.label.localeCompare(b.label));
/** Where the card opens: the most populous country that reported all four stages and its judges. */
const FIRST =
  [...COUNTRIES].sort((a, b) => b.population - a.population).find((c) => STAGES.every((s) => JUSTICE_PROCESS[c.value]?.[s.id] != null) && JUSTICE_STAFF[c.value]?.judges)?.value ?? COUNTRIES[0].value;

function Card({ look, title, kicker, children }: { look: Look; title: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 min-w-0" style={look.card}>
      <div>
        <h3 className="text-[13px] font-bold font-sans leading-snug" style={{ color: look.head }}>
          {title}
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest mt-1 leading-snug" style={{ color: look.muted }}>
          {kicker}
        </p>
      </div>
      {children}
    </div>
  );
}

const Row = ({ look, label, children }: { look: Look; label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <span className="text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ color: look.muted }}>
      {label}
    </span>
    {children}
  </div>
);

/** An article's opening, in Wikipedia's words, under what it is here to explain. */
function Lead({ id }: { id: string }) {
  const a = articleOf(id);
  return <ArticleLead key={a.title} title={a.title} name={a.label.toLowerCase()} />;
}

// ── The kinds of justice ────────────────────────────────────────────────────

function Kinds({ look }: { look: Look }) {
  const [kind, setKind] = useState("criminal");
  return (
    <Card look={look} title="The kinds of justice" kicker="The branches of a justice system, and the ideas of what justice is for · each in Wikipedia's words">
      <Row look={look} label="Branches">
        <Pick look={look} value={kind} onChange={setKind} options={BRANCHES} label="The branches of a justice system" />
      </Row>
      <Row look={look} label="Ideas">
        <Pick look={look} value={kind} onChange={setKind} options={IDEAS} label="The ideas of what justice is for" />
      </Row>
      <Lead id={kind} />
    </Card>
  );
}

// ── The legal traditions ────────────────────────────────────────────────────

function Names({ look, title, list }: { look: Look; title: string; list: typeof LEGAL }) {
  if (!list.length) return null;
  return (
    <details className="group">
      <summary className="text-[11px] font-sans font-semibold cursor-pointer hover:opacity-80" style={{ color: look.head }}>
        {title}
      </summary>
      <ul className="mt-2 grid gap-x-4 gap-y-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))" }}>
        {list.map((l) => (
          <li key={l.id} className="min-w-0">
            <p className="text-[11px] font-sans font-semibold leading-snug" style={{ color: look.head }}>
              {l.name}
            </p>
            <p className="text-[10px] font-sans leading-snug" style={{ color: look.muted }}>
              {l.text}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Traditions({ look }: { look: Look }) {
  const [id, setId] = useState<Tradition>("civil");
  const t = BY_TRADITION.find((x) => x.id === id)!;
  const trial = TRIAL[id];
  return (
    <Card look={look} title="The legal traditions, and how each tries a case" kicker={`The traditions each country's legal system draws on · ${LEGAL.length} countries · CIA World Factbook, final edition`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex flex-col gap-3 min-w-0">
          <ChartTitle>Countries whose legal system names each tradition · of {LEGAL.length}</ChartTitle>
          <MeasureBars
            max={LEGAL.length}
            color={ACCENT}
            label={`Countries whose legal system names each tradition, of ${LEGAL.length}`}
            rows={BY_TRADITION.map((x) => ({ key: x.id, label: x.name, value: x.all.length, text: `${x.all.length}`, sub: `${x.alone.length} alone, ${x.mixed.length} mixed with another` }))}
          />
          <ChartNote>
            A tradition is read off the Factbook's own line for the country, before its first semicolon: one that names several is a mixed system and is counted under
            each, so the four come to more than {LEGAL.length}. Each bar is on the scale of all {LEGAL.length}. {UNPLACED.length} lines name none of the four - most
            are territories where another country's laws apply - and are listed below as written.
          </ChartNote>
        </div>
        <div className="flex flex-col gap-3 min-w-0">
          <Row look={look} label="Tradition">
            <Pick look={look} value={id} onChange={setId} options={TRADITIONS.map((x) => ({ id: x.id, label: x.name }))} label="Which legal tradition" />
          </Row>
          <Lead id={`${id}-tradition`} />
        </div>
      </div>

      {trial && (
        <div className="pt-3" style={{ borderTop: `1px solid ${look.grid}` }}>
          <ChartTitle>
            {trial === "sharia" ? `Sharia · the religious law ${ISLAMIC} of the ${t.all.length} lines name` : `How a case is tried · ${articleOf(trial).label.toLowerCase()}`}
          </ChartTitle>
          <Lead id={trial} />
        </div>
      )}

      <div className="pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${look.grid}` }}>
        <Names look={look} title={`The ${t.alone.length} countries whose line names ${t.name.toLowerCase()} alone`} list={t.alone} />
        <Names look={look} title={`The ${t.mixed.length} that mix it with another tradition`} list={t.mixed} />
        <Names look={look} title={`The ${UNPLACED.length} lines that name none of the four`} list={UNPLACED} />
      </div>
      <SourceLink sources={[JUSTICE_SOURCES.legal]} />
    </Card>
  );
}

// ── The steps of a criminal case ────────────────────────────────────────────

function Steps({ look }: { look: Look }) {
  const [step, setStep] = useState(STEPS[0].id);
  return (
    <Card look={look} title="The steps of a criminal case" kicker="From an investigation to an appeal, in the order a case runs · each in Wikipedia's words">
      <Pick look={look} value={step} onChange={setStep} options={STEPS.map((s, i) => ({ id: s.id, label: `${i + 1} · ${s.label}` }))} label="The steps of a criminal case" />
      <Lead id={step} />
      <ChartNote>
        The opening of Wikipedia's article on each step. Not every system has every step, or gives it this name: the articles say where each is used. The figures below
        count the people at four points along the way, country by country.
      </ChartNote>
    </Card>
  );
}

// ── A justice system in figures ─────────────────────────────────────────────

function Figures({ look }: { look: Look }) {
  const [id, setId] = useState(FIRST);
  const place = PLACE.get(id)!;
  const legal = LEGAL_SYSTEMS[id];
  const stages = JUSTICE_PROCESS[id];
  const staff = JUSTICE_STAFF[id];
  const unsentenced = UNSENTENCED[id];
  const prison = PRISON_RATES[id];
  const top = stages ? Math.max(...STAGES.map((s) => stages[s.id] ?? 0)) : 0;
  const options = useMemo(() => COUNTRIES.map(({ value, label }) => ({ value, label })), []);

  return (
    <Card look={look} title="A justice system in figures" kicker={`Its legal system, the people at each stage of it and the people who staff it · ${COUNTRIES.length} countries · Factbook, UNODC, World Prison Brief`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: look.muted }}>
          Country
        </span>
        <StyledSelect value={id} onValueChange={setId} options={options} ariaLabel="Which country's justice system" triggerClassName="!text-[13px] font-semibold !text-foreground" />
      </div>

      <div className="modal-tile rounded-xl p-4">
        <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: look.muted }}>
          Legal system · {legal?.traditions.length ? legal.traditions.map((x) => TRADITION_NAME[x]).join(" + ") : "as the Factbook words it"}
        </p>
        <p className="text-[12px] font-sans leading-relaxed mt-1" style={{ color: look.head }}>
          {legal ? legal.text : `The Factbook gives no legal-system line that the site could match to ${place.name}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
        <div className="min-w-0">
          <ChartTitle>People at each stage{stages ? ` · ${stages.y}` : ""} · UNODC</ChartTitle>
          {stages ? (
            <MeasureBars
              max={top}
              color={ACCENT}
              label={`People at each stage of ${place.name}'s criminal justice system, ${stages.y}`}
              rows={STAGES.map((s) => (stages[s.id] != null ? { key: s.id, label: s.label, value: stages[s.id], text: whole(stages[s.id]!) } : { key: s.id, label: s.label, text: "Not reported" }))}
            />
          ) : (
            <p className="text-[11px] font-sans leading-relaxed" style={{ color: look.muted }}>
              {place.name} has not reported two or more of the four stages to UNODC for any one of the last ten years.
            </p>
          )}
          <div className="mt-3">
            <FigureRow label="Held in prison with no sentence yet" value={unsentenced ? `${unsentenced[0]}% of prisoners` : "Not reported"} sub={unsentenced ? `${unsentenced[1]} · UNODC` : undefined} />
            <FigureRow label="Prison population" value={prison ? `${prison.approx ? "c. " : ""}${whole(prison.v)} per 100,000 people` : "Not published"} sub={prison ? `${prison.at} · World Prison Brief` : undefined} />
          </div>
        </div>
        <div className="min-w-0">
          <ChartTitle>The people who staff it · per 100,000 people · UNODC</ChartTitle>
          {staff ? (
            <MeasureBars
              color={ACCENT}
              label={`The people who staff ${place.name}'s criminal justice system, per 100,000 people`}
              rows={STAFF.map((s) => {
                const f = staff[s.id];
                if (!f) return { key: s.id, label: s.label, text: "Not reported" };
                const women = f[3] !== null ? ` · ${((100 * f[3]) / f[0]).toFixed(1)}% women` : "";
                return { key: s.id, label: s.label, value: f[2] ?? undefined, text: f[2] !== null ? rate(f[2]) : whole(f[0]), sub: `${f[2] !== null ? `${whole(f[0])} in ` : ""}${f[1]}${women}` };
              })}
            />
          ) : (
            <p className="text-[11px] font-sans leading-relaxed" style={{ color: look.muted }}>
              {place.name} has not reported its police, prosecutors, judges or prison staff to UNODC in the last ten years.
            </p>
          )}
          <p className="text-[10px] font-mono leading-relaxed mt-3" style={{ color: look.muted }}>
            The middle of the places reporting each: {STAFF.map((s) => `${s.label.toLowerCase()} ${rate(+MEDIAN[s.id].value.toFixed(1))} (of ${MEDIAN[s.id].places})`).join(" · ")} per 100,000.
          </p>
        </div>
      </div>

      <ChartNote>
        Counts as the country reported them to the UN Crime Trends Survey. The stages are counted by different bodies - police, prosecutors, courts - which may not
        cover the same territory or count in the same way, and they are the people at each stage in one year, not one group followed through: a later stage can be
        larger than an earlier one, and none is divided by another here. Each bar is on the scale of the country's own largest figure. A count per 100,000 people
        is UNODC's count over the World Bank's population for the same year, worked out by the site; the share of women is from two of UNODC's counts.
      </ChartNote>
      <SourceLink sources={[JUSTICE_SOURCES.legal, JUSTICE_SOURCES.unodc, OFFENCE_SOURCES.prisons, PRISON_RATES_SOURCE, JUSTICE_SOURCES.population]} />
    </Card>
  );
}

// ── The section ─────────────────────────────────────────────────────────────

export function JusticeSection({ look }: { look: Look }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="crime-justice">
      <div id="crime-justice">
        <SectionHead
          look={look}
          title="Justice"
          kicker="The kinds of justice, the legal traditions countries follow and how each tries a case, the steps of a criminal case, and a justice system in figures"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Kinds look={look} />
        <Steps look={look} />
      </div>
      <Traditions look={look} />
      <Figures look={look} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <RankCard
          look={look}
          title="Judges and magistrates by country"
          unit="Professional judges and magistrates per 100,000 people · UNODC"
          rows={JUDGES}
          note="Each is UNODC's count for the latest year the country reported, given beside it, over the World Bank's population for that year. Countries differ in who counts as a judge - lay and part-time judges are in some counts and not others."
          source={[JUSTICE_SOURCES.unodc, JUSTICE_SOURCES.population]}
        />
        <RankCard
          look={look}
          title="Police by country"
          unit="Police personnel per 100,000 people · UNODC"
          rows={POLICE}
          note="Each is UNODC's count for the latest year the country reported, given beside it, over the World Bank's population for that year. Countries differ in which forces they count - gendarmeries, border and municipal police are in some counts and not others."
          source={[JUSTICE_SOURCES.unodc, JUSTICE_SOURCES.population]}
        />
      </div>
    </section>
  );
}
