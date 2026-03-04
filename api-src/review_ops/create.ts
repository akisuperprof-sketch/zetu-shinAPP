
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { analysis_id, doctor_pattern_def_id, doctor_confidence, doctor_comment, reviewer_id_hash } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data, error } = await supabase
        .from('doctor_review')
        .insert([
            {
                analysis_id,
                doctor_pattern_def_id,
                doctor_confidence,
                doctor_comment,
                reviewer_id_hash,
                review_status: 'draft'
            }
        ])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: data?.[0] });
}
