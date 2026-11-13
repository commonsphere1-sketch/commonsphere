/**
 * Two lists for the Climate page's "Life on Earth": the endangered species
 * and about how many of each are left, and the species science has named in
 * the last few years with what is known of each and where it was found.
 *
 * Both are read whole from their data files (endangeredSpecies.ts,
 * newSpecies.ts), each built from Wikipedia's lists and checked against
 * Wikidata; nothing is typed in here. Each is a card that is searched by
 * name, narrowed by a few chips, and scrolls inside itself, in the look of
 * the page's figure cards. A number left is the list's own wording; an
 * account of a new species is its article's own opening.
 *
 * As asked, both follow the place chosen in the page's climate history (`where`): the species living in its country - or
 * in the division chosen, where a species' record names it - by where they live (build-species-places.cjs: the places
 * Wikidata records each as endemic to or its taxon range, as countries, and for a new species the countries its own
 * article names), with "All the world" a press away. A species no record places is shown only under all the world.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { countriesData } from "../data/countriesData";
import { MagnifyingGlass, MapPin, TrendDown, TrendUp, X } from "@phosphor-icons/react";
import { ENDANGERED_LISTS, ENDANGERED_SOURCES, ENDANGERED_SPECIES } from "../data/endangeredSpecies";
import { NEW_SPECIES, NEW_SPECIES_SOURCES } from "../data/newSpecies";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

/** The place chosen in the page's climate history: its country, and the divisions within it chosen (the nearest first). */
export type SpeciesWhere = { cc: string; country: string; divisions: string[] };
type Placed = Record<string, { cc: string[]; places: { name: string; cc?: string; via: "endemic" | "range" | "article" }[] }>;
const COUNTRY = new Map(countriesData.map((c) => [c.code, c.name]));
let placesRead: Promise<Placed> | null = null;
/** Where each species lives, read once for both lists. */
function usePlaces() {
  const [placed, setPlaced] = useState<Placed | null>(null);
  useEffect(() => {
    let live = true;
    placesRead ??= fetch("/species/places.json").then((r) => (r.ok ? (r.json() as Promise<Placed>) : {}));
    void placesRead.then((p) => live && setPlaced(p)).catch(() => live && setPlaced({}));
    return () => {
      live = false;
    };
  }, []);
  return placed;
}
/**
 * The species of a list that live in the place chosen: those whose record names the nearest division chosen, else those
 * of its country; and what that place is called.
 */
function speciesHere<T extends { scientific: string }>(all: T[], placed: Placed | null, where?: SpeciesWhere): { here: T[]; at: string } | null {
  if (!where || !placed) return null;
  for (const d of where.divisions) {
    const here = all.filter((s) => placed[s.scientific]?.places.some((p) => p.name === d));
    if (here.length) return { here, at: d };
  }
  return { here: all.filter((s) => placed[s.scientific]?.cc.includes(where.cc)), at: where.country };
}
/** A species' countries, said short. */
const countriesOf = (placed: Placed | null, scientific: string) => {
  const cc = placed?.[scientific]?.cc ?? [];
  const names = cc.map((c) => COUNTRY.get(c) ?? c);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
};
/** The chips that choose between the place and all the world. */
function WhereChips({ where, at, n, here, setHere }: { where?: SpeciesWhere; at?: string; n: number; here: boolean; setHere: (v: boolean) => void }) {
  if (!where || !at) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip on={here} onClick={() => setHere(true)}>
        <MapPin size={10} weight="fill" aria-hidden /> {at} · {n}
      </Chip>
      <Chip on={!here} onClick={() => setHere(false)}>
        All the world
      </Chip>
    </div>
  );
}
const PLACES_NOTE =
  "Where a species lives is the places Wikidata records it as endemic to or its taxon range, each as its country, and for a newly described species also the countries its own article names; a species no record places is shown only under all the world.";

const wiki = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
const STATUS = {
  CR: { label: "Critically endangered", color: "#ef4444" },
  EN: { label: "Endangered", color: "#f97316" },
} as const;

/** A card of the section: its kicker and title, its controls, and a list that scrolls inside it. */
function ListCard({ kicker, title, controls, count, children, foot }: { kicker: string; title: string; controls: ReactNode; count: string; children: ReactNode; foot: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5 text-muted-foreground">{kicker}</p>
      <h3 className="text-sm font-bold font-sans mb-3 text-foreground">{title}</h3>
      {controls}
      <p className="text-[10px] font-mono text-muted-foreground mt-3 mb-1.5">{count}</p>
      <ul className="flex flex-col max-h-[30rem] overflow-y-auto pr-2 border-y border-border/60" tabIndex={0} aria-label={title}>
        {children}
      </ul>
      {foot}
    </div>
  );
}

