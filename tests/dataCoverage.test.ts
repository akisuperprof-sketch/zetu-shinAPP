import { describe, it, expect } from 'vitest';
import { calculateCoverage, detectShortage, generateHeatmap } from '../services/research/dataCoverage';

describe('dataCoverage', () => {
    it('calculates coverage and detect shortages', () => {
        const distributions = {
            tongueColor: { '淡紅': 5, '紅': 15 },
            coatColor: {},
            coatThickness: { '厚': 10 },
            moisture: {},
            pattern: { 'JIKKAN': 2 }
        };

        const coverage = calculateCoverage(distributions);

        // Target is 10 for everything.
        // 淡紅 = 5, 紅 = 15 (exceeds), missing others.
        // For tongue color, TARGET_LABELS include '淡白', '淡紅', '紅', '絳', '紫', '黒' ...

        const lightRedCoverage = coverage.find(c => c.axis === 'tongueColor' && c.label === '淡紅');
        expect(lightRedCoverage?.shortage).toBe(5);

        const redCoverage = coverage.find(c => c.axis === 'tongueColor' && c.label === '紅');
        expect(redCoverage?.shortage).toBe(0);

        const shortages = detectShortage(coverage);
        expect(shortages.length).toBeGreaterThan(0);
        expect(shortages.find(c => c.label === '淡白')?.shortage).toBe(10);
    });

    it('generates heatmap with zeros for missing data', () => {
        const records = [
            { tongueColor: '淡紅', coatThickness: '薄' },
            { tongueColor: '淡紅', coatThickness: '薄' },
            { tongueColor: '紅', coatThickness: '厚' }
        ];

        const heatmap = generateHeatmap(
            records,
            'tongueColor', 'coatThickness',
            ['淡白', '淡紅', '紅'], ['有無', '薄', '厚']
        );

        expect(heatmap['薄']['淡紅']).toBe(2);
        expect(heatmap['厚']['紅']).toBe(1);
        expect(heatmap['薄']['紅']).toBe(0);
        expect(heatmap['有無']?.['淡白']).toBe(0);
    });
});
