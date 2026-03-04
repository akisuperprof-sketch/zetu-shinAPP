/**
 * 画像特徴抽出モジュール (Step1: Phase1)
 * 撮影画像を研究資産として蓄積するためのメタデータ抽出を行う。
 */

export interface ImageFeatures {
    brightness_mean: number;
    contrast: number;
    saturation_mean: number;
    sharpness: number;
    blur_score: number;
    tongue_area_ratio: number | null;
    whiteness_ratio: number | null;
    yellowness_ratio: number | null;
}

/**
 * 渡された File オブジェクトから画像特徴を抽出する (ブラウザ環境)
 */
export async function extractImageFeatures(file: File): Promise<ImageFeatures> {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) throw new Error("Canvas context failed");

                    // 解析用に縮小 (読み取り負荷軽減のため256px基準)
                    const scale = Math.min(1, 256 / Math.max(img.width, img.height));
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const numPixels = data.length / 4;

                    let rSum = 0, gSum = 0, bSum = 0, graySum = 0;
                    let brightnessValues: number[] = [];

                    // 1. 基本統計量
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                        rSum += r;
                        gSum += g;
                        bSum += b;
                        graySum += brightness;
                        brightnessValues.push(brightness);
                    }

                    const brightness_mean = graySum / numPixels;
                    const r_mean = rSum / numPixels;
                    const g_mean = gSum / numPixels;
                    const b_mean = bSum / numPixels;

                    // 2. コントラスト (標準偏差)
                    let sqDiffSum = 0;
                    for (const b of brightnessValues) {
                        sqDiffSum += Math.pow(b - brightness_mean, 2);
                    }
                    const contrast = Math.sqrt(sqDiffSum / numPixels);

                    // 3. 彩度 (平均的な鮮やかさ)
                    const saturation_mean = Math.sqrt(
                        Math.pow(r_mean - brightness_mean, 2) +
                        Math.pow(g_mean - brightness_mean, 2) +
                        Math.pow(b_mean - brightness_mean, 2)
                    );

                    // 4. シャープネス & ブレスコア (エッジ強度)
                    let edgeTotal = 0;
                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width - 1; x++) {
                            const idx = (y * canvas.width + x) * 4;
                            const nextIdx = (y * canvas.width + x + 1) * 4;
                            edgeTotal += Math.abs(data[idx] - data[nextIdx]);
                        }
                    }
                    const blur_score = edgeTotal / numPixels;
                    const sharpness = blur_score * 1.5; // 簡易

                    // 5. 苔の色合い簡易推計 (Step1)
                    // ホワイトバランス等の影響を受けるため、あくまで参考値
                    let whiteCount = 0;
                    let yellowCount = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // 白：RGBが近く、明るさが高い
                        if (r > 160 && g > 160 && b > 160 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
                            whiteCount++;
                        }
                        // 黄：RとGが高く、Bが低い
                        else if (r > 150 && g > 140 && b < 100 && (r - b) > 50) {
                            yellowCount++;
                        }
                    }

                    resolve({
                        brightness_mean: Math.round(brightness_mean),
                        contrast: Math.round(contrast),
                        saturation_mean: Math.round(saturation_mean),
                        sharpness: Math.round(sharpness * 10) / 10,
                        blur_score: Math.round(blur_score * 10) / 10,
                        tongue_area_ratio: null, // Phase 1 では null
                        whiteness_ratio: Math.round((whiteCount / numPixels) * 100) / 100,
                        yellowness_ratio: Math.round((yellowCount / numPixels) * 100) / 100
                    });

                } catch (err) {
                    console.error("Feature extraction failed:", err);
                    // 失敗しても null を含んだオブジェクトを返す
                    resolve({
                        brightness_mean: 0,
                        contrast: 0,
                        saturation_mean: 0,
                        sharpness: 0,
                        blur_score: 0,
                        tongue_area_ratio: null,
                        whiteness_ratio: null,
                        yellowness_ratio: null
                    });
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}
