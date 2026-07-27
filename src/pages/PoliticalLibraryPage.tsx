import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ArrowLeft, BookOpen } from "@phosphor-icons/react";

const LIBRARY_ENTRIES = [
  { term: "GDP (Gross Domestic Product)", tag: "Economics", def: "The total monetary value of all goods and services produced within a country&#39;s borders in a given time period. It is the most commonly used indicator of economic size and growth." },
  { term: "HDI (Human Development Index)", tag: "Development", def: "A composite index measuring average achievement in three dimensions: a long and healthy life, knowledge, and a decent standard of living. Developed by the UNDP." },
  { term: "Gini Coefficient", tag: "Economics", def: "A statistical measure of income or wealth inequality within a population. A Gini of 0 represents perfect equality; a Gini of 1 represents maximum inequality." },
  { term: "Electoral College", tag: "Politics", def: "The body of electors established by the US Constitution to elect the President and Vice President. Each state is allocated electors equal to its total congressional representation." },
  { term: "Filibuster", tag: "Politics", def: "A prolonged speech or set of obstructive tactics used in the US Senate to delay or prevent a vote on a bill, requiring 60 votes (cloture) to overcome." },
  { term: "Purchasing Power Parity (PPP)", tag: "Economics", def: "An economic theory that compares different countries&#39; currencies through a basket of goods approach, adjusting for local price levels to enable more accurate country-to-country comparisons." },
];

const TAG_COLORS: Record<string, string> = {
  Economics: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Development: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Politics: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export function PoliticalLibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = LIBRARY_ENTRIES.filter(
    (e) =>
      e.term.toLowerCase().includes(search.toLowerCase()) ||
      e.def.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#06101f] text-white font-sans flex flex-col">
      <nav className="h-14 flex items-center px-6 border-b border-slate-800 bg-[#06101f]/90 backdrop-blur-md fixed top-0 inset-x-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors text-sm mr-4">
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
        <Globe size={20} weight="fill" className="text-sky-400 mr-2" />
        <span className="font-bold text-sm">CommonSphere</span>
      </nav>
      <main className="flex-1 flex flex-col items-center pt-14 px-6">
        <div className="max-w-3xl w-full py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Learn</span>
            <h1 className="text-4xl font-bold mt-2" style={{ fontFamily: "Georgia, serif" }}>Political Library</h1>
            <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto">A reference guide to key political, economic, and governance terms used throughout CommonSphere.</p>
          </div>
          <input
            type="search"
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1f35] border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-sky-500 mb-6 transition"
          />
          <div className="space-y-4">
            {filtered.map((entry) => (
              <div key={entry.term} className="rounded-xl border border-slate-700/60 bg-[#0d1f35]/80 p-5 hover:border-sky-500/40 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-400 shrink-0" weight="fill" />
                    <h3 className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: entry.term }} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${TAG_COLORS[entry.tag] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>{entry.tag}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: entry.def }} />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-10">No entries found for &quot;{search}&quot;</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
