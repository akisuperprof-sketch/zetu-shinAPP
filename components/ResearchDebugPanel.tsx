
import React, { useState, useEffect } from 'react';

export const ResearchDebugPanel: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<string>('Never');
    const [status, setStatus] = useState<{
        isDev: boolean;
        researchFlag: boolean;
        agreed: boolean;
        missingReason?: string;
    }>({ isDev: false, researchFlag: false, agreed: false });

    useEffect(() => {
        const checkStatus = () => {
            const isDev = import.meta.env.DEV;
            const researchFlag = localStorage.getItem('IS_RESEARCH_MODE') === 'true';
            const agreed = localStorage.getItem('RESEARCH_AGREED') === 'true';

            let missingReason = undefined;
            if (!isDev) missingReason = "Not in DEV environment";
            else if (!researchFlag) missingReason = "Research Mode Flag is OFF";
            else if (!agreed) missingReason = "User Consent is OFF";

            setStatus({ isDev, researchFlag, agreed, missingReason });
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchEvents = async () => {
        if (!import.meta.env.DEV) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/research_debug');
            const data = await res.json();
            if (data.status === 'success') {
                setEvents(data.events || []);
                setLastRefresh(new Date().toLocaleTimeString());
            } else {
                console.warn('[ResearchDebug] Failed to fetch:', data.error);
            }
        } catch (e) {
            console.error('[ResearchDebug] Error fetching:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status.isDev && status.researchFlag && status.agreed) {
            fetchEvents();
        }
    }, [status.researchFlag, status.agreed]);

    if (!import.meta.env.DEV || import.meta.env.MODE === 'production' || process.env.NODE_ENV === 'production') return null;

    return (
        <div className="mt-6 border-t border-slate-700 pt-4 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase font-black text-indigo-400 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    Research Debug Panel
                </h4>
                <button
                    onClick={fetchEvents}
                    disabled={isLoading}
                    className="text-[9px] bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 px-2 py-1 rounded border border-indigo-700/50 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Now'}
                </button>
            </div>

            {/* Status Guard Info */}
            <div className={`p-2 rounded text-[10px] font-bold border ${status.missingReason ? 'bg-red-900/20 border-red-800/50 text-red-400' : 'bg-indigo-900/20 border-indigo-800/50 text-indigo-300'}`}>
                {status.missingReason ? (
                    <div className="flex items-center gap-1.5">
                        <span>❌ No Logs:</span>
                        <span className="underline decoration-red-500/50">{status.missingReason}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span>✅ Research Mode Active</span>
                        <span className="text-[9px] opacity-70 font-normal ml-auto">Last sync: {lastRefresh}</span>
                    </div>
                )}
            </div>

            {/* Event List */}
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {events.length === 0 ? (
                    <div className="text-center py-4 text-slate-600 text-[10px] italic">No recent events found.</div>
                ) : (
                    events.map((ev, i) => (
                        <div key={ev.id || i} className="bg-slate-800/40 p-2 rounded border border-slate-700/50 text-[9px] flex flex-col gap-1.5">
                            <div className="flex justify-between items-center opacity-80">
                                <span className="font-mono text-jade-400">ID: {ev.id?.slice(-8) || 'N/A'}</span>
                                <span className="text-slate-500">{new Date(ev.created_at).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Plan:</span>
                                    <span className={`px-1 rounded bg-slate-700 text-slate-300 ${ev.plan_type === 'pro_personal' ? 'text-blue-300' : ''}`}>
                                        {ev.plan_type || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Age:</span>
                                    <span className="text-slate-300 font-bold">{ev.age_range || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Type:</span>
                                    <span className="text-indigo-300 font-bold truncate max-w-[60px]">{ev.top1_id || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Dummy:</span>
                                    <span className={ev.is_dummy ? 'text-amber-400 font-bold' : 'text-slate-400'}>{ev.is_dummy ? 'TRUE' : 'FALSE'}</span>
                                </div>
                            </div>
                            <div className="text-[8px] text-slate-600 font-mono truncate">User: {ev.anonymous_user_id || 'N/A'}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
