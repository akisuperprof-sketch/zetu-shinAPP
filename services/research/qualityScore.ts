import { ImageFeatures } from '../features/imageFeatures';
import { AdditionalFeatures } from '../vision/featureExtractorV1';
import { QUALITY_WEIGHTS } from '../../constants/researchQualityWeights';

export interface QualityResult {
    score: number;
    reasons: string[];
}

export function calculateQualityScore(features: ImageFeatures | null | undefined, additional?: AdditionalFeatures | null): QualityResult {
    if (!features) {
        return { score: 0, reasons: ['No features available'] };
    }

    if (features.roi_failed) {
        return { score: 0, reasons: ['ROI extraction failed (fatal)'] };
    }

    let score = 100;
    const reasons: string[] = [];

    // Blur deduction
    if (typeof features.blur_score === 'number') {
        if (features.blur_score < QUALITY_WEIGHTS.BLUR.THRESHOLD_CRITICAL) {
            score += QUALITY_WEIGHTS.BLUR.PENALTY_CRITICAL;
            reasons.push(`Blur too high (critical, score < ${QUALITY_WEIGHTS.BLUR.THRESHOLD_CRITICAL})`);
        } else if (features.blur_score < QUALITY_WEIGHTS.BLUR.THRESHOLD_WARNING) {
            score += QUALITY_WEIGHTS.BLUR.PENALTY_WARNING;
            reasons.push(`Blur high (warning, score < ${QUALITY_WEIGHTS.BLUR.THRESHOLD_WARNING})`);
        }
    }

    // Brightness deduction
    if (typeof features.brightness_mean === 'number') {
        if (features.brightness_mean < QUALITY_WEIGHTS.BRIGHTNESS.TOO_DARK) {
            score += QUALITY_WEIGHTS.BRIGHTNESS.PENALTY_DARK;
            reasons.push(`Too dark (brightness < ${QUALITY_WEIGHTS.BRIGHTNESS.TOO_DARK})`);
        } else if (features.brightness_mean > QUALITY_WEIGHTS.BRIGHTNESS.TOO_BRIGHT) {
            score += QUALITY_WEIGHTS.BRIGHTNESS.PENALTY_BRIGHT;
            reasons.push(`Too bright (brightness > ${QUALITY_WEIGHTS.BRIGHTNESS.TOO_BRIGHT})`);
        }
    }

    // Example logic using additional features if needed
    if (additional) {
        // e.g., low saturation means it might be a monochrome/failed photo
        if (additional.saturation_index < 10) {
            score -= 20;
            reasons.push(`Very low saturation proxy (< 10)`);
        }
    }

    // Clamp score
    const finalScore = Math.max(0, Math.min(100, score));

    return { score: finalScore, reasons };
}
