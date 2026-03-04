import React, { useState } from 'react';
import { DiagnosisResult, RiskLevel, UploadedImage, PlanType } from '../types';
import FindingCard from './FindingCard';
import { YIN_DEF_IDS } from '../constants/patternGroups';
import DoctorReviewForm from './DoctorReviewForm';
import { getConditionType } from '../utils/typeMapper';
import { getStreakData, getCelebrateMessage } from '../utils/streak';
import StreakBadge from './StreakBadge';
import { ShareCardData, generateShareCard } from '../utils/shareCard';
import { getHistoryMini, getDelta } from '../utils/historyMini';
import { getPhase1Story } from '../utils/phase1Story';
import { mapZaoShiToLabel } from '../constants/zaoShiLabels';

// --- Quiet Future: Custom Styles ---
const QUIET_FUTURE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;400;700;900&display=swap');
  
  .font-noto { font-family: 'Noto Sans JP', sans-serif; }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
    50% { transform: translateY(-30px) translateX(15px); opacity: 0.2; }
  }

  @keyframes orb-pulse {
    0% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
    70% { transform: scale(1.5); opacity: 0; box-shadow: 0 0 0 20px rgba(52, 211, 153, 0); }
    100% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
  }

  .orb-glow {
    box-shadow: 0 0 20px 5px rgba(52, 211, 153, 0.5);
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    background: white;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }

  .qi-node-active {
    box-shadow: 0 0 20px rgba(24, 183, 165, 0.4);
    transform: scale(1.15);
  }
