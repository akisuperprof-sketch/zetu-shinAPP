import { describe, it, expect } from 'vitest';
import { mapScoreToBucket, HEAT_COLD_SPECTRUM } from '../constants/heatColdSpectrum';
import { evaluateExpertAgreement } from '../services/research/expertEvaluation';
import { calculateQualityScore } from '../services/research/qualityScore';
import { extractAdditionalFeatures } from '../services/vision/featureExtractorV1';
import { estimateHeatColdV0 } from '../services/ai/heatColdEstimatorV0';

describe('New Research Modules', () => {

    it('heatColdSpectrum returns correct categories', () => {
        expect(mapScoreToBucket(-100)).toBe('strong_cold');
        expect(mapScoreToBucket(100)).toBe('strong_hot');
        expect(mapScoreToBucket(0)).toBe('neutral');
    });

    it('expertEvaluation returns agreement rate correctly safely', () => {
        const resultEmpty = evaluateExpertAgreement([]);
        expect(resultEmpty.agreement_rate).toBe(0);

        // evaluatePhase1 uses fixed 50 questionaire score.
        // Pale + White + Thin + Wet = KYOKAN (Cold + Xu)
        // Red + Yellow + Thick + Dry = JITSUNETSU (Heat + Shi)
        const resultValid = evaluateExpertAgreement([
            { tongueColor: '淡白', coatColor: '白', coatThickness: '薄', moisture: '湿潤', pattern: 'KYOKAN' },
            { tongueColor: '淡白', coatColor: '白', coatThickness: '厚', moisture: '湿潤', pattern: 'JIKKAN' },
            { tongueColor: '紅', coatColor: '黄', coatThickness: '薄', moisture: '乾燥', pattern: '不明' } // unlabeled
        ]);

        expect(resultValid.unlabeled_rate).toBeCloseTo(0.33, 1);
        expect(resultValid.agreement_rate).toBe(1.0); // 2 agreed out of 2 labeled
    });

    it('qualityScore decreases correctly', () => {
        expect(calculateQualityScore({ roi_failed: true } as any).score).toBe(0);
        expect(calculateQualityScore({ blur_score: 10, brightness_mean: 100, roi_failed: false } as any).score).toBe(40); // 100 - 60
        expect(calculateQualityScore({ blur_score: 50, brightness_mean: 50, roi_failed: false } as any).score).toBe(70); // 100 - 30
    });

    it('featureExtractor returns dummy features without errors', () => {
        expect(extractAdditionalFeatures(null)).toBeNull();

        const features = extractAdditionalFeatures({
            roi_failed: false,
            color_r_mean: 150,
            color_g_mean: 100,
            color_b_mean: 50,
            brightness_mean: 100,
            saturation_mean: 50,
            blur_score: 20,
            contrast: 40
        } as any);
        // redness: 150-100=50, 150-50=100 -> 150. 150/200*100 = 75
        expect(features?.redness_index).toBe(75);
    });

    it('heatColdEstimator limits range safely', () => {
        expect(estimateHeatColdV0(null as any).score).toBe(0);
        const sampleFeats = {
            redness_index: 100,
            brightness_index: 50,
            saturation_index: 50,
            yellow_coating_proxy: 0,
            dryness_proxy: 100,
            texture_proxy: 50,
            purple_proxy: 0
        };
        const result = estimateHeatColdV0(sampleFeats);
        expect(result.score).toBeGreaterThan(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });
});
