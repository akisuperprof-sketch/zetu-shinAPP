
import { createClient } from "@supabase/supabase-js";
import { calculateMatchGrade } from "../../utils/matchGrader";

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
            doctor_confidence,
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

    const buckets = [
        { label: "81-100", min: 81, max: 100, s: 0, total: 0 },
        { label: "61-80", min: 61, max: 80, s: 0, total: 0 },
        { label: "41-60", min: 41, max: 60, s: 0, total: 0 },
        { label: "21-40", min: 21, max: 40, s: 0, total: 0 },
        { label: "0-20", min: 0, max: 20, s: 0, total: 0 }
    ];

    (reviews || []).forEach((rev: any) => {
        const v2 = rev.analyses?.v2_payload;
        if (!v2) return;

        const ai_main = v2.diagnosis?.top1_id || 'UNKNOWN';
        const ai_tops = v2.diagnosis?.top3_ids || [];
        const doc_pattern = rev.doctor_pattern_def_id;
        const confidence = rev.doctor_confidence || 0;

        const { match_grade } = calculateMatchGrade(ai_main, ai_tops, doc_pattern);

        const bucket = buckets.find(b => confidence >= b.min && confidence <= b.max);
        if (bucket) {
            bucket.total++;
            if (match_grade === 'S') bucket.s++;
        }
    });

    const result = buckets.map(b => ({
        range: b.label,
        exact_rate: b.total > 0 ? (b.s / b.total) * 100 : 0,
        total: b.total
    }));

    return res.status(200).json({ buckets: result });
}
