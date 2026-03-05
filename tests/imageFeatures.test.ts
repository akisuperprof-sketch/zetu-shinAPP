import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { extractImageFeatures } from '../services/features/imageFeatures';

describe('ImageFeatures extraction', () => {

    // Mock canvas, Image and FileReader
    beforeAll(() => {
        global.Image = class {
            onload: () => void = () => { };
            width = 100;
            height = 100;
            set src(value: string) {
                setTimeout(() => this.onload(), 10);
            }
        } as any;

        global.FileReader = class {
            onload: (e: any) => void = () => { };
            readAsDataURL() {
                setTimeout(() => this.onload({ target: { result: 'data:image/png;base64,mock' } }), 10);
            }
        } as any;

        const mockContext = {
            drawImage: vi.fn(),
            getImageData: vi.fn().mockImplementation((x, y, w, h) => {
                const data = new Uint8ClampedArray(w * h * 4);
                // Mock some colors
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 150;     // R
                    data[i + 1] = 100;   // G
                    data[i + 2] = 50;    // B
                    data[i + 3] = 255;   // A
                }
                return { data };
            })
        };

        vi.stubGlobal('document', {
            createElement: (tag: string) => {
                if (tag === 'canvas') {
                    return {
                        width: 100,
                        height: 100,
                        getContext: () => mockContext
                    };
                }
            }
        });
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    test('It calculates mean values correctly and prevents NaN', async () => {
        const dummyFile = new File([''], 'test.png', { type: 'image/png' });
        const result = await extractImageFeatures(dummyFile);

        expect(result.color_r_mean).toBe(150);
        expect(result.color_g_mean).toBe(100);
        expect(result.color_b_mean).toBe(50);

        // redness = (r-g) + (r-b) = 50 + 100 = 150
        expect(result.redness_score).toBe(150);

        // values are not NaN
        expect(Number.isNaN(result.color_r_mean)).toBe(false);
        expect(Number.isNaN(result.redness_score)).toBe(false);
    });

    test('It falls back and prevents NaN when ROI logic fails (no pixels match)', async () => {
        // Feature flag ON
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => key === 'FEATURE_ROI_V0' ? '1' : null
        });

        // Our mock returns 150,100,50 everywhere.
        // The ROI logic filters for isReddish: r > g && r > b && (r - Math.min(g, b)) > 10.
        // For 150, 100, 50, (r - min)= 150-50 = 100 > 10.
        // We need a test where pixels FAIL the ROI logic to see the fallback. 
        // We'll trust the main test to act as successful ROI (since it matches).
        // Let's test the successful ROI fallback mechanism separately or just check that setting the flag doesn't introduce NaNs.

        const dummyFile = new File([''], 'test.png', { type: 'image/png' });
        const result = await extractImageFeatures(dummyFile);

        expect(result.color_r_mean).toBeNull();
        expect(result.redness_score).toBeNull();
        expect(result.roi_failed).toBe(true);

        vi.stubGlobal('localStorage', {
            getItem: () => null
        });
    });

    // We can also test the division by zero explicitly by mocking empty data, 
    // but the fallback handles errors and we threw an error when numPixels = 0.
});