`;

// --- Sub Components ---

const ParticleBg: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
            animationDelay: `${Math.random() * -20}s`
          }}
        />
      ))}
    </div>
  );
};

const HeatmapCanvas: React.FC<{ imageUrl: string; findings: string[] }> = ({ imageUrl, findings }) => {
  const [analyzing, setAnalyzing] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden bg-slate-900 group shadow-2xl">
      <img src={imageUrl} alt="Analysis Result" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" />

      {!analyzing && (
        <div className="absolute inset-4 pointer-events-none opacity-40 mix-blend-screen">
          <div className="absolute top-1/4 left-1/3 w-32 h-40 bg-red-400/40 rounded-full blur-[40px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-yellow-400/30 rounded-full blur-[30px] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-16 bg-blue-400/20 rounded-full blur-[50px] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}

      {analyzing && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center z-20">
          <div className="w-1.5 h-1.5 bg-jade-400 rounded-full animate-ping mb-6 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
          <p className="text-[10px] font-black tracking-[0.6em] text-jade-300 uppercase">Analysis Rendering...</p>
        </div>
      )}
    </div>
  );
};

const QiMap: React.FC<{ currentTypeKey: string; onSelect: (key: string) => void }> = ({ currentTypeKey, onSelect }) => {
  const types = [
    { key: 'qi_def', name: '気虚', icon: '🔋' },
    { key: 'yang_def', name: '陽虚', icon: '☀️' },
    { key: 'yin_def', name: '陰虚', icon: '💧' },
    { key: 'blood_def', name: '血虚', icon: '🍇' },
    { key: 'neutral', name: '平和', icon: '✨' },
    { key: 'qi_stag', name: '気滞', icon: '🍃' },
    { key: 'blood_stasis', name: '血お', icon: '🔄' },
    { key: 'phlegm_damp', name: '痰湿', icon: '☁️' },
    { key: 'damp_heat', name: '湿熱', icon: '🌡️' },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center p-8 bg-[#111C2E] rounded-[3rem] shadow-[0_32px_80px_rgba(17,28,46,0.1)] border border-white/[0.03] overflow-hidden font-noto">
      <ParticleBg />
      <div className="absolute inset-0 bg-radial-gradient from-[#111C2E] via-[#0E1624] to-[#0A101A] opacity-90"></div>

      <div className="relative z-10 text-center">
        <p className="text-[10px] text-blue-300/40 font-black uppercase tracking-[0.4em] mb-1">Observation</p>
        <h4 className="text-xl font-black text-white tracking-widest leading-none">今日の気の地図</h4>
      </div>

      <div className="absolute inset-0">
        {types.map((t, idx) => {
          const angle = (idx * 360) / 9;
          const x = 50 + 38 * Math.cos((angle - 90) * (Math.PI / 180));
          const y = 50 + 38 * Math.sin((angle - 90) * (Math.PI / 180));
          const isActive = t.key === currentTypeKey;

          return (
            <div
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={`absolute -ml-6 -mt-6 w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-700 ease-out z-20 ${isActive
                ? 'bg-jade-500 text-white shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-125 ring-4 ring-white/10'
                : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
                }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="text-lg">{t.icon}</span>
              <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black whitespace-nowrap transition-colors tracking-widest ${isActive ? 'text-jade-400' : 'text-white/20'}`}>
                {t.name}
              </span>
            </div>
          );
        })}
      </div>

      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
        <circle cx="50%" cy="50%" r="38%" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};

const XYMap: React.FC<{ x: number; y: number; typeName: string }> = ({ x, y, typeName }) => {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[#F8FAFC] rounded-[4rem] p-12 overflow-hidden border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
      {/* Central Guide Labels */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <div className="text-[10px] font-black text-slate-300/40 uppercase tracking-[0.4em] mb-1">あなたの現在地</div>
        <div className="text-xl font-black text-slate-200 tracking-tighter uppercase">{typeName}</div>
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none opacity-40">
        <div className="w-full h-[1px] bg-slate-300/50"></div>
        <div className="h-full w-[1px] bg-slate-300/50 absolute left-1/2"></div>
      </div>

      {/* Axis Labels */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between items-center z-10">
        <div className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">虚 (Deficiency)</div>
        <div className="w-full flex justify-between items-center px-2">
          <div className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase origin-center -rotate-90">寒 (Cold)</div>
          <div className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase origin-center rotate-90">熱 (Heat)</div>
        </div>
        <div className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">実 (Excess)</div>
      </div>

      {/* Quadrant Soft Labels */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] font-black text-lg tracking-[0.5em] text-slate-900 flex flex-wrap content-between p-16">
        <div className="w-1/2 text-left">虚寒</div>
        <div className="w-1/2 text-right">実寒</div>
        <div className="w-1/2 text-left self-end">虚熱</div>
        <div className="w-1/2 text-right self-end">実熱</div>
      </div>

      {/* Glowing Orb Animation Wrapper */}
      <div
        className="absolute w-10 h-10 -ml-5 -mt-5 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-30"
        style={{ left: `${50 + (x * 40)}%`, top: `${50 + (y * 40)}%` }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Glowing Center */}
          <div className="w-4 h-4 bg-jade-400 rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(52,211,153,0.6)] orb-glow"></div>

          {/* Pulse Ripple Effect */}
          <div className="absolute inset-0 bg-jade-400 rounded-full" style={{ animation: 'orb-pulse 2s infinite ease-out' }}></div>
          <div className="absolute inset-0 bg-jade-400 rounded-full scale-125 opacity-10"></div>

          {/* Label Tooltip */}
          <div className="absolute bottom-full mb-4 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black whitespace-nowrap shadow-2xl animate-fade-in-up">
            NOW: {typeName}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Components ---

interface ResultsScreenProps {
  result: DiagnosisResult;
  onRestart: () => void;
  uploadedImages: UploadedImage[];
  onOpenDictionary?: () => void;
  plan?: string;
  planType?: PlanType;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, uploadedImages, onOpenDictionary, plan, planType }) => {
  const { findings, heatCold, result_v2 } = result;
  const v2 = result_v2?.output_payload;
  const activePlan = planType || 'light';
  const isPro = plan === 'pro' || activePlan === 'pro_personal';
  const axes = v2?.axes || { xuShi: 0, heatCold: 0, zaoShi: 0 };
  const conditionType = getConditionType(v2?.diagnosis.top1_id || result.top3?.[0]?.id || null);
  const streak = getStreakData();
  const celebrateMsg = getCelebrateMessage(streak.streakDays);
  // @ts-ignore
  const v2Incomplete = !!v2 && (!v2.diagnosis.top1_id || v2.diagnosis.top3_ids.length === 0);
  const dataPathUsed = v2 ? "V2" : (result.guard ? "LEGACY" : "NONE");

  const isPhase1StoryEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_PHASE1_STORY_V1') === '1';
  const dummyScore = 50 + (conditionType.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 45);
  const story = isPhase1StoryEnabled ? getPhase1Story({ typeKey: conditionType.key, score: dummyScore, streakDays: streak.streakDays }) : null;

  const isHistoryMiniEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_HISTORY_MINI_V1') === '1';
  const historyMini = isHistoryMiniEnabled ? getHistoryMini() : [];

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'visual' | 'history'>('overview');
  // @ts-ignore
  const [selectedGridKey, setSelectedGridKey] = useState<string | null>(null);

  const concerningFindings = findings.filter(f => f.riskLevel === RiskLevel.Red || f.riskLevel === RiskLevel.Yellow);

  const handleShareCard = async () => {
    try {
      const data: ShareCardData = {
        typeName: conditionType.name,
        typeDescription: conditionType.description,
        typeCare: conditionType.care,
        score: dummyScore,
        plan: isPro ? 'pro' : 'light',
        shareQuestion: isPhase1StoryEnabled && story?.shareQuestion ? story.shareQuestion : undefined
      };
      const dataUrl = await generateShareCard(data);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `tongue_obs_${new Date().getTime()}.png`;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in font-noto bg-white pb-32">
      <style dangerouslySetInnerHTML={{ __html: QUIET_FUTURE_CSS }} />

      {/* 📡 Hero Section: Enhanced XY Map as Protagonist */}
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        <div className="w-full flex flex-col items-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 mb-12 shadow-sm">
            <span className="w-2 h-2 bg-jade-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Constitution Mapping</span>
          </div>

          <XYMap x={-(axes.xuShi / 100) * 0.8} y={-(axes.heatCold / 100) * 0.8} typeName={conditionType.name} />

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">推定体質タイプ</p>
            <h2 className="text-[48px] font-black tracking-tighter leading-tight text-slate-900">
              {conditionType.name}
            </h2>
            <p className="mt-6 text-slate-500 font-medium max-w-md mx-auto leading-relaxed text-sm">
              {isPhase1StoryEnabled && story ? story.subLine : conditionType.description.split('。')[0] + '。'}
            </p>
          </div>
        </div>
      </div>

      {/* 📑 Tab Navigation */}
      <div className="max-w-4xl mx-auto px-6 mb-20 sticky top-6 z-40">
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 flex overflow-hidden">
          {[
            { id: 'overview', label: '分析概要' },
            { id: 'visual', label: '画像解析' },
            { id: 'history', label: '経過履歴' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-2 rounded-2xl text-[12px] font-black tracking-widest transition-all duration-300 ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🧩 Tab Content: Spaced for clarity */}
      <div className="max-w-4xl mx-auto px-6 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up space-y-20">
            {/* 🎰 Streak / Hook Section */}
            {((streak.active && streak.streakDays > 0) || (isPhase1StoryEnabled && story?.hookLine)) && (
              <div className="flex flex-col items-center bg-slate-50 rounded-[3rem] p-10 border border-slate-100/60 shadow-inner">
                {streak.active && streak.streakDays > 0 && <StreakBadge className="scale-110 mb-6" />}
                <div className="px-8 py-3 bg-white border border-slate-100 text-slate-900 font-black rounded-full text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-jade-400 rounded-full"></span> {celebrateMsg || story?.hookLine}
                </div>
              </div>
            )}

            {/* Observation Detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div className="bg-[#F8FAFC] rounded-[3rem] p-10 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-jade-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Expert Guide</p>
                    <h4 className="text-xl font-black text-slate-900">セルフケアの指針</h4>
                  </div>
                </div>
                <p className="text-slate-600 leading-[1.8] font-medium text-[15px]">
                  {conditionType.description.split('。')[1]}
                </p>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden h-full">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.4em] mb-8">Selective Insight</p>
                  <div className="space-y-8">
                    <div>
                      <span className="text-[10px] text-jade-400 font-black mb-2 block uppercase tracking-widest opacity-60">【 主証判定 】</span>
                      <span className="text-2xl font-black text-white leading-tight block">
                        {v2?.guard.primaryPatternName || result.top3?.[0]?.name || "特定中"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-300/40 mb-2 block uppercase tracking-widest">Message</span>
                      <p className="text-[15px] text-slate-300 leading-relaxed font-medium">
                        「{v2?.guard.message || result.guard?.message || "身体のバランスを整えましょう。"}」
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="animate-fade-in-up space-y-12">
            <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
              <div className="text-center mb-12">
                <h3 className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase mb-3">Visual Analysis</h3>
                <div className="text-3xl font-black text-slate-900 tracking-tight">舌の微細解析</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {uploadedImages.map((url, idx) => (
                  <HeatmapCanvas key={idx} imageUrl={url.previewUrl} findings={concerningFindings.map(f => f.name)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in-up space-y-12">
            {historyMini.length > 0 ? (
              <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100">
                <div className="text-center mb-12">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase mb-3">Observation History</h3>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">観測の軌跡</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {historyMini.map((h, i) => {
                    const delta = i < historyMini.length - 1 ? getDelta(h.score, historyMini[i + 1].score) : '→';
                    const date = new Date(h.ts);
                    return (
                      <div key={i} className={`p-8 rounded-[2.5rem] bg-white border transition-all duration-500 ${i === 0 ? 'border-jade-200 shadow-xl' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[9px] font-black text-slate-300">{`${date.getMonth() + 1}/${date.getDate()}`}</span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mb-2 truncate">{h.typeLabel}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">{h.score}</span>
                          <span className={`text-[12px] font-black ${delta === '↑' ? 'text-jade-500' : delta === '↓' ? 'text-red-500' : 'text-slate-300'}`}>{delta}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center text-slate-400 font-medium">
                解析履歴がまだありません。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📲 Actions: 80px space from content */}
      <div className="max-w-xl mx-auto px-6 mt-20 flex flex-col gap-6">
        <button onClick={handleShareCard} className="w-full bg-slate-900 text-white font-black py-6 px-10 rounded-3xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] text-sm tracking-widest uppercase">
          カードを保存して共有
        </button>
        <button onClick={onRestart} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-slate-900 transition-colors">
          ← START NEW SESSION
        </button>
      </div>

      {/* 🧪 Debug */}
      {import.meta.env.DEV && (
        <div className="mt-32 max-w-lg mx-auto p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-[9px] font-mono text-slate-300 text-center">
          SsoT Path: {dataPathUsed} | Version: {v2?.output_version || "LEGACY"}
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;
