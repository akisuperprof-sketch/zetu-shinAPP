
import { TongueInput, HearingInput, calculateTongueScore, calculateHearingScore, inferRegion } from './coreEngine';

/**
 * [TASK 2: Recommended A] 
 * coreEngineの不変性を保つため、DEV/DEBUG専用の定数とロジックをreadonly複製。
 * 本番のコードパス（analyzeCore等）からは、このファイルは参照されない（if (import.meta.env.DEV) に閉じる設計）。
 */

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

function axisMatch(value: number, need: 'V' | 'J' | 'C' | 'H' | 'M' | 'D' | '0') {
    if (need === 'V') return clamp(value / 100, 0, 1);
    if (need === 'J') return clamp((-value) / 100, 0, 1);
    if (need === 'C') return clamp(value / 100, 0, 1);
    if (need === 'H') return clamp((-value) / 100, 0, 1);
    if (need === 'M') return clamp(value / 100, 0, 1);
    if (need === 'D') return clamp((-value) / 100, 0, 1);
    return 1 - Math.min(Math.abs(value) / 100, 1);
}

const DEBUG_PATTERNS = [
    { id: 'P_LUNG_QI_DEF', name: '肺気虚', needX: 'V', needY: '0', needZ: '0', region: 'tip' },
    { id: 'P_LUNG_YIN_DEF', name: '肺陰虚', needX: 'V', needY: 'H', needZ: 'D', region: 'tip' },
    { id: 'P_WIND_COLD_LUNG', name: '風寒犯肺', needX: 'J', needY: 'C', needZ: '0', region: 'tip' },
    { id: 'P_WIND_HEAT_LUNG', name: '風熱犯肺', needX: 'J', needY: 'H', needZ: '0', region: 'tip' },
    { id: 'P_PHLEGM_DAMP_LUNG', name: '痰湿阻肺', needX: 'J', needY: '0', needZ: 'M', region: 'tip' },
    { id: 'P_LI_DAMP_HEAT', name: '大腸湿熱', needX: 'J', needY: 'H', needZ: 'M', region: 'root' },
    { id: 'P_LI_FLUID_DEF', name: '大腸津虚', needX: 'V', needY: 'H', needZ: 'D', region: 'root' },
    { id: 'P_LI_QI_DEF', name: '大腸気虚', needX: 'V', needY: '0', needZ: '0', region: 'root' },
    { id: 'P_SPLEEN_QI_DEF', name: '脾気虚', needX: 'V', needY: '0', needZ: 'M', region: 'center' },
    { id: 'P_SPLEEN_YANG_DEF', name: '脾陽虚', needX: 'V', needY: 'C', needZ: 'M', region: 'center' },
    { id: 'P_COLD_DAMP_SPLEEN', name: '寒湿困脾', needX: '0', needY: 'C', needZ: 'M', region: 'center' },
    { id: 'P_DAMP_HEAT_SP_ST', name: '脾胃湿熱', needX: 'J', needY: 'H', needZ: 'M', region: 'center' },
    { id: 'P_STOMACH_YIN_DEF', name: '胃陰虚', needX: 'V', needY: 'H', needZ: 'D', region: 'center' },
    { id: 'P_STOMACH_COLD', name: '胃寒', needX: '0', needY: 'C', needZ: '0', region: 'center' },
    { id: 'P_STOMACH_HEAT', name: '胃熱', needX: 'J', needY: 'H', needZ: 'D', region: 'center' },
    { id: 'P_HEART_QI_DEF', name: '心気虚', needX: 'V', needY: '0', needZ: '0', region: 'tip' },
    { id: 'P_HEART_BLOOD_DEF', name: '心血虚', needX: 'V', needY: '0', needZ: 'D', region: 'tip' },
    { id: 'P_HEART_YIN_DEF', name: '心陰虚', needX: 'V', needY: 'H', needZ: 'D', region: 'tip' },
    { id: 'P_HEART_FIRE', name: '心火亢盛', needX: 'J', needY: 'H', needZ: 'D', region: 'tip' },
    { id: 'P_HEART_BLOOD_STASIS', name: '心血瘀', needX: 'J', needY: '0', needZ: '0', region: 'tip' },
    { id: 'P_SI_HEAT', name: '小腸実熱', needX: 'J', needY: 'H', needZ: 'D', region: 'tip' },
    { id: 'P_SI_COLD_DEF', name: '小腸虚寒', needX: 'V', needY: 'C', needZ: '0', region: 'center' },
    { id: 'P_KIDNEY_YANG_DEF', name: '腎陽虚', needX: 'V', needY: 'C', needZ: 'M', region: 'root' },
    { id: 'P_KIDNEY_YIN_DEF', name: '腎陰虚', needX: 'V', needY: 'H', needZ: 'D', region: 'root' },
    { id: 'P_KIDNEY_ESS_DEF', name: '腎精不足', needX: 'V', needY: '0', needZ: '0', region: 'root' },
    { id: 'P_KIDNEY_QI_NOT_FIRM', name: '腎気不固', needX: 'V', needY: '0', needZ: '0', region: 'root' },
    { id: 'P_BLADDER_DAMP_HEAT', name: '膀胱湿熱', needX: 'J', needY: 'H', needZ: 'M', region: 'root' },
    { id: 'P_LIVER_QI_STAG', name: '肝気鬱結', needX: '0', needY: '0', needZ: '0', region: 'side' },
    { id: 'P_LIVER_FIRE', name: '肝火上炎', needX: 'J', needY: 'H', needZ: 'D', region: 'side' },
    { id: 'P_LIVER_YANG_RISING', name: '肝陽上亢', needX: '0', needY: 'H', needZ: 'D', region: 'side' },
    { id: 'P_LIVER_BLOOD_DEF', name: '肝血虚', needX: 'V', needY: '0', needZ: 'D', region: 'side' },
    { id: 'P_LIVER_YIN_DEF', name: '肝陰虚', needX: 'V', needY: 'H', needZ: 'D', region: 'side' },
    { id: 'P_LIVER_GB_DAMP_HEAT', name: '肝胆湿熱', needX: 'J', needY: 'H', needZ: 'M', region: 'side' },
    { id: 'P_COLD_STAGN_LIVER', name: '寒滞肝脈', needX: '0', needY: 'C', needZ: '0', region: 'side' }
];

