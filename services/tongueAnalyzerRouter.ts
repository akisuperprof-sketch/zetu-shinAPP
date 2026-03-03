
import { DiagnosisResult, UserInfo, AnalysisMode } from '../types';
import { analyzeLegacy } from './analyzers/legacy';
import { analyzeLite } from './analyzers/lite';
import { analyzePro } from './analyzers/pro';
import { analyzeAcademic } from './analyzers/academic';
import { isDevEnabled, getSelectedPlan } from '../utils/devFlags';
import { logV2Scoreboard } from './analyzers/debugScoreboard';
import { getDummyPresetData } from './analyzers/dummyPresets';

/**
 * 舌診解析ルーター
 */
export const routeTongueAnalysis = async (
    images: File[],
    userInfo: UserInfo | null,
    mode: AnalysisMode,
    userRole: string = 'FREE'
): Promise<DiagnosisResult> => {
    const isDummy = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem("DUMMY_TONGUE") === "true";

    if (isDummy) {
        if (import.meta.env.DEV) {
            const preset = localStorage.getItem("DUMMY_PRESET") || "lv2";
            const dummy = getDummyPresetData(preset, userInfo?.answers || {});

            console.group("🚀 [CORE ANALYSIS INPUT] (DUMMY MODE)");
            console.log("coreEngineInput:", {
                selected_level: preset,
                tongue: dummy.tongueInput,
                hearing: dummy.hearingAnswers
            });
            console.groupEnd();

            // スコアボード出力
            logV2Scoreboard(dummy.tongueInput, dummy.hearingAnswers);
        }

        console.warn('🚀 [ROUTER] DUMMY MODE ACTIVE - Bypassing real API');
        return analyzePro(images, userInfo);
    }

    // デフォルトプラン設定等
    if (isDevEnabled()) {
        const selectedPlan = getSelectedPlan();
        switch (selectedPlan) {
            case 'lite': return analyzeLite(images, userInfo, userRole);
            case 'pro': return analyzePro(images, userInfo, userRole);
            case 'academic': return analyzeAcademic(images, userInfo, userRole);
            case 'legacy': return analyzeLegacy(images, userInfo, mode);
        }
    }

    if (mode === AnalysisMode.Pro) {
        return analyzePro(images, userInfo, userRole);
    }

    return analyzeLite(images, userInfo, userRole);
};
