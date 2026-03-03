import crypto from 'crypto';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
    // STRICT GUARD: Absolute zero exposure in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).end(); // Act as if it doesn't exist
    }

    // ONLY permit in local development
    const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    if (!isLocal) {
        return res.status(403).json({ error: 'Forbidden: Development only' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase Config Missing', url: !!supabaseUrl, key: !!supabaseKey });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase
            .from('research_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ status: 'success', events: data });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
