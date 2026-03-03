export interface TongueInput {
    bodyColor?: string | null;
    bodyShape?: string[];
    coatColor?: string | null;
    coatThickness?: string | null;
    coatTexture?: string[];
    moisture?: string | null;
    regionMap?: Record<string, string[]>;
}

export type HearingInput = Record<string, number | null>;

export interface Pattern {
    id: string;
    name: string;
    needX: 'V' | 'J' | '0'; // V(虚) J(実)
    needY: 'C' | 'H' | '0'; // C(寒) H(熱)
    needZ: 'M' | 'D' | '0'; // M(湿) D(燥)
    region: 'tip' | 'side' | 'center' | 'root' | 'any';
}

export interface DiagnosticGuard {
    isNeutral: boolean;
    level: 1 | 2 | 3 | 4;
    levelLabel: string;
    tendency: '混合傾向' | '単一傾向' | '通常';
    primaryPatternName?: string;
    message: string;
}

export interface CoreOutput {
    axes: {
        X_final: number;
        Y_final: number;
        Z_final: number;
        type4: string;
        levels: { X: number; Y: number; Z: number };
    };
    region: {
        primary: string;
        confidence: number;
    };
    guard: DiagnosticGuard;
    top3: Array<{
        id: string;
        name: string;
        score: number;
        reasons: string[];
    }>;
    inputs: {
        tongue: TongueInput;
        hearing: HearingInput;
    };
}

const POINT_MAP: Record<string, { X: number; Y: number; Z: number }> = {
    // bodyColor
    '淡': { X: 2, Y: 1, Z: 0 },
    '淡紅': { X: 1, Y: 0, Z: 0 },
    '紅': { X: -1, Y: -2, Z: -1 },
    '絳（深紅）': { X: -1, Y: -3, Z: -2 },
    '紫': { X: -2, Y: 0, Z: 0 },

    // bodyShape
    '胖大': { X: 1, Y: 1, Z: 2 },
    '歯痕': { X: 2, Y: 0, Z: 2 },
    '痩薄': { X: 2, Y: 0, Z: -1 },
    '裂紋': { X: 2, Y: -1, Z: -3 },
    '点刺（赤点）': { X: -1, Y: -2, Z: 0 },
    '瘀点': { X: -2, Y: 0, Z: 0 },
    '舌下静脈怒張': { X: -2, Y: 0, Z: 0 },

    // coatColor
    '白': { X: 0, Y: 1, Z: 1 },
    '黄': { X: -1, Y: -2, Z: 1 },
    '灰黒': { X: -1, Y: -2, Z: 0 },

    // coatThickness
    '薄': { X: 0, Y: 0, Z: 0 },
    '中': { X: -1, Y: 0, Z: 1 },
    '厚': { X: -2, Y: 0, Z: 2 },

    // coatTexture
    '膩': { X: -2, Y: 0, Z: 3 },
    '滑': { X: 0, Y: 1, Z: 2 },
    '燥': { X: 1, Y: -1, Z: -3 },
    '腐': { X: -2, Y: -1, Z: 1 },
    '剥（剥落/地図状）': { X: 2, Y: -1, Z: -3 },
    'なし（無苔寄り）': { X: 2, Y: -1, Z: -3 },

    // moisture
    '潤': { X: 0, Y: 1, Z: 2 },
    '正常': { X: 0, Y: 0, Z: 0 },
    '乾': { X: 1, Y: -1, Z: -3 },
    '少津': { X: 2, Y: -1, Z: -3 }
};

const PATTERNS: Pattern[] = [
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
    { id: 'P_COLD_STAGN_LIVER', name: '寒滞肝脈', needX: '0', needY: 'C', need: '0', region: 'side' } as any
]; // Wait, last one has typo "need": "0" -> needZ: "0"

