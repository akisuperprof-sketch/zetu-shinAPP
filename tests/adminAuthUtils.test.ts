
import { describe, it, expect } from 'vitest';
import { verifyAdminToken } from '../api-src/research_ops/auth_utils';
import crypto from 'crypto';

describe('Admin Auth Utility (Server Side)', () => {
    const internalKey = 'test_secret';
    process.env.INTERNAL_API_KEY = internalKey;

    const createToken = (expiry: number) => {
        const payload = `jti_test:${expiry}`;
        const signature = crypto.createHmac('sha256', internalKey).update(payload).digest('hex');
        return Buffer.from(`${payload}|${signature}`).toString('base64');
    };

    it('should verify a valid token', () => {
        const token = createToken(Date.now() + 10000);
        const req = { headers: { 'authorization': `Bearer ${token}` } };
        expect(verifyAdminToken(req)).toBe(true);
    });

    it('should fail an expired token', () => {
        const token = createToken(Date.now() - 10000);
        const req = { headers: { 'authorization': `Bearer ${token}` } };
        expect(verifyAdminToken(req)).toBe(false);
    });

    it('should fail with wrong signature', () => {
        const payload = `jti_test:${Date.now() + 10000}`;
        const token = Buffer.from(`${payload}|wrong_sig`).toString('base64');
        const req = { headers: { 'authorization': `Bearer ${token}` } };
        expect(verifyAdminToken(req)).toBe(false);
    });

    it('should fail with missing header', () => {
        const req = { headers: {} };
        expect(verifyAdminToken(req)).toBe(false);
    });
});