function Search({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
      <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder={label} className="flex-1 min-w-0 bg-transparent text-[11px] font-sans text-foreground outline-none border-none" />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear the search" className="cursor-pointer text-muted-foreground">
          <X size={11} weight="bold" />
        </button>
      )}
    </label>
  );
}

function Chip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${on ? "border-secondary/60 bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden />}
      {children}
    </button>
  );
}

/** Endangered and critically endangered mammals and birds, fewest left first. */
export function EndangeredSpeciesList({ where }: { where?: SpeciesWhere }) {
  const placed = usePlaces();
  const [here, setHere] = useState(true);
  useEffect(() => setHere(true), [where?.cc, where?.divisions.join()]);
  const local = useMemo(() => speciesHere(ENDANGERED_SPECIES, placed, where), [placed, where]);
  const base = here && local ? local.here : ENDANGERED_SPECIES;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"CR" | "EN" | null>(null);
  const [group, setGroup] = useState("all");
  const groups = useMemo(() => [...new Set(ENDANGERED_SPECIES.map((s) => s.group))].sort(), []);
  const q = search.trim().toLowerCase();
  const list = useMemo(
    () => base.filter((s) => (!status || s.status === status) && (group === "all" || s.group === group) && (!q || s.name.toLowerCase().includes(q) || s.scientific.toLowerCase().includes(q))),
    [base, q, status, group],
  );
  const of = (st: "CR" | "EN") => base.filter((s) => s.status === st).length;
  return (
    <ListCard
      kicker="Endangered species"
      title="Endangered species, and about how many are left"
      count={here && local ? `${list.length} of the ${ENDANGERED_SPECIES.length} mammals and birds live in ${local.at} · fewest left first` : `${list.length} of ${ENDANGERED_SPECIES.length} mammals and birds · fewest left first`}
      controls={
        <div className="flex flex-col gap-2">
          <WhereChips where={where} at={local?.at} n={local?.here.length ?? 0} here={here} setHere={setHere} />
          <Search value={search} onChange={setSearch} label="Search a species by name" />
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip on={status === null} onClick={() => setStatus(null)}>
              Both
            </Chip>
            {(["CR", "EN"] as const).map((st) => (
              <Chip key={st} on={status === st} onClick={() => setStatus(status === st ? null : st)} color={STATUS[st].color}>
                {STATUS[st].label} · {of(st)}
              </Chip>
            ))}
            <span className="ml-auto">
              <StyledSelect value={group} onValueChange={setGroup} ariaLabel="Narrow to a group of animals" options={[{ value: "all", label: "All groups" }, ...groups.map((g) => ({ value: g, label: g }))]} />
            </span>
          </div>
        </div>
      }
      foot={
        <>
          <p className="text-[10px] font-sans leading-relaxed text-muted-foreground mt-3">
            Each row is from one of Wikipedia's lists of mammals and birds by population ({ENDANGERED_LISTS.length} lists), and is here only where Wikidata holds the same Red List category for the
            same scientific name: {ENDANGERED_SOURCES.kept} of {ENDANGERED_SOURCES.listed} rows. {ENDANGERED_SOURCES.noCategory + ENDANGERED_SOURCES.categoryDiffers} are left out because the two records
            do not agree - most are subspecies. The number left is an estimate in the list's own words, often of mature animals only. Reptiles, amphibians, fish, plants and insects are not in
            these lists, so this is not every endangered species: the IUCN Red List is the list of record. {PLACES_NOTE}{" "}
            {placed ? `${ENDANGERED_SPECIES.filter((s) => placed[s.scientific]?.cc.length).length} of these ${ENDANGERED_SPECIES.length} are placed.` : ""}
          </p>
          <SourceLink sources={[ENDANGERED_SOURCES.hub, ENDANGERED_SOURCES.wikidata, ENDANGERED_SOURCES.redList]} className="mt-2" />
        </>
      }
    >
      {list.map((s) => (
        <li key={s.scientific} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-b-0 min-w-0">
          <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: STATUS[s.status].color }} title={STATUS[s.status].label} aria-hidden />
          <span className="min-w-0 flex-1">
            <a href={wiki(s.article)} target="_blank" rel="noopener noreferrer" className="block text-[12px] font-sans font-semibold text-foreground truncate hover:underline">
              {s.name}
            </a>
            <span className="block text-[10px] font-sans text-muted-foreground truncate">
              <i>{s.scientific}</i> · {s.group} · {STATUS[s.status].label}
              {countriesOf(placed, s.scientific) && ` · ${countriesOf(placed, s.scientific)}`}
            </span>
          </span>
          <span className="text-right shrink-0">
            <span className="block text-[12px] font-mono font-bold text-foreground">{s.left}</span>
            <span className="flex items-center justify-end gap-1 text-[9px] font-sans text-muted-foreground">
              {s.trend === "decrease" && <TrendDown size={10} weight="bold" aria-hidden />}
              {s.trend === "increase" && <TrendUp size={10} weight="bold" aria-hidden />}
              {s.trend === "decrease" ? "left, falling" : s.trend === "increase" ? "left, rising" : s.trend === "steady" ? "left, steady" : "left"}
            </span>
          </span>
        </li>
      ))}
      {list.length === 0 && <li className="py-6 text-center text-[11px] font-sans text-muted-foreground">{here && local && !local.here.length ? `None of these species is recorded as living in ${local.at}.` : "No species in the list matches."}</li>}
    </ListCard>
  );
}

