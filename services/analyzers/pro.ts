
import { DiagnosisResult, UserInfo, TongueInput, AnalysisMode, AnalysisV2Payload } from '../../types';
import { analyzeCore } from './coreEngine';
import { analyzeTongueHealth } from '../geminiService';
import { getDummyPresetData } from './dummyPresets';

/**
 * Proプラン 解析ロジック (v2)
 * 証判定推論エンジン連動
 */
export const analyzePro = async (
    images: File[],
    userInfo: UserInfo | null,
    userRole: string = 'FREE'
): Promise<DiagnosisResult> => {
    console.log('Running Pro (v2) Analyzer...');

    let tongueInput: TongueInput;
    let hearingAnswers = userInfo?.answers || {};
    let v2RawBase: any = { findings: [] };

    const isDummy = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem("DUMMY_TONGUE") === "true";

    if (isDummy) {
        const preset = localStorage.getItem("DUMMY_PRESET") || "lv2";
        const dummy = getDummyPresetData(preset, userInfo?.answers || {});
        tongueInput = dummy.tongueInput;
        hearingAnswers = dummy.hearingAnswers;
        v2RawBase.findings = dummy.findings;
    } else {
        // Normal Flow
        const v2Raw = await analyzeTongueHealth(images, userInfo, AnalysisMode.Pro, userRole);
        v2RawBase = v2Raw;

        tongueInput = (v2Raw as any).tongueInput || {
            bodyColor: '淡紅',
            coatColor: '白',
            coatThickness: '薄',
            moisture: '正常',
            regionMap: {}
        };
    }

    // 4. coreEngine による論理推論実行
    const coreOutput = analyzeCore(tongueInput, hearingAnswers);

    // 5. v2 ペイロードの構築 (Single Source of Truth)
    const v2Payload: AnalysisV2Payload = {
        output_version: isDummy ? `Z26_P2_v1-dummy-${localStorage.getItem("DUMMY_PRESET")}` : "Z26_P2_v1",
        guard: {
            level: coreOutput.guard.level,
            band: coreOutput.guard.levelLabel,
            mix: coreOutput.guard.tendency
        },
        diagnosis: {
            top1_id: coreOutput.top3[0]?.id || null,
            top2_id: coreOutput.top3[1]?.id || null,
            top3_ids: coreOutput.top3.map(p => p.id)
        },
        display: {
            template_key: coreOutput.guard.level >= 2 ? "standard_pro" : "neutral_pro",
            show: {
                show_pattern_name: coreOutput.guard.level >= 2,
                show_top3_list: coreOutput.guard.level >= 2 && coreOutput.top3.length === 3
            }
        },
        stats: {
            answered: Object.keys(hearingAnswers).length,
            total: 20
        },
        axes: {
            xuShi: coreOutput.axes.X_final,
            heatCold: coreOutput.axes.Y_final,
            zaoShi: coreOutput.axes.Z_final
        }
    };

    return {
        ...v2RawBase,
        guard: coreOutput.guard,
        top3: coreOutput.top3,
        result_v2: {
            output_payload: v2Payload
        }
    };
};