// Fixed PATTERNS array
PATTERNS[PATTERNS.length - 1].needZ = '0';
delete (PATTERNS[PATTERNS.length - 1] as any).need;

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function calculateTongueScore(tongue: TongueInput) {
    let x = 0, y = 0, z = 0;

    const addPoint = (key: string | null | undefined) => {
        if (key && POINT_MAP[key]) {
            x += POINT_MAP[key].X;
            y += POINT_MAP[key].Y;
            z += POINT_MAP[key].Z;
        }
    };

    addPoint(tongue.bodyColor);
    tongue.bodyShape?.forEach(addPoint);
    addPoint(tongue.coatColor);
    addPoint(tongue.coatThickness);
    tongue.coatTexture?.forEach(addPoint);
    addPoint(tongue.moisture);

    return {
        X_tongue: clamp(Math.round(100 * x / 18), -100, 100),
        Y_tongue: clamp(Math.round(100 * y / 18), -100, 100),
        Z_tongue: clamp(Math.round(100 * z / 24), -100, 100),
    };
}

export function inferRegion(tongue: TongueInput): string {
    if (!tongue.regionMap || Object.keys(tongue.regionMap).length === 0) {
        return 'center'; // Default or based on general overall presence
    }

    let maxScore = -1;
    let maxRegion = 'center';
    let bestThickness = 0; // priority for thicker coat

    for (const [reg, findings] of Object.entries(tongue.regionMap)) {
        let rx = 0, ry = 0, rz = 0;
        let hasThick = false;
        for (const f of findings) {
            if (POINT_MAP[f]) {
                rx += POINT_MAP[f].X;
                ry += POINT_MAP[f].Y;
                rz += POINT_MAP[f].Z;
            }
            if (f === '厚') hasThick = true;
            if (f === '膩' || f === '腐') hasThick = true; // Also count as thick
        }
        const score = Math.abs(rx) + Math.abs(ry) + Math.abs(rz);

        // priority: thick coat
        const thicknessScore = hasThick ? 1 : 0;

        if (score > maxScore || (score === maxScore && thicknessScore > bestThickness)) {
            maxScore = score;
            maxRegion = reg;
            bestThickness = thicknessScore;
        }
    }

    const validRegions = ['tip', 'side', 'center', 'root'];
    return validRegions.includes(maxRegion) ? maxRegion : 'center';
}

function calculateGroupScore(hearing: HearingInput, qIds: string[]) {
    let sum = 0;
    let n = 0;
    for (const q of qIds) {
        if (hearing[q] !== null && hearing[q] !== undefined) {
            sum += hearing[q] as number;
            n++;
        }
    }
    if (n === 0) return { val: 0, n: 0 };
    return { val: 100 * sum / (2 * n), n };
}

export function calculateHearingScore(hearing: HearingInput) {
    const V_group = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'];
    const J_group = ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'];
    const C_group = ['Q11', 'Q12', 'Q13'];
    const H_group = ['Q14', 'Q15', 'Q16'];
    const M_group = ['Q17', 'Q18'];
    const D_group = ['Q19', 'Q20'];

    const V = calculateGroupScore(hearing, V_group);
    const J = calculateGroupScore(hearing, J_group);
    const C = calculateGroupScore(hearing, C_group);
    const H = calculateGroupScore(hearing, H_group);
    const M = calculateGroupScore(hearing, M_group);
    const D = calculateGroupScore(hearing, D_group);

    const totalN = V.n + J.n + C.n + H.n + M.n + D.n;

    return {
        X_hear: V.val - J.val,
        Y_hear: C.val - H.val,
        Z_hear: M.val - D.val,
        nTotal: totalN
    };
}

function axisMatch(value: number, need: 'V' | 'J' | 'C' | 'H' | 'M' | 'D' | '0') {
    if (need === 'V') return clamp(value / 100, 0, 1);
    if (need === 'J') return clamp((-value) / 100, 0, 1);
    if (need === 'C') return clamp(value / 100, 0, 1);
    if (need === 'H') return clamp((-value) / 100, 0, 1);
    if (need === 'M') return clamp(value / 100, 0, 1);
    if (need === 'D') return clamp((-value) / 100, 0, 1);
    // need === '0'
    return 1 - Math.min(Math.abs(value) / 100, 1);
}

