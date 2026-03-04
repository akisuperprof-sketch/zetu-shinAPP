
import { createClient } from "@supabase/supabase-js";
import { calculateMatchGrade } from "../../utils/matchGrader.js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { role } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

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
            // LIGHT + PRO_PERSONAL
            query = query.in('analyses.user_role', ['LIGHT', 'PRO_PERSONAL']);
        } else {
            query = query.eq('analyses.user_role', role);
        }
    }

    const { data: reviews, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Filter null analyses (due to inner join behavior simulation or role filter)
    const filteredReviews = (reviews || []).filter((r: any) => r.analyses);

    let total = 0;
    let s_count = 0;
    let a_count = 0;
    let b_count = 0;
    let c_count = 0;

    filteredReviews.forEach((rev: any) => {
        const v2 = rev.analyses?.v2_payload;
        if (!v2) return;

        const ai_main = v2.diagnosis?.top1_id || null;
        const ai_tops = v2.diagnosis?.top3_ids || [];
        const doc_pattern = rev.doctor_pattern_def_id;

        const { match_grade } = calculateMatchGrade(ai_main, ai_tops, doc_pattern);

        total++;
        if (match_grade === 'S') s_count++;
        else if (match_grade === 'A') a_count++;
        else if (match_grade === 'B') b_count++;
        else if (match_grade === 'C') c_count++;
    });

    if (total === 0) {
        return res.status(200).json({ total_reviews: 0, exact_rate: 0, group_rate: 0, partial_rate: 0, mismatch_rate: 0 });
    }

    return res.status(200).json({
        total_reviews: total,
        exact_rate: (s_count / total) * 100,
        group_rate: ((s_count + a_count) / total) * 100,
        partial_rate: ((s_count + a_count + b_count) / total) * 100,
        mismatch_rate: (c_count / total) * 100
    });
}
