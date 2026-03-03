
import React, { useState, useCallback } from 'react';
import DisclaimerScreen from './components/DisclaimerScreen';
import UserInfoScreen from './components/UserInfoScreen';
import UploadWizard from './components/UploadWizard';
import HearingScreen from './components/HearingScreen';
import AnalysisScreen from './components/AnalysisScreen';
import ResultsScreen from './components/ResultsScreen';
import HistoryScreen from './components/HistoryScreen';
import StreakBadge from './components/StreakBadge';
import FindingsDictionaryScreen from './components/FindingsDictionaryScreen';
import SettingsModal from './components/SettingsModal';
import ImageQualityGateScreen from './components/ImageQualityGateScreen';
import { AnalysisMode, AppState, DiagnosisResult, FindingResult, UploadedImage, UserInfo, Gender, ImageSlot, PlanType } from './types';
import { routeTongueAnalysis } from './services/tongueAnalyzerRouter';
import { analyzeImageQuality } from './utils/imageQualityAnalyzer';
import { saveHistory, getHistoryItem, reconstructFindings, reconstructImages, saveLastUserInfo } from './services/historyService';
import DevSettingsScreen from './components/DevSettingsScreen';
import { isDevEnabled } from './utils/devFlags';
import { colors } from './styles/tokens';
import { updateStreak } from './utils/streak';
import { pushHistoryMini } from './utils/historyMini';
import { getConditionType } from './utils/typeMapper';
import { DebugPanel } from './components/DebugPanel';
import AdminDashboard from './components/AdminDashboard';
import { saveLatestPayloadForDebug } from './utils/debugStorage';
import DevControlCenter from './components/DevControlCenter';

