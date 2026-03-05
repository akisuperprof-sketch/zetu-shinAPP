import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data: analyses, error } = await supabase
            .from('analyses')
            .select(`
                id,
                created_at,
                expert_observation
            `)
            .not('expert_observation', 'is', null);

        if (error) {
            console.error('[dashboard_data] Fetch error:', error);
            return res.status(500).json({ error: 'Database fetch failed' });
        }

        const observations = analyses.map((a: any) => a.expert_observation);
        return res.status(200).json(observations);
    } catch (e: any) {
        console.error('[dashboard_data] General error:', e);
        return res.status(500).json({ error: 'Unknown server error' });
    }
}
