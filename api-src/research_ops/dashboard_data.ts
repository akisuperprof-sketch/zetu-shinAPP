import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './auth_utils';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // DEBUG STUB: If this works, the function invocation is successful.
    if (req.query.stub === 'true') {
        return res.status(200).json({
            ok: true,
            message: "STUB_ACTIVE",
            env: { has_url: !!process.env.VITE_SUPABASE_URL }
        });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 1. 各種カウントの取得 (Main Table: tongue_observations)
        const { count: totalObs, error: errTotal } = await supabase
            .from('tongue_observations')
            .select('*', { count: 'exact', head: true });

        // 2. 本日のアップロード数 (JST)
        // サーバー時刻ではなく、JSTの00:00:00以降を取得
        const now = new Date();
        const jstOffset = 9 * 60 * 60 * 1000;
        const jstNow = new Date(now.getTime() + jstOffset);
        const jstTodayStart = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()));
        const utcTodayStart = new Date(jstTodayStart.getTime() - jstOffset);

        const { count: todayCount, error: errToday } = await supabase
            .from('tongue_observations')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', utcTodayStart.toISOString());

        // 3. 最新の10件のアップロード (Direct query from tongue_observations)
        const { data: rawRecent, error: errRecent } = await supabase
            .from('tongue_observations')
            .select('id, created_at, processing_mode, segmentation_status, quality_score, processed_path, mask_path')
            .order('created_at', { ascending: false })
            .limit(10);

        // クライアント側で必要な JST 表記を付与
        const recentUploads = (rawRecent || []).map(r => ({
            ...r,
            created_at_jst: new Date(new Date(r.created_at).getTime() + jstOffset).toISOString()
        }));

        // 4. 要確認件数 (Review Queue)
        const { count: notProcessed } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).eq('segmentation_status', 'not_processed');
        const { count: failedCount } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).eq('segmentation_status', 'failed');
        const { count: lowQuality } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).lt('quality_score', 70).gt('quality_score', 0);

        // 5. 特徴量抽出済みデータ (互換性のための空配列)
        const records: any[] = [];

        // 6. デイリーサマリー (簡易版)
        const dailySummary = [{
            target_date_jst: jstNow.toISOString().split('T')[0],
            upload_count: todayCount || 0
        }];

        if (errTotal || errRecent) {
            console.error('[dashboard_data] DB Error:', errTotal || errRecent);
            return res.status(500).json({ error: 'Database error', details: errTotal || errRecent });
        }

        return res.status(200).json({
            records: [],
            stats: {
                total_observations: totalObs || 0,
                total_analyses: totalObs || 0, // 収集フェーズでは一旦Totalと同値
                recent_uploads: recentUploads || [],
                daily_summary: dailySummary,
                quality_summary: [], // View 依存を避けるため一旦空
                timeline: [], // View 依存を避けるため一旦空
                review_counts: {
                    not_processed: notProcessed || 0,
                    failed: failedCount || 0,
                    low_quality: lowQuality || 0
                },
                debug: {
                    has_url: !!SUPABASE_URL,
                    has_key: !!SUPABASE_KEY
                }
            }
        });
    } catch (e: any) {
        console.error('[dashboard_data] General error:', e);
        return res.status(500).json({
            error: 'Unknown server error',
            details: e.message,
            stack: e.stack?.substring(0, 200)
        });
    }
}
