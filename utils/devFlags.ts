/**
 * 開発用フラグ管理ユーティリティ
 */

const STORAGE_KEY = 'DEV_FEATURES';
const PLAN_KEY = 'SELECTED_PLAN';
const VERSION_KEY = 'SELECTED_VERSION';

/**
 * 開発用機能が有効かどうかを判定する
 * 判定条件:
 * 1. URL パラメータに ?debug=1 が含まれている (強制有効化 + localStorage 保存)
 * 2. または、localStorage.getItem("DEV_FEATURES") が "true" であること
 * 3. ただし、マスターロック (VITE_DEV_FEATURES_MASTER) が "true" でない場合の本番環境でも、
 *    明示的なデバッグ操作 (?debug=1) が一度行われれば有効化を維持する。
 */
export const isDevEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;

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
 * 開発用設定の変更が可能かどうかを判定する (マスターロックの状態)
 */
export const isDevConfigurable = (): boolean => {
    return import.meta.env.VITE_DEV_FEATURES_MASTER === 'true';
};

/**
 * 開発用機能をON/OFFに切り替える
 */
export const setDevEnabled = (enabled: boolean): void => {
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
