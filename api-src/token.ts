import crypto from 'crypto';

// Minimal rate limit map (resets on container cold start)
const rateLimitMap = new Map<string, number[]>();

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Anti-caching headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const requestId = req.headers['x-request-id'] || `req_tok_${now}_${Math.random().toString(16).slice(2, 6)}`;

    // Rates: Max 10 requests per 1 minute per IP (allowing for dictionary lookups etc)
    const windowMs = 60 * 1000;
    const timestamps = rateLimitMap.get(ip) || [];
    const validTimestamps = timestamps.filter((t: number) => now - t < windowMs);

    if (validTimestamps.length >= 10) {
        return res.status(429).json({
            ok: false,
            requestId,
            code: 'API_4XX',
            message_public: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
            retryable: true
        });
    }

    validTimestamps.push(now);

    // cleanup old map entries occasionally
    if (rateLimitMap.size > 1000) rateLimitMap.clear();

    rateLimitMap.set(ip, validTimestamps);

    // Create short-lived token
    const secret = process.env.INTERNAL_API_KEY;
    if (!secret) return res.status(500).json({
        ok: false,
        requestId,
        code: 'API_5XX',
        message_public: 'Server Config Error',
        retryable: false
    });

    const expiry = now + 5 * 60 * 1000; // 5 minutes
    const jti = crypto.randomBytes(8).toString('hex');

    // We bind using jti + expiry rather than strict IP to allow mobile network switching
    const payload = `${jti}:${expiry}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}|${signature}`).toString('base64');

    const sessionId = crypto.randomUUID();
    res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; Path=/; Max-Age=3600; Secure; SameSite=Lax`);

    return res.status(200).json({ token });
}
