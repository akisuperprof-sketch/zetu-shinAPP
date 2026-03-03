export interface QualityMetrics {
    blur_score: number;
    brightness_mean: number;
    saturation_mean: number;
}

export interface CaptureGuideV2Result {
    message: string;
    isOk: boolean;
    showQualityFeedbackFlag: boolean;
}

export const getCaptureGuideV2 = (metrics: QualityMetrics | null, role: string): CaptureGuideV2Result => {
    if (!metrics) {
        return { message: "明るい場所で舌を枠の中に収めてください", isOk: false, showQualityFeedbackFlag: false };
    }

    const { blur_score, brightness_mean, saturation_mean } = metrics;
    let message = "";
    let isOk = true;
    let showQualityFeedbackFlag = false;

    if (brightness_mean < 80) {
        message = "もう少し明るい場所で撮影してください";
        isOk = false;
        showQualityFeedbackFlag = true;
    } else if (brightness_mean > 180) {
        message = "光が強すぎます。少し暗い場所に移動してください";
        isOk = false;
        showQualityFeedbackFlag = true;
    } else if (blur_score < 15) {
        message = "手ブレに注意して、ピントを合わせてください";
        isOk = false;
        showQualityFeedbackFlag = true;
    } else if (saturation_mean < 20 || saturation_mean > 80) {
        message = "自然光での撮影をおすすめします";
        isOk = false;
        showQualityFeedbackFlag = true;
    }

    if (isOk) {
        message = "撮影しやすい状態です。そのまま撮影してください";
    }

    // Role specific additional context
    if (role === 'STUDENT' && !isOk) {
        message = `${message}（研究に使える品質に近づけるため、光とブレを整えると安心です）`;
    }

    return { message, isOk, showQualityFeedbackFlag };
};
