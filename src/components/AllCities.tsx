/**
 * Every city the United Nations counts, under the Cities page's profiled
 * few: a card each, searched and filtered by country, and a window each.
 *
 * The profiled cities above have a window of their own, written and sourced
 * city by city. These have what one body publishes for every city alike
 * (unCities.ts: the UN's World Urbanization Prospects, 2025 Revision): where
 * the city is, whether it is its country's capital, its population in 1975,
 * 2000 and 2025 and the UN's projection for 2050, its land area and its
 * density. A change is worked out here from two of those figures, and says
 * so. What the UN does not publish for every city is not shown, and the
 * window says which parts those are.
 *
 * A city is what the UN's method draws - built-up land of at least 1,500
 * people to a km² holding 50,000 or more - not the administrative city, so
 * its figure can differ from the one its own council gives.
 *
 * Loaded when the page reaches it: the list is some twelve thousand cities.
 * `openId` ("un-<country>-<code>") opens one city's window - the Dashboard's
 * map sends its presses here that way.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { UN_CITIES, UN_CITIES_SOURCE, UN_CITY_YEARS, type UnCity } from "../data/unCities";
import { flagColor } from "../lib/flagColor";
import { FigureRow } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = "#10b981";
const PAGE = 48;
const COUNTRY = new Map(countriesData.map((c) => [c.code, c]));
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(0)}%`;
const flag = (cc: string, w = 40) => `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`;
const coords = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
export const unCityId = (c: UnCity) => `un-${c[0]}-${c[1]}`;
/** Its place among all the UN's cities by 2025 population: the list is written largest first. */
const RANK = new Map(UN_CITIES.map((c, i) => [unCityId(c), i + 1]));
const BY_ID = new Map(UN_CITIES.map((c) => [unCityId(c), c]));
const COUNTRIES = [...new Set(UN_CITIES.map((c) => c[0]))].map((cc) => ({ cc, name: COUNTRY.get(cc)?.name ?? cc, count: UN_CITIES.filter((c) => c[0] === cc).length })).sort((a, b) => a.name.localeCompare(b.name));
const [Y0, Y1, Y2, Y3] = UN_CITY_YEARS;
/** A change between two of a city's populations, as a percentage of the earlier. */
const change = (from: number | null, to: number | null) => (from && to ? (100 * (to - from)) / from : null);

