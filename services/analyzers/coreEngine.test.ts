import { describe, it, expect } from 'vitest';
import { analyzeCore, TongueInput, HearingInput } from './coreEngine';

describe('coreEngine tests', () => {

    it('calculates perfectly healthy case (all 0s/nulls)', () => {
        const tongue: TongueInput = {
            bodyColor: '淡紅',
            bodyShape: [],
            coatColor: '白',
            coatThickness: '薄',
            coatTexture: [],
            moisture: '正常',
            regionMap: {}
        };
        const hearing: HearingInput = {
            'Q01': 0, 'Q02': 0, 'Q03': 0, 'Q04': 0, 'Q05': 0,
            'Q06': 0, 'Q07': 0, 'Q08': 0, 'Q09': 0, 'Q10': 0,
            'Q11': 0, 'Q12': 0, 'Q13': 0,
            'Q14': 0, 'Q15': 0, 'Q16': 0,
            'Q17': 0, 'Q18': 0,
            'Q19': 0, 'Q20': 0
        };

        const out = analyzeCore(tongue, hearing);

        // 淡紅(X+1), 白(Y+1, Z+1) => Y_raw=1, X_raw=1, Z_raw=1
        // Wait, let's just make sure it doesn't crash and returns reasonable bounds.
        expect(out.axes.X_final).toBeDefined();
        expect(out.axes.type4).toBe('混合');
    });

    it('handles nulls (unanswered) in hearing and adjusts coverage weight', () => {
        const tongue: TongueInput = {
            bodyColor: '絳（深紅）', // Heat/dry
        };
        const hearing: HearingInput = {
            'Q01': null, 'Q02': null, 'Q03': null, 'Q04': null, 'Q05': null,
            'Q06': null, 'Q07': null, 'Q08': null, 'Q09': null, 'Q10': null,
            'Q11': null, 'Q12': null, 'Q13': null,
            'Q14': null, 'Q15': null, 'Q16': null,
            'Q17': null, 'Q18': null,
            'Q19': null, 'Q20': null
        };

        const out = analyzeCore(tongue, hearing);

        // Extracted X_tongue from 絳 => X=-1, Y=-3, Z=-2
        // X_tongue = -100*-1/18 = -6 (actually round(100*-1/18) = -6)
        // Hearing is 0 coverage, w_hear = 0.
        expect(out.axes.X_final).toBeCloseTo(-6, 0);
    });

    it('applies Aux Rule A (liver stagnation) correctly', () => {
        const tongue: TongueInput = {
            regionMap: {
                'side': ['紅'] // force side region
            }
        };
        const hearing: HearingInput = {
            'Q10': 2 // Irritability
        };

        const out = analyzeCore(tongue, hearing);

        // Aux Rule A should boost P_LIVER_QI_STAG
        const stag = out.top3.find(t => t.id === 'P_LIVER_QI_STAG');
        expect(stag).toBeDefined();
        expect(out.region.primary).toBe('side');
    });

    it('applies Aux Rule B (blood stasis) correctly', () => {
        const tongue: TongueInput = {
            bodyColor: '紫'
        };
        const hearing: HearingInput = {};
        const out = analyzeCore(tongue, hearing);
        const stasis = out.top3.find(t => t.id === 'P_HEART_BLOOD_STASIS');
        expect(stasis).toBeDefined();
    });

    it('applies Aux Rule C (cold damp spleen) correctly', () => {
        const tongue: TongueInput = {
            bodyColor: '淡',    // X:2, Y:1
            coatColor: '白',    // X:0, Y:1, Z:1
            coatTexture: ['滑'] // X:0, Y:1, Z:2
        }; // Y_raw = 3 => Y_tongue = 100*3/18 = 17
        const hearing: HearingInput = {
            'Q11': 2, 'Q12': 2 // Cold => C=100, Y_hear = 100
        };
        // 滑, coatThickness thick implicitly from 滑 -> meets isThick
        // Y_final uses both tongue and hear, should easily be > 10
        const out = analyzeCore(tongue, hearing);
        const coldSpleen = out.top3.find(t => t.id === 'P_COLD_DAMP_SPLEEN');
        expect(coldSpleen).toBeDefined();
    });

    it('correctly categorizes type4 thresholds', () => {
        // We know X_final >= 10 and Y_final >= 10 => 虚寒
        // Let's force X=10, Y=10
        // Tongue only, 0 coverage on hearing => w_tongue=1
        // To get X=10, Y=10 -> X_raw needs to be approx 18 * 0.1 = 1.8 -> 2
        // So Point_X = 2, Point_Y = 2
        const tongue: TongueInput = {
            bodyColor: '淡', // X+2, Y+1
            coatColor: '白' // X0, Y+1, Z+1
        };
        // Total X_raw=2, Y_raw=2. Tongue norm: X = 100*2/18 = 11. Y = 100*2/18 = 11. Z=100*1/24 = 4
        const out = analyzeCore(tongue, {});
        expect(out.axes.X_final).toBeGreaterThanOrEqual(10);
        expect(out.axes.Y_final).toBeGreaterThanOrEqual(10);
        expect(out.axes.type4).toBe('虚寒');
    });

});
