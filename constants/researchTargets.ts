import { EXPERT_PATTERNS } from './expertPattern';

export const RESEARCH_TARGETS = {
    tongueColor: 10,
    coatColor: 10,
    coatThickness: 10,
    moisture: 10,
    pattern: 10,
};

export const TARGET_LABELS: Record<string, string[]> = {
    tongueColor: ['淡白', '淡紅', '紅', '絳', '紫', '黒'],
    coatThickness: ['無', '薄', '厚'],
    coatColor: ['白', '黄', '灰', '黒'],
    moisture: ['乾燥', '湿潤', '過湿'],
    pattern: Object.keys(EXPERT_PATTERNS),
};
