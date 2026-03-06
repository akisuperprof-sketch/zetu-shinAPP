
import React, { useState, useEffect } from 'react';
import { saveAdminToken, isAdminAuthenticated, getAdminToken, clearAdminToken } from '../utils/adminAuthToken';

interface AdminAuthGateProps {
    children: React.ReactNode;
}

const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated());
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const trimmedPassword = password.trim();
        try {
            const res = await fetch('/api/research/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: trimmedPassword })
            });

            if (res.ok) {
                const { token } = await res.json();
                saveAdminToken(token);
                setIsAuthenticated(true);
            } else {
                if (res.status === 401) {
                    setError('Invalid password');
                } else if (res.status === 404) {
                    setError('Login endpoint not available (404)');
                } else if (res.status === 500) {
                    setError('Server configuration error (500)');
                } else {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || `Access denied (${res.status})`);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Connection error');
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-noto">
            <meta name="robots" content="noindex, nofollow" />
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <span className="text-4xl mb-4 block">🛡️</span>
                    <h1 className="text-xl font-black text-white uppercase tracking-widest">Internal Research Access</h1>
                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-tighter">Admin Authentication Required</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1 tracking-widest">Access Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter administrative secret"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold py-2 px-3 rounded-lg flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none uppercase tracking-widest text-xs"
                    >
                        {loading ? 'Verifying...' : 'Authorize Access'}
                    </button>
                </form>

                <p className="text-[9px] text-slate-600 mt-8 text-center uppercase tracking-widest">
                    Unauthorized access is strictly prohibited.
                </p>
            </div>
        </div>
    );
};

export default AdminAuthGate;
