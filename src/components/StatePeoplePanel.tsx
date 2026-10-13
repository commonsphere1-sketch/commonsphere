/**
 * A state's own people and income, in its window and in the window of a
 * place inside it (data/statePeople.ts): the languages its people speak at
 * home, and how its households' income is shared - the Census Bureau's, from
 * the American Community Survey.
 *
 * The languages are a whole - every person aged 5 and over speaks one of
 * them at home - so they are a ring: English only, Spanish, the four next
 * largest of the Bureau's languages and groups, and the rest together, which
 * is said to be added up here. The shares of income are a bar of five parts,
 * with the top twentieth's share, the Gini index and how many times the
 * highest fifth's share is the lowest's beside it - the last worked out here.
 *
 * In the state's own window they are the state's. In the window of a county
 * or a town in it they are given as the state's and say so. Religion is not
 * here: the Bureau does not ask it, and the panel of the country's says what
 * is known of the country.
 */
import { STATE_PEOPLE, STATE_PEOPLE_SOURCES as SRC, STATE_PEOPLE_YEAR } from "../data/statePeople";
import { ChartNote, ChartTitle, FigureTile, PartsBar, PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

export type StatePeoplePart = "languages" | "income";
const FIFTHS = ["Lowest fifth", "Second fifth", "Middle fifth", "Fourth fifth", "Highest fifth"];
const FIFTH_COLORS = ["#fde68a", "#fcd34d", "#f59e0b", "#d97706", "#92400e"];
/** How many of the Bureau's languages are named in the ring before the rest are put together. */
const NAMED = 6;

export default function StatePeoplePanel({
  stateId,
  name,
  place,
  parts = ["languages", "income"],
  className = "",
}: {
  /** The site's id for the state: its postal abbreviation in lower case. */
  stateId: string;
  name: string;
  /** The place whose window this is, where it is not the state itself. */
  place?: string;
  parts?: StatePeoplePart[];
  className?: string;
}) {
  const s = STATE_PEOPLE[stateId];
  if (!s) return null;
  const languages = parts.includes("languages");
  const income = parts.includes("income");
  if (!languages && !income) return null;
  // The largest first, the Bureau's "other and unspecified" kept for the rest; what is not named is added up.
  const ranked = [...s.languages].filter(([n]) => n !== "Other and unspecified").sort((a, b) => b[1] - a[1]);
  const named = ranked.slice(0, NAMED);
  const rest = Math.round((100 - named.reduce((a, [, v]) => a + v, 0)) * 10) / 10;
  const times = s.fifths[0] > 0 ? Math.round((s.fifths[4] / s.fifths[0]) * 10) / 10 : null;
  const title = languages && income ? "Languages and income" : languages ? "Languages" : "How income is shared";

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
          🗣️ {title} · {name}
        </h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {place && (
        <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
          These are {name}'s, not {place}'s own: the survey is given here for the state it is in.
        </p>
      )}
      {languages && (
        <div className="modal-tile rounded-lg p-4 min-w-0">
          <ChartTitle>Languages spoken at home · % of people aged 5 and over · {STATE_PEOPLE_YEAR}</ChartTitle>
          <PartsDonut
            label={`The languages the people of ${name} speak at home, ${STATE_PEOPLE_YEAR}`}
            parts={[...named.map(([n, v]) => ({ label: n, value: v, text: `${v}%` })), ...(rest > 0 ? [{ label: "All other languages · added up here", value: rest, text: `${rest}%` }] : [])]}
          />
          <ChartNote className="mt-2">“English only” is people who speak nothing else at home; the others speak that language there, whether or not they also speak English.</ChartNote>
        </div>
      )}
      {income && (
        <div className={languages ? "mt-2" : ""}>
          <div className="modal-tile rounded-lg p-4 min-w-0 mb-2">
            <ChartTitle>The share of household income that goes to each fifth of households · % · {STATE_PEOPLE_YEAR}</ChartTitle>
            <PartsBar label={`How the household income of ${name} is shared among five equal parts of its households, ${STATE_PEOPLE_YEAR}`} columns={3} colors={FIFTH_COLORS} parts={s.fifths.map((v, i) => ({ label: FIFTHS[i], value: v, text: `${v}%` }))} />
            <ChartNote className="mt-2">Were income shared evenly, each fifth of households would have 20% of it.</ChartNote>
          </div>
          <div className="tile-fill gap-2">
            <FigureTile label="Gini index" value={String(s.gini)} sub={`0 is every household alike, 1 one household with all of it · ${STATE_PEOPLE_YEAR}`} />
            <FigureTile label="The top twentieth's share" value={`${s.top5}%`} sub={`of household income, to the highest 5% of households · ${STATE_PEOPLE_YEAR}`} />
            {times != null && <FigureTile label="Highest fifth to lowest fifth" value={`${times} times`} sub={`the one's share over the other's · worked out here · ${STATE_PEOPLE_YEAR}`} />}
          </div>
        </div>
      )}
      <SourceLink sources={[...(languages ? [SRC.languages] : []), ...(income ? [SRC.income] : [])]} className="mt-2" />
    </section>
  );
}
