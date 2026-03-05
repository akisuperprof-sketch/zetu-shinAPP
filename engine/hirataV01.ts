import { HirataInput, HirataOutput } from './tongueTypes';
import { HIRATA_PATTERNS, HOLD_REASONS } from '../constants/tongueLabels';

export function evaluateHirataV01(input: HirataInput): HirataOutput {
    let temp_score = 0;
    let defex_score = 0;
    const flags: string[] = [];

    // 1. 舌色
    switch (input.tongue_color) {
        case '淡白': temp_score -= 2; break;
        case '淡紅': temp_score += 0; break;
        case '紅': temp_score += 2; break;
        case '絳': temp_score += 3; break;
        case '紫': temp_score += 0; flags.push('purple'); break;
        case '黒': temp_score += 0; flags.push('black', 'severe'); break;
    }

    // 2. 苔色
    switch (input.coat_color) {
        case '白': temp_score -= 1; break;
        case '黄': temp_score += 1; break;
        case '灰': temp_score += 1; flags.push('severe'); break;
        case '黒': temp_score += 1; flags.push('severe'); break;
    }

    // 3. 苔厚
    switch (input.coat_thickness) {
        case '無': defex_score -= 2; break;
        case '薄': defex_score += 0; break;
        case '厚': defex_score += 2; break;
    }

    // 4. 津液
    switch (input.moisture) {
        case '湿潤': temp_score -= 1; break;
        case '乾燥': temp_score += 1; break;
    }

    // 5. 形
    switch (input.tongue_form) {
        case '胖嫩': defex_score -= 1; break;
        case '歯痕': defex_score -= 1; break;
        case '老': defex_score += 1; break;
        case 'その他': defex_score += 0; break;
    }

    // 統合判定 (HOLD_CONFLICT チェック)
    if (flags.includes('black') || flags.includes('purple')) {
        // 紫/黒などはv0.1段階では安全側に倒して保留(HOLD_CONFLICT)とする
        return {
            pattern: HIRATA_PATTERNS.HOLD,
            temp_score,
            defex_score,
            hold_reason: HOLD_REASONS.CONFLICT,
            flags
        };
    }

    // 4分類判定
    let pattern: string = HIRATA_PATTERNS.HOLD;
    let hold_reason: string | null = null;

    if (temp_score <= -1 && defex_score >= 1) {
        pattern = HIRATA_PATTERNS.JIKKAN;
    } else if (temp_score <= -1 && defex_score <= 0) {
        pattern = HIRATA_PATTERNS.KYOKAN;
    } else if (temp_score >= 1 && defex_score >= 1) {
        pattern = HIRATA_PATTERNS.JITSUNETSU;
    } else if (temp_score >= 1 && defex_score <= 0) {
        pattern = HIRATA_PATTERNS.KYONETSU;
    } else {
        pattern = HIRATA_PATTERNS.HOLD;
        hold_reason = HOLD_REASONS.BORDER;
    }

    // 矛盾や安全マージンとしてsevereフラグがある場合などで必要に応じてHOLDに倒す
    if (flags.includes('severe') && pattern !== HIRATA_PATTERNS.HOLD) {
        pattern = HIRATA_PATTERNS.HOLD;
        hold_reason = HOLD_REASONS.CONFLICT;
    }

    return {
        pattern,
        temp_score,
        defex_score,
        hold_reason,
        flags
    };
}
