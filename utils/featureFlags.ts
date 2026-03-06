export interface FeatureFlagDefinition {
    key: string;
    description: string;
    devDefault: string | null; // The value to set when "Enable Latest Features" is clicked. Null means do not auto-set.
}

// SSOT of all flags used in the application
export const ALL_FLAGS: FeatureFlagDefinition[] = [
    { key: 'FF_STREAK_V1', description: '継続演出ロゴ等 (Streak V1)', devDefault: '1' },
    { key: 'FF_SHARE_CARD_V1', description: 'SNSシェア画像生成機能 (v1)', devDefault: '1' },
    { key: 'FF_HISTORY_MINI_V1', description: '簡易履歴ミニ表示 (v1)', devDefault: '1' },
    { key: 'FF_CAPTURE_GUIDE_V2', description: '撮影ガイドUI強化 (v2)', devDefault: '1' },
    { key: 'FF_EXPLAIN_TREE_V1', description: '説明ツリー/内部デバッグ (v1)', devDefault: '1' },
    { key: 'FF_PHASE1_STORY_V1', description: 'Phase1 一言ストーリー＆フック (v1)', devDefault: '1' },
    { key: 'FF_CAPTURE_REWARD_V1', description: '撮影成功時エフェクト (v1)', devDefault: '1' },
    { key: 'DEBUG_PANEL_OPEN', description: 'Technical Debug Summaryパネル開閉', devDefault: 'true' },
    { key: 'DUMMY_TONGUE', description: 'カメラバイパス/ダミー画像使用', devDefault: 'true' },
    { key: 'DEBUG_AUTO_TEST', description: 'E2E/自動進行テストモード (手動ON非推奨)', devDefault: null },
    { key: 'FORCE_PRO', description: 'PROプラン強制(UI表示テスト)', devDefault: null },
    { key: 'IS_RESEARCH_MODE', description: '研究モード: 匿名結果ログの蓄積(DEV限定)', devDefault: null },
];

export const FLAGS_LATEST_VERSION = 'FLAGS_LATEST_V1';

export const isResearchModeEnabled = (): boolean => {
    return isFlagEnabled('IS_RESEARCH_MODE', 'true');
};

/**
 * Sets all DEV default flags and tags the profile version
 */
export const setLatestDevFlags = () => {
    console.warn("setLatestDevFlags is deactivated to comply with production hard-lock rules.");
};

export const clearAllDevFlags = () => {
    console.warn("clearAllDevFlags is deactivated.");
};

export const isFlagEnabled = (key: string, expectedValue: string = '1'): boolean => {
    return false; // LocalStorage flag lookup is strictly forbidden
};

// ==========================================
// 拡散UI等の「将来機能」Feature Flag 管理 (憲法第3条準拠)
// ==========================================

import { FeatureFlags } from '../types';

const IS_PROD = typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;

/**
 * デフォルト設定: 全て OFF
 */
export const FEATURES: FeatureFlags = {
    FEATURE_SHARE_CARD: false,
    TYPE_CHART: false,
    TYPE_MAP: false,
    INVITE_FRIEND: false,
    FEATURE_HIRATA_V01: false,
    FEATURE_COLOR_ASSIST: false,
    FEATURE_OBSERVATION_INPUT: false,
    FEATURE_ROI_V0: false,
    FEATURE_OBSERVATION_LOG: false,
    FEATURE_ROI_DEBUG_VIEW: false,
    FEATURE_RESEARCH_DASHBOARD: false,
    FEATURE_RESEARCH_ALERTS: false,
    FEATURE_DATA_COVERAGE: false,
    FEATURE_EXPERT_EVALUATION: false,
    FEATURE_VISION_EXTRACTOR: false,
    FEATURE_HEAT_COLD_ESTIMATOR: false,
    FEATURE_QUALITY_SCORE: false,
    FEATURE_RESEARCH_OS: false,
    FEATURE_RESEARCH_IMAGE_INJECTION: false,
};

import { isAdminAuthenticated } from './adminAuthToken';

/**
 * 機能が有効かどうかを判定する
 */
export const isFeatureEnabled = (key: keyof FeatureFlags): boolean => {
    // 管理者認証済みの場合のみ、特定の研究機能を許可
    const researchFlags: (keyof FeatureFlags)[] = [
        'FEATURE_RESEARCH_DASHBOARD',
        'FEATURE_RESEARCH_IMAGE_INJECTION',
        'FEATURE_RESEARCH_OS',
        'FEATURE_DATA_COVERAGE',
        'FEATURE_RESEARCH_ALERTS',
        'FEATURE_EXPERT_EVALUATION',
        'FEATURE_QUALITY_SCORE',
        'FEATURE_HEAT_COLD_ESTIMATOR'
    ];

    if (researchFlags.includes(key) && isAdminAuthenticated()) {
        return true;
    }

    // 本番環境でのハードロック (オーバーライドは一切無視)
    if (IS_PROD) {
        return FEATURES[key];
    }

    // 開発環境のみ Env Variable オーバーライドを許可
    // VITE_DEV_FEATURE_OVERRIDES='{"FEATURE_RESEARCH_OS": true}'
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEV_FEATURE_OVERRIDES) {
        try {
            const overrides = JSON.parse(import.meta.env.VITE_DEV_FEATURE_OVERRIDES);
            if (overrides[key] === true || overrides[key] === 'true' || overrides[key] === '1') {
                return true;
            }
        } catch (e) {
            console.error('Failed to parse VITE_DEV_FEATURE_OVERRIDES', e);
        }
    }

    return FEATURES[key];
};