export function analyzeCore(tongue: TongueInput, hearing: HearingInput): CoreOutput {
    const { X_tongue, Y_tongue, Z_tongue } = calculateTongueScore(tongue);
    const { X_hear, Y_hear, Z_hear, nTotal } = calculateHearingScore(hearing);

    const hear_coverage = nTotal / 20;
    const w_hear = 0.3 * clamp(hear_coverage / 0.6, 0, 1);
    const w_tongue = 1 - w_hear;

    const X_final = Math.round(w_tongue * X_tongue + w_hear * X_hear);
    const Y_final = Math.round(w_tongue * Y_tongue + w_hear * Y_hear);
    const Z_final = Math.round(w_tongue * Z_tongue + w_hear * Z_hear);

    let type4 = '混合';
    if (X_final >= 10 && Y_final >= 10) type4 = '虚寒';
    else if (X_final >= 10 && Y_final <= -10) type4 = '虚熱';
    else if (X_final <= -10 && Y_final >= 10) type4 = '実寒';
    else if (X_final <= -10 && Y_final <= -10) type4 = '実熱';

    const inferredRegion = inferRegion(tongue);

    const candidateScores = PATTERNS.map(pattern => {
        const mX = axisMatch(X_final, pattern.needX as any);
        const mY = axisMatch(Y_final, pattern.needY as any);
        const mZ = axisMatch(Z_final, pattern.needZ as any);
        const mR = (pattern.region === 'any' || inferredRegion === pattern.region) ? 1 : 0;

        let score = 35 * mX + 35 * mY + 20 * mZ + 10 * mR;

        // Aux rules
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
            const isThick = tongue.coatThickness === '厚' || tongue.coatTexture?.includes('膩') || tongue.coatTexture?.includes('滑');
            if (isThick && Y_final >= 10) {
                score += 8;
            }
        }

        score = clamp(Math.round(score), 0, 100);

        const reasons = [];
        if (mX > 0.5) reasons.push("虚実傾向が一致");
        if (mY > 0.5) reasons.push("寒熱傾向が一致");
        if (mZ > 0.5) reasons.push("湿燥傾向が一致");
        if (mR === 1) reasons.push("主領域が一致");

        return {
            id: pattern.id,
            name: pattern.name,
            score,
            reasons
        };
    });

    candidateScores.sort((a, b) => b.score - a.score);
    const top3 = candidateScores.slice(0, 3);

    const t1 = top3[0];
    const t2 = top3[1];

    const isNeutral = Math.abs(X_final) <= 15 && Math.abs(Y_final) <= 15 && Math.abs(Z_final) <= 15;

    let level: 1 | 2 | 3 | 4 = 1;
    let levelLabel = "偏りなし";
    if (isNeutral) {
        level = 1;
        levelLabel = "偏りなし";
    } else if (t1.score < 60) {
        level = 2;
        levelLabel = "軽い傾向";
    } else if (t1.score < 75) {
        level = 3;
        levelLabel = "やや強い傾向";
    } else {
        level = 4;
        levelLabel = "明確な証";
    }

    let tendency: '混合傾向' | '単一傾向' | '通常' = '通常';
    if (!isNeutral) {
        const diff = t1.score - (t2?.score || 0);
        if (diff < 10) tendency = '混合傾向';
        else if (diff >= 20) tendency = '単一傾向';
    }

    let message = "";
    if (isNeutral) {
        message = "大きな偏りは見られません";
    }

    let primaryPatternName = undefined;
    if (level >= 3 && !isNeutral) {
        primaryPatternName = t1.name;
    }

    const guard: DiagnosticGuard = {
        isNeutral,
        level,
        levelLabel,
        tendency,
        primaryPatternName,
        message
    };

    return {
        axes: {
            X_final,
            Y_final,
            Z_final,
            type4,
            levels: { X: X_final, Y: Y_final, Z: Z_final }
        },
        region: {
            primary: inferredRegion,
            confidence: 1.0 // Future scope
        },
        guard,
        top3,
        inputs: {
            tongue,
            hearing
        }
    };
}