export function logV2Scoreboard(tongue: TongueInput, hearing: HearingInput) {
    if (!import.meta.env.DEV) return;

    const { X_tongue, Y_tongue, Z_tongue } = calculateTongueScore(tongue);
    const { X_hear, Y_hear, Z_hear, nTotal } = calculateHearingScore(hearing);

    const hear_coverage = nTotal / 20;
    const w_hear = 0.3 * clamp(hear_coverage / 0.6, 0, 1);
    const w_tongue = 1 - w_hear;

    const X_final = Math.round(w_tongue * X_tongue + w_hear * X_hear);
    const Y_final = Math.round(w_tongue * Y_tongue + w_hear * Y_hear);
    const Z_final = Math.round(w_tongue * Z_tongue + w_hear * Z_hear);

    const inferredRegion = inferRegion(tongue);

    const candidateScores = DEBUG_PATTERNS.map(pattern => {
        const mX = axisMatch(X_final, pattern.needX as any);
        const mY = axisMatch(Y_final, pattern.needY as any);
        const mZ = axisMatch(Z_final, pattern.needZ as any);
        const mR = (pattern.region === 'any' || inferredRegion === pattern.region) ? 1 : 0;

        let score = 35 * mX + 35 * mY + 20 * mZ + 10 * mR;

        // Rule A
        if (pattern.id === 'P_LIVER_QI_STAG') {
            const q10 = hearing['Q10'] || 0;
            const q07 = hearing['Q07'] || 0;
            if ((q10 >= 1 || q07 >= 1) && inferredRegion === 'side' && X_final >= -10 && X_final <= 10) {
                score += 8;
            }
        }
        // Rule B
        if (pattern.id === 'P_HEART_BLOOD_STASIS') {
            const hasPurple = tongue.bodyColor === '紫';
            const hasStasis = tongue.bodyShape?.includes('瘀点') || tongue.bodyShape?.includes('舌下静脈怒張');
            if (hasPurple || hasStasis) {
                score += 12;
            }
        }
        // Rule C
        if (pattern.id === 'P_COLD_DAMP_SPLEEN') {
            const isThick = tongue.coatThickness === '厚' || tongue.coatThickness === 'なし（無苔寄り）' || tongue.coatTexture?.includes('膩') || tongue.coatTexture?.includes('滑');
            if (isThick && Y_final >= 10) {
                score += 8;
            }
        }

        score = clamp(Math.round(score), 0, 100);

        return {
            id: pattern.id,
            name: pattern.name,
            score
        };
    });

    candidateScores.sort((a, b) => b.score - a.score);
    const top10 = candidateScores.slice(0, 10);

    console.group("📊 [V2 SCOREBOARD] top10 (Copied Formula for Debug Avoids CoreEngine Pollution)");
    console.table(top10.map(s => ({ Pattern: s.name, Score: s.score, ID: s.id })));
    console.groupEnd();
}
