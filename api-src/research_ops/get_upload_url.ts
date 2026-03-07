import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://zetu-shin-app.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(200).end();
    }

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

    try {
        const { bucket, path, contentType } = req.body;
        if (!bucket || !path) {
            return res.status(400).json({ error: 'Missing bucket or path' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Generate a 60s signed upload URL
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(path);

        if (error) throw error;

        return res.status(200).json({
            signedUrl: data.signedUrl,
            token: data.token,
            path: path
        });

    } catch (error: any) {
        console.error('[get_upload_url] Failed:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
