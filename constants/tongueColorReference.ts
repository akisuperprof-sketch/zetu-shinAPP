export interface TongueColorEntry {
    id: string;
    label_ja: string;
    label_en: string;
    reading: string;
    hint: string; // 寒熱の方向性など
    hsv_range?: { h: [number, number], s: [number, number], v: [number, number] }; // 暫定
}

export const TONGUE_COLOR_REFERENCE: Record<string, TongueColorEntry> = {
    PALE: {
        id: 'PALE',
        label_ja: '淡白舌',
        label_en: 'Pale',
        reading: 'TANPAKU',
        hint: '寒証・虚証',
    },
    PALE_RED: {
        id: 'PALE_RED',
        label_ja: '淡紅舌',
        label_en: 'Pale Red',
        reading: 'TAN-KO',
        hint: '正常・中間',
    },
    RED: {
        id: 'RED',
        label_ja: '紅舌',
        label_en: 'Red',
        reading: 'KO',
        hint: '熱証',
    },
    DEEP_RED: {
        id: 'DEEP_RED',
        label_ja: '絳舌',
        label_en: 'Deep Red',
        reading: 'KO',
        hint: '極端な熱証',
    },
    PURPLE: {
        id: 'PURPLE',
        label_ja: '紫舌',
        label_en: 'Purple',
        reading: 'SHI',
        hint: '血瘀 (重症)',
    },
    BLACK: {
        id: 'BLACK',
        label_ja: '黒舌',
        label_en: 'Black',
        reading: 'KOKU',
        hint: '極端な寒証または熱証 (重症)',
    }
};
