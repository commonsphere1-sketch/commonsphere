/**
 * A place's postal codes, in its window: how many GeoNames lists for it, the
 * first and the last in order, and the codes themselves where there are no
 * more than twenty (static/postal, see lib/placePostal.ts). It says how the
 * codes were put with the place, and what GeoNames does not hold in full for
 * the country. A place with no code is given no section at all: nothing
 * stands empty.
 */
import { ChartNote } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { POSTAL_PARTIAL, POSTAL_SOURCE, type PostalEntry } from "../lib/placePostal";

const whole = (v: number) => v.toLocaleString("en-US");

/** How the codes were put with the place, said under them. */
const HOW = {
  place: (name: string) =>
    `The codes GeoNames files under the name ${name}, in its own district and near where it lies; matched here by name, district and distance. A code filed under the name of a suburb or a quarter is not counted, so a large city has more codes in use than are counted here.`,
  city: (name: string) =>
    `The codes GeoNames files under the name ${name}, in its own district and near where it lies; matched here by name, district and distance, and the United Nations' city to GeoNames' place of the same name. A code filed under the name of a suburb or a quarter is not counted, so a large city has more codes in use than are counted here.`,
  district: (name: string) => `The codes whose point, as GeoNames places it, lies inside the outline of ${name} as the site's maps draw it: counted here.`,
  county: (name: string) => `The ZIP codes GeoNames files under ${name}: its own record, nothing worked out but the count.`,
};

export default function PostalCodes({
  entry,
  cc,
  name,
  how,
  className = "",
}: {
  /** The place's codes; nothing is drawn without them. */
  entry: PostalEntry | null | undefined;
  /** The country, for what the codes are called there and what GeoNames holds of them. */
  cc: string;
  name: string;
  how: keyof typeof HOW;
  className?: string;
}) {
  if (!entry || entry[0] < 1) return null;
  const [n, from, to, codes] = entry;
  const word = cc === "US" ? "ZIP code" : "Postal code";
  const tile = "modal-tile rounded-lg p-3 min-w-0";
  const label = "text-xs text-muted-foreground font-sans";
  const figure = "text-base font-bold font-mono text-foreground break-words";
  const sub = "text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug";
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">📮 {word}s</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="tile-fill gap-3">
        {n === 1 ? (
          <div className={tile}>
            <p className={label}>{word}</p>
            <p className={figure}>{from}</p>
            <p className={sub}>the one GeoNames lists for it</p>
          </div>
        ) : (
          <>
            <div className={tile}>
              <p className={label}>{word}s</p>
              <p className={figure}>{whole(n)}</p>
              <p className={sub}>as GeoNames lists them</p>
            </div>
            <div className={tile}>
              <p className={label}>First in order</p>
              <p className={figure}>{from}</p>
            </div>
            <div className={tile}>
              <p className={label}>Last in order</p>
              <p className={figure}>{to}</p>
            </div>
          </>
        )}
      </div>
      {codes && codes.length > 1 && (
        <ul className="flex flex-wrap gap-1.5 mt-2" aria-label={`The ${word.toLowerCase()}s of ${name}`}>
          {codes.map((c) => (
            <li key={c} className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-border text-foreground">
              {c}
            </li>
          ))}
        </ul>
      )}
      <ChartNote className="mt-2">
        {HOW[how](name)}
        {POSTAL_PARTIAL[cc] ? ` ${POSTAL_PARTIAL[cc]}` : ""} GeoNames gives its list as it stands, with no date for a code and no promise that it is current: a code a post
        office has since changed may still be in it.
      </ChartNote>
      <SourceLink sources={[POSTAL_SOURCE]} className="mt-1" />
    </section>
  );
}
