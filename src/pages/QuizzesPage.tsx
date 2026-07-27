import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ArrowLeft, CheckCircle } from "@phosphor-icons/react";

const SAMPLE_QUIZ = [
  {
    question: "Which country has the highest Human Development Index (HDI)?",
    options: ["United States", "Norway", "Switzerland", "Denmark"],
    answer: 1,
  },
  {
    question: "What percentage of the world&#39;s freshwater is located in Canada?",
    options: ["7%", "14%", "20%", "30%"],
    answer: 2,
  },
  {
    question: "Which US state has the highest GDP per capita?",
    options: ["California", "New York", "Massachusetts", "Connecticut"],
    answer: 2,
  },
];

export function QuizzesPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = SAMPLE_QUIZ[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= SAMPLE_QUIZ.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

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
        <div className="max-w-xl w-full py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Learn</span>
            <h1 className="text-4xl font-bold mt-2" style={{ fontFamily: "Georgia, serif" }}>Quizzes</h1>
            <p className="text-slate-400 text-sm mt-3">Test your knowledge of world data, politics, and geography.</p>
          </div>

          {finished ? (
            <div className="rounded-2xl border border-slate-700/60 bg-[#0d1f35]/80 p-8 text-center">
              <CheckCircle size={48} weight="fill" className="text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-slate-400 text-sm mb-6">You scored <span className="text-emerald-400 font-bold">{score}</span> out of {SAMPLE_QUIZ.length}</p>
              <button
                onClick={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }}
                className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3 rounded-full text-sm transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-700/60 bg-[#0d1f35]/80 p-8">
              <div className="flex justify-between text-xs text-slate-500 mb-5">
                <span>Question {current + 1} of {SAMPLE_QUIZ.length}</span>
                <span>Score: {score}</span>
              </div>
              <h2 className="text-lg font-semibold mb-6" dangerouslySetInnerHTML={{ __html: q.question }} />
              <div className="space-y-3">
                {q.options.map((opt, idx) => {
                  let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
                  if (selected === null) {
                    cls += "border-slate-700 text-slate-300 hover:border-sky-500 hover:text-white cursor-pointer bg-[#06101f]";
                  } else if (idx === q.answer) {
                    cls += "border-emerald-500 bg-emerald-500/10 text-emerald-300 cursor-default";
                  } else if (idx === selected) {
                    cls += "border-rose-500 bg-rose-500/10 text-rose-300 cursor-default";
                  } else {
                    cls += "border-slate-800 text-slate-600 cursor-default bg-[#06101f]";
                  }
                  return (
                    <button key={idx} className={cls} onClick={() => handleSelect(idx)} dangerouslySetInnerHTML={{ __html: opt }} />
                  );
                })}
              </div>
              {selected !== null && (
                <button
                  onClick={handleNext}
                  className="mt-6 w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  {current + 1 >= SAMPLE_QUIZ.length ? "See Results" : "Next Question"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
