export const EXPERT_PATTERNS = {
    JIKKAN: '実寒',
    KYOKAN: '虚寒',
    JITSUNETSU: '実熱',
    KYONETSU: '虚熱',
} as const;

export type ExpertPatternType = keyof typeof EXPERT_PATTERNS;

export const TONGUE_COLORS = ['淡白', '淡紅', '紅', '絳', '紫', '黒', '不明'] as const;
export const COAT_THICKNESSES = ['薄', '厚', '無', '不明'] as const;
export const COAT_COLORS = ['白', '黄', '灰', '黒', '不明'] as const;
export const MOISTURES = ['湿潤', '乾燥', '過湿', '不明'] as const;
