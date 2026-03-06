
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password } = req.body;
    const adminPassword = process.env.ADMIN_RESEARCH_PASSWORD;
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!adminPassword || !internalKey) {
        console.error('[AdminLogin] Environment variables missing');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== adminPassword) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Create a secure 1-hour token
    const now = Date.now();
    const expiry = now + 60 * 60 * 1000; // 1 hour
    const jti = crypto.randomBytes(8).toString('hex');
    const payload = `${jti}:${expiry}`;
    const signature = crypto.createHmac('sha256', internalKey).update(payload).digest('hex');
    const token = Buffer.from(`${payload}|${signature}`).toString('base64');

    return res.status(200).json({ token });
}
