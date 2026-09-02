import { useNavigate } from "react-router-dom";
import { Globe, MapPin, ArrowLeft } from "@phosphor-icons/react";

export function USStatesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#06101f] text-white font-sans flex flex-col">
      <nav className="h-14 flex items-center px-6 border-b border-slate-800 bg-[#06101f]/90 backdrop-blur-md fixed top-0 inset-x-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors text-sm mr-4">
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
        <Globe size={20} weight="fill" className="text-sky-400 mr-2" />
        <span className="font-bold text-sm">CommonSphere</span>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-6">
        <div className="max-w-2xl w-full text-center py-20">
          <MapPin size={48} weight="fill" className="text-sky-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>US States</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Explore detailed data for all 50 US states — crime, health, education, economics, voting patterns, and governance data with side-by-side comparison tools.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-full text-sm transition-all shadow-lg shadow-sky-500/25"
          >
            Open Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
