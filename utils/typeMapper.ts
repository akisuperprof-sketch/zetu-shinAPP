
/**
 * SSOT（主証ID）を「今日のコンディションタイプ（9分類）」にマッピングするユーティリティ
 * 診断ロジックは変更せず、表示レイヤーのみでの変換を行う。
 */

export interface ConditionType {
    key: string;
    name: string;
    icon: string;
    description: string;
    care: string;
}

const TYPE_MAP: Record<string, ConditionType> = {
    // 1. 気虚型 (Qi Deficiency)
    'P_LUNG_QI_DEF': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },
    'P_LI_QI_DEF': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },
    'P_SPLEEN_QI_DEF': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },
    'P_HEART_QI_DEF': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },
    'P_KIDNEY_QI_NOT_FIRM': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },
    'P_KIDNEY_ESS_DEF': { key: 'qi_def', name: '気虚（ききょ）タイプ', icon: '🔋', description: 'エネルギー不足の傾向です。', care: '十分な睡眠と消化に良い食事を。' },

    // 2. 陽虚型 (Yang Deficiency)
    'P_SPLEEN_YANG_DEF': { key: 'yang_def', name: '陽虚（ようきょ）タイプ', icon: '☀️', description: '体が冷えやすい傾向です。', care: '体を温める食材を選んで。' },
    'P_KIDNEY_YANG_DEF': { key: 'yang_def', name: '陽虚（ようきょ）タイプ', icon: '☀️', description: '体が冷えやすい傾向です。', care: '足を冷やさないように。' },
    'P_SI_COLD_DEF': { key: 'yang_def', name: '陽虚（ようきょ）タイプ', icon: '☀️', description: '体が冷えやすい傾向です。', care: '冷たい飲み物を控えて。' },

    // 3. 陰虚型 (Yin Deficiency)
    'P_LUNG_YIN_DEF': { key: 'yin_def', name: '陰虚（いんきょ）タイプ', icon: '💧', description: 'うるおい不足の傾向です。', care: '水分補給と保湿を意識して。' },
    'P_STOMACH_YIN_DEF': { key: 'yin_def', name: '陰虚（いんきょ）タイプ', icon: '💧', description: 'うるおい不足の傾向です。', care: '水分補給と保湿を意識して。' },
    'P_HEART_YIN_DEF': { key: 'yin_def', name: '陰虚（いんきょ）タイプ', icon: '💧', description: 'うるおい不足の傾向です。', care: '水分補給と保湿を意識して。' },
    'P_KIDNEY_YIN_DEF': { key: 'yin_def', name: '陰虚（いんきょ）タイプ', icon: '💧', description: 'うるおい不足の傾向です。', care: '水分補給と保湿を意識して。' },
    'P_LIVER_YIN_DEF': { key: 'yin_def', name: '陰虚（いんきょ）タイプ', icon: '💧', description: 'うるおい不足の傾向です。', care: '水分補給と保湿を意識して。' },

    // 4. 気滞型 (Qi Stagnation)
    'P_LIVER_QI_STAG': { key: 'qi_stag', name: '気滞（きたい）タイプ', icon: '🍃', description: '巡りが滞りがちな傾向です。', care: '深呼吸や軽いストレッチを。' },

    // 5. 血お型 (Blood Stasis)
    'P_HEART_BLOOD_STASIS': { key: 'blood_stasis', name: '血お（けつお）タイプ', icon: '🔄', description: '流れが悪くなっている傾向です。', care: '適度な運動を心がけて。' },
    'P_BLOOD_STASIS': { key: 'blood_stasis', name: '血お（けつお）タイプ', icon: '🔄', description: '流れが悪くなっている傾向です。', care: '適度な運動を心がけて。' },

    // 6. 痰湿型 (Phlegm-Dampness)
    'P_PHLEGM_DAMP_LUNG': { key: 'phlegm_damp', name: '痰湿（たんしつ）タイプ', icon: '☁️', description: '水分が溜まりやすい傾向です。', care: '塩分を控え、排出を助けて。' },
    'P_COLD_DAMP_SPLEEN': { key: 'phlegm_damp', name: '痰湿（たんしつ）タイプ', icon: '☁️', description: '水分が溜まりやすい傾向です。', care: '塩分を控え、排出を助けて。' },

    // 7. 湿熱型 (Damp-Heat)
    'P_LI_DAMP_HEAT': { key: 'damp_heat', name: '湿熱（しつねつ）タイプ', icon: '🌡️', description: '余分な熱と水分が溜まる傾向です。', care: '脂っこい食事を控えめに。' },
    'P_DAMP_HEAT_SP_ST': { key: 'damp_heat', name: '湿熱（しつねつ）タイプ', icon: '🌡️', description: '余分な熱と水分が溜まる傾向です。', care: '脂っこい食事を控えめに。' },
    'P_BLADDER_DAMP_HEAT': { key: 'damp_heat', name: '湿熱（しつねつ）タイプ', icon: '🌡️', description: '余分な熱と水分が溜まる傾向です。', care: '脂っこい食事を控えめに。' },
    'P_LIVER_GB_DAMP_HEAT': { key: 'damp_heat', name: '湿熱（しつねつ）タイプ', icon: '🌡️', description: '余分な熱と水分が溜まる傾向です。', care: '脂っこい食事を控えめに。' },

    // 8. 血虚型 (Blood Deficiency)
    'P_HEART_BLOOD_DEF': { key: 'blood_def', name: '血虚（けっきょ）タイプ', icon: '🍇', description: '栄養が不足しやすい傾向です。', care: '赤い食材や黒い食材を食べて。' },
    'P_LIVER_BLOOD_DEF': { key: 'blood_def', name: '血虚（けっきょ）タイプ', icon: '🍇', description: '栄養が不足しやすい傾向です。', care: '赤い食材や黒い食材を食べて。' },

    // 9. 気血平和型 (Neutral/Balanced)
    'NEUTRAL': { key: 'neutral', name: '気血平和（きけつへいわ）タイプ', icon: '✨', description: 'バランスが良い健康的な状態です。', care: '今のライフスタイルを維持して。' },
    'HEALTHY': { key: 'neutral', name: '気血平和（きけつへいわ）タイプ', icon: '✨', description: 'バランスが良い健康的な状態です。', care: '今のライフスタイルを維持して。' }
};

