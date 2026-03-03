import React, { useState } from 'react';
import { HEARING_QUESTIONS, HearingSlider } from './HearingSlider';

interface HearingScreenProps {
  onNext: (hearing: Record<string, number | null>) => void;
  onBack: () => void;
}

const HearingScreen: React.FC<HearingScreenProps> = ({ onNext, onBack }) => {
  const [answers, setAnswers] = useState<Partial<Record<string, number>>>({});
  const [validationError, setValidationError] = useState<string[] | null>(null);

  const handleChange = (id: string, value: number) => {
    setValidationError(null);
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  React.useEffect(() => {
    if (import.meta.env.DEV && localStorage.getItem("DEBUG_AUTO_TEST") === "v1") {
      console.warn("🚀 DEBUG_AUTO_TEST: v1 - Auto filling hearing answers...");
      const autoAnswers: Partial<Record<string, number>> = {};
      HEARING_QUESTIONS.forEach(q => {
        autoAnswers[q.id] = 1; // Mild answer for all
      });
      setAnswers(autoAnswers);
      // Delay a bit to show user the fill, then submit
      setTimeout(() => {
        localStorage.removeItem("DEBUG_AUTO_TEST"); // Clear flag
        handleNextInternal(autoAnswers);
      }, 500);
    }
  }, []);

  const handleNextInternal = (currentAnswers: Partial<Record<string, number>>) => {
    const finalAnswers: Record<string, number | null> = {};
    const ALLOWED = new Set([0, 1, 2, 3]);

    HEARING_QUESTIONS.forEach(q => {
      const v = currentAnswers[q.id];
      if (v === undefined) {
        finalAnswers[q.id] = null;
      } else {
        finalAnswers[q.id] = ALLOWED.has(v) ? v : null;
      }
    });

    console.log("Submitting Hearing Answers (AUTO-TEST):", finalAnswers);
    onNext(finalAnswers);
  };

  const handleNext = () => {
    handleNextInternal(answers);
  };

  const answeredCount = HEARING_QUESTIONS.filter(q => answers[q.id] !== undefined).length;
  const unansweredCount = HEARING_QUESTIONS.length - answeredCount;
  const isComplete = unansweredCount === 0;

  console.log("answered:", answeredCount, "unanswered:", unansweredCount);

  return (
    <div className="bg-slate-50/50 p-6 sm:p-10 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.05)] border border-white animate-fade-in relative max-w-2xl w-full mx-auto backdrop-blur-sm">
      {/* Progress Bar Header: Refined */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Research Discovery</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 02: 体調ヒアリング</p>
          </div>
          <span className="text-[10px] font-black text-brand-primary bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm transition-all hover:scale-105">
            PROGRESS: {answeredCount} / {HEARING_QUESTIONS.length}
          </span>
        </div>
        <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
          <div
            className="h-full bg-slate-900 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{ width: `${(answeredCount / HEARING_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-4 font-bold flex items-center gap-2">
          <span className="w-1 h-1 bg-jade-400 rounded-full"></span>
          正確な学術的観測のため、直感的に現在の状態をご回答ください。
        </p>
      </div>

      {validationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold animate-shake">
          <p className="mb-1 uppercase tracking-widest">⚠️ Unanswered items remain</p>
          <p className="opacity-80">※以下の項目の回答を推奨します: {validationError.join(', ')}</p>
        </div>
      )}

      <div className="max-h-[500px] overflow-y-auto mb-10 pr-2 custom-scrollbar space-y-4" id="hearing-list">
        {HEARING_QUESTIONS.map(q => (
          <div key={q.id} id={`q-${q.id}`}>
            <HearingSlider
              question={q}
              value={answers[q.id]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      {/* Helper for long lists: jump to next unanswered */}
      {unansweredCount > 0 && answeredCount > 0 && (
        <button
          onClick={() => {
            const nextUnanswered = HEARING_QUESTIONS.find(q => answers[q.id] === undefined);
            if (nextUnanswered) {
              const el = document.getElementById(`q-${nextUnanswered.id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className="w-full mb-8 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>↓ </span>
          次の未回答の設問へジャンプ
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onBack}
          className="w-full sm:w-[30%] bg-white text-slate-400 font-black text-xs py-4 px-6 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
        >
          BACK / 戻る
        </button>
        {unansweredCount > 0 && (
          <button
            onClick={handleNext}
            className="w-full sm:w-[70%] bg-slate-900 text-white font-black text-sm py-4 px-6 rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>一部未回答のまま次へ</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
        {unansweredCount === 0 && (
          <button
            onClick={handleNext}
            className="w-full sm:w-[70%] bg-brand-primary text-white font-black text-sm py-4 px-6 rounded-2xl hover:opacity-90 shadow-2xl shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>START ANALYSIS / 解析を開始</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>

      {!isComplete && (
        <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed font-medium">未回答の項目は、舌画像からの観測データで補完されます。<br />可能な限り回答することで、より多角的な分析結果が得られます。</p>
      )}
    </div>
  );
};

export default HearingScreen;
