
/**
 * 画像品質解析モジュール (v1)
 * 診断ロジックとは完全に分離された観測レイヤー。
 */

export interface ImageQualityPayload {
    brightness_mean: number;
    blur_score: number;
    saturation_mean: number;
    timestamp: number;
    quality_feedback_flag?: string[]; // 保存用: 発生したアラートのログ
}

export function analyzeImageData(data: Uint8ClampedArray, width: number, height: number): Omit<ImageQualityPayload, 'timestamp' | 'quality_feedback_flag'> {
    let r_sum = 0, g_sum = 0, b_sum = 0;
    let brightness_sum = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        r_sum += r;
        g_sum += g;
        b_sum += b;

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        brightness_sum += brightness;
    }

    const numPixels = data.length / 4;
    const brightness_mean = brightness_sum / numPixels;

    const r_mean = r_sum / numPixels;
    const g_mean = g_sum / numPixels;
    const b_mean = b_sum / numPixels;
    const saturation_mean = Math.sqrt(
        Math.pow(r_mean - brightness_mean, 2) +
        Math.pow(g_mean - brightness_mean, 2) +
        Math.pow(b_mean - brightness_mean, 2)
    );

    let edgeTotal = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const nextIdx = (y * width + x + 1) * 4;
            const diff = Math.abs(data[idx] - data[nextIdx]);
            edgeTotal += diff;
        }
    }
    const blur_score = edgeTotal / numPixels;

    return {
        brightness_mean: Math.round(brightness_mean),
        blur_score: Math.round(blur_score * 10) / 10,
        saturation_mean: Math.round(saturation_mean)
    };
}

export function getQualityFeedback(quality: Omit<ImageQualityPayload, 'timestamp' | 'quality_feedback_flag'>) {
    const feedback: { type: string, message: string }[] = [];
    const flags: string[] = [];

    // Thresholds (v1.1)
    if (quality.blur_score < 15) {
        feedback.push({ type: 'blur', message: '手ブレに注意してください' });
        flags.push('BLUR_LOW');
    }
    if (quality.brightness_mean < 80) {
        feedback.push({ type: 'brightness', message: '明るい場所で撮影してください' });
        flags.push('BRIGHTNESS_LOW');
    }
    if (quality.saturation_mean > 60) {
        feedback.push({ type: 'saturation', message: '自然光で撮影してください' });
        flags.push('SATURATION_HIGH');
    }

    return { feedback, flags };
}

/**
 * キャンバスを使用して画像データを解析する (軽量)
 */
export async function analyzeImageQuality(file: File): Promise<ImageQualityPayload | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(null);
                        return;
                    }

                    // 軽量化のため縮小してサンプリング
                    const scale = Math.min(1, 256 / Math.max(img.width, img.height));
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const metrics = analyzeImageData(imageData.data, canvas.width, canvas.height);
                    const { flags } = getQualityFeedback(metrics);

                    resolve({
                        ...metrics,
                        timestamp: Date.now(),
                        quality_feedback_flag: flags
                    });
                } catch (err) {
                    console.error("Image quality analysis failed:", err);
                    resolve(null);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}
