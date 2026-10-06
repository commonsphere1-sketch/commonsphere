/**
 * The dates on which power changes hands in the United States, worked out
 * from the laws that fix them - not typed in.
 *
 *   Election day          the Tuesday after the first Monday in November: of
 *                         every even year for Congress (2 U.S.C. § 7), of
 *                         every fourth year for President (3 U.S.C. §§ 1, 21)
 *   Electors vote         the first Tuesday after the second Wednesday in
 *                         December after a presidential election (3 U.S.C. § 7)
 *   A new Congress        noon on 3 January of each odd year, unless Congress
 *                         sets another day by law (20th Amendment, § 2)
 *   The votes are counted 6 January after a presidential election
 *                         (3 U.S.C. § 15)
 *   Inauguration          noon on 20 January after a presidential election
 *                         (20th Amendment, § 1)
 *
 * States set their own primaries, and the offices of a state its own
 * constitution; neither is here.
 */

export type CivicDate = {
  id: string;
  /** What happens, in full. */
  label: string;
  /** The same, short enough for a heading. */
  short: string;
  /** The day, at midnight local time: the countdown runs to its start. */
  date: Date;
  /** What is decided or begins. */
  what: string;
  /** The law that fixes the day. */
  law: { label: string; url: string };
};

const LAW = {
  congressElection: { label: "2 U.S.C. § 7", url: "https://www.law.cornell.edu/uscode/text/2/7" },
  presidentElection: { label: "3 U.S.C. § 1", url: "https://www.law.cornell.edu/uscode/text/3/1" },
  electors: { label: "3 U.S.C. § 7", url: "https://www.law.cornell.edu/uscode/text/3/7" },
  count: { label: "3 U.S.C. § 15", url: "https://www.law.cornell.edu/uscode/text/3/15" },
  twentieth: { label: "20th Amendment", url: "https://constitution.congress.gov/constitution/amendment-20/" },
};

/** The Tuesday after the first Monday in November. */
export function electionDay(year: number): Date {
  const first = new Date(year, 10, 1);
  const firstMonday = 1 + ((8 - first.getDay()) % 7);
  return new Date(year, 10, firstMonday + 1);
}

/** The first Tuesday after the second Wednesday in December. */
function electorsMeet(year: number): Date {
  const first = new Date(year, 11, 1);
  const secondWednesday = 1 + ((10 - first.getDay()) % 7) + 7;
  // The Tuesday after a Wednesday is six days on.
  return new Date(year, 11, secondWednesday + 6);
}

/** Every such date from one year to another, in order. */
export function civicDates(fromYear: number, toYear: number): CivicDate[] {
  const out: CivicDate[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    const presidential = y % 4 === 0;
    if (y % 2 === 0) {
      out.push(
        presidential
          ? {
              id: `president-${y}`,
              label: `Presidential election, ${y}`,
              short: "Presidential election",
              date: electionDay(y),
              what: "The President and Vice President, every seat in the House and a third of the Senate.",
              law: LAW.presidentElection,
            }
          : {
              id: `midterm-${y}`,
              label: `Midterm elections, ${y}`,
              short: "Midterm elections",
              date: electionDay(y),
              what: "Every seat in the House and a third of the Senate, halfway through the President's term.",
              law: LAW.congressElection,
            },
      );
      if (presidential) {
        out.push({
          id: `electors-${y}`,
          label: `The electors vote, ${y}`,
          short: "Electors vote",
          date: electorsMeet(y),
          what: "Each state's electors meet and cast their votes for President and Vice President.",
          law: LAW.electors,
        });
      }
    } else {
      out.push({
        id: `congress-${y}`,
        label: `A new Congress convenes, ${y}`,
        short: "New Congress convenes",
        date: new Date(y, 0, 3),
        what: "The members elected the November before take their seats, at noon unless Congress sets another day by law.",
        law: LAW.twentieth,
      });
      if ((y - 1) % 4 === 0) {
        out.push(
          {
            id: `count-${y}`,
            label: `Congress counts the electoral votes, ${y}`,
            short: "Electoral votes counted",
            date: new Date(y, 0, 6),
            what: "The two houses meet together and the electors' votes are opened and counted.",
            law: LAW.count,
          },
          {
            id: `inauguration-${y}`,
            label: `Inauguration Day, ${y}`,
            short: "Inauguration Day",
            date: new Date(y, 0, 20),
            what: "The President's term ends and the next begins, at noon.",
            law: LAW.twentieth,
          },
        );
      }
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** The dates still to come, from today: through the next presidential inauguration and the midterms after it. */
export function upcomingCivicDates(now: Date = new Date()): CivicDate[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return civicDates(now.getFullYear(), now.getFullYear() + 6).filter((d) => d.date.getTime() >= today).slice(0, 8);
}

/** "3 November 2026". */
export const civicDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
/** Whole days from today to a date. Both are local midnights, so the gap is whole days give or take the hour a clock change adds: rounded, not rounded up. */
export const daysUntil = (d: Date, now: Date = new Date()) => Math.max(0, Math.round((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000));
