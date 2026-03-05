export interface EvaluationRecord {
    aiPattern: string;
    expertPattern: string;
}

export function evaluateExpertAgreement(records: EvaluationRecord[]) {
    if (records.length === 0) return { agreement_rate: 0, confusion_matrix: {}, unlabeled_ratio: 0, disagreement_reasons: [] };

    let agreed = 0;
    let unlabeled = 0;
    const matrix: Record<string, Record<string, number>> = {};
    const discrepancies: string[] = [];

    records.forEach(rec => {
        if (!rec.expertPattern || rec.expertPattern === '不明') {
            unlabeled++;
            return;
        }

        if (!matrix[rec.expertPattern]) matrix[rec.expertPattern] = {};
        matrix[rec.expertPattern][rec.aiPattern] = (matrix[rec.expertPattern][rec.aiPattern] || 0) + 1;

        if (rec.expertPattern === rec.aiPattern) {
            agreed++;
        } else {
            discrepancies.push(`AI:${rec.aiPattern} vs EXP:${rec.expertPattern}`);
        }
    });

    const labeledCount = records.length - unlabeled;
    const agreement_rate = labeledCount > 0 ? (agreed / labeledCount) : 0;
    const unlabeled_ratio = unlabeled / records.length;

    return {
        agreement_rate,
        confusion_matrix: matrix,
        unlabeled_ratio,
        disagreement_reasons: discrepancies.slice(0, 10)
    };
}
