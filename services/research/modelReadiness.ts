export interface ModelReadinessResult {
    score: number;
    ready: boolean;
    reasons: string[];
}

export function calculateModelReadiness(total_records: number, labeled_records: number, agreement_rate: number): ModelReadinessResult {
    if (total_records === 0) return { score: 0, ready: false, reasons: ['No data available'] };

    let score = 0;
    const reasons: string[] = [];

    // data size (0-40), max out around 300
    const sizeRatio = Math.min(1, total_records / 300);
    const sizeScore = sizeRatio * 40;
    score += sizeScore;
    if (total_records < 100) reasons.push(`Low data size (${total_records}/100 minimum)`);

    // labeled count (0-30), max out around 100
    const labeledRatio = Math.min(1, labeled_records / 100);
    const labelScore = labeledRatio * 30;
    score += labelScore;
    if (labeled_records < 50) reasons.push(`Low labeled count (${labeled_records}/50 minimum)`);

    // agreement rate (0-30), baseline 0.8
    const agreementRatio = Math.min(1, agreement_rate / 0.8);
    const agreementScore = agreementRatio * 30;
    score += agreementScore;
    if (agreement_rate < 0.7) reasons.push(`Low agreement rate (${(agreement_rate * 100).toFixed(1)}% / 70.0% minimum)`);

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    if (reasons.length === 0 && finalScore < 80) {
        reasons.push('Overall score is not high enough yet');
    }

    return {
        score: finalScore,
        ready: finalScore >= 80 && reasons.length === 0,
        reasons: reasons.slice(0, 5)
    };
}
