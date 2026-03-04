
import { createClient } from "@supabase/supabase-js";

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

    // Fetch reviews joined with analyses
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

    const matrix: Record<string, Record<string, number>> = {};
    const ai_totals: Record<string, number> = {};
    const doctor_totals: Record<string, number> = {};

    (reviews || []).forEach((rev: any) => {
        const ai_def_id = rev.analyses?.v2_payload?.diagnosis?.top1_id || 'UNKNOWN';
        const doc_def_id = rev.doctor_pattern_def_id || 'UNKNOWN';

        // Update Matrix
        if (!matrix[ai_def_id]) matrix[ai_def_id] = {};
        matrix[ai_def_id][doc_def_id] = (matrix[ai_def_id][doc_def_id] || 0) + 1;

        // Update Totals
        ai_totals[ai_def_id] = (ai_totals[ai_def_id] || 0) + 1;
        doctor_totals[doc_def_id] = (doctor_totals[doc_def_id] || 0) + 1;
    });

    // Flatten matrix for API consistency
    const flattenedMatrix: any[] = [];
    for (const [ai, docs] of Object.entries(matrix)) {
        for (const [doc, count] of Object.entries(docs)) {
            flattenedMatrix.push({ ai_def_id: ai, doctor_def_id: doc, count });
        }
    }

    return res.status(200).json({
        matrix: flattenedMatrix,
        ai_totals,
        doctor_totals
    });
}
