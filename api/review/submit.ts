
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { review_id } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data, error } = await supabase
        .from('doctor_review')
        .update({ review_status: 'locked', reviewed_at: new Date().toISOString() })
        .eq('review_id', review_id)
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: data?.[0] });
}
