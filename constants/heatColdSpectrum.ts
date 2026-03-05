export const HEAT_COLD_SPECTRUM = {
    SCORE_MIN: -100, // 強寒
    SCORE_MAX: 100,  // 強熱
    CATEGORIES: {
        KYOKAN: { min: -100, max: -25, label: '虚寒', bucket: 'cold' },
        JIKKAN: { min: -100, max: -25, label: '実寒', bucket: 'strong_cold' },
        NORMAL: { min: -24, max: 24, label: '平穏', bucket: 'neutral' },
        KYONETSU: { min: 25, max: 100, label: '虚熱', bucket: 'hot' },
        JITSUNETSU: { min: 25, max: 100, label: '実熱', bucket: 'strong_hot' }
    },
    HOLD_CONDITIONS: {
        BORDERLINE: { threshold: 5, reason: 'HOLD_BORDER_LINE', description: '境界線付近のスコアのため保留' },
        QUALITY_LOW: { score_threshold: 40, reason: 'HOLD_QUALITY', description: '画像品質が基準を満たさないため保留' },
        CONFLICT: { reason: 'HOLD_CONFLICT', description: '特徴量間に矛盾があるため保留（例: 赤みが強いが湿潤が極端）' }
    }
};

export type HeatColdBucket = 'strong_cold' | 'cold' | 'neutral' | 'hot' | 'strong_hot' | 'hold';

export function mapScoreToBucket(score: number, isShi: boolean = false): HeatColdBucket {
    if (score < -50) return 'strong_cold';
    if (score < -24) return 'cold';
    if (score > 50) return 'strong_hot';
    if (score > 24) return 'hot';
    return 'neutral';
}
