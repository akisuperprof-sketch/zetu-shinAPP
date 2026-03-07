import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './auth_utils';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 1. 各種カウントの取得
        const { count: totalObs } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true });
        const { count: totalAnalyses } = await supabase.from('analyses').select('*', { count: 'exact', head: true });

        // 2. 既存のダッシュボードレコード（エキスパート評価あり）の取得 (互換性のため)
        const { data: analysesRecords } = await supabase
            .from('analyses')
            .select('id, created_at, expert_observation')
            .not('expert_observation', 'is', null);

        // 3. 最新の10件のアップロード (view: research_dashboard)
        const { data: recentUploads } = await supabase
            .from('research_dashboard')
            .select('*')
            .order('created_at_jst', { ascending: false })
            .limit(10);

        // 4. 日別サマリー (view: research_daily_summary)
        const { data: dailySummary } = await supabase
            .from('research_daily_summary')
            .select('*')
            .order('target_date_jst', { ascending: false })
            .limit(7);

        // 5. 品質サマリー (view: research_quality_summary)
        const { data: qualitySummary } = await supabase
            .from('research_quality_summary')
            .select('*');

        // 6. タイムライン (table: research_events)
        const { data: timeline } = await supabase
            .from('research_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        // 7. 特殊カウント (Review Queue 用)
        const { count: notProcessed } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).eq('segmentation_status', 'not_processed');
        const { count: failedCount } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).eq('segmentation_status', 'failed');
        const { count: lowQuality } = await supabase.from('tongue_observations').select('*', { count: 'exact', head: true }).lt('quality_score', 70).gt('quality_score', 0);

        const records = (analysesRecords || []).map((a: any) => a.expert_observation).filter(Boolean);

        return res.status(200).json({
            records,
            stats: {
                total_observations: totalObs || 0,
                total_analyses: totalAnalyses || 0,
                recent_uploads: recentUploads || [],
                daily_summary: dailySummary || [],
                quality_summary: qualitySummary || [],
                timeline: timeline || [],
                review_counts: {
                    not_processed: notProcessed || 0,
                    failed: failedCount || 0,
                    low_quality: lowQuality || 0
                }
            }
        });
    } catch (e: any) {
        console.error('[dashboard_data] General error:', e);
        return res.status(500).json({ error: 'Unknown server error' });
    }
}
