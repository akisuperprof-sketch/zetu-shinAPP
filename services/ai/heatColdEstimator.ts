import { VisionFeatures } from '../vision/featureExtractor';

export function estimateHeatCold(features: VisionFeatures): number {
    if (!features) return 0;

    // Based on -100 to 100
    // High redness and dryness = Heat
    // High brightness and low redness = Cold

    let score = 0;

    // Normalize logic (dummy for v0)
    score += (features.redness - 50); // +/-50
    score += (features.dryness - 50) * 0.5; // +/- 25
    score -= (features.brightness - 120) * 0.2;

    return Math.max(-100, Math.min(100, score));
}
