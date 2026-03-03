
import { TongueInput, HearingInput } from './coreEngine';

export function getDummyPresetData(preset: string, baseAnswers: HearingInput = {}) {
    let tongueInput: TongueInput;
    let hearingAnswers = { ...baseAnswers };
    let findings: any[] = [];

    if (preset === 'lv4') {
        tongueInput = {
            bodyColor: '絳（深紅）',
            bodyShape: ['裂紋', '痩薄', '舌下静脈怒張'],
            coatThickness: 'なし（無苔寄り）',
            moisture: '少津',
            regionMap: { root: ['絳（深紅）', 'なし（無苔寄り）', '裂紋', '少津'] }
        };
        hearingAnswers = {
            ...hearingAnswers,
            Q01: 2, Q02: 2, Q03: 2, Q14: 2, Q15: 2, Q16: 2, Q19: 2, Q20: 2,
            Q06: 0, Q07: 0, Q08: 0, Q09: 0, Q10: 0
        };
        findings = [
            { key: 'F_RED_TONGUE', name: '紅舌', riskLevel: '赤', aiExplanation: 'DUMMY LV4: 非常に強い熱感と陰液の不足が見られます。' },
            { key: 'F_CRACKS', name: '裂紋', riskLevel: '赤', aiExplanation: 'DUMMY LV4: 陰虚が進行し、栄養が組織に行き届いていない状態です。' }
        ];
    } else if (preset === 'lv3') {
        tongueInput = {
            bodyColor: '紅',
            coatColor: '白',
            coatThickness: '薄',
            moisture: '正常'
        };
        hearingAnswers = { ...hearingAnswers, Q14: 2, Q15: 1 };
        findings = [
            { key: 'F_RED_TONGUE', name: '紅舌', riskLevel: '黄', aiExplanation: 'DUMMY LV3: 全体的に赤みが強く、熱がこもっています。' }
        ];
    } else {
        tongueInput = {
            bodyColor: '淡紅',
            bodyShape: ['歯痕'],
            coatColor: '白',
            coatThickness: '薄',
            moisture: '正常'
        };
        hearingAnswers = { ...hearingAnswers, Q01: 1 };
        findings = [
            { key: 'F_TOOTH_MARKS', name: '歯痕', riskLevel: '黄', aiExplanation: 'DUMMY LV2: 縁に歯の跡が見られ、水分代謝の低下を示唆します。' }
        ];
    }

    return { tongueInput, hearingAnswers, findings };
}
