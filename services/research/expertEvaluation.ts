import { ObservationData } from './validityRules';
import { evaluatePhase1 } from '../../engine/phase1Algorithm';

export interface ExpertEvaluationMetrics {
    agreement_rate: number;
    confusion_matrix: Record<string, Record<string, number>>;
    unlabeled_rate: number;
    mismatch_top_reasons: { ai: string; expert: string; count: number }[];
}

export function evaluateExpertAgreement(records: ObservationData[]): ExpertEvaluationMetrics {
    if (!records || records.length === 0) {
        return { agreement_rate: 0, confusion_matrix: {}, unlabeled_rate: 0, mismatch_top_reasons: [] };
    }

    let labeledCount = 0;
    let agreedCount = 0;
    const matrix: Record<string, Record<string, number>> = {};
    const mismatchCounts: Record<string, number> = {};

    for (const obs of records) {
        if (!obs.pattern || obs.pattern === '不明') {
            continue;
        }

        labeledCount++;

        // 観察入力から擬似的なAIパターンをルールベースで算出
        const aiPattern = evaluatePhase1({
            tongue_color: obs.tongueColor || '不明',
            coat_color: obs.coatColor || '不明',
            coat_thickness: obs.coatThickness || '不明',
            moisture: obs.moisture || '不明',
            tongue_shape: '不明',
            questionnaire_score: 50 // 固定
        });

        const expertPattern = obs.pattern;

        if (!matrix[expertPattern]) matrix[expertPattern] = {};
        matrix[expertPattern][aiPattern] = (matrix[expertPattern][aiPattern] || 0) + 1;

        if (expertPattern === aiPattern) {
            agreedCount++;
        } else {
            const splitKey = `${aiPattern}|${expertPattern}`;
            mismatchCounts[splitKey] = (mismatchCounts[splitKey] || 0) + 1;
        }
    }

    const agreement_rate = labeledCount > 0 ? (agreedCount / labeledCount) : 0;
    const unlabeled_rate = (records.length - labeledCount) / records.length;

    const mismatch_top_reasons = Object.entries(mismatchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => {
            const [ai, expert] = key.split('|');
            return { ai, expert, count };
        });

    return {
        agreement_rate,
        confusion_matrix: matrix,
        unlabeled_rate,
        mismatch_top_reasons
    };
}
