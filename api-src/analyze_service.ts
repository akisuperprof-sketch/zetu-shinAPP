import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// In-memory replay protection (best effort in serverless)
const usedJtis = new Set<string>();

// This function runs on Vercel Serverless
export default async function handler(req: any, res: any) {
    // 1. Method Guard
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Security Guard (Short-lived Token Check)
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

        // Replay Protection
        if (usedJtis.has(jti)) {
            return res.status(401).json({ error: 'Token already used' });
        }
        usedJtis.add(jti);
        if (usedJtis.size > 10000) usedJtis.clear();

    } catch {
        return res.status(401).json({ error: 'Invalid Token Format' });
    }

    // Extract Session ID from cookies
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session_id=([^;]+)/);
    const sessionId = match ? match[1] : null;


    // 3. API Config Check
    const apiKey = process.env.GEMINI_API_KEY;
    const requestId = req.headers['x-request-id'] || 'unknown';

    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            requestId,
            code: 'API_5XX',
            message_public: 'Server API configuration error',
            stage: 'init',
            retryable: false
        });
    }

    // 4. Supabase Config Check
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    try {
        const { parts, user_role } = req.body;

        // Initialize Gemini Client
        const ai = new GoogleGenAI({ apiKey });

        // Call Gemini with explicit timeout protection
        console.log(`[analyze_service] Calling Gemini id=${requestId}`);

        let result;
        try {
            // Using a race to implement a reliable timeout for the AI call
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('UPSTREAM_TIMEOUT')), 25000)
            );

            const aiPromise = ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: "user", parts }],
                config: { responseMimeType: "application/json" }
            });

            result = await Promise.race([aiPromise, timeoutPromise]) as any;
        } catch (aiError: any) {
            console.error(`[analyze_service] Gemini Error id=${requestId}:`, aiError);
            const isTimeout = aiError.message === 'UPSTREAM_TIMEOUT';
            return res.status(isTimeout ? 504 : 502).json({
                ok: false,
                requestId,
                code: 'UPSTREAM_AI',
                message_public: isTimeout ? 'AIの応答がタイムアウトしました。' : 'AIサービスでエラーが発生しました。',
                stage: 'call_llm',
                retryable: true
            });
        }

        const text = result.text;
        if (!text) {
            throw new Error('Empty text from AI');
        }

        let savedData = null;

        // 5. Supabase Logging
        if (supabase) {
            try {
                const { data, error: dbError } = await supabase
                    .from('analyses')
                    .insert([
                        {
                            raw_response: JSON.parse(text),
                            request_parts: parts,
                            session_id: sessionId,
                            user_role: user_role || 'FREE'
                        }
                    ])
                    .select();

                if (dbError) {
                    console.warn(`[analyze_service] Supabase Insert Error id=${requestId}:`, dbError);
                    // Do not fail the whole request if only logging fails, but return the status
                } else {
                    savedData = data?.[0];
                }
            } catch (dbEx) {
                console.error(`[analyze_service] Supabase Exception id=${requestId}:`, dbEx);
            }
        }

        return res.status(200).json({
            ok: true,
            requestId,
            text,
            savedId: savedData?.id || null,
            supabaseStatus: supabase ? (savedData ? 'success' : 'failed') : 'not_configured'
        });

    } catch (error: any) {
        console.error(`[analyze_service] UNEXPECTED Error id=${requestId}:`, error);
        return res.status(500).json({
            ok: false,
            requestId,
            code: 'API_5XX',
            message_public: '解析中に予期せぬエラーが発生しました。',
            stage: 'postprocess',
            retryable: true
        });
    }
}
