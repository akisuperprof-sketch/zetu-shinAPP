
export type ZaoShiType = 'DRY' | 'SLIGHT_DRY' | 'BALANCED' | 'WET';

export interface ZaoShiLabel {
    type: ZaoShiType;
    label: string;
    subLabel?: string;
    color: string;
}

export const ZAO_SHI_LABELS: Record<ZaoShiType, ZaoShiLabel> = {
    WET: {
        type: 'WET',
        label: '湿り傾向',
        subLabel: 'むくみや重だるさが出やすい傾向',
        color: 'text-blue-600'
    },
    BALANCED: {
        type: 'BALANCED',
        label: 'バランス良好',
        subLabel: '水分バランスは安定している傾向',
        color: 'text-jade-600'
    },
    SLIGHT_DRY: {
        type: 'SLIGHT_DRY',
        label: 'やや乾き傾向',
        subLabel: '乾きやすさが少しある傾向',
        color: 'text-orange-600'
    },
    DRY: {
        type: 'DRY',
        label: '乾き傾向',
        subLabel: '乾きやすさが強めの傾向',
        color: 'text-red-600'
    }
};

export const mapZaoShiToLabel = (score: number): ZaoShiLabel => {
    if (score > 15) return ZAO_SHI_LABELS.WET;
    if (score < -25) return ZAO_SHI_LABELS.DRY;
    if (score < -10) return ZAO_SHI_LABELS.SLIGHT_DRY;
    return ZAO_SHI_LABELS.BALANCED;
};
