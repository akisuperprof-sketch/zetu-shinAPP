
import { createClient } from "@supabase/supabase-js";

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
            query = query.in('analyses.user_role', ['LIGHT', 'PRO_PERSONAL']);
        } else {
            query = query.eq('analyses.user_role', role);
        }
    }

    const { data: reviews, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const filteredReviews = (reviews || []).filter((r: any) => r.analyses);

    const matrix: Record<string, Record<string, number>> = {};
    let total = 0;

    filteredReviews.forEach((rev: any) => {
        const ai_def_id = rev.analyses?.v2_payload?.diagnosis?.top1_id || 'UNKNOWN';
        const doc_def_id = rev.doctor_pattern_def_id || 'UNKNOWN';

        if (!matrix[ai_def_id]) matrix[ai_def_id] = {};
        matrix[ai_def_id][doc_def_id] = (matrix[ai_def_id][doc_def_id] || 0) + 1;
        total++;
    });

    const flattenedMatrix: any[] = [];
    for (const [ai, docs] of Object.entries(matrix)) {
        for (const [doc, count] of Object.entries(docs)) {
            flattenedMatrix.push({ ai_def_id: ai, doctor_def_id: doc, count });
        }
    }

    return res.status(200).json({
        matrix: flattenedMatrix,
        total
    });
}
