/**
 * A country's people, in every place's window (data/countryPeople.ts), set
 * out by what each part is for:
 *
 *   who its people are        their ages, the peoples they are, and where
 *                             in the country they live;
 *   what they speak and       its languages and its religions;
 *     believe
 *   how its income is shared  the share that goes to each fifth of its
 *                             people, to the richest and poorest tenth, and
 *                             its Gini index;
 *   how many are poor         below the international line, below its own,
 *                             and by the World Bank's wider measure.
 *
 * The first two are the CIA World Factbook's, as its final edition wrote
 * them, each with the year it gives; the last two are the World Bank's. In
 * a country's own window they are the country's. In the window of a place
 * in it - a state, a district, a town, a city - they are given as the
 * country's and say so: nobody publishes them place by place on one footing.
 *
 * Shares that make a whole are a ring; shares that do not - people who gave
 * two languages - are bars, each on 0 to 100; a line the Factbook wrote as a
 * sentence is given as its sentence. What is worked out here says so. A part
 * with nothing held is left out, and a panel with nothing is not drawn.
 */
import type { ReactNode } from "react";
import { COUNTRY_INDEXES, INDEX_DEFS } from "../data/countryIndexes";
import { COUNTRY_PEOPLE, COUNTRY_PEOPLE_SOURCES as SRC, POVERTY_LINE, type Shares } from "../data/countryPeople";
import { inSentence } from "./CountryQuality";
import { ChartNote, ChartTitle, FigureTile, MeasureBars, PartsBar, PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

/** A part of the panel. "people" is its ages and its peoples together, "belief" its languages and its religions. */
export type PeoplePart = "ages" | "peoples" | "languages" | "religions" | "income" | "poverty" | "people" | "belief";
type Source = { label: string; url: string };
const ALL: PeoplePart[] = ["people", "belief", "income", "poverty"];
const FIFTHS = ["Poorest fifth", "Second fifth", "Middle fifth", "Fourth fifth", "Richest fifth"];
/** From the poorest fifth to the richest: one hue, deepening. */
const FIFTH_COLORS = ["#fde68a", "#fcd34d", "#f59e0b", "#d97706", "#92400e"];
const pct = (v: number, under?: 1) => `${under ? "<" : ""}${v}%`;

/** One line of the Factbook's - languages, religions, peoples - as a ring, as bars, or as its own sentence. */
function Line({ title, what, s }: { title: string; /** What the shares are of, for a screen reader: "The religions of France". */ what: string; s: Shares }) {
  const when = s.year ? ` · ${s.year}` : "";
  return (
    <div className="modal-tile rounded-lg p-4 min-w-0">
      <ChartTitle>
        {title}
        {s.parts ? " · % of its people" : ""}
        {when}
      </ChartTitle>
      {s.parts ? (
        s.whole ? (
          <PartsDonut label={`${what}${s.year ? `, ${s.year}` : ""}`} parts={s.parts.map(([name, v, under]) => ({ label: name, value: v, text: pct(v, under) }))} />
        ) : (
          <MeasureBars max={100} label={what} rows={s.parts.map(([name, v, under]) => ({ label: name, value: v, text: pct(v, under) }))} />
        )
      ) : (
        <p className="text-[11px] font-sans text-foreground leading-snug">{s.text}</p>
      )}
      {(s.note || (s.parts && !s.whole) || (s.parts && !s.year)) && (
        <ChartNote className="mt-2">
          {s.parts && !s.whole ? "The shares do not make a whole, so they are bars, each on 0 to 100, and not a ring. " : ""}
          {s.parts && !s.year ? "The Factbook gives no year for them. " : ""}
          {s.note ? `The Factbook's note: ${s.note}.` : ""}
        </ChartNote>
      )}
    </div>
  );
}
const Sub = ({ children }: { children: ReactNode }) => <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mt-3 mb-1.5">{children}</p>;

export default function PeoplePanel({
  code,
  country,
  place,
  parts = ALL,
  className = "",
}: {
  /** The country's ISO 3166-1 code. */
  code: string;
  country: string;
  /** The place whose window this is, where it is not the country itself. */
  place?: string;
  /** Which of its four parts are shown: all of them, unless the window gives some elsewhere. */
  parts?: PeoplePart[];
  className?: string;
}) {
  const p = COUNTRY_PEOPLE[code];
  const idx = COUNTRY_INDEXES[code] ?? {};
  const land = inSentence(country);
  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.url, s);
  const want = new Set(parts.flatMap((k): PeoplePart[] => (k === "people" ? ["ages", "peoples"] : k === "belief" ? ["languages", "religions"] : [k])));
  const has = (k: PeoplePart) => want.has(k);
  const ages = has("ages") ? p?.ages : undefined;
  const ethnic = has("peoples") ? p?.ethnic : undefined;
  const where = has("peoples") || has("ages") ? p?.where : undefined;
  const spoken = has("languages") ? p?.languages : undefined;
  const faith = has("religions") ? p?.religions : undefined;

  const people = Boolean(ages || ethnic);
  const belief = Boolean(spoken || faith);
  const gini = idx.gini;
  const income = has("income") && (p?.income || gini);
  const mpm = idx.mpm;
  const poverty = has("poverty") && (p?.poor || p?.poorOwn || mpm);
  if (!people && !belief && !income && !poverty) return null;
  if (people || belief) cite(SRC.factbook);
  if (has("income") && p?.income) cite(SRC.income);
  if (has("poverty") && (p?.poor || p?.poorOwn)) cite(SRC.poverty);
  const indexSource = (id: string) => INDEX_DEFS.find((d) => d.id === id)?.source;
  if (has("income") && gini && indexSource("gini")) cite(indexSource("gini")!);
  if (has("poverty") && mpm && indexSource("mpm")) cite(indexSource("mpm")!);
  const five = p?.income?.fifths;
  const times = five && five[0] > 0 ? Math.round((five[4] / five[0]) * 10) / 10 : null;
  // The head names what the panel holds: its people, or only how its income is shared and how many are poor.
  const title = (people || belief) && (income || poverty) ? "People, income and poverty" : people || belief ? "People and society" : "Income and poverty";

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
          👥 {title}
          {place ? ` · ${country}` : ""}
        </h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {place && (
        <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
          These are {land}'s, not {place}'s own: nobody publishes a country's languages, beliefs, ages, incomes and poverty on one footing for every place inside it.
        </p>
      )}

      {people && (
        <>
          <Sub>Who its people are</Sub>
          <div className="chart-fill">
            {ages && (
              <div className="modal-tile rounded-lg p-4 min-w-0">
                <ChartTitle>
                  Its people by age · % of its people{ages.year ? ` · ${ages.year}` : ""}
                </ChartTitle>
                <PartsBar label={`The people of ${country} by age${ages.year ? `, ${ages.year}` : ""}`} columns={3} parts={ages.bands.map(([band, v]) => ({ label: band, value: v, text: `${v}%` }))} />
                {where && (
                  <ChartNote className="mt-3">
                    <span className="font-semibold text-foreground">Where they live:</span> {where}.
                  </ChartNote>
                )}
              </div>
            )}
            {ethnic && <Line title="The peoples it is made of" what={`The ethnic groups of ${country}`} s={ethnic} />}
          </div>
          {/* Where its ages are given elsewhere in the window, where its people live is said under its peoples. */}
          {!ages && where && (
            <ChartNote className="mt-2">
              <span className="font-semibold text-foreground">Where they live:</span> {where}.
            </ChartNote>
          )}
        </>
      )}

      {belief && (
        <>
          <Sub>What they speak and believe</Sub>
          <div className="chart-fill">
            {spoken && <Line title="Languages spoken" what={`The languages of ${country}`} s={spoken} />}
            {faith && <Line title="Religion and belief" what={`The religions of ${country}`} s={faith} />}
          </div>
        </>
      )}

      {income && (
        <>
          <Sub>How its income is shared</Sub>
          {five && (
            <div className="modal-tile rounded-lg p-4 min-w-0 mb-2">
              <ChartTitle>The share of income or spending that goes to each fifth of its people · % · {p!.income!.y}</ChartTitle>
              <PartsBar label={`How the income of ${country} is shared among five equal parts of its people, ${p!.income!.y}`} columns={3} colors={FIFTH_COLORS} parts={five.map((v, i) => ({ label: FIFTHS[i], value: v, text: `${v}%` }))} />
              <ChartNote className="mt-2">Were income shared evenly, each fifth of the people would have 20% of it.</ChartNote>
            </div>
          )}
          <div className="tile-fill gap-2">
            {gini && <FigureTile label="Gini index" value={String(gini.v)} sub={`0 is everyone alike, 100 one person with all of it · World Bank, ${gini.y}`} />}
            {p?.income?.top10 != null && <FigureTile label="The richest tenth's share" value={`${p.income.top10}%`} sub={`of income or spending · ${p.income.y}`} />}
            {p?.income?.bottom10 != null && <FigureTile label="The poorest tenth's share" value={`${p.income.bottom10}%`} sub={`of income or spending · ${p.income.y}`} />}
            {times != null && <FigureTile label="Richest fifth to poorest fifth" value={`${times} times`} sub={`the one's share over the other's · worked out here · ${p!.income!.y}`} />}
          </div>
        </>
      )}

      {poverty && (
        <>
          <Sub>How many are poor</Sub>
          <div className="tile-fill gap-2">
            {p?.poor && <FigureTile label="Below the international line" value={`${p.poor.v}%`} sub={`of its people, on less than ${POVERTY_LINE} · ${p.poor.y}`} />}
            {p?.poorOwn && <FigureTile label="Below its own poverty line" value={`${p.poorOwn.v}%`} sub={`of its people, by the line ${land} sets itself · ${p.poorOwn.y}`} />}
            {mpm && <FigureTile label="Poor by the wider measure" value={`${mpm.v}%`} sub={`short of money, schooling or basic services · World Bank's Multidimensional Poverty Measure, ${mpm.y}`} />}
          </div>
          <ChartNote className="mt-2">These are different measures and are not added together: a country's own line is set by the country, so it is not compared across countries.</ChartNote>
        </>
      )}
      <SourceLink sources={[...sources.values()]} className="mt-2" />
    </section>
  );
}
