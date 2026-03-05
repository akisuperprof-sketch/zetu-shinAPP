/**
 * 開発用フラグ管理ユーティリティ
 * 
 * 二重封印設計:
 *   Layer 1: import.meta.env.PROD === true なら、全DEV機能を強制無効化
 *   Layer 2: 本番で残存するlocalStorageフラグを自動消去
 * 
 * 本番では ?debug=1 も localStorage も一切効かない。
 */

const STORAGE_KEY = 'DEV_FEATURES';
const PLAN_KEY = 'SELECTED_PLAN';
const VERSION_KEY = 'SELECTED_VERSION';

/** 本番ビルドかどうか (Vite: import.meta.env.PROD) */
const IS_PROD_BUILD = import.meta.env.PROD === true;

/** 本番で強制消去すべきDEVフラグ一覧 */
const DEV_FLAG_KEYS = [
    'DEV_FEATURES',
    'FORCE_PRO',
    'DUMMY_TONGUE',
    'DUMMY_PRESET',
    'MOCK_AI',
    'DEBUG_AUTO_TEST',
    'IS_ADMIN',
    'IS_RESEARCH_MODE',
    'DEV_FLAGS_PROFILE',
];

/**
 * 開発用機能が有効かどうかを判定する
 * 
 * 本番ビルド (import.meta.env.PROD === true) では常に false。
 * ?debug=1 も localStorage も無視。
 * 
 * 開発環境のみ ?debug=1 または localStorage で有効化可能。
 */
export const isDevEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;

    // ===== LAYER 1: 本番ハードガード =====
    // Viteの本番ビルドでは絶対にfalse（tree-shakingで分岐ごと消える）
    if (IS_PROD_BUILD) return false;

    // ===== 以下はDEVビルドのみ到達 =====

    // A. URLパラメータによる強制有効化パッチ
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === '1') {
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
    }

    // B. 保存されたフラグの確認
    return localStorage.getItem(STORAGE_KEY) === 'true';
};

/**
 * 本番環境でDEVフラグが残存していたら静かに消去する
 * App.tsx の useEffect 内で呼ぶ想定
 */
export const purgeDevFlagsInProd = (): void => {
    if (!IS_PROD_BUILD) return;
    if (typeof window === 'undefined') return;

    let purged = false;
    DEV_FLAG_KEYS.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            purged = true;
        }
    });

    // ?debug=1 がURLに残っていたら静かに消す
    const url = new URL(window.location.href);
    if (url.searchParams.has('debug')) {
        url.searchParams.delete('debug');
        window.history.replaceState(null, '', url.toString());
        purged = true;
    }

    if (purged) {
        console.info('[ZETUSHIN] Production: dev flags purged silently.');
    }
};

/**
 * 開発用設定の変更が可能かどうかを判定する (マスターロックの状態)
 */
export const isDevConfigurable = (): boolean => {
    if (IS_PROD_BUILD) return false;
    return import.meta.env.VITE_DEV_FEATURES_MASTER === 'true';
};

/**
 * 開発用機能をON/OFFに切り替える
 */
export const setDevEnabled = (enabled: boolean): void => {
    if (IS_PROD_BUILD) return; // 本番では何もしない
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    if (enabled) {
        console.info('🚀 DEV_FEATURES enabled');
    }
};

/**
 * 現在選択されているプランを取得する
 */
export const getSelectedPlan = (): string => {
    return localStorage.getItem(PLAN_KEY) || 'lite';
};

/**
 * 現在選択されているプランを保存する
 */
export const setSelectedPlan = (plan: string): void => {
    localStorage.setItem(PLAN_KEY, plan);
};

/**
 * 現在選択されているバージョンを取得する
 */
export const getSelectedVersion = (): string => {
    return localStorage.getItem(VERSION_KEY) || 'v0.0.1-legacy';
};

/**
 * 現在選択されているバージョンを保存する
 */
export const setSelectedVersion = (version: string): void => {
    localStorage.setItem(VERSION_KEY, version);
};
