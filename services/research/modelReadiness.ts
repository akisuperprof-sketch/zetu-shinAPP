import { STAGE_THRESHOLDS } from '../../constants/researchStages';

export function calculateModelReadiness(total_records: number, labeled_records: number, agreement_rate: number): number {
    if (total_records === 0) return 0;

    let score = 0;

    // Dataset size score (0-40)
    const sizeRatio = Math.min(1, total_records / STAGE_THRESHOLDS.DATA_COLLECTION_MIN_RECORDS);
    score += sizeRatio * 40;

    // Labeled data score (0-30)
    const labeledRatio = Math.min(1, labeled_records / total_records);
    score += labeledRatio * 30;

    // Agreement score (0-30)
    const agreementRatio = Math.min(1, agreement_rate / STAGE_THRESHOLDS.LABEL_ALIGNMENT_MIN_AGREEMENT);
    score += agreementRatio * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
}
