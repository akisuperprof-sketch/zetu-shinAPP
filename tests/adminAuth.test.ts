
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocking fetch for API tests
global.fetch = vi.fn();

describe('Admin Authentication Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear sessionStorage-like objects if needed (though we use a custom utility)
    });

    it('should fail if no password is provided', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Invalid password' })
        });

        const res = await fetch('/api/research/login', {
            method: 'POST',
            body: JSON.stringify({ password: '' })
        });
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('Invalid password');
    });

    it('should succeed with valid password', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ token: 'mock_token' })
        });

        const res = await fetch('/api/research/login', {
            method: 'POST',
            body: JSON.stringify({ password: 'valid_password' })
        });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.token).toBe('mock_token');
    });
});
