import React, { useState } from 'react';
import { DiagnosisResult, RiskLevel, UploadedImage, PlanType, UserInfo } from '../types';
import FindingCard from './FindingCard';
import { getConditionType } from '../utils/typeMapper';
import { getSession } from '../utils/userSession';
import { getStreakData, getCelebrateMessage } from '../utils/streak';
import StreakBadge from './StreakBadge';
import { ShareCardData, generateShareCard } from '../utils/shareCard';
import { getHistoryMini, getDelta } from '../utils/historyMini';
import { getPhase1Story } from '../utils/phase1Story';
import ShareCardSystem from './ShareCardSystem';
import { isFeatureEnabled } from '../utils/featureFlags';
import { ImageFeatures } from '../services/features/imageFeatures';
import ObservationInputPanel from './ObservationInputPanel';


// --- Research Minimal Style (Zetushin v1.1) ---
const RESEARCH_UI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;400;700;900&display=swap');
  
  .font-noto { font-family: 'Noto Sans JP', sans-serif; }
  
  @keyframes orb-pulse-high {
    0% { transform: scale(1); opacity: 0.7; box-shadow: 0 0 0 0 rgba(111, 195, 178, 0.4); }
    70% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 0 20px rgba(111, 195, 178, 0); }
    100% { transform: scale(1); opacity: 0.7; box-shadow: 0 0 0 0 rgba(111, 195, 178, 0); }
  }

  .sticky-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(248, 250, 252, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(31, 58, 95, 0.05);
  }
