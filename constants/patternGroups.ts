
/**
 * 証パターンのグループ定義 (Single Source of Truth)
 * 研究データの一致率判定（Grade A）に使用します。
 */

export interface PatternGroup {
    id: string;
    name: string;
    patternIds: string[];
}

export const PATTERN_GROUPS: PatternGroup[] = [
    {
        id: 'yin_deficiency',
        name: '陰虚',
        patternIds: [
            'P_LUNG_YIN_DEF',   // 肺陰虚
            'P_STOMACH_YIN_DEF', // 胃陰虚
            'P_HEART_YIN_DEF',   // 心陰虚
            'P_KIDNEY_YIN_DEF',  // 腎陰虚
            'P_LIVER_YIN_DEF',   // 肝陰虚
        ]
    },
    {
        id: 'yang_deficiency',
        name: '陽虚',
        patternIds: [
            'P_SPLEEN_YANG_DEF',
            'P_KIDNEY_YANG_DEF',
        ]
    },
    // 将来的に 痰湿、気鬱などのグループを追加可能
];

// 後方互換性および簡易参照用のエイリアス
export const YIN_DEF_IDS = PATTERN_GROUPS.find(g => g.id === 'yin_deficiency')?.patternIds || [];
export const YANG_DEF_IDS = PATTERN_GROUPS.find(g => g.id === 'yang_deficiency')?.patternIds || [];

/**
 * IDから所属するグループIDを取得する
 */
export function getGroupId(patternId: string): string | null {
    const group = PATTERN_GROUPS.find(g => g.patternIds.includes(patternId));
    return group ? group.id : null;
}
