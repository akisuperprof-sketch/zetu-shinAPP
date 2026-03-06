import { ResearchStage } from '../../constants/researchStages';
import { CoverageItem } from './dataCoverage';

export function getNextResearchActions(stage: ResearchStage, shortage_top5: CoverageItem[], roi_fail_rate: number): string[] {
    const actions: string[] = [];

    if (roi_fail_rate > 0.2) {
        actions.push('Improve capture quality: reduce ROI failure by centering tongue');
    }

    switch (stage) {
        case ResearchStage.DATA_COLLECTION:
            actions.push('Collect basic tongue images mapping to valid patients');
            break;
        case ResearchStage.DATA_BALANCING:
            shortage_top5.forEach(s => {
                actions.push(`Collect more: ${s.axis}=${s.label} (need +${s.shortage})`);
            });
            break;
        case ResearchStage.LABEL_ALIGNMENT:
            actions.push('Request expert labeling to increase count');
            actions.push('Review mismatch top reasons in dashboard to align mapping rules');
            break;
        case ResearchStage.MODEL_EXPLORATION:
            actions.push('Prepare ML training dataset export');
            actions.push('Investigate initial feature correlation');
            break;
        case ResearchStage.MODEL_REFINEMENT:
            actions.push('Focus on hard edge cases and false positives');
            actions.push('Validate against a strict hold-out dataset');
            break;
    }

    if (actions.length === 0) {
        actions.push('Continue normal data collection operations');
    }

    return actions.slice(0, 7);
}
