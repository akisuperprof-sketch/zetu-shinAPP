export const HEAT_COLD_SPECTRUM = {
    SCORE_MIN: -100, // Max Cold
    SCORE_MAX: 100,  // Max Heat
    CATEGORIES: {
        KYOKAN: { min: -100, max: -25, label: '虚寒' },
        JIKKAN: { min: -100, max: -25, label: '実寒' },
        NORMAL: { min: -24, max: 24, label: '平穏' },
        KYONETSU: { min: 25, max: 100, label: '虚熱' },
        JITSUNETSU: { min: 25, max: 100, label: '実熱' }
    }
};

export function getSpectrumCategory(score: number, isShi: boolean = false): string {
    if (score <= HEAT_COLD_SPECTRUM.CATEGORIES.JIKKAN.max) {
        return isShi ? 'JIKKAN' : 'KYOKAN';
    } else if (score >= HEAT_COLD_SPECTRUM.CATEGORIES.JITSUNETSU.min) {
        return isShi ? 'JITSUNETSU' : 'KYONETSU';
    }
    return 'NORMAL';
}
