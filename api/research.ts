import crypto from 'crypto';
import { createClient } from "@supabase/supabase-js";

// In-memory replay protection (best effort in serverless)
const usedJtis = new Set<string>();

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or Invalid Token' });
    }

    const token = authHeader.split(' ')[1];
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return res.status(500).json({ error: 'Server Config Error' });

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [payload_str, signature] = decoded.split('|');
        if (!payload_str || !signature) throw new Error('Invalid format');

        const [jti, expiryStr] = payload_str.split(':');

        const expectedSignature = crypto.createHmac('sha256', internalKey)
            .update(payload_str)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[Research] Invalid Signature');
            return res.status(401).json({ error: 'Invalid Token Signature' });
        }

        if (Date.now() > parseInt(expiryStr, 10)) {
            console.error('[Research] Token Expired');
            return res.status(401).json({ error: 'Token Expired' });
        }

        if (usedJtis.has(jti)) {
            console.error('[Research] Token Replay Detected');
            return res.status(401).json({ error: 'Token already used' });
        }
        usedJtis.add(jti);
        if (usedJtis.size > 10000) usedJtis.clear();
    } catch (e) {
        console.error('[Research] Token Parse Error:', e);
        return res.status(401).json({ error: 'Invalid Token Format' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase Config Missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const {
            anonymous_user_id,
            top1_id,
            level,
            current_type_label,
            is_dummy,
            app_version,
            output_version,
            age_range,
            payload
        } = req.body;

        if (!anonymous_user_id) {
            return res.status(400).json({ error: 'anonymous_user_id required' });
        }

        const { data, error } = await supabase
            .from('research_events')
            .insert([{
                anonymous_user_id,
                top1_id,
                level,
                current_type_label,
                is_dummy,
                app_version,
                output_version,
                age_range,
                payload
            }])
            .select();

        if (error) {
            console.warn('Supabase Insert Error (Research):', error);
            // We return 200 with an error flag to not break client UX
            return res.status(200).json({ status: 'failed', details: error.message });
        }

        return res.status(200).json({ status: 'success', id: data?.[0]?.id });

    } catch (error: any) {
        console.error('API Error (Research):', error);
        return res.status(200).json({ status: 'error', details: error.message || 'Internal' });
    }
}
