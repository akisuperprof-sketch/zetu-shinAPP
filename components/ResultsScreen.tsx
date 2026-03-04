import React, { useState } from 'react';
import { DiagnosisResult, RiskLevel, UploadedImage, PlanType } from '../types';
import FindingCard from './FindingCard';
import DoctorReviewForm from './DoctorReviewForm';
import { getConditionType } from '../utils/typeMapper';
import { getStreakData, getCelebrateMessage } from '../utils/streak';
import StreakBadge from './StreakBadge';
import { ShareCardData, generateShareCard, getShareMessage } from '../utils/shareCard';
import { getHistoryMini, getDelta } from '../utils/historyMini';
import { getPhase1Story } from '../utils/phase1Story';

// --- Product Design Levels: Custom Styles ---
const DESIGN_SYSTEM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;400;700;900&display=swap');
  
  .font-noto { font-family: 'Noto Sans JP', sans-serif; }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
    50% { transform: translateY(-30px) translateX(15px); opacity: 0.2; }
  }

  @keyframes orb-pulse-heavy {
    0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(111, 195, 178, 0.6); }
    70% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 0 30px rgba(111, 195, 178, 0); }
    100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(111, 195, 178, 0); }
  }

  .orb-glow-main {
    box-shadow: 0 0 30px 10px rgba(111, 195, 178, 0.4);
    background: #6FC3B2;
  }

  .particle-soft {
    position: absolute;
    border-radius: 50%;
    background: #1F3A5F;
    opacity: 0.03;
    pointer-events: none;
    z-index: 0;
  }

  .sticky-tab-shadow {
    box-shadow: 0 10px 40px -10px rgba(15, 25, 41, 0.08);
  }
