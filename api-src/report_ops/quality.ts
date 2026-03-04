
import { createClient } from "@supabase/supabase-js";
import { calculateMatchGrade } from "../../utils/matchGrader.js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { role } = req.query;

    let query = supabase
        .from('doctor_review')
        .select(`
            doctor_pattern_def_id,
            analyses:analysis_id (
                v2_payload,
                user_role
            )
        `)
        .eq('review_status', 'locked');

    if (role && role !== 'ALL') {
        if (role === 'GENERAL') {
            query = query.in('analyses.user_role', ['LIGHT', 'PRO_PERSONAL']);
        } else {
            query = query.eq('analyses.user_role', role);
        }
    }

    const { data: reviews, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    let global = { s: 0, a: 0, b: 0, c: 0, total: 0 };
    const patternMap: Record<string, { s: 0, a: 0, b: 0, c: 0, total: 0 }> = {};

    (reviews || []).forEach((rev: any) => {
        const v2 = rev.analyses?.v2_payload;
        if (!v2) return;

        const ai_main = v2.diagnosis?.top1_id || 'UNKNOWN';
        const ai_tops = v2.diagnosis?.top3_ids || [];
        const doc_pattern = rev.doctor_pattern_def_id;

        const { match_grade } = calculateMatchGrade(ai_main, ai_tops, doc_pattern);

        global.total++;
        if (match_grade === 'S') global.s++;
        else if (match_grade === 'A') global.a++;
        else if (match_grade === 'B') global.b++;
        else if (match_grade === 'C') global.c++;

        // Per Pattern stats (based on AI result)
        if (!patternMap[ai_main]) patternMap[ai_main] = { s: 0, a: 0, b: 0, c: 0, total: 0 };
        patternMap[ai_main].total++;
        if (match_grade === 'S') patternMap[ai_main].s++;
        else if (match_grade === 'A') patternMap[ai_main].a++;
        else if (match_grade === 'B') patternMap[ai_main].b++;
        else if (match_grade === 'C') patternMap[ai_main].c++;
    });

    const pattern_accuracy = Object.entries(patternMap).map(([def_id, stats]) => ({
        def_id,
        exact_rate: (stats.s / stats.total) * 100,
        group_rate: ((stats.s + stats.a) / stats.total) * 100,
        mismatch_rate: (stats.c / stats.total) * 100,
        total: stats.total
    }));

    if (global.total === 0) {
        return res.status(200).json({ exact_rate: 0, group_rate: 0, partial_rate: 0, mismatch_rate: 0, pattern_accuracy: [] });
    }

    return res.status(200).json({
        exact_rate: (global.s / global.total) * 100,
        group_rate: ((global.s + global.a) / global.total) * 100,
        partial_rate: ((global.s + global.a + global.b) / global.total) * 100,
        mismatch_rate: (global.c / global.total) * 100,
        pattern_accuracy
    });
}
