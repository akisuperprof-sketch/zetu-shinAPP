import { RESEARCH_THRESHOLDS } from '../../constants/researchThresholds';

export interface QualityFlags {
    roi_failed?: boolean;
    blur_score?: number;
    brightness_mean?: number;
}

export interface ObservationData {
    tongueColor?: string;
    coatColor?: string;
    coatThickness?: string;
    moisture?: string;
    pattern?: string;
    quality_flags?: QualityFlags;
}

export function checkValidity(obs: ObservationData): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const flags = obs.quality_flags || {};

    if (flags.roi_failed) {
        reasons.push('roi_failed');
    }
    if (flags.blur_score !== undefined && flags.blur_score < RESEARCH_THRESHOLDS.BLUR_MIN) {
        reasons.push('blur_low');
    }
    if (flags.brightness_mean !== undefined && flags.brightness_mean < RESEARCH_THRESHOLDS.BRIGHTNESS_MIN) {
        reasons.push('brightness_low');
    }
    if (flags.brightness_mean !== undefined && flags.brightness_mean > RESEARCH_THRESHOLDS.BRIGHTNESS_MAX) {
        reasons.push('brightness_high');
    }
    if (!obs.pattern || obs.pattern === '不明') {
        reasons.push('missing_observation');
    }

    return {
        valid: reasons.length === 0,
        reasons
    };
}