`;

// --- Type Meta for Research Mode ---
const NINE_TYPE_MAP: Record<string, { label: string; research: string }> = {
  neutral: { label: '安定バランス型', research: '平和質' },
  qi_def: { label: 'チャージ不足傾向', research: '気虚質' },
  yang_def: { label: 'ウォーム不足傾向', research: '陽虚質' },
  yin_def: { label: 'うるおい不足傾向', research: '陰虚質' },
  phlegm_damp: { label: 'ため込みケア型', research: '痰湿質' },
  damp_heat: { label: 'クールダウン型', research: '湿熱質' },
  blood_stasis: { label: 'フローサポート型', research: '血瘀質' },
  qi_stag: { label: 'リラックスサポート型', research: '気鬱質' },
  special_constitution: { label: 'センシティブケア型', research: '特禀質' },
  blood_def: { label: 'うるおい不足傾向', research: '血虚' }, // Alias for Research UI
};

// --- Sub Components ---

const HeatmapCanvas: React.FC<{ imageUrl: string; findings: string[] }> = ({ imageUrl, findings }) => {
  const [analyzing, setAnalyzing] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm group">
      <img src={imageUrl} alt="Visual Analysis" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
      {analyzing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="w-2 h-2 bg-jade-500 rounded-full animate-ping mr-3"></div>
          <p className="text-[10px] font-black tracking-widest text-[#1F3A5F] uppercase">Analyzing...</p>
        </div>
      )}
    </div>
  );
};

const CircularMap: React.FC<{ x: number; y: number; typeLabel: string }> = ({ x, y, typeLabel }) => {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-white rounded-full p-12 shadow-[0_32px_80px_rgba(31,58,95,0.03)] border border-slate-100/50 flex items-center justify-center group overflow-hidden">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[80%] h-[1px] bg-[#1F3A5F]"></div>
        <div className="h-[80%] w-[1px] bg-[#1F3A5F] absolute left-1/2"></div>
        <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#1F3A5F" strokeWidth="0.5" strokeDasharray="4 4" />
      </div>

      {/* Axis Labels */}
      <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between items-center z-10">
        <div className="text-[11px] font-black text-[#1F3A5F] tracking-widest uppercase">虚 (Deficiency)</div>
        <div className="w-full flex justify-between px-2 items-center">
          <div className="text-[11px] font-black text-[#1F3A5F] tracking-widest uppercase origin-center rotate-[-90deg]">寒 (Cold)</div>
          <div className="text-[11px] font-black text-[#1F3A5F] tracking-widest uppercase origin-center rotate-[90deg]">熱 (Heat)</div>
        </div>
        <div className="text-[11px] font-black text-[#1F3A5F] tracking-widest uppercase">実 (Excess)</div>
      </div>

      {/* Quadrant Labels */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.2] font-black text-[9px] tracking-widest text-[#1F3A5F] p-16">
        <span className="absolute top-20 left-20">虚寒 (陽虚)</span>
        <span className="absolute bottom-20 left-20">虚熱 (陰虚)</span>
        <span className="absolute top-20 right-20">実寒</span>
        <span className="absolute bottom-20 right-20">実熱 (湿熱)</span>
      </div>

      {/* Center Anchor */}
      <div className="relative z-10 text-center">
        <p className="text-[10px] text-slate-300 font-bold mb-1 uppercase tracking-widest">安定バランス</p>
      </div>

      {/* Dynamic User Pointer (Glow Orb) */}
      <div
        className="absolute w-10 h-10 -ml-5 -mt-5 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-30"
        style={{ left: `${50 + (x * 40)}%`, top: `${50 + (y * 40)}%` }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 bg-[#6FC3B2] border-2 border-white rounded-full shadow-lg" style={{ animation: 'orb-pulse-high 2s infinite ease-out' }}></div>
          {/* Tooltip */}
          <div className="absolute top-full mt-3 px-3 py-1.5 bg-[#1F3A5F] text-white rounded-xl text-[10px] font-black whitespace-nowrap shadow-xl">
            {typeLabel}
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
  userInfo?: UserInfo | null;
  onHistoryClick?: () => void;
  imageFeatures?: ImageFeatures | null;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, uploadedImages, plan, planType, userInfo, onHistoryClick, onOpenDictionary, imageFeatures }) => {
  const { findings, result_v2, isDevLocalCheck, devLocalScore } = result;
  const v2 = result_v2?.output_payload;
  const axes = v2?.axes || { xuShi: 0, heatCold: 0, zaoShi: 0 };
  const conditionType = getConditionType(v2?.diagnosis.top1_id || result.top3?.[0]?.id || null);
  const typeKey = v2?.diagnosis.top1_id || result.top3?.[0]?.id || 'neutral';
  const typeMeta = NINE_TYPE_MAP[typeKey] || NINE_TYPE_MAP['neutral'];

  let finalTypeLabel = typeMeta.label;
  let finalResearchPrefix = typeMeta.research;
  if (isDevLocalCheck && devLocalScore !== undefined) {
    if (devLocalScore < 40) {
      finalTypeLabel = "寒寄り";
    } else if (devLocalScore > 60) {
      finalTypeLabel = "熱寄り";
    } else {
      finalTypeLabel = "安定";
    }
    finalResearchPrefix = "LOCAL_MOCK";
  }

  const streak = getStreakData();
  const celebrateMsg = getCelebrateMessage(streak.streakDays);
  const isPhase1StoryEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_PHASE1_STORY_V1') === '1';
  const dummyScore = isDevLocalCheck && devLocalScore !== undefined ? devLocalScore : 50 + (conditionType.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 45);
  const story = isPhase1StoryEnabled && !isDevLocalCheck ? getPhase1Story({ typeKey: conditionType.key, score: dummyScore, streakDays: streak.streakDays }) : null;

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'visual' | 'history'>('overview');

  const handleShareCard = async () => {
    try {
      const data: ShareCardData = {
        typeName: typeMeta.label,
        typeDescription: conditionType.description,
        typeCare: conditionType.care,
        score: dummyScore,
        plan: planType || 'light',
        shareQuestion: isPhase1StoryEnabled && story?.shareQuestion ? story.shareQuestion : undefined
      };
      const dataUrl = await generateShareCard(data);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `zetu_obs_${new Date().getTime()}.png`;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in font-noto bg-[#F8FAFC] pb-40">
      <style dangerouslySetInnerHTML={{ __html: RESEARCH_UI_CSS }} />

      {/* 📡 Hero Section: 80px Spacing */}
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        {isDevLocalCheck && (
          <div className="mb-6 px-5 py-2 bg-orange-500 text-white text-[12px] font-black tracking-widest rounded-full shadow-lg border-2 border-orange-400">
            DEV LOCAL CHECK
          </div>
        )}
        <div className="text-center">
          <p className="text-[#6FC3B2] text-[13px] font-black uppercase tracking-[0.5em] mb-4">{getSession()?.nickname ? `${getSession()!.nickname}さんの` : ''}今日のコンディション</p>
          <h1 className="text-[48px] font-black text-[#1F3A5F] tracking-tighter leading-tight mb-2">
            {finalTypeLabel}
          </h1>
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-[12px] font-black tracking-widest uppercase mb-4">
              （{finalResearchPrefix}）
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-300 text-[16px] font-black italic">Score</span>
              <span className="text-[42px] font-black text-[#1F3A5F] leading-none">{dummyScore}</span>
            </div>
          </div>
          <p className="mt-8 text-slate-500 font-medium max-w-sm mx-auto leading-[1.8] text-[15px]">
            {isPhase1StoryEnabled && story ? story.subLine : conditionType.description.split('。')[0] + '。'}
          </p>
        </div>
      </div>

      {/* 🧭 Condition Map: Spaced for Hierarchy */}
      {!isDevLocalCheck && (
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <CircularMap
            x={(axes.heatCold / 100) * 0.8}
            y={(axes.xuShi / 100) * 0.8}
            typeLabel={finalTypeLabel}
          />
          <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Coordinate Analysis</p>
          </div>
        </div>
      )}

      {/* 🔮 Hirata Algorithm v0.1 Data (Feature Flagged) */}
      {isFeatureEnabled('FEATURE_HIRATA_V01') && (
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 shadow-sm">
            <h4 className="text-[12px] font-black text-indigo-800 flex items-center gap-2 mb-3 tracking-widest uppercase">
              <span className="text-[14px]">🧪</span> 平田式アルゴリズム (v0.1) 検証中
            </h4>
            <div className="text-[11px] font-medium text-slate-600 leading-relaxed">
              ※ この表示は `FEATURE_HIRATA_V01` フラグが有効な場合のみ表示されます。現在バックグラウンドで平田式オリジナル舌診アルゴリズム（寒熱虚実4分類）が稼働しています。
            </div>
          </div>
        </div>
      )}

      {/* 🔬 Observation Input UI (Feature Flagged) */}
      {isFeatureEnabled('FEATURE_OBSERVATION_INPUT') && (
        <div className="max-w-2xl mx-auto px-6 mb-12 animate-fade-in-up delay-300">
          <ObservationInputPanel analysisId={result.savedId} />
        </div>
      )}

      {/* 🎨 Color Assist UI (Feature Flagged) */}
      {isFeatureEnabled('FEATURE_COLOR_ASSIST') && imageFeatures && (
        <div className="max-w-2xl mx-auto px-6 mb-12 animate-fade-in-up delay-300">
          <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 shadow-sm relative overflow-hidden">
            <h4 className="text-[12px] font-black text-orange-800 flex items-center gap-2 mb-4 tracking-widest uppercase">
              <span className="text-[14px]">🎨</span> 色判定 観察補助 (Research/Assist)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-2xl border border-orange-50 text-center shadow-[0_2px_8px_rgba(234,88,12,0.05)]">
                <p className="text-[10px] text-orange-400 font-bold tracking-widest uppercase mb-1">R-Mean</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-[20px] font-black text-[#1F3A5F]">{imageFeatures.color_r_mean || '-'}</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-orange-50 text-center shadow-[0_2px_8px_rgba(234,88,12,0.05)]">
                <p className="text-[10px] text-orange-400 font-bold tracking-widest uppercase mb-1">G-Mean</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-[20px] font-black text-[#1F3A5F]">{imageFeatures.color_g_mean || '-'}</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-orange-50 text-center shadow-[0_2px_8px_rgba(234,88,12,0.05)]">
                <p className="text-[10px] text-orange-400 font-bold tracking-widest uppercase mb-1">B-Mean</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-[20px] font-black text-[#1F3A5F]">{imageFeatures.color_b_mean || '-'}</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-orange-50 text-center shadow-[0_2px_8px_rgba(234,88,12,0.05)]">
                <p className="text-[10px] text-red-400 font-bold tracking-widest uppercase mb-1">Redness</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-[20px] font-black text-red-500">{imageFeatures.redness_score || '-'}</p>
                </div>
              </div>
            </div>

            {/* Color Assist Reference UI */}
            <div className="bg-white/80 p-4 rounded-2xl border border-orange-100/50 mt-4">
              <p className="text-[11px] font-bold text-slate-700 mb-2">判定基準（SSOT Reference）</p>
              <div className="h-6 w-full rounded-full overflow-hidden mb-2 relative flex shadow-inner">
                {/* Visual spectrum representation matching tongue_color_spectrum.png loosely */}
                <div className="h-full flex-1" style={{ backgroundColor: '#FADEE1' }} title="淡白舌"></div>
                <div className="h-full flex-1" style={{ backgroundColor: '#F8BFC7' }} title="淡紅舌"></div>
                <div className="h-full flex-1" style={{ backgroundColor: '#E45B6B' }} title="紅舌"></div>
                <div className="h-full flex-1" style={{ backgroundColor: '#BC283A' }} title="絳舌"></div>
                <div className="h-full flex-1" style={{ backgroundColor: '#A45D8C' }} title="紫舌"></div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                ※この機能は研究者向けの観察補助（Assist）機能です。表示されている指標に基づく特定の自動診断結果・断定文を出力するものではありません。実際の判定には `project/reference/` 配下の SSOT画像 を参考に目視確認を行うか、専門家の判断を仰いでください。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 💬 Zetushin's Guidance (Character Hook) */}
      <div className="max-w-2xl mx-auto px-6 mb-20">
        <div className="bg-white rounded-[3rem] p-10 shadow-[0_20px_60px_rgba(31,58,95,0.05)] border border-slate-100 flex items-start gap-8">
          <img src="/assets/zetushin.png" alt="Zetushin" className="w-20 h-20 object-contain drop-shadow-md flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <p className="text-[11px] font-black text-[#6FC3B2] uppercase tracking-[0.4em]">💬 舌神のひとこと</p>
            <p className="text-[16px] text-[#1F3A5F] font-bold leading-relaxed">
              「今日のコンディションは{finalTypeLabel}だね。{isPhase1StoryEnabled && story?.hookLine ? story.hookLine : "身体の声に耳を傾け、大切に過ごしておくれ。"}」
            </p>
          </div>
        </div>
      </div>

      {/* 🔬 Research Participation Notice */}
      {getSession()?.researchAgreed && (
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <div className="bg-[#1F3A5F]/5 rounded-3xl p-6 border border-[#1F3A5F]/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
            <h4 className="text-[12px] font-black text-[#1F3A5F] flex items-center gap-2 mb-3 tracking-widest uppercase">
              <span className="text-[14px]">🔬</span> 東洋医学研究に参加中
            </h4>
            <div className="text-[11px] font-medium text-slate-600 leading-relaxed space-y-3">
              <p>・あなたの画像とデータは<strong>匿名化（anon_id）</strong>され、個人情報と切り離して保存されます。</p>
              <p>・アップロード前に<strong>画像位置情報（EXIF）等のメタデータは物理的に消去</strong>されています。</p>
              <p>・ご提供いただいたデータは、舌診AI精度の向上および次世代の東洋医学・予防医学エコシステム構築という<strong>重要な社会的意義</strong>のために活用されます。</p>
            </div>
          </div>
        </div>
      )}

      {/* 📲 Action Area & Diffusion Feature (Feature Flagged) */}
      <div className="max-w-xl mx-auto px-6 mb-20 flex flex-col gap-6">
        {isFeatureEnabled('FEATURE_SHARE_CARD') && (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleShareCard}
              className="w-full bg-[#1F3A5F] text-white font-black py-5 rounded-[2.5rem] shadow-2xl hover:bg-[#162944] transition-all active:scale-[0.98] text-[14px] tracking-[0.2em] uppercase flex flex-col items-center justify-center gap-1"
            >
              <span>結果カードを保存して共有</span>
              <span className="text-[9px] font-bold text-slate-300 opacity-80">(#舌診AI でシェア)</span>
            </button>
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-slate-50 relative pointer-events-none">
              <ShareCardSystem result={result} userInfo={getSession()} nickname={getSession()?.nickname || 'ゲスト'} />
            </div>
          </div>
        )}

        <button onClick={onRestart} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] py-4 hover:text-slate-600 transition-colors">
          ← START NEW OBSERVATION
        </button>
      </div>

      {/* 📑 Details Tabs: Sticky & Spaced */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-1.5 shadow-lg border border-slate-100 flex overflow-hidden mb-12 sticky top-6 z-40">
          {[
            { id: 'overview', label: '詳細概要' },
            !isDevLocalCheck && { id: 'map', label: '体質分布' },
            { id: 'visual', label: '画像解析' },
            { id: 'history', label: '履歴' }
          ].filter(Boolean).map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-2 rounded-[2rem] text-[12px] font-black tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-[#1F3A5F] text-white shadow-xl'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="animate-fade-in-up space-y-12">
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[11px] font-black text-[#6FC3B2] uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#6FC3B2] rounded-full"></span> Expert Advice
                  </h4>
                  <p className="text-[17px] text-[#1F3A5F] leading-[2] font-medium">
                    {conditionType.description.split('。')[1] || "日々の傾向を把握することで、より良いコンディション維持につながります。"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              {uploadedImages.map((img, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-4">{img.slot}の観測点</p>
                  <HeatmapCanvas imageUrl={img.previewUrl} findings={findings.map(f => f.name)} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="animate-fade-in-up flex flex-col items-center py-10">
              <CircularMap
                x={-(axes.heatCold / 100) * 0.8}
                y={-(axes.xuShi / 100) * 0.8}
                typeLabel={typeMeta.label}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in-up py-20 text-center">
              <p className="text-slate-300 font-bold uppercase tracking-[0.5em]">No Observation History Available</p>
            </div>
          )}
        </div>
      </div>

      {/* 🧪 Debug Control Center (Secret Path) */}
      {import.meta.env.DEV && (
        <div className="mt-40 max-w-lg mx-auto p-10 border border-slate-100 rounded-[3rem] bg-white opacity-20 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-mono text-slate-400 text-center mb-4">ENGINE_V2: {v2?.output_version || 'LEGACY'}</p>
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;
