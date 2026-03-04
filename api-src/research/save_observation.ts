import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

const usedJtis = new Set<string>();

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. セキュリティチェック (HMAC Token Verify)
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or Invalid Token' });
    }
    const token = authHeader.split(' ')[1];
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return res.status(500).json({ error: 'Server Config Error' });

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [payload, signature] = decoded.split('|');
        const [jti, expiryStr] = payload.split(':');

        const expectedSignature = crypto.createHmac('sha256', internalKey).update(payload).digest('hex');
        if (signature !== expectedSignature) {
            return res.status(401).json({ error: 'Invalid Token Signature' });
        }
        if (Date.now() > parseInt(expiryStr, 10)) {
            return res.status(401).json({ error: 'Token Expired' });
        }
        if (usedJtis.has(jti)) {
            return res.status(401).json({ error: 'Token Replay Detected' });
        }
        usedJtis.add(jti);
        if (usedJtis.size > 10000) usedJtis.clear();
    } catch (e) {
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
            image_base64,
            image_mime_type,
            diagnosis,
            features,
            is_dummy
        } = req.body;

        if (!anonymous_user_id || !image_base64) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const dateStr = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
        const uuid = crypto.randomUUID();
        const extension = image_mime_type === 'image/png' ? 'png' : 'jpg';
        const fileName = `${uuid}.${extension}`;
        const storagePath = `${anonymous_user_id}/${dateStr}/${fileName}`;

        // 2. Supabase Storage へアップロード
        const buffer = Buffer.from(image_base64, 'base64');
        const { error: uploadError } = await supabase.storage
            .from('tongue-images')
            .upload(storagePath, buffer, {
                contentType: image_mime_type,
                upsert: true
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
        }

        // 3. DBへレコード保存 (tongue_observations テーブル)
        const { error: dbError } = await supabase
            .from('tongue_observations')
            .insert([{
                anon_id: anonymous_user_id,
                date: new Date().toISOString(),
                type: diagnosis.type,
                score: diagnosis.score,
                x: diagnosis.x,
                y: diagnosis.y,
                storage_path: storagePath,
                features_json: features,
                status: uploadError ? 'failed' : 'success',
                error_message: uploadError ? uploadError.message : null,
                is_dummy: is_dummy || false
            }]);

        if (dbError) {
            console.warn('DB Insert Error (Observations):', dbError);
            return res.status(500).json({ status: 'failed', error: dbError.message });
        }

        return res.status(200).json({ status: 'success', path: storagePath });

    } catch (error: any) {
        console.error('Observation logging failed:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
