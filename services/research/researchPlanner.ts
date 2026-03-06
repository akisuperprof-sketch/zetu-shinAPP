import { ResearchStage } from '../../constants/researchStages';

export function getNextResearchActions(stage: ResearchStage): string[] {
    switch (stage) {
        case ResearchStage.DATA_COLLECTION:
            return [
                'Collect more tongue color samples',
                'Ensure balanced lighting conditions'
            ];
        case ResearchStage.DATA_BALANCING:
            return [
                'Check data coverage panel for shortages',
                'Collect coating thickness variations'
            ];
        case ResearchStage.LABEL_ALIGNMENT:
            return [
                'Request expert labeling',
                'Review mismatch top reasons in dashboard'
            ];
        case ResearchStage.MODEL_EXPLORATION:
            return [
                'Prepare ML training dataset',
                'Extract and save feature vectors'
            ];
        case ResearchStage.MODEL_REFINEMENT:
            return [
                'Fine-tune algorithms',
                'Validate against hold-out sets'
            ];
        default:
            return ['Continue current operations'];
    }
}
