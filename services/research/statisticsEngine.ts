import { ObservationData, checkValidity } from './validityRules';

export interface ResearchMetrics {
    total_records: number;
    roi_failed_rate: number;
    hold_rate: number;
    blur_avg: number;
    blur_p10: number;
    blur_p90: number;
    brightness_avg: number;
    brightness_p10: number;
    brightness_p90: number;
    labeled_rate: number;
    valid_rate: number;
    exclusion_reasons_top: { reason: string; count: number }[];
    distributions: {
        tongueColor: Record<string, number>;
        coatColor: Record<string, number>;
        coatThickness: Record<string, number>;
        moisture: Record<string, number>;
        pattern: Record<string, number>;
    };
}

function calculatePercentiles(values: number[]): { avg: number; p10: number; p90: number } {
    if (values.length === 0) return { avg: 0, p10: 0, p90: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    return { avg, p10, p90 };
}

export function calculateMetrics(records: ObservationData[]): ResearchMetrics {
    const total_records = records.length;
    if (total_records === 0) {
        return {
            total_records: 0,
            roi_failed_rate: 0,
            hold_rate: 0,
            blur_avg: 0, blur_p10: 0, blur_p90: 0,
            brightness_avg: 0, brightness_p10: 0, brightness_p90: 0,
            labeled_rate: 0,
            valid_rate: 0,
            exclusion_reasons_top: [],
            distributions: {
                tongueColor: {}, coatColor: {}, coatThickness: {}, moisture: {}, pattern: {}
            }
        };
    }

    let roi_failed_count = 0;
    let labeled_count = 0;
    let valid_count = 0;
    const blur_values: number[] = [];
    const brightness_values: number[] = [];
    const reason_counts: Record<string, number> = {};

    const distributions = {
        tongueColor: {} as Record<string, number>,
        coatColor: {} as Record<string, number>,
        coatThickness: {} as Record<string, number>,
        moisture: {} as Record<string, number>,
        pattern: {} as Record<string, number>,
    };

    records.forEach(rec => {
        const { valid, reasons } = checkValidity(rec);
        if (valid) valid_count++;

        reasons.forEach(r => {
            reason_counts[r] = (reason_counts[r] || 0) + 1;
        });

        if (rec.quality_flags?.roi_failed) {
            roi_failed_count++;
        }
        if (rec.quality_flags?.blur_score !== undefined && !Number.isNaN(rec.quality_flags.blur_score)) {
            blur_values.push(rec.quality_flags.blur_score);
        }
        if (rec.quality_flags?.brightness_mean !== undefined && !Number.isNaN(rec.quality_flags.brightness_mean)) {
            brightness_values.push(rec.quality_flags.brightness_mean);
        }
        if (rec.pattern && rec.pattern !== '不明') {
            labeled_count++;
        }

        if (rec.tongueColor) distributions.tongueColor[rec.tongueColor] = (distributions.tongueColor[rec.tongueColor] || 0) + 1;
        if (rec.coatColor) distributions.coatColor[rec.coatColor] = (distributions.coatColor[rec.coatColor] || 0) + 1;
        if (rec.coatThickness) distributions.coatThickness[rec.coatThickness] = (distributions.coatThickness[rec.coatThickness] || 0) + 1;
        if (rec.moisture) distributions.moisture[rec.moisture] = (distributions.moisture[rec.moisture] || 0) + 1;
        if (rec.pattern) distributions.pattern[rec.pattern] = (distributions.pattern[rec.pattern] || 0) + 1;
    });

    const blurStats = calculatePercentiles(blur_values);
    const brightStats = calculatePercentiles(brightness_values);

    const sortedReasons = Object.entries(reason_counts)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => ({ reason, count }));

    return {
        total_records,
        roi_failed_rate: roi_failed_count / total_records,
        hold_rate: 1 - (valid_count / total_records),
        blur_avg: blurStats.avg, blur_p10: blurStats.p10, blur_p90: blurStats.p90,
        brightness_avg: brightStats.avg, brightness_p10: brightStats.p10, brightness_p90: brightStats.p90,
        labeled_rate: labeled_count / total_records,
        valid_rate: valid_count / total_records,
        exclusion_reasons_top: sortedReasons.slice(0, 5),
        distributions
    };
}
