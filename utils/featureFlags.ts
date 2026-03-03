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
    if (typeof window === 'undefined') return;

    ALL_FLAGS.forEach(flag => {
        if (flag.devDefault !== null) {
            window.localStorage.setItem(flag.key, flag.devDefault);
        }
    });
    window.localStorage.setItem('DEV_FLAGS_PROFILE', FLAGS_LATEST_VERSION);
};

/**
 * Clears all predefined flags from local storage
 */
export const clearAllDevFlags = () => {
    if (typeof window === 'undefined') return;

    ALL_FLAGS.forEach(flag => {
        window.localStorage.removeItem(flag.key);
    });
    window.localStorage.removeItem('DEV_FLAGS_PROFILE');
};

/**
 * Convenience method to check a flag securely
 */
export const isFlagEnabled = (key: string, expectedValue: string = '1'): boolean => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(key) === expectedValue;
};
