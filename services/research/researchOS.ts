import { ObservationData } from './validityRules';
import { calculateMetrics } from './statisticsEngine';
import { calculateCoverage, nextRecommendations, CoverageItem } from './dataCoverage';
import { evaluateExpertAgreement } from './expertEvaluation';
import { ResearchStage } from '../../constants/researchStages';
import { calculateModelReadiness, ModelReadinessResult } from './modelReadiness';
import { getNextResearchActions } from './researchPlanner';

export interface ResearchState {
    stage: ResearchStage;
    total_records: number;
    labeled_records: number;
    agreement_rate: number;
    validity_rate: number;
    roi_fail_rate: number;
    shortage_top5: CoverageItem[];
    next_actions: string[];
    model_readiness: ModelReadinessResult;
}

export function evaluateResearchState(records: ObservationData[]): ResearchState {
    if (!records || records.length === 0) {
        return {
            stage: ResearchStage.DATA_COLLECTION,
            total_records: 0,
            labeled_records: 0,
            agreement_rate: 0,
            validity_rate: 0,
            roi_fail_rate: 0,
            shortage_top5: [],
            next_actions: ['Collect basic tongue images mapping to valid patients'],
            model_readiness: calculateModelReadiness(0, 0, 0)
        };
    }

    const metrics = calculateMetrics(records);
    const coverage = calculateCoverage(metrics.distributions);
    const evaluation = evaluateExpertAgreement(records);

    const total_records = metrics.total_records;
    const labeled_records = Math.floor(metrics.total_records * metrics.labeled_rate);
    const agreement_rate = evaluation.agreement_rate;
    const validity_rate = metrics.valid_rate;
    const roi_fail_rate = metrics.roi_failed_rate;

    const shortage_top5 = nextRecommendations(coverage);
    const shortage_total = coverage.reduce((sum, item) => sum + item.shortage, 0);

    let stage = ResearchStage.DATA_COLLECTION;

    if (total_records < 100) {
        stage = ResearchStage.DATA_COLLECTION;
    } else if (shortage_total > 0) {
        stage = ResearchStage.DATA_BALANCING;
    } else if (labeled_records < 50) {
        stage = ResearchStage.LABEL_ALIGNMENT;
    } else if (agreement_rate < 0.7) {
        stage = ResearchStage.LABEL_ALIGNMENT;
    } else if (labeled_records >= 300 && agreement_rate >= 0.8) {
        stage = ResearchStage.MODEL_REFINEMENT;
    } else {
        stage = ResearchStage.MODEL_EXPLORATION;
    }

    const next_actions = getNextResearchActions(stage, shortage_top5, roi_fail_rate);
    const model_readiness = calculateModelReadiness(total_records, labeled_records, agreement_rate);

    return {
        stage,
        total_records,
        labeled_records,
        agreement_rate,
        validity_rate,
        roi_fail_rate,
        shortage_top5,
        next_actions,
        model_readiness
    };
}
