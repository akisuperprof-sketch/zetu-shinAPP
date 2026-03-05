import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '../services/research/statisticsEngine';
import { ObservationData } from '../services/research/validityRules';

describe('statisticsEngine', () => {
    it('handles empty data without NaN', () => {
        const metrics = calculateMetrics([]);
        expect(metrics.total_records).toBe(0);
        expect(Number.isNaN(metrics.roi_failed_rate)).toBe(false);
        expect(metrics.roi_failed_rate).toBe(0);
        expect(metrics.blur_avg).toBe(0);
        expect(Number.isNaN(metrics.valid_rate)).toBe(false);
    });

    it('calculates metrics correctly for valid data', () => {
        const records: ObservationData[] = [
            {
                pattern: 'JIKKAN',
                tongueColor: '淡紅',
                coatThickness: '薄',
                quality_flags: { roi_failed: false, blur_score: 20, brightness_mean: 100 }
            },
            {
                pattern: 'JIKKAN',
                tongueColor: '淡紅',
                coatThickness: '厚',
                quality_flags: { roi_failed: true, blur_score: 10, brightness_mean: 50 } // roi_failed, blur_low, brightness_low
            }
        ];

        const metrics = calculateMetrics(records);
        expect(metrics.total_records).toBe(2);

        // 1 of 2 failed ROI
        expect(metrics.roi_failed_rate).toBe(0.5);

        // 1 of 2 valid (reasons length 0)
        expect(metrics.valid_rate).toBe(0.5);
        expect(metrics.labeled_rate).toBe(1.0);

        // Stats
        expect(metrics.blur_avg).toBe(15);
        expect(metrics.brightness_avg).toBe(75);

        // Distributions
        expect(metrics.distributions.tongueColor['淡紅']).toBe(2);
        expect(metrics.distributions.coatThickness['薄']).toBe(1);
        expect(metrics.distributions.pattern['JIKKAN']).toBe(2);
    });

    it('handles missing quality_flags without exceptions', () => {
        const records: ObservationData[] = [
            { pattern: 'JIKKAN', tongueColor: '紅' },
            { pattern: '不明' }
        ];

        const metrics = calculateMetrics(records);
        expect(metrics.total_records).toBe(2);
        expect(metrics.valid_rate).toBe(0.5);
        expect(metrics.labeled_rate).toBe(0.5);
        expect(metrics.roi_failed_rate).toBe(0);
        expect(metrics.blur_avg).toBe(0);

        // missing patten contributes to exclusion reasons
        const missingObsReason = metrics.exclusion_reasons_top.find(r => r.reason === 'missing_observation');
        expect(missingObsReason?.count).toBe(1);
    });
});
