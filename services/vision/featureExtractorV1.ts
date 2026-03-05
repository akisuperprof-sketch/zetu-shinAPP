import { ImageFeatures } from '../features/imageFeatures';

export interface AdditionalFeatures {
    redness_index: number;
    brightness_index: number;
    saturation_index: number;
    yellow_coating_proxy: number;
    dryness_proxy: number;
    purple_proxy: number;
    texture_proxy: number;
}

/**
 * 舌診特徴量設計 v1
 * 画像が無くてもユニットテスト可能なように純粋関数レイヤーとして実装。
 * 既存の features (rgb平均や輝度、ブラーなど) から、診断に直結するプロキシ値を 0-100 に正規化して算出。
 */
export function extractAdditionalFeatures(features: ImageFeatures | null | undefined): AdditionalFeatures | null {
    if (!features) return null;

    // ROIが失敗したか、もしくは主要な特徴量がnullのときはnullを返す
    if (features.roi_failed || typeof features.color_r_mean !== 'number') return null;

    // Redness Index: (R - G) + (R - B) のような簡易推定値 (通常 0~200) -> 0~100 に正規化
    const rawR = features.color_r_mean || 0;
    const rawG = features.color_g_mean || 0;
    const rawB = features.color_b_mean || 0;

    // 赤み
    const rawRedness = Math.max(0, (rawR - rawG) + (rawR - rawB));
    const redness_index = Math.min(100, (rawRedness / 200) * 100);

    // 明るさ (0~255) -> (0~100)
    const rawBright = features.brightness_mean || 0;
    const brightness_index = Math.min(100, (rawBright / 255) * 100);

    // 彩度 (既存のsaturation_meanベースに簡易スケーリング)
    const rawSat = features.saturation_mean || 0;
    const saturation_index = Math.min(100, (rawSat / 100) * 100); // Saturation Mean 0-60+程度

    // 黄苔寄り (R>100 & G>100 & B<G) -> Bが少ないほど黄色。
    const yellow_diff = Math.max(0, (rawG - rawB));
    const yellow_coating_proxy = Math.min(100, (yellow_diff / 80) * 100);

    // 乾燥指標: Blur Scoreが異常に高い(エッジが鋭い)＆彩度が低いと乾燥のヒント。
    const rawBlur = features.blur_score || 0;
    // Edge強度40を最大としてみる
    const dryness_proxy = Math.min(100, (rawBlur / 40) * 100);

    // 紫指標: RとBがともに高く、Gが少ない
    const rb_mix = Math.min(rawR, rawB);
    const purple_diff = rb_mix - rawG;
    const purple_proxy = Math.max(0, Math.min(100, (purple_diff / 50) * 100));

    // テクスチャ (苔厚のプロキシ): コントラストが高いと凹凸があるとして苔厚プロキシを加算
    const rawContrast = features.contrast || 0;
    const texture_proxy = Math.min(100, (rawContrast / 80) * 100);

    return {
        redness_index,
        brightness_index,
        saturation_index,
        yellow_coating_proxy,
        dryness_proxy,
        purple_proxy,
        texture_proxy
    };
}