const DEFAULT_TYPE: ConditionType = {
    key: 'unknown',
    name: 'コンディション分析中',
    icon: '🔍',
    description: '現在の傾向を分析しています。',
    care: '日常のセルフケアを続けてください。'
};

export function getConditionType(top1_id: string | null): ConditionType {
    if (!top1_id) return DEFAULT_TYPE;

    // IDの部分一致も含めて探す (例: P_LIVER_QI_STAG -> 気滞)
    const baseId = top1_id.toUpperCase();

    // 直接マッチ
    if (TYPE_MAP[baseId]) return TYPE_MAP[baseId];

    // 特徴語での簡易判定 (フォールバック)
    if (baseId.includes('QI_DEF')) return TYPE_MAP['P_LUNG_QI_DEF'];
    if (baseId.includes('YANG_DEF')) return TYPE_MAP['P_SPLEEN_YANG_DEF'];
    if (baseId.includes('YIN_DEF')) return TYPE_MAP['P_LUNG_YIN_DEF'];
    if (baseId.includes('QI_STAG')) return TYPE_MAP['P_LIVER_QI_STAG'];
    if (baseId.includes('BLOOD_STASIS')) return TYPE_MAP['P_HEART_BLOOD_STASIS'];
    if (baseId.includes('DAMP_HEAT')) return TYPE_MAP['P_LI_DAMP_HEAT'];
    if (baseId.includes('PHLEGM') || baseId.includes('DAMP')) return TYPE_MAP['P_PHLEGM_DAMP_LUNG'];
    if (baseId.includes('BLOOD_DEF')) return TYPE_MAP['P_HEART_BLOOD_DEF'];
    if (baseId.includes('NEUTRAL')) return TYPE_MAP['NEUTRAL'];

    return DEFAULT_TYPE;
}
