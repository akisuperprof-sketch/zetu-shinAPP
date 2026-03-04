import { AnalysisV2Payload } from '../types.js';

/**
 * 開発・分析用デバッグストレージ（Hardened v1）
 * - 保存対象は実データ整合検証に必要な result_v2.output_payload のみ。
 * - 個人情報（年齢、性別、ID）や画像（URL, base64）は一切保存しない。
 * - TTL（有効期限）を設け、30分で自動的にクリアされる。
 * - 本番環境（PROD）では保存処理が完全にバイパスされる。
 */

const STORAGE_KEY = 'z26_latest_payload_for_explain';
const TTL_MS = 30 * 60 * 1000; // 30分

interface DebugData {
    payload: AnalysisV2Payload;
    expiresAt: number;
    ts: string;
}

/**
 * 分析結果 Payload を安全に保存する（DEV限定）
 */
export function saveLatestPayloadForDebug(payload: AnalysisV2Payload): void {
    // PRODガード: 本番ビルドでは何もしない
    if (!import.meta.env.DEV) return;
    if (typeof window === 'undefined') return;

    try {
        // 保存対象外フィールドが入り込まないよう、構造を明示的に抽出（Deep Copy & Filter）
        const safePayload: AnalysisV2Payload = {
            output_version: payload.output_version,
            guard: { ...payload.guard },
            diagnosis: {
                top1_id: payload.diagnosis.top1_id,
                top2_id: payload.diagnosis.top2_id,
                top3_ids: [...payload.diagnosis.top3_ids]
            },
            display: {
                template_key: payload.display.template_key,
                show: { ...payload.display.show }
            },
            stats: payload.stats ? { ...payload.stats } : undefined
        };

        const debugData: DebugData = {
            payload: safePayload,
            expiresAt: Date.now() + TTL_MS,
            ts: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(debugData));
    } catch (e) {
        console.warn('[DebugStorage] Failed to save payload', e);
    }
}

/**
 * 保存された最新の Payload を取得する。有効期限切れの場合は null を返す。
 */
export function getLatestPayloadForDebug(): { payload: AnalysisV2Payload; ts: string } | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const data: DebugData = JSON.parse(raw);
        if (Date.now() > data.expiresAt) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return { payload: data.payload, ts: data.ts };
    } catch (e) {
        return null;
    }
}

/**
 * 明示的なクリーンアップ
 */
export function clearDebugStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