/** Species described in the last few years: what each is, and where it was found. */
export function NewSpeciesList({ where }: { where?: SpeciesWhere }) {
  const placed = usePlaces();
  const [here, setHere] = useState(true);
  useEffect(() => setHere(true), [where?.cc, where?.divisions.join()]);
  const local = useMemo(() => speciesHere(NEW_SPECIES, placed, where), [placed, where]);
  const base = here && local ? local.here : NEW_SPECIES;
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [group, setGroup] = useState("all");
  const years = useMemo(() => [...new Set(NEW_SPECIES.map((s) => s.year))].sort((a, b) => b - a), []);
  const groups = useMemo(() => [...new Set(NEW_SPECIES.map((s) => s.group))].sort(), []);
  const q = search.trim().toLowerCase();
  const list = useMemo(
    () => base.filter((s) => (!year || s.year === year) && (group === "all" || s.group === group) && (!q || [s.article, s.scientific, s.said, s.where ?? ""].some((x) => x.toLowerCase().includes(q)))),
    [base, q, year, group],
  );
  return (
    <ListCard
      kicker="Species discovered"
      title="Recently described species: what they are, and where they were found"
      count={here && local ? `${list.length} of the ${NEW_SPECIES.length} species live in ${local.at} · newest first` : `${list.length} of ${NEW_SPECIES.length} species · newest first`}
      controls={
        <div className="flex flex-col gap-2">
          <WhereChips where={where} at={local?.at} n={local?.here.length ?? 0} here={here} setHere={setHere} />
          <Search value={search} onChange={setSearch} label="Search a species, a place or a word" />
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip on={year === null} onClick={() => setYear(null)}>
              All years
            </Chip>
            {years.map((y) => (
              <Chip key={y} on={year === y} onClick={() => setYear(year === y ? null : y)}>
                {y} · {base.filter((s) => s.year === y).length}
              </Chip>
            ))}
            <span className="ml-auto">
              <StyledSelect value={group} onValueChange={setGroup} ariaLabel="Narrow to a group of living things" options={[{ value: "all", label: "All groups" }, ...groups.map((g) => ({ value: g, label: g }))]} />
            </span>
          </div>
        </div>
      }
      foot={
        <>
          <p className="text-[10px] font-sans leading-relaxed text-muted-foreground mt-3">
            From the {NEW_SPECIES_SOURCES.articles.toLocaleString("en-US")} articles Wikipedia files under species described in these years: kept where Wikidata also holds the subject as a species named in
            that year and the article's opening says enough ({NEW_SPECIES_SOURCES.agreed}), then the fullest few of each group and year. What is said of a species is its article's own opening, and
            the place is its own words. It is a sample of what has been written up, not a count: some sixteen thousand species are described a year. {PLACES_NOTE}{" "}
            {placed ? `${NEW_SPECIES.filter((s) => placed[s.scientific]?.cc.length).length} of these ${NEW_SPECIES.length} are placed.` : ""}
          </p>
          <SourceLink sources={[NEW_SPECIES_SOURCES.wikipedia, NEW_SPECIES_SOURCES.wikidata]} className="mt-2" />
        </>
      }
    >
      {list.map((s) => (
        <li key={s.article} className="py-2.5 border-b border-border/40 last:border-b-0 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="font-bold text-foreground">{s.year}</span> · {s.group}
          </p>
          <a href={wiki(s.article)} target="_blank" rel="noopener noreferrer" className="block text-[13px] font-sans font-bold text-foreground leading-snug mt-0.5 hover:underline">
            {s.article}
            {s.article !== s.scientific && <i className="font-normal text-muted-foreground"> · {s.scientific}</i>}
          </a>
          {s.where && (
            <p className="flex items-start gap-1 text-[11px] font-sans text-foreground mt-1">
              <MapPin size={12} weight="fill" className="shrink-0 mt-[2px] text-emerald-500" aria-hidden />
              {s.where}
            </p>
          )}
          <p className="text-[11px] font-sans leading-relaxed text-muted-foreground mt-1">{s.said}</p>
        </li>
      ))}
      {list.length === 0 && <li className="py-6 text-center text-[11px] font-sans text-muted-foreground">{here && local && !local.here.length ? `None of these species is recorded as living in ${local.at}.` : "No species in the list matches."}</li>}
    </ListCard>
  );
}
