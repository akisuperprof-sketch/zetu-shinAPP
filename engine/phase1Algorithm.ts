export interface Phase1Input {
    tongue_color: string | null;
    coat_color: string | null;
    coat_thickness: string | null;
    moisture: string | null;
    tongue_shape: string | null;
    questionnaire_score: number | null;
}

export const PHASE1_PATTERNS = {
    JIKKAN: 'JIKKAN',
    KYOKAN: 'KYOKAN',
    JITSUNETSU: 'JITSUNETSU',
    KYONETSU: 'KYONETSU',
} as const;

export function evaluatePhase1(input: Phase1Input): string {
    // スコアリングで寒熱(Heat/Cold)と虚実(Deficiency/Excess)を判定する
    let heatScore = 0;
    let excessScore = 0;

    // STEP1: 寒熱 (舌色)
    if (input.tongue_color === '淡白') {
        heatScore -= 2; // 寒
    } else if (input.tongue_color === '紅') {
        heatScore += 2; // 熱
    } else if (input.tongue_color === '淡紅') {
        // 中間
        heatScore += 0;
    }

    // STEP3: 湿燥 (寒熱に寄与)
    if (input.moisture === '湿潤') {
        heatScore -= 1; // 寒寄り
    } else if (input.moisture === '乾燥') {
        heatScore += 1; // 熱寄り
    }

    // STEP2: 虚実 (苔厚)
    if (input.coat_thickness === '薄') {
        excessScore -= 1; // 虚
    } else if (input.coat_thickness === '厚') {
        excessScore += 1; // 実
    }

    // 判定
    const isCold = heatScore < 0;
    // heatScore >= 0 の場合はデフォルトで熱とする（中間含む）
    const isHeat = heatScore >= 0;

    // excessScore <= 0 の場合は虚とする（デフォルト）
    const isXu = excessScore <= 0;
    const isShi = excessScore > 0;

    // 最終分類
    if (isCold && isXu) return PHASE1_PATTERNS.KYOKAN;
    if (isCold && isShi) return PHASE1_PATTERNS.JIKKAN;
    if (isHeat && isXu) return PHASE1_PATTERNS.KYONETSU;
    if (isHeat && isShi) return PHASE1_PATTERNS.JITSUNETSU;

    // デフォルトフォールバック
    return PHASE1_PATTERNS.KYOKAN;
}
