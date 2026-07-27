import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  ArrowLeft,
  Code,
  Key,
  Terminal,
  CheckCircle,
  CopySimple,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Lightning,
} from "@phosphor-icons/react";

const ENDPOINTS = [
  { method: "GET", path: "/v1/countries", desc: "List all countries with key indicators" },
  { method: "GET", path: "/v1/countries/:id", desc: "Single country full profile" },
  { method: "GET", path: "/v1/states", desc: "All 50 US states with statistics" },
  { method: "GET", path: "/v1/cities", desc: "Global cities dataset" },
  { method: "GET", path: "/v1/economies", desc: "Economy blocs & indicators" },
  { method: "GET", path: "/v1/conflicts", desc: "Active & resolved conflicts" },
  { method: "GET", path: "/v1/policies", desc: "Policy database with impact scores" },
];

const SAMPLE = `curl -X GET "https://api.commonsphere.io/v1/countries?limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Response
{
  "data": [
    {
      "id": "us",
      "name": "United States",
      "gdp": 29300000000000,
      "gdpGrowth": 2.8,
      "population": 335000000,
      ...
    }
  ],
  "meta": { "total": 195, "page": 1 }
}`;

export function ApiAccessPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SAMPLE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06101f] text-white font-sans flex flex-col">
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-slate-800 bg-[#06101f]/90 backdrop-blur-md fixed top-0 inset-x-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors text-sm mr-4"
        >
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
        <Globe size={20} weight="fill" className="text-sky-400 mr-2" />
        <span className="font-bold text-sm">CommonSphere</span>
        <span className="ml-2 text-slate-600 text-sm">/</span>
        <span className="ml-2 text-sky-300 text-sm font-semibold">API Access</span>
      </nav>

      <main className="flex-1 pt-14 px-6">
        <div className="max-w-5xl mx-auto py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-xs font-semibold mb-4">
              <Code size={13} /> Developer API
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
              CommonSphere API
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Access our full global dataset programmatically. Integrate country, state, economy, and policy data directly into your applications.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-500/25">
                <Key size={15} /> Get API Key
              </button>
              <button className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                <BookOpen size={15} /> Documentation
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { icon: Lightning, label: "Fast", desc: "< 80ms median latency" },
              { icon: ShieldCheck, label: "Secure", desc: "OAuth 2.0 + HTTPS" },
              { icon: Terminal, label: "RESTful", desc: "JSON • OpenAPI 3.0 spec" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-[#0d1f35]/60 p-5 text-center">
                <Icon size={22} className="text-sky-400 mx-auto mb-2" />
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-slate-400 text-xs mt-1">{desc}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Endpoints */}
            <div>
              <h2 className="text-base font-semibold mb-4 text-slate-200">Available Endpoints</h2>
              <div className="space-y-2">
                {ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-[#0d1f35]/60 px-4 py-3">
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                      {ep.method}
                    </span>
                    <div>
                      <code className="text-sky-300 text-xs font-mono">{ep.path}</code>
                      <p className="text-slate-400 text-xs mt-0.5">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code sample */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-200">Quick Start</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <CopySimple size={13} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="rounded-xl border border-slate-800 bg-[#050e1a] text-emerald-300 text-xs font-mono p-5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {SAMPLE}
              </pre>

              {/* Pricing note */}
              <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                <p className="text-xs text-violet-300 font-semibold mb-1">API Access is included in Research plan</p>
                <ul className="space-y-1">
                  {["10,000 req/month on Research plan", "Rate limit: 60 req/min", "Webhooks available on enterprise"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
