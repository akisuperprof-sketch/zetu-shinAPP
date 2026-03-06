import { ObservationData } from './validityRules';
import { calculateMetrics } from './statisticsEngine';
import { calculateCoverage } from './dataCoverage';
import { evaluateExpertAgreement } from './expertEvaluation';
import { ResearchStage, STAGE_THRESHOLDS } from '../../constants/researchStages';

export interface ResearchState {
    stage: ResearchStage;
    total_records: number;
    labeled_records: number;
    agreement_rate: number;
    coverage_shortage: number;
}

export function evaluateResearchState(records: ObservationData[]): ResearchState {
    if (!records || records.length === 0) {
        return {
            stage: ResearchStage.DATA_COLLECTION,
            total_records: 0,
            labeled_records: 0,
            agreement_rate: 0,
            coverage_shortage: 0
        };
    }

    const metrics = calculateMetrics(records);
    const coverage = calculateCoverage(metrics.distributions);
    const evaluation = evaluateExpertAgreement(records);

    const total_records = metrics.total_records;
    const labeled_records = Math.floor(metrics.total_records * metrics.labeled_rate);
    const agreement_rate = evaluation.agreement_rate;
    const coverage_shortage = coverage.reduce((acc, rec) => acc + rec.shortage, 0);

    let stage = ResearchStage.DATA_COLLECTION;

    if (total_records >= STAGE_THRESHOLDS.DATA_COLLECTION_MIN_RECORDS) {
        if (coverage_shortage <= STAGE_THRESHOLDS.DATA_BALANCING_MAX_SHORTAGE) {
            if (agreement_rate >= STAGE_THRESHOLDS.LABEL_ALIGNMENT_MIN_AGREEMENT) {
                stage = ResearchStage.MODEL_EXPLORATION;
            } else {
                stage = ResearchStage.LABEL_ALIGNMENT;
            }
        } else {
            stage = ResearchStage.DATA_BALANCING;
        }
    }

    return {
        stage,
        total_records,
        labeled_records,
        agreement_rate,
        coverage_shortage
    };
}
