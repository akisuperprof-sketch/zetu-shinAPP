import { AdditionalFeatures } from '../vision/featureExtractorV1';
import { mapScoreToBucket, HeatColdBucket, HEAT_COLD_SPECTRUM } from '../../constants/heatColdSpectrum';

export interface HeatColdEstimationResult {
    score: number;
    bucket: HeatColdBucket;
    confidence: number;
    hold_reason: string | null;
}

export function estimateHeatColdV0(features: AdditionalFeatures | null): HeatColdEstimationResult {
    if (!features) {
        return {
            score: 0,
            bucket: 'hold',
            confidence: 0,
            hold_reason: 'NO_FEATURES'
        };
    }

    // V0 Rule-based estimation for -100 to 100 spectrum
    // redness_index affects + (Heat)
    // brightness_index affects - (Cold, Pale tongue is brighter usually)
    // yellow_coating_proxy affects + (Yellow = Heat)
    // dryness_proxy affects + (Dry = Heat)

    let score = 0;

    // + side
    score += (features.redness_index - 50) * 1.5;
    score += (features.yellow_coating_proxy) * 0.5;
    score += (features.dryness_proxy) * 0.5;

    // - side
    // Pale tongue has higher brightness but low redness.
    score -= (features.brightness_index - 50) * 0.5;

    // Clamp score
    score = Math.max(-100, Math.min(100, score));

    // For V0, neutral confidence
    let confidence = 0.5;

    let bucket = mapScoreToBucket(score);
    let hold_reason: string | null = null;

    // Conflict Check (example: High red but very wet/cold metrics)
    if (features.redness_index > 80 && features.dryness_proxy < 10 && features.brightness_index > 80) {
        hold_reason = HEAT_COLD_SPECTRUM.HOLD_CONDITIONS.CONFLICT.reason;
        bucket = 'hold';
        confidence = 0.1;
    }

    // Borderline check
    if (Math.abs(score) < HEAT_COLD_SPECTRUM.HOLD_CONDITIONS.BORDERLINE.threshold) {
        hold_reason = HEAT_COLD_SPECTRUM.HOLD_CONDITIONS.BORDERLINE.reason;
        bucket = 'hold';
        confidence = 0.2;
    }

    return {
        score,
        bucket,
        confidence,
        hold_reason
    };
}
