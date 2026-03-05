import { describe, it, expect } from 'vitest';
import { getSpectrumCategory, HEAT_COLD_SPECTRUM } from '../constants/heatColdSpectrum';
import { evaluateExpertAgreement } from '../services/research/expertEvaluation';
import { calculateQualityScore } from '../services/research/qualityScore';
import { extractVisionFeatures } from '../services/vision/featureExtractor';
import { estimateHeatCold } from '../services/ai/heatColdEstimator';

describe('New Research Modules', () => {

    it('heatColdSpectrum returns correct categories', () => {
        expect(getSpectrumCategory(-100)).toBe('KYOKAN');
        expect(getSpectrumCategory(-100, true)).toBe('JIKKAN');
        expect(getSpectrumCategory(100)).toBe('KYONETSU');
        expect(getSpectrumCategory(100, true)).toBe('JITSUNETSU');
        expect(getSpectrumCategory(0)).toBe('NORMAL');
    });

    it('expertEvaluation returns agreement rate correctly safely', () => {
        const resultEmpty = evaluateExpertAgreement([]);
        expect(resultEmpty.agreement_rate).toBe(0);

        const resultValid = evaluateExpertAgreement([
            { aiPattern: 'JIKKAN', expertPattern: 'JIKKAN' },
            { aiPattern: 'KYONETSU', expertPattern: 'JIKKAN' },
            { aiPattern: 'NORMAL', expertPattern: '不明' }
        ]);

        expect(resultValid.unlabeled_ratio).toBeCloseTo(0.33, 1);
        expect(resultValid.agreement_rate).toBe(0.5); // 1 agreed out of 2 labeled
    });

    it('qualityScore decreases correctly', () => {
        expect(calculateQualityScore({ roi_failed: true })).toBe(0);
        expect(calculateQualityScore({ blur_score: 10, brightness_mean: 100 })).toBe(60); // 100 - 40
        expect(calculateQualityScore({ blur_score: 50, brightness_mean: 50 })).toBe(70); // 100 - 30
    });

    it('featureExtractor returns dummy features without errors', () => {
        const emptyArray = new Uint8ClampedArray(0);
        expect(extractVisionFeatures(emptyArray, 0, 0)).toBeNull();

        const dummyArray = new Uint8ClampedArray(4);
        const features = extractVisionFeatures(dummyArray, 1, 1);
        expect(features?.redness).toBe(50);
    });

    it('heatColdEstimator limits range safely', () => {
        expect(estimateHeatCold(null as any)).toBe(0);
        const sampleFeats = {
            redness: 100, brightness: 50, saturation: 50, yellow_coating: 0, dryness: 100, texture: 50, purple_index: 0
        };
        const score = estimateHeatCold(sampleFeats);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});
