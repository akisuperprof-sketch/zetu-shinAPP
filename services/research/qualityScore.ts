export interface QualityMetrics {
    roi_failed?: boolean;
    blur_score?: number;
    brightness_mean?: number;
    noise_level?: number;
}

export function calculateQualityScore(metrics: QualityMetrics): number {
    if (metrics.roi_failed) return 0;

    let score = 100;

    // Blur deduction
    if (metrics.blur_score !== undefined) {
        if (metrics.blur_score < 15) score -= 40;
        else if (metrics.blur_score < 30) score -= 20;
    }

    // Brightness deduction
    if (metrics.brightness_mean !== undefined) {
        if (metrics.brightness_mean < 80) score -= 30;
        if (metrics.brightness_mean > 220) score -= 30;
    }

    // Noise deduction
    if (metrics.noise_level !== undefined) {
        if (metrics.noise_level > 50) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
}
