export const QUALITY_WEIGHTS = {
    ROI_FAILURE: -100, // ROI失敗は致命傷（一発0点）
    BLUR: {
        THRESHOLD_CRITICAL: 15,
        PENALTY_CRITICAL: -60,
        THRESHOLD_WARNING: 30,
        PENALTY_WARNING: -20,
    },
    BRIGHTNESS: {
        TOO_DARK: 60,
        PENALTY_DARK: -30,
        TOO_BRIGHT: 220,
        PENALTY_BRIGHT: -30,
    },
    NOISE: {
        MAX_SAFE_NOISE: 60,
        PENALTY_NOISE: -15,
    }
};
