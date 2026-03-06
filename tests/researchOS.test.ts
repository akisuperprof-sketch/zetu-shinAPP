import { describe, it, expect } from 'vitest';
import { ResearchStage } from '../constants/researchStages';
import { evaluateResearchState } from '../services/research/researchOS';
import { getNextResearchActions } from '../services/research/researchPlanner';
import { calculateModelReadiness } from '../services/research/modelReadiness';

describe('Research OS Modules', () => {

    it('evaluateResearchState handles empty array', () => {
        const state = evaluateResearchState([]);
        expect(state.stage).toBe(ResearchStage.DATA_COLLECTION);
        expect(state.total_records).toBe(0);
        expect(state.labeled_records).toBe(0);
        expect(state.agreement_rate).toBe(0);
    });

    it('evaluateResearchState computes valid state', () => {
        // Create 50 records to pass DATA_COLLECTION condition
        const dummyRecords = Array.from({ length: 50 }).map((_, i) => ({
            tongueColor: i % 2 === 0 ? '淡白' : '紅',
            coatColor: '白',
            coatThickness: '薄',
            moisture: '湿潤',
            pattern: 'KYOKAN'
        }));

        const state = evaluateResearchState(dummyRecords);
        expect(state.total_records).toBe(50);
        expect(state.stage).toBe(ResearchStage.DATA_BALANCING);
    });

    it('getNextResearchActions returns actions', () => {
        const actions = getNextResearchActions(ResearchStage.DATA_COLLECTION);
        expect(actions.length).toBeGreaterThan(0);
        expect(actions[0]).toContain('color samples');
    });

    it('calculateModelReadiness returns correctly', () => {
        expect(calculateModelReadiness(0, 0, 0)).toBe(0);
        expect(calculateModelReadiness(50, 50, 0.8)).toBeGreaterThan(80);
        expect(calculateModelReadiness(10, 5, 0.4)).toBeLessThan(50);
    });

});
