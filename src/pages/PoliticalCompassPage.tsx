import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { MagnifyingGlass, ArrowLeft, Info } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import {
  authorityScore,
  authorityBand,
  AUTHORITY_BANDS,
  type AuthorityBandId,
} from "../data/compassAxes";
import { CollapsibleFilters } from "../components/CollapsibleFilters";
import { useTheme } from "../contexts/ThemeContext";

/** Continent hues, from the validated categorical order in fixed slot order. */
const CONTINENT_COLORS: Record<string, { light: string; dark: string }> = {
  Europe: { light: "#2a78d6", dark: "#3987e5" },
  Africa: { light: "#eb6834", dark: "#d95926" },
  Asia: { light: "#1baf7a", dark: "#199e70" },
  "North America": { light: "#eda100", dark: "#c98500" },
  "South America": { light: "#e87ba4", dark: "#d55181" },
  Oceania: { light: "#4a3aa7", dark: "#9085e9" },
};

const CONTINENTS = Object.keys(CONTINENT_COLORS);

export function PoliticalCompassPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState<string | "all">("all");
  const [band, setBand] = useState<AuthorityBandId | "all">("all");

  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const mutedText = isLight ? "rgba(30,41,59,0.55)" : "rgba(255,255,255,0.45)";
  const gridLine = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight
    ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)"
    : "var(--card-glow)";

  /* Every country becomes a point. GDP per capita is logged because the field
     runs from $233 to $247,950 — on a linear axis four fifths of the world
     would sit in the first column.

     The vertical axis is derived from a category, so it takes about a dozen
     values and 68 presidential republics would land on one line, hiding each
     other. Each point is nudged within its own score by a hash of its id:
     deterministic, so a country does not move between renders, and small
     enough never to cross into a neighbouring band. The axis is labelled only
     at its two ends, so no precision is implied that this spread would break. */
  const nudge = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.7; // ±0.35
  };
  const points = useMemo(
    () =>
      countriesData.map((c) => {
        const { score, known } = authorityScore(c.governmentType);
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          continent: c.continent,
          governmentType: c.governmentType,
          authority: score,
          knownForm: known,
          gdpPerCapita: c.gdpPerCapita,
          x: Math.log10(Math.max(c.gdpPerCapita, 100)),
          y: score + nudge(c.id),
          hdi: c.humanDevelopmentIndex,
        };
      }),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return points.filter((p) => {
      if (continent !== "all" && p.continent !== continent) return false;
      if (band !== "all" && authorityBand(p.authority) !== band) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [points, search, continent, band]);

  const hue = (c: string) =>
    (CONTINENT_COLORS[c] ?? CONTINENT_COLORS.Europe)[isLight ? "light" : "dark"];

  // Ticks at round money values rather than round logs.
  const moneyTicks = [100, 1_000, 10_000, 100_000];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Political Compass
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              All {countriesData.length} countries placed by how concentrated
              executive power is, against economic output per person
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/countries")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-sans cursor-pointer shrink-0"
          >
            <ArrowLeft size={13} />
            Country List
          </button>
        </div>

        {/* ── What the axes are ──
            Stated up front rather than buried, because these are derived
            axes and a reader is entitled to know from what. */}
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-2.5">
            <Info size={14} weight="fill" className="text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold font-sans mb-1 text-foreground">
                How these axes are built
              </p>
              <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
                This dataset carries no left/right or
                authoritarian/libertarian scores, so neither axis is one.
                Vertical reads each country's <strong>constitutional form</strong>{" "}
                from its government type — where power sits on paper, not how
                freely elections are run or how the state behaves. Horizontal is{" "}
                <strong>GDP per capita</strong> on a log scale. Both come from
                fields every country actually has; nothing here is an estimate
                of a country's politics.
              </p>
            </div>
          </div>
        </div>

        {/* ── Search + filters ── */}
        <div className="search-sticky sticky top-16 z-30 flex flex-col border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
          <div className="flex items-center gap-2">
            <MagnifyingGlass size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
              {filtered.length}/{points.length}
            </span>
          </div>
          <CollapsibleFilters>
            <button
              onClick={() => setContinent("all")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                continent === "all"
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              All
            </button>
            {CONTINENTS.map((c) => (
              <button
                key={c}
                onClick={() => setContinent(c)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  continent === c
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                  style={{ background: hue(c) }}
                />
                {c}
              </button>
            ))}
            <div className="w-px h-5 bg-border shrink-0" />
            <button
              onClick={() => setBand("all")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                band === "all"
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Any power structure
            </button>
            {AUTHORITY_BANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBand(b.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  band === b.id
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {b.label}
              </button>
            ))}
          </CollapsibleFilters>
        </div>

        {/* ── The chart ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                Constitutional form × income
              </p>
              <h2 className="text-sm font-bold font-sans text-foreground">
                {filtered.length} countries plotted
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {CONTINENTS.map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: hue(c) }}
                  />
                  <span className="text-[10px] font-sans text-muted-foreground">
                    {c}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
              <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[2, 5.4]}
                ticks={moneyTicks.map((t) => Math.log10(t))}
                tickFormatter={(v: number) => {
                  const d = Math.round(Math.pow(10, v));
                  return d >= 1000 ? `$${d / 1000}k` : `$${d}`;
                }}
                tick={{ fontSize: 9, fill: mutedText, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "GDP per capita (log scale)",
                  position: "insideBottom",
                  offset: -16,
                  style: { fontSize: 10, fill: mutedText, fontFamily: "sans-serif" },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 10]}
                ticks={[0, 2.5, 5, 7.5, 10]}
                tickFormatter={(v: number) =>
                  v === 0 ? "Dispersed" : v === 10 ? "Concentrated" : ""
                }
                tick={{ fontSize: 9, fill: mutedText, fontFamily: "sans-serif" }}
                axisLine={false}
                tickLine={false}
                width={78}
                reversed
              />
              <ZAxis range={[46, 46]} />
              <ReferenceLine y={5} stroke={gridLine} strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: gridLine }}
                contentStyle={{
                  background: isLight ? "#fff" : "#15151d",
                  border: isLight
                    ? "1px solid rgba(0,0,0,0.1)"
                    : "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: headText,
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof points)[number];
                  return (
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        background: isLight ? "#fff" : "#15151d",
                        border: isLight
                          ? "1px solid rgba(0,0,0,0.1)"
                          : "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <p
                        className="text-[12px] font-bold font-sans"
                        style={{ color: headText }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="text-[10px] font-sans mb-1"
                        style={{ color: mutedText }}
                      >
                        {p.continent}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: headText }}>
                        {p.governmentType}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: mutedText }}>
                        Power {p.authority}/10 · $
                        {p.gdpPerCapita.toLocaleString()} per person
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={filtered}
                onClick={(d: any) => d?.id && navigate(`/dashboard/countries`)}
              >
                {filtered.map((p) => (
                  <Cell
                    key={p.id}
                    fill={hue(p.continent)}
                    fillOpacity={0.82}
                    stroke={isLight ? "#ffffff" : "#15151d"}
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <p className="text-[9px] font-sans mt-3 pt-3 border-t border-border/40 text-muted-foreground">
            Vertical position is derived from each country's government type, a
            reading of constitutional form rather than a democracy score, and
            points are spread slightly within each score so that countries
            sharing a form do not sit on top of one another. Horizontal is GDP
            per capita. Source: country dataset, World Bank figures.
          </p>
        </div>

        {/* ── Band counts, so the shape is legible without reading the cloud ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AUTHORITY_BANDS.map((b) => {
            const inBand = filtered.filter(
              (p) => authorityBand(p.authority) === b.id,
            );
            const median =
              inBand.length === 0
                ? null
                : [...inBand].sort((a, z) => a.gdpPerCapita - z.gdpPerCapita)[
                    Math.floor(inBand.length / 2)
                  ].gdpPerCapita;
            return (
              <div
                key={b.id}
                className="rounded-2xl p-4"
                style={{
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  {b.label} power
                </p>
                <p className="text-xl font-bold font-mono text-foreground">
                  {inBand.length}
                </p>
                <p className="text-[10px] font-sans text-muted-foreground mt-0.5">
                  {median === null
                    ? "no countries in view"
                    : `median $${median.toLocaleString()} per person`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
