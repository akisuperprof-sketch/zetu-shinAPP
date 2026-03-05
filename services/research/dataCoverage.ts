import { RESEARCH_TARGETS, TARGET_LABELS } from '../../constants/researchTargets';
import { ResearchMetrics } from './statisticsEngine';

export interface CoverageItem {
    axis: string;
    label: string;
    count: number;
    target: number;
    shortage: number;
}

export function calculateCoverage(distributions: ResearchMetrics['distributions']): CoverageItem[] {
    const coverage: CoverageItem[] = [];

    const axes = ['tongueColor', 'coatColor', 'coatThickness', 'moisture', 'pattern'] as const;

    axes.forEach(axis => {
        const target = RESEARCH_TARGETS[axis];
        const labels = TARGET_LABELS[axis] as string[];

        labels.forEach(label => {
            if (label === '不明') return;
            const count = distributions[axis][label] || 0;
            const shortage = Math.max(0, target - count);
            coverage.push({
                axis,
                label,
                count,
                target,
                shortage
            });
        });
    });

    return coverage;
}

export function detectShortage(coverage: CoverageItem[]): CoverageItem[] {
    return coverage.filter(c => c.shortage > 0);
}

export function nextRecommendations(coverage: CoverageItem[]): CoverageItem[] {
    return [...coverage]
        .filter(c => c.shortage > 0)
        .sort((a, b) => b.shortage - a.shortage)
        .slice(0, 5);
}

export function generateHeatmap(records: Record<string, any>[], axisX: string, axisY: string, labelsX: string[], labelsY: string[]): Record<string, Record<string, number>> {
    const heatmap: Record<string, Record<string, number>> = {};

    labelsY.forEach(ly => {
        heatmap[ly] = {};
        labelsX.forEach(lx => {
            heatmap[ly][lx] = 0;
        });
    });

    records.forEach(rec => {
        const x = rec[axisX];
        const y = rec[axisY];
        if (x && y && heatmap[y] && heatmap[y][x] !== undefined) {
            heatmap[y][x]++;
        }
    });

    return heatmap;
}