`;

// --- Display Mapping for 9 Type System ---
const NINE_TYPES_CONFIG: Record<string, { label: string; research: string }> = {
  neutral: { label: '安定バランス型', research: '平和質' },
  qi_def: { label: 'チャージ不足傾向', research: '気虚質' },
  yang_def: { label: 'ウォーム不足傾向', research: '陽虚質' },
  yin_def: { label: 'うるおい不足傾向', research: '陰虚質' },
  phlegm_damp: { label: 'ため込みケア型', research: '痰湿質' },
  damp_heat: { label: 'クールダウン型', research: '湿熱質' },
  blood_stasis: { label: 'フローサポート型', research: '血瘀質' },
  qi_stag: { label: 'リラックスサポート型', research: '気鬱質' },
  special_constitution: { label: 'センシティブケア型', research: '特禀質' },
  // Map blood_def (official 9 types usually skip this or include it in yin/qi, but engine has it)
  blood_def: { label: 'うるおい不足傾向', research: '血虚' },
};

// --- Sub Components ---

const ParticleBgLight: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="particle-soft"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            animation: `float ${Math.random() * 20 + 20}s infinite ease-in-out`,
            animationDelay: `${Math.random() * -30}s`
          }}
        />
      ))}
    </div>
  );
};

const HeatmapCanvas: React.FC<{ imageUrl: string; findings: string[] }> = ({ imageUrl, findings }) => {
  const [analyzing, setAnalyzing] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 group shadow-sm border border-slate-200/50">
      <img src={imageUrl} alt="Visual Analysis" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />

      {!analyzing && (
        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply">
          <div className="absolute top-1/4 left-1/3 w-32 h-40 bg-red-400 rounded-full blur-[40px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-yellow-400 rounded-full blur-[30px] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}

      {analyzing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
          <div className="w-2 h-2 bg-jade-500 rounded-full animate-ping mb-4"></div>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Analyzing Textures...</p>
        </div>
      )}
    </div>
  );
};

const XYMapFull: React.FC<{ x: number; y: number; typeName: string }> = ({ x, y, typeName }) => {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[#F8FAFC] rounded-[4rem] p-12 overflow-hidden border border-slate-200/60 shadow-[0_45px_100px_rgba(31,58,95,0.05)] group">
      {/* Central Axis */}
      <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none opacity-40">
        <div className="w-full h-[1.5px] bg-slate-300/60"></div>
        <div className="h-full w-[1.5px] bg-slate-300/60 absolute left-1/2"></div>
      </div>

      {/* Axis Labels: Large and Clear */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between items-center z-20">
        <div className="text-[13px] font-black text-[#1F3A5F] tracking-[0.3em] uppercase">虚 (Deficiency)</div>
        <div className="w-full flex justify-between items-center px-4">
          <div className="text-[13px] font-black text-[#1F3A5F] tracking-[0.3em] uppercase origin-center -rotate-90">寒 (Cold)</div>
          <div className="text-[13px] font-black text-[#1F3A5F] tracking-[0.3em] uppercase origin-center rotate-90">熱 (Heat)</div>
        </div>
        <div className="text-[13px] font-black text-[#1F3A5F] tracking-[0.3em] uppercase">実 (Excess)</div>
      </div>

      {/* Quadrant Soft Labels */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.2] font-black text-[12px] tracking-widest text-slate-400 flex flex-wrap content-between p-20 text-center">
        <div className="w-1/2">虚寒（陽虚）</div>
        <div className="w-1/2">実寒</div>
        <div className="w-1/2 self-end">虚熱（陰虚）</div>
        <div className="w-1/2 self-end">実熱（湿熱）</div>
      </div>

      {/* User Focus Area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 opacity-10">
        <div className="w-32 h-32 bg-jade-400/20 blur-[50px] rounded-full"></div>
      </div>

      {/* Glowing Orb: User Current Position */}
      <div
        className="absolute w-12 h-12 -ml-6 -mt-6 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-40"
        style={{ left: `${50 + (x * 40)}%`, top: `${50 + (y * 40)}%` }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 bg-jade-500 rounded-full border-[4px] border-white shadow-2xl orb-glow-main" style={{ animation: 'orb-pulse-heavy 2s infinite ease-out' }}></div>
          <div className="absolute top-full mt-4 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[11px] font-black whitespace-nowrap shadow-xl">
            現在地: {typeName}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

interface ResultsScreenProps {
  result: DiagnosisResult;
  onRestart: () => void;
  uploadedImages: UploadedImage[];
  onOpenDictionary?: () => void;
  plan?: string;
  planType?: PlanType;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, uploadedImages, plan, planType }) => {
  const { findings, result_v2 } = result;
  const v2 = result_v2?.output_payload;
  const axes = v2?.axes || { xuShi: 0, heatCold: 0, zaoShi: 0 };
  const currentKey = v2?.diagnosis.top1_id || result.top3?.[0]?.id || 'neutral';

  // Resolve Naming via the Configuration
  const designConfig = NINE_TYPES_CONFIG[currentKey] || NINE_TYPES_CONFIG['neutral'];
  const conditionType = getConditionType(currentKey); // Using original for description/care

  const streak = getStreakData();
  const celebrateMsg = getCelebrateMessage(streak.streakDays);
  const isPhase1StoryEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_PHASE1_STORY_V1') === '1';
  const dummyScore = 50 + (conditionType.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 45);
  const story = isPhase1StoryEnabled ? getPhase1Story({ typeKey: currentKey, score: dummyScore, streakDays: streak.streakDays }) : null;

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'visual' | 'history'>('overview');

  const handleShareCard = async () => {
    try {
      const data: ShareCardData = {
        typeName: designConfig.label, // Use label without research name
        typeDescription: conditionType.description,
        typeCare: conditionType.care,
        score: dummyScore,
        plan: planType || 'light',
        shareQuestion: isPhase1StoryEnabled && story?.shareQuestion ? story.shareQuestion : undefined
      };
      const dataUrl = await generateShareCard(data);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `my_condition_${new Date().getTime()}.png`;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in font-noto bg-white pb-40">
      <style dangerouslySetInnerHTML={{ __html: DESIGN_SYSTEM_CSS }} />
      <ParticleBgLight />

      {/* 1. Hero Section: 80px Padding, Visual Hierarchy */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10">
        <p className="text-[#6FC3B2] text-[15px] font-black uppercase tracking-[0.5em] mb-4">今日のコンディション</p>

        <h1 className="text-[48px] font-black text-[#1F3A5F] tracking-tighter leading-tight mb-2">
          {designConfig.label}
        </h1>
        <p className="text-[18px] text-slate-400 font-bold mb-8 uppercase tracking-widest">
          ({designConfig.research})
        </p>

        <div className="inline-flex flex-col items-center mb-10">
          <div className="text-[18px] font-black text-slate-900 tracking-[0.2em] mb-1">
            SCORE <span className="text-3xl text-jade-500">{dummyScore}</span>
          </div>
          <div className="h-1 w-12 bg-jade-500/20 rounded-full"></div>
        </div>

        <p className="text-[14px] text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          {isPhase1StoryEnabled && story ? story.subLine : conditionType.description.split('。')[0] + '。'}
        </p>
      </div>

      {/* 2. Condition Map: The Protagonist (80px Spacing) */}
      <div className="max-w-4xl mx-auto px-6 mb-20 relative z-10 flex flex-col items-center">
        <XYMapFull
          x={-(axes.xuShi / 100) * 0.8}
          y={-(axes.heatCold / 100) * 0.8}
          typeName={designConfig.label}
        />
        <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Constitutional Coordinate</p>
      </div>

      {/* 3. Action Area: Share & Save */}
      <div className="max-w-xl mx-auto px-6 mb-20 flex flex-col gap-4 relative z-10">
        <button
          onClick={handleShareCard}
          className="w-full bg-[#1F3A5F] text-white font-black py-6 px-10 rounded-[2rem] shadow-[0_20px_40px_rgba(31,58,95,0.2)] hover:bg-[#162944] transition-all active:scale-[0.98] text-[15px] tracking-widest uppercase flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          結果をシェアする
        </button>
        <button
          onClick={onRestart}
          className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-slate-900 transition-colors py-4"
        >
          ← NEW SESSION
        </button>
      </div>

      {/* 4. Details Tabs: Sticky & Content (80px Spacing) */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="sticky top-6 z-50 mb-12">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-1.5 sticky-tab-shadow border border-slate-100 flex overflow-hidden">
            {[
              { id: 'overview', label: '診断概要' },
              { id: 'map', label: '体質座標' },
              { id: 'visual', label: '画像解析' },
              { id: 'history', label: '履歴' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-2 rounded-2xl text-[12px] font-black tracking-widest transition-all duration-400 ${activeTab === tab.id
                  ? 'bg-[#1F3A5F] text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="animate-fade-in-up space-y-12">
              <div className="bg-[#F8FAFC] rounded-[3rem] p-10 md:p-12 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-[1.25rem] shadow-sm border border-slate-100">
                    <svg className="w-6 h-6 text-jade-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-jade-500 uppercase tracking-[0.4em] mb-1">Expert Advice</h4>
                    <p className="text-xl font-black text-[#1F3A5F]">セルフケアの指針</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-[2] font-medium text-[15px]">
                  {conditionType.description.split('。')[1] || conditionType.description}
                </p>
              </div>

              {/* Bonus Story Hook */}
              {(isPhase1StoryEnabled && story?.hookLine) && (
                <div className="bg-slate-900 rounded-[3rem] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-jade-400 uppercase tracking-[0.5em] mb-6">Continuous Care</p>
                    <h4 className="text-2xl font-black tracking-tight leading-relaxed mb-4">
                      「{story.hookLine}」
                    </h4>
                    <div className="h-1 w-12 bg-jade-400/30 rounded-full"></div>
                  </div>
                  <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="animate-fade-in-up flex flex-col items-center py-10">
              <XYMapFull
                x={-(axes.xuShi / 100) * 0.8}
                y={-(axes.heatCold / 100) * 0.8}
                typeName={designConfig.label}
              />
              <div className="mt-12 max-w-sm text-center">
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  虚実（エネルギーの充実度）と寒熱（身体の熱バランス）を軸に、現在の傾向を観測しています。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              {uploadedImages.map((img, i) => (
                <div key={i} className="space-y-4">
                  <HeatmapCanvas imageUrl={img.previewUrl} findings={findings.map(f => f.name)} />
                  <p className="text-[10px] font-black text-slate-300 text-center uppercase tracking-[0.3em]">{img.slot}の所見解析</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in-up space-y-8">
              <div className="p-20 text-center text-slate-400 text-sm font-bold tracking-widest bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 uppercase">
                No Data to Comparison
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Footer (Dev Only) */}
      {import.meta.env.DEV && (
        <div className="mt-40 max-w-lg mx-auto p-4 text-center opacity-20 hover:opacity-100 transition-opacity">
          <div className="text-[8px] font-mono text-slate-400">
            CORE_V2: {v2?.output_version || 'LEGACY'} | AXES: X={axes.xuShi} Y={axes.heatCold}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;