const Section = ({ title, note, children }: { title: string; note?: string; children?: ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
    {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">{note}</p>}
    {children}
  </section>
);
const none = <span className="font-normal text-muted-foreground">Not held</span>;

function CityWindow({ c, onClose }: { c: UnCity; onClose: () => void }) {
  const navigate = useNavigate();
  const [cc, code, name, lat, lon, capital, p0, p1, p2, p3, area, density] = c;
  const country = COUNTRY.get(cc);
  const rank = RANK.get(unCityId(c))!;
  const since = change(p1, p2);
  const ahead = change(p2, p3);
  const points = ([[Y0, p0], [Y1, p1], [Y2, p2], [Y3, p3]] as [number, number | null][]).filter((x): x is [number, number] => x[1] !== null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const before = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={name} className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl modal-glass border overflow-y-auto">
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={flag(cc, 160)} alt={`${country?.name ?? cc} flag`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">City · {country?.name ?? cc}</p>
                <h2 className="text-2xl font-bold font-sans text-foreground leading-tight">{name}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[...(capital ? ["Capital"] : []), `#${rank.toLocaleString("en-US")} of ${UN_CITIES.length.toLocaleString("en-US")} by population`].map((x) => (
                    <span key={x} className="text-[11px] font-sans border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {country && (
              <button type="button" onClick={() => navigate(`/dashboard/countries?open=${country.id}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Open {country.name} <ArrowRight size={11} weight="bold" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => navigate(`/dashboard/subnations?country=${cc}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
              Its country's divisions <ArrowRight size={11} weight="bold" aria-hidden />
            </button>
          </div>

          <Section title="Identity">
            <div className="modal-tile rounded-xl px-4 py-1.5">
              <FigureRow label="Name" value={name} sub="as the United Nations writes it" />
              <FigureRow label="Country" value={country?.name ?? cc} sub={`ISO 3166-1: ${cc}`} />
              <FigureRow label="Its country's capital" value={capital ? "Yes" : "No"} />
              <FigureRow label="The UN's code for it" value={String(code)} />
            </div>
          </Section>
          <Section title="Geography">
            <div className="modal-tile rounded-xl px-4 py-1.5">
              <FigureRow label="Coordinates" value={lat !== null && lon !== null ? coords(lat, lon) : none} sub={lat !== null ? "where its people are centred" : undefined} />
              <FigureRow label="Land area" value={area !== null ? `${whole(area)} km²` : none} sub={area !== null ? String(Y2) : undefined} />
              <FigureRow label="People to a km²" value={density !== null ? whole(density) : none} sub={density !== null ? String(Y2) : undefined} />
            </div>
          </Section>
          <Section title="Demographics">
            <div className="modal-tile rounded-xl px-4 py-1.5">
              <FigureRow label={`Population, ${Y2}`} value={whole(p2)} sub="the UN's last estimate" />
              <FigureRow label={`Population, ${Y1}`} value={p1 !== null ? whole(p1) : none} />
              <FigureRow label={`Population, ${Y0}`} value={p0 !== null ? whole(p0) : none} />
              <FigureRow label={`Change, ${Y1} to ${Y2}`} value={since !== null ? signed(since) : none} sub={since !== null ? "worked out here from the two figures" : undefined} />
              <FigureRow label={`Projected for ${Y3}`} value={p3 !== null ? whole(p3) : none} sub={ahead !== null ? `the UN's projection · ${signed(ahead)} on ${Y2}, worked out here` : undefined} />
            </div>
          </Section>
          <Section title="Historical trends" note={`Its population in ${Y0}, ${Y1} and ${Y2}, and the UN's projection for ${Y3}.`}>
            <div className="modal-tile rounded-xl p-3" role="img" aria-label={`${name}'s population: ${points.map(([y, v]) => `${y} ${people(v)}`).join(", ")}.`}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={points.map(([year, v]) => ({ year, v }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="year" type="number" domain={[Y0, Y3]} ticks={[...UN_CITY_YEARS]} tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => people(v)} domain={[0, "auto"]} />
                  <Tooltip formatter={(v: number) => [whole(v), "People"]} labelFormatter={(y) => (y === Y3 ? `${y} (projected)` : String(y))} contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 11 }} />
                  <Area type="linear" dataKey="v" stroke={flagColor(cc) ?? COLOR} strokeWidth={1.75} fill={flagColor(cc) ?? COLOR} fillOpacity={0.12} dot={{ r: 2.5 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>
          <Section title="Government · Economy · Society · Political data" note={`No body publishes these for every city on one footing, so none is given here. ${country ? `${country.name}'s` : "Its country's"} are in the country's own window.`} />
          <SourceLink sources={[UN_CITIES_SOURCE]} />
        </div>
      </div>
    </div>
  );
}

export default function AllCities({ openId, onOpened }: { /** A city to open, as a link names it. */ openId: string | null; onOpened: () => void }) {
  const [query, setQuery] = useState("");
  const [cc, setCc] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<UnCity | null>(null);
  useEffect(() => {
    if (!openId) return;
    const found = BY_ID.get(openId);
    if (found) setOpen(found);
    onOpened();
  }, [openId, onOpened]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UN_CITIES.filter((c) => (!cc || c[0] === cc) && (!q || c[2].toLowerCase().includes(q) || (COUNTRY.get(c[0])?.name ?? "").toLowerCase().includes(q)));
  }, [query, cc]);
  const field = "bg-transparent border border-border rounded-full px-3 py-1.5 text-[12px] font-sans text-foreground focus:outline-none focus:border-foreground/40";
  return (
    <section id="all-cities" aria-label="Every city the United Nations counts" className="mt-10 scroll-mt-32">
      <h2 className="text-lg font-bold font-sans text-foreground">Every city the United Nations counts</h2>
      <p className="text-[12px] font-sans text-muted-foreground mt-1 max-w-3xl">
        {UN_CITIES.length.toLocaleString("en-US")} cities in {COUNTRIES.length} countries, largest first by their {Y2} population. A city here is what the UN's method draws - built-up
        land of at least 1,500 people to a km² holding 50,000 or more - not the administrative city, so its figure can differ from the one its own council gives.
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
        <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
          <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search every city, or a country"
            aria-label="Search every city by its name or its country's"
            className="bg-transparent w-52 sm:w-64 focus:outline-none placeholder:text-muted-foreground"
          />
        </label>
        <select
          value={cc}
          onChange={(e) => {
            setCc(e.target.value);
            setShown(PAGE);
          }}
          aria-label="The country whose cities are listed"
          className={field}
        >
          <option value="">Every country</option>
          {COUNTRIES.map((c) => (
            <option key={c.cc} value={c.cc}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <span className="text-[11px] font-mono text-muted-foreground">{rows.length.toLocaleString("en-US")} cities</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rows.slice(0, shown).map((c) => {
          const since = change(c[7], c[8]);
          return (
            <button key={unCityId(c)} type="button" onClick={() => setOpen(c)} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
              <span className="flex items-center gap-2.5 min-w-0">
                <img src={flag(c[0])} alt="" width={22} height={16} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold font-sans text-foreground truncate">{c[2]}</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground truncate">
                    <MapPin size={9} aria-hidden /> {COUNTRY.get(c[0])?.name ?? c[0]}
                    {c[5] ? " · capital" : ""}
                  </span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">#{RANK.get(unCityId(c))!.toLocaleString("en-US")}</span>
              </span>
              <span className="flex flex-col border-t border-border/40 pt-1.5">
                {(
                  [
                    [`Population · ${Y2}`, people(c[8])],
                    [`Since ${Y1}`, since !== null ? signed(since) : undefined],
                    ["Land area", c[10] !== null ? `${whole(c[10])} km²` : undefined],
                    ["People to a km²", c[11] !== null ? whole(c[11]) : undefined],
                  ] as [string, string | undefined][]
                ).map(([k, v]) => (
                  <span key={k} className="flex items-baseline justify-between gap-2 py-0.5 min-w-0">
                    <span className="text-[11px] font-sans text-muted-foreground shrink-0">{k}</span>
                    <span className={`text-[11px] font-mono truncate ${v ? "font-bold text-foreground" : "text-muted-foreground"}`}>{v ?? "Not held"}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {rows.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 4)} className="mt-4 text-[11px] font-semibold font-sans px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
          Show more · {Math.min(shown, rows.length).toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} shown
        </button>
      )}
      <SourceLink sources={[UN_CITIES_SOURCE]} className="mt-4" />
      {open && <CityWindow c={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
