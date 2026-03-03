import { DiagnosisResult, UserInfo, LiteResult, AnalysisV2Payload } from '../../types';

/**
 * Liteプラン 解析ロジック
 * 主に「寒熱スペクトラム」の算出を担当します。
 */
export const analyzeLite = async (
    images: File[],
    userInfo: UserInfo | null,
    userRole: string = 'FREE'
): Promise<DiagnosisResult> => {
    console.log(`Running Lite Analyzer (v0.2.0) for role: ${userRole}...`);

    let spectrumValue = 0;
    if (userInfo?.answers) {
        const coldScore = Number(userInfo.answers['q3']) || 50;
        const heatScore = Number(userInfo.answers['q4']) || 50;
        spectrumValue = heatScore - coldScore; // -100 to +100
    }

    const mockLiteResult: LiteResult = {
        spectrumValue: spectrumValue,
        tongueColor: spectrumValue > 30 ? "紅 (熱傾向)" : spectrumValue < -30 ? "淡白 (寒傾向)" : "淡紅",
        coatingColor: "薄白",
        advice: "Liteプランによる簡易判定です。寒熱のバランスを意識した食事を摂りましょう。"
    };

    const heatCold = {
        score: Math.min(Math.max(Math.round(spectrumValue / 25), -3), 4),
        label: spectrumValue > 20 ? "熱傾向" : (spectrumValue < -20 ? "寒傾向" : "正常"),
        explanation: `Liteプランの解析により、寒熱バランスは ${spectrumValue} (-100〜+100) と判定されました。`
    };

    // V2 Payload for Lite Plan
    const v2Payload: AnalysisV2Payload = {
        output_version: "2.0.0-lite",
        guard: {
            level: Math.abs(heatCold.score) >= 2 ? 2 : 1,
            band: heatCold.label,
            mix: "単一傾向"
        },
        diagnosis: {
            top1_id: heatCold.score > 0 ? "P_HEAT" : (heatCold.score < 0 ? "P_COLD" : null),
            top2_id: null,
            top3_ids: []
        },
        display: {
            template_key: "standard_lite",
            show: {
                show_pattern_name: true,
                show_top3_list: false
            }
        },
        stats: {
            answered: Object.keys(userInfo?.answers || {}).length,
            total: 3 // Lite basic questions
        },
        axes: {
            xuShi: 0,
            heatCold: heatCold.score,
            zaoShi: 0
        }
    };

    console.log("[V2 OUT LITE]", { output_version: v2Payload.output_version, level: v2Payload.guard.level });

    return {
        heatCold,
        findings: [],
        liteResult: mockLiteResult,
        result_v2: {
            output_payload: v2Payload
        }
    };
};
