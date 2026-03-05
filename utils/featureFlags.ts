/**
 * 将来機能（拡散UI等）のFeature Flag管理
 * 
 * 憲法第3条に基づき、開発済みの機能であっても
 * 以下のフラグが true にならない限り、ユーザーには一切公開されない。
 * 
 * 公開条件:
 *   - 研究データ 3,000件突破
 *   - 一般公開フェーズへの移行
 *   - 管理者による手動解除
 */

import { FeatureFlags } from '../types';

const IS_PROD = import.meta.env.PROD === true;

/**
 * デフォルト設定: 全て OFF
 * 
 * 本番環境では環境変数 VITE_ENABLE_FUTURE_FEATURES が "true" でない限り
 * 強制的に false が返される。
 */
export const FEATURES: FeatureFlags = {
    SHARE_CARD: false,
    TYPE_CHART: false,
    TYPE_MAP: false,
    INVITE_FRIEND: false,
};

/**
 * 機能が有効かどうかを判定する
 */
export const isFeatureEnabled = (key: keyof FeatureFlags): boolean => {
    // 本番環境でのハードロック
    if (IS_PROD) {
        // 本番でも特定の環境変数がセットされている場合のみ許可する設計（将来用）
        return FEATURES[key] && import.meta.env.VITE_ENABLE_FUTURE_FEATURES === 'true';
    }

    // 開発環境では FEATURES の値に従う
    return FEATURES[key];
};
