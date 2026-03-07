import crypto from 'node:crypto';

export function verifyAdminToken(req: any) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return false;

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [payload_str, signature] = decoded.split('|');
        if (!payload_str || !signature) return false;

        const [jti, expiryStr] = payload_str.split(':');

        const expectedSignature = crypto.createHmac('sha256', internalKey)
            .update(payload_str)
            .digest('hex');

        if (signature !== expectedSignature) return false;
        if (Date.now() > parseInt(expiryStr, 10)) return false;

        return true;
    } catch {
        return false;
    }
}