// Inject CSS variables from styles/tokens.ts (SSOT)
if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--c-light-primary', colors.light.primary);
  document.documentElement.style.setProperty('--c-light-secondary', colors.light.secondary);
  document.documentElement.style.setProperty('--c-pro-secondary', colors.pro.secondary);
  document.documentElement.style.setProperty('--c-pro-cta', colors.pro.cta);
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Disclaimer);
  const [analysisResult, setAnalysisResult] = useState<DiagnosisResult | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [planType, setPlanType] = useState<PlanType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('PLAN_TYPE') as PlanType) || 'light';
    }
    return 'light';
  });

  // Research Logging Dedupe Ref
  const sentResearchHashes = React.useRef<Set<string>>(new Set());

  // Settings & Dev Mode
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [devMode, setDevMode] = useState(isDevEnabled());
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.Standard);
  const [qualityReason, setQualityReason] = useState<string>("");
  const [showDevFlagBanner, setShowDevFlagBanner] = useState(false);

  // Force Pro Mode from localStorage (DEV ONLY)
  const isForcedPro = React.useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return localStorage.getItem("FORCE_PRO") === "true";
  }, []);

  const currentEffectivePlan = isForcedPro ? AnalysisMode.Pro : (devMode ? analysisMode : AnalysisMode.Standard);

  const handleAgree = useCallback(() => {
    setAppState(AppState.UserInfo);
  }, []);

  const handleUserInfoSubmit = useCallback((info: UserInfo) => {
    setUserInfo(info);
    setAppState(AppState.Uploading);
  }, []);

  // URL-based Hidden Routing for Dev Settings (/dev/settings)
  React.useEffect(() => {
    // 1. One-click Test Shortcut (DEV ONLY)
    if (import.meta.env.DEV && localStorage.getItem("DEBUG_AUTO_TEST") === "v1") {
      if (!userInfo) {
        setUserInfo({
          age: 30,
          gender: Gender.Male,
          height: 170,
          weight: 65,
          concerns: "DEBUG AUTO TEST"
        });
      }
      if (uploadedImages.length === 0) {
        setUploadedImages([
          { slot: ImageSlot.Front, file: new File([""], "dummy.jpg", { type: "image/jpeg" }), previewUrl: "/tongue_scale_chart.jpg" }
        ]);
      }
      if (appState !== AppState.Hearing && appState !== AppState.Analyzing && appState !== AppState.Results) {
        setAppState(AppState.Hearing);
      }
    }

    // Safety check for production
    if (!import.meta.env.DEV) {
      const hasForcePro = localStorage.getItem("FORCE_PRO") === "true";
      const hasDummy = localStorage.getItem("DUMMY_TONGUE") === "true";
      const hasMock = localStorage.getItem("MOCK_AI") === "true";
      const hasDebugAutoTest = localStorage.getItem("DEBUG_AUTO_TEST") === "v1";
      const hasDummyPreset = !!localStorage.getItem("DUMMY_PRESET");

      if (hasForcePro || hasDummy || hasMock || hasDebugAutoTest || hasDummyPreset) {
        console.error("CRITICAL: DEV flags detected in production! Disabling.");
        setShowDevFlagBanner(true);
        localStorage.removeItem("FORCE_PRO");
        localStorage.removeItem("DUMMY_TONGUE");
        localStorage.removeItem("MOCK_AI");
        localStorage.removeItem("DEBUG_AUTO_TEST");
        localStorage.removeItem("DUMMY_PRESET");
      }
    }

    const handleLocationCheck = () => {
      const path = window.location.pathname;
      if (path.endsWith('/dev/settings')) {
        setAppState(AppState.DevSettings);
      } else if (path.endsWith('/admin/report')) {
        setAppState(AppState.AdminDashboard);
      } else if (window.location.hash === '#dev-settings') {
        const newPath = path.includes('/app') ? '/app/dev/settings' : '/dev/settings';
        window.history.replaceState(null, '', newPath);
        setAppState(AppState.DevSettings);
      }
    };
    window.addEventListener('popstate', handleLocationCheck);
    window.addEventListener('hashchange', handleLocationCheck);
    handleLocationCheck();

    // Plan Type Sync Effect
    const handlePlanUpdate = () => {
      const stored = localStorage.getItem('PLAN_TYPE') as PlanType;
      if (stored && stored !== planType) setPlanType(stored);
    };
    window.addEventListener('storage', handlePlanUpdate);

    return () => {
      window.removeEventListener('popstate', handleLocationCheck);
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('storage', handlePlanUpdate);
    };
  }, [planType, appState]);

  // History Handlers
  const handleHistoryClick = useCallback(() => {
    setAppState(AppState.History);
  }, []);

  const handleHistoryBack = useCallback(() => {
    if (userInfo) {
      setAppState(AppState.Uploading);
    } else {
      setAppState(AppState.UserInfo);
    }
  }, [userInfo]);

  const handleSelectHistory = useCallback(async (id: string) => {
    try {
      const record = await getHistoryItem(id);
      if (record) {
        const findings = reconstructFindings(record.results);
        const images = reconstructImages(record.images);
        const result: DiagnosisResult = { findings };

        setUserInfo(record.userInfo);
        setAnalysisResult(result);
        setUploadedImages(images);
        setAppState(AppState.Results);
      }
    } catch (error) {
      console.error("Failed to load history item:", error);
      alert("履歴データの読み込みに失敗しました。");
    }
  }, []);

  // Dictionary Handlers
  const handleOpenDictionary = useCallback(() => {
    setAppState(AppState.Dictionary);
  }, []);

  const handleDictionaryBack = useCallback(() => {
    if (analysisResult) {
      setAppState(AppState.Results);
    } else {
      setAppState(AppState.Uploading);
    }
  }, [analysisResult]);

  const handleStartAnalysis = useCallback(async (images: UploadedImage[]) => {
    setUploadedImages(images);
    setAppState(AppState.Hearing);
  }, []);

  const handleHearingNext = useCallback(async (hearingAnswers: Record<string, number | null>) => {
    const isDummy = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem("DUMMY_TONGUE") === "true";

    // 1. Image Quality Guard (Skip if DUMMY)
    if (!isDummy) {
      const checkResults = await Promise.all(uploadedImages.map(async (img) => {
        return new Promise<{ ok: boolean, reason: string }>((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const tempImg = new Image();
          tempImg.onload = () => {
            canvas.width = 100;
            canvas.height = 100;
            ctx?.drawImage(tempImg, 0, 0, 100, 100);
            const imageData = ctx?.getImageData(0, 0, 100, 100);
            if (!imageData) return resolve({ ok: true, reason: "" });
            const data = imageData.data;

            // A. Brightness Check
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
              totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            const avgBrightness = totalBrightness / (data.length / 4);
            if (avgBrightness < 35) return resolve({ ok: false, reason: "画像が暗すぎます" });
            if (avgBrightness > 235) return resolve({ ok: false, reason: "画像が明るすぎます（白飛び）" });

            // B. Blur Check (Simple Laplacian Variance heuristic)
            // 3x3 Laplacian Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
            const gray = new Float32Array(100 * 100);
            for (let i = 0; i < data.length; i += 4) {
              gray[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
            }

            let lapVar = 0;
            let lapSum = 0;
            const laplacian = new Float32Array(100 * 100);
            for (let y = 1; y < 99; y++) {
              for (let x = 1; x < 99; x++) {
                const idx = y * 100 + x;
                const val = gray[idx] * -4 + gray[idx - 1] + gray[idx + 1] + gray[idx - 100] + gray[idx + 100];
                laplacian[idx] = val;
                lapSum += val;
              }
            }
            const lapAvg = lapSum / (98 * 98);
            for (let i = 0; i < laplacian.length; i++) {
              lapVar += Math.pow(laplacian[i] - lapAvg, 2);
            }
            const variance = lapVar / (98 * 98);

            console.log(`[QC] Brightness: ${avgBrightness.toFixed(1)}, BlurVar: ${variance.toFixed(1)}`);
            // Threshold 10 is very blurry for 100x100 downscale
            if (variance < 10) return resolve({ ok: false, reason: "画像がぼけています" });

            resolve({ ok: true, reason: "" });
          };
          tempImg.src = img.previewUrl;
        });
      }));

      const fail = checkResults.find(r => !r.ok);
      if (fail) {
        setQualityReason(fail.reason);
        setAppState(AppState.ImageQualityGate);
        return;
      }
    }

    setAppState(AppState.Analyzing);

    try {
      setAnalysisError(null);
      const files = uploadedImages.map(img => img.file);
      const currentMode = currentEffectivePlan;
      const userRole = localStorage.getItem('role') || 'FREE';

      const result = await routeTongueAnalysis(files, userInfo, currentMode, userRole);

      // Async Image Quality Analysis (Observation Layer) - Non-blocking
      (async () => {
        try {
          if (files[0] && result.savedId && result.result_v2?.output_payload) {
            const qualityPayload = await analyzeImageQuality(files[0]);

            fetch('/api/analyze/update_v2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                analysis_id: result.savedId,
                v2_payload: result.result_v2.output_payload,
                quality_payload: qualityPayload,
                user_role: userRole,
                img_blur_score: qualityPayload.blur_score,
                img_brightness_mean: qualityPayload.brightness_mean,
                img_saturation_mean: qualityPayload.saturation_mean,
                quality_feedback_flag: !!qualityReason
              })
            }).catch(err => console.error("Failed to update quality_payload:", err));
          }
        } catch (err) {
          console.warn("Quality assessment failed in background:", err);
        }
      })();

      if (userInfo) {
        userInfo.answers = { ...userInfo.answers, hearing: hearingAnswers };
      }

      setAnalysisResult(result);
      updateStreak();

      // Feature Flag check for History Mini
      const isHistoryMiniEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_HISTORY_MINI_V1') === '1';
      if (isHistoryMiniEnabled) {
        try {
          const typeId = result.result_v2?.output_payload?.diagnosis?.top1_id || result.top3?.[0]?.id || null;
          const conditionType = getConditionType(typeId);
          const hash = conditionType.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const score = 50 + (hash % 45); // Dummy score 50-95
          pushHistoryMini({
            score,
            typeId: typeId || undefined,
            typeLabel: conditionType.name,
            top1PatternId: typeId || undefined,
            quality_flag: !!qualityReason
          });
        } catch (e) {
          console.error("Failed to push history_mini:", e);
        }
      }

      // Always persist latest result for internal tools (Explain Tree) - Hardened v1
      if (result.result_v2?.output_payload) {
        saveLatestPayloadForDebug(result.result_v2.output_payload);
      }

      setAppState(AppState.Results);

      if (userInfo) {
        saveHistory(userInfo, result.findings, uploadedImages).catch(err => console.error("History save failed:", err));
        saveLastUserInfo(userInfo).catch(err => console.error("Last User Info save failed:", err));
      }

      // --- RESEARCH MODE (DEV ONLY) ---
      // Hard Guard 1: Runtime/Build-time environment check
      const isDevEnv = import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

      if (isDevEnv) {
        const isResearchModeEnabled = typeof window !== 'undefined' && localStorage.getItem('IS_RESEARCH_MODE') === 'true';
        const isAgreed = typeof window !== 'undefined' && localStorage.getItem('RESEARCH_AGREED') === 'true';
        const payload = result.result_v2?.output_payload;

        if (isResearchModeEnabled && isAgreed && payload) {
          const doResearchLog = async () => {
            try {
              // Deduplication Guard: Prevent double-send for the same result within 60s
              const resultHash = `${payload.diagnosis.top1_id}_${payload.guard.level}_${Math.floor(Date.now() / 60000)}`;
              const lastSentHash = sessionStorage.getItem('z26_research_last_sent_hash');

              if (lastSentHash === resultHash || sentResearchHashes.current.has(resultHash)) {
                return;
              }

              // Mark as sent immediately (both in Ref and Storage)
              sentResearchHashes.current.add(resultHash);
              sessionStorage.setItem('z26_research_last_sent_hash', resultHash);

              const { getAnonymousUserId } = await import('./utils/anonymousId');
              const anonId = getAnonymousUserId();

              // 1. Get Token securely
              const tokenRes = await fetch('/api/token', { method: 'POST' });
              if (!tokenRes.ok) {
                // If token fails, maybe allow retry? For now, just clear hash if we really want to retry, 
                // but let's just keep it simple.
                return;
              }
              const { token } = await tokenRes.json();

              // 2. Safe non-blocking fetch
              await fetch('/api/research', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  anonymous_user_id: anonId,
                  top1_id: payload.diagnosis.top1_id,
                  level: payload.guard.level,
                  current_type_label: payload.guard.band,
                  is_dummy: localStorage.getItem('DUMMY_TONGUE') === 'true',
                  app_version: '1.2.1',
                  output_version: payload.output_version,
                  age_range: userInfo?.age_range || null,
                  payload: payload
                })
              });
            } catch (err) {
              console.error('Research logging failed silently:', err);
            }
          };
          doResearchLog();
        }
      }
      // --- END RESEARCH MODE ---

    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      setAnalysisError(errorMessage);
    }
  }, [uploadedImages, userInfo, currentEffectivePlan]);

  const handleRestart = useCallback(() => {
    setAnalysisResult(null);
    setUploadedImages([]);
    setAppState(AppState.Uploading);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.Disclaimer:
        return <DisclaimerScreen onAgree={handleAgree} />;
      case AppState.UserInfo:
        return <UserInfoScreen onNext={handleUserInfoSubmit} />;
      case AppState.Uploading:
        return <UploadWizard
          onStartAnalysis={handleStartAnalysis}
          devMode={devMode}
          disabled={showDevFlagBanner || (!import.meta.env.DEV && localStorage.getItem('IS_ADMIN') !== 'true')}
          plan={currentEffectivePlan}
        />;
      case AppState.Hearing:
        return <HearingScreen onNext={handleHearingNext} onBack={() => setAppState(AppState.Uploading)} />;
      case AppState.Analyzing:
        return (
          <AnalysisScreen
            error={analysisError}
            onRetry={() => handleHearingNext(userInfo?.answers?.hearing || {})}
          />
        );
      case AppState.Results:
        return analysisResult ? (
          <ResultsScreen
            result={analysisResult}
            uploadedImages={uploadedImages}
            userInfo={userInfo}
            planType={planType}
            onHistoryClick={handleHistoryClick}
            onRestart={handleRestart}
            onOpenDictionary={handleOpenDictionary}
            plan={currentEffectivePlan}
          />
        ) : null;
      case AppState.History:
        return <HistoryScreen onSelectHistory={handleSelectHistory} onBack={handleHistoryBack} />;
      case AppState.Dictionary:
        return <FindingsDictionaryScreen onBack={handleDictionaryBack} devMode={devMode} />;
      case AppState.ImageQualityGate:
        return (
          <ImageQualityGateScreen
            reason={qualityReason}
            onRetry={() => setAppState(AppState.Uploading)}
            onViewGuide={() => alert("現在ガイドを準備中です。")}
          />
        );
      case AppState.AdminDashboard:
        return <AdminDashboard onBack={() => setAppState(AppState.Uploading)} />;
      case AppState.DevSettings:
        return (
          <DevSettingsScreen
            onBack={() => {
              setDevMode(isDevEnabled());
              setAppState(AppState.Disclaimer);
            }}
          />
        );
      default:
        return <DisclaimerScreen onAgree={handleAgree} />;
    }
  };

  const isPro = currentEffectivePlan === AnalysisMode.Pro;

  return (
    <div
      className={`min-h-screen font-sans flex flex-col items-center transition-all duration-700 ${isPro ? 'text-white' : 'text-slate-800'
        }`}
      style={{
        background: isPro
          ? `linear-gradient(135deg, ${colors.pro.bgGradientStart}, ${colors.pro.bgGradientEnd})`
          : colors.light.bg
      }}
    >
      {showDevFlagBanner && (
        <div className="w-full max-w-4xl mb-4 p-2 bg-red-600 text-white text-[10px] font-bold text-center rounded shadow-lg animate-pulse">
          ⚠️ 開発用フラグを検出しました。安全のため自動消去しましたが、再読み込みを推奨します。
        </div>
      )}
      <header className="w-full max-w-4xl mb-6 py-6 flex items-center justify-between px-4 sm:px-0">
        <div className="flex-1 text-center sm:text-left">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tighter ${isPro ? 'text-blue-300' : ''}`} style={{ color: isPro ? undefined : colors.light.primary }}>
            舌診アシスタント2025
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isPro ? 'text-blue-400/60' : 'text-slate-400'}`}>
              セルフケアのための傾向分析・補助ツール {import.meta.env.DEV && <span className="text-orange-500 font-black">[DEV]</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Unified Plan Badge */}
          <div className={`px-2 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider border transition-all flex items-center space-x-1 ${isPro
            ? (import.meta.env.DEV ? 'bg-[#0F1C2E] text-[#2E6F5E] border-[#2E6F5E] shadow-[0_0_15px_rgba(46,111,94,0.4)]' : 'bg-slate-800/50 text-white border-white/10 backdrop-blur-md')
            : (import.meta.env.DEV ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm')
            } ${import.meta.env.DEV ? 'scale-110' : ''}`}>
            <span>PLAN: {isPro ? 'PRO' : 'LIGHT'}</span>
            {import.meta.env.DEV && (
              <>
                {localStorage.getItem("FORCE_PRO") === "true" && <span className="bg-[#B84C3A] text-white px-1 rounded-[2px] ml-1 text-[8px]">TRIAL</span>}
                {localStorage.getItem("DUMMY_TONGUE") === "true" && <span className="bg-red-600 text-white px-1 rounded-[2px] ml-1 text-[8px]">DUMMY</span>}
              </>
            )}
          </div>

          <StreakBadge className="hidden sm:inline-flex" />

          {appState !== AppState.Disclaimer && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleHistoryClick}
                className="flex flex-col items-center p-2 text-brand-primary bg-white border border-brand-primary/20 rounded-lg hover:bg-brand-primary/5 transition-colors shadow-sm"
                title="履歴"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] font-bold mt-1">履歴</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex flex-col items-center p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                title="設定"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] font-bold mt-1">設定</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl z-10 flex-1 relative">
        {renderContent()}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devMode={devMode}
        setDevMode={setDevMode}
        analysisMode={analysisMode}
        setAnalysisMode={setAnalysisMode}
      />

      <footer className="w-full max-w-4xl mt-8 pb-4 text-center text-xs text-slate-500">
        <p>本アプリは医療的な診断、治療、または助言を提供するものではありません。健康上の問題については、必ず医師または他の適切な医療従事者にご相談ください。</p>
        <p className="mt-2 opacity-50">v1.2.1 {import.meta.env.DEV ? '(Development Build)' : ''}</p>
      </footer>
      <div className="fixed bottom-2 right-2 text-[10px] font-mono text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200 shadow-sm z-50 pointer-events-none">
        BUILD: 2026.03.02.01
      </div>
      <DevControlCenter />
      <DebugPanel plan={currentEffectivePlan} />
    </div >
  );
};

export default App;
