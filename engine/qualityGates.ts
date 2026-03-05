import { HirataInput } from './tongueTypes';
import { HOLD_REASONS } from '../constants/tongueLabels';

export interface QualityGateResult {
    isPass: boolean;
    reason: string | null;
}

export function checkQualityGate(input: HirataInput, isBlurry: boolean, isTooDark: boolean, isTooBright: boolean): QualityGateResult {
    if (isBlurry || isTooDark || isTooBright) {
        return {
            isPass: false,
            reason: HOLD_REASONS.QUALITY
        };
    }

    // 矛盾チェック (HOLD_CONFLICT)
    // 例えば、紫や黒などの重症サインがありつつ、熱/寒が矛盾するなど
    // v0.1では簡易的に紫・黒の場合に他のパラメータとの組み合わせ異常があればCONFLICTとする（hirataV01で詳細判定）

    return {
        isPass: true,
        reason: null
    };
}
