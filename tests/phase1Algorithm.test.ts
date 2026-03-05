import { describe, test, expect } from 'vitest';
import { evaluatePhase1, PHASE1_PATTERNS } from '../engine/phase1Algorithm';

describe('Phase 1 Algorithm Tests', () => {

    test('Case 1: 淡白 (寒) + 薄 (虚) + 湿潤 (寒寄り) = 虚寒 (KYOKAN)', () => {
        const result = evaluatePhase1({
            tongue_color: '淡白',
            coat_color: '白',
            coat_thickness: '薄',
            moisture: '湿潤',
            tongue_shape: '胖嫩',
            questionnaire_score: 50
        });
        // heat=-2 -1 = -3 (Cold) -> isCold
        // excess=-1 (Xu) -> isXu
        // Cold + Xu -> KYOKAN
        expect(result).toBe(PHASE1_PATTERNS.KYOKAN);
    });

    test('Case 2: 淡白 (寒) + 厚 (実) + 湿潤 (寒寄り) = 実寒 (JIKKAN)', () => {
        const result = evaluatePhase1({
            tongue_color: '淡白',
            coat_color: '白',
            coat_thickness: '厚',
            moisture: '湿潤',
            tongue_shape: '胖嫩',
            questionnaire_score: 50
        });
        // heat=-2 -1 = -3 (Cold)
        // excess=+1 (Shi)
        // Cold + Shi -> JIKKAN
        expect(result).toBe(PHASE1_PATTERNS.JIKKAN);
    });

    test('Case 3: 紅 (熱) + 薄 (虚) + 乾燥 (熱寄り) = 虚熱 (KYONETSU)', () => {
        const result = evaluatePhase1({
            tongue_color: '紅',
            coat_color: '黄',
            coat_thickness: '薄',
            moisture: '乾燥',
            tongue_shape: '老',
            questionnaire_score: 50
        });
        // heat=2 +1 = 3 (Heat)
        // excess=-1 (Xu)
        // Heat + Xu -> KYONETSU
        expect(result).toBe(PHASE1_PATTERNS.KYONETSU);
    });

    test('Case 4: 紅 (熱) + 厚 (実) + 乾燥 (熱寄り) = 実熱 (JITSUNETSU)', () => {
        const result = evaluatePhase1({
            tongue_color: '紅',
            coat_color: '黄',
            coat_thickness: '厚',
            moisture: '乾燥',
            tongue_shape: '老',
            questionnaire_score: 50
        });
        // heat=2 +1 = 3 (Heat)
        // excess=+1 (Shi)
        // Heat + Shi -> JITSUNETSU
        expect(result).toBe(PHASE1_PATTERNS.JITSUNETSU);
    });

});
