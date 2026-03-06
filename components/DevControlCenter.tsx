import React, { useState, useEffect } from 'react';
import { ALL_FLAGS, setLatestDevFlags, clearAllDevFlags, FLAGS_LATEST_VERSION } from '../utils/featureFlags';
import { ResearchDebugPanel } from './ResearchDebugPanel';
import { isDevEnabled } from '../utils/devFlags';

export const DevControlCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [flagStates, setFlagStates] = useState<Record<string, string | null>>({});
    const [profileVersion, setProfileVersion] = useState<string | null>(null);
    const [planType, setPlanType] = useState<string>('light');
    const [showToast, setShowToast] = useState(false);

    // Only render if dev/debug mode is enabled (manual ?debug=1 or storage flag)
    if (typeof window === 'undefined' || !isDevEnabled()) {
        return null;
    }

    // Refresh flags when opened
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            const currentStates: Record<string, string | null> = {};
            ALL_FLAGS.forEach(f => {
                currentStates[f.key] = window.localStorage.getItem(f.key);
            });
            setFlagStates(currentStates);
            setProfileVersion(window.localStorage.getItem('DEV_FLAGS_PROFILE'));
            setPlanType(window.localStorage.getItem('PLAN_TYPE') || 'light');
        }
    }, [isOpen]);

    // Toast check on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.sessionStorage.getItem('DEV_JUST_UPDATED') === '1') {
            window.sessionStorage.removeItem('DEV_JUST_UPDATED');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    }, []);

    const handleSetLatest = () => {
        setLatestDevFlags();
        window.sessionStorage.setItem('DEV_JUST_UPDATED', '1');
        window.location.reload();
    };

    const handleClearAll = () => {
        clearAllDevFlags();
        window.location.reload();
    };

    const handleToggleFlag = (key: string, currentValue: string | null) => {
        let newValue: string | null = null;
        if (currentValue === '1') newValue = '0';
        else if (currentValue === '0') newValue = '1';
        else if (currentValue === 'true') newValue = 'false';
        else if (currentValue === 'false') newValue = 'true';
        else newValue = '1'; // Default toggle for unset or others

        if (newValue !== null) {
            window.localStorage.setItem(key, newValue);
            setFlagStates(prev => ({ ...prev, [key]: newValue }));
        }
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 font-sans">
            {/* Toast */}
            {showToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 border border-jade-500 text-white px-6 py-3 rounded-full shadow-2xl animate-fade-in-up flex items-center gap-2">
                    <span className="text-jade-400">✅</span>
                    <span className="font-bold text-sm tracking-wide">最新v1を適用しました</span>
                </div>
            )}
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-slate-900 border border-slate-700 text-slate-300 rounded-full py-1.5 px-3 shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2 select-none"
                    title="開発者用コントロールセンターを開く"
                >
                    <span className="text-sm">⚙</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dev</span>
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[340px] max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-fade-in-up">
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700 select-none cursor-move">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">⚙</span>
                            <span className="text-xs font-black uppercase tracking-[0.15em] text-jade-400 font-mono">Dev Control</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white px-2 py-1 select-none">✕</button>
                    </div>

                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1 text-sm space-y-5">
                        <div className="bg-slate-800/50 border border-t-amber-500/50 border-x-transparent border-b-transparent p-3 rounded text-[11px] leading-relaxed select-none">
                            <p className="text-amber-400 font-bold mb-1 flex items-center gap-1">⚠️ THIS IS DEV ENVIRONMENT</p>
                            <p className="text-slate-400 mb-2">
                                Current Profile: <br />
                                <strong className={`font-mono ${profileVersion === FLAGS_LATEST_VERSION ? 'text-jade-400' : 'text-slate-200'}`}>
                                    {profileVersion || 'NONE (Custom or Empty)'}
                                </strong>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={handleSetLatest}
                                className="w-full bg-jade-600 hover:bg-jade-500 text-white font-bold py-2 px-3 rounded shadow-sm transition-colors flex flex-col justify-center items-center gap-0.5 select-none"
                            >
                                <div className="text-xs flex items-center gap-2">✨ Enable Latest Features (v1)</div>
                                <div className="text-[9px] font-normal text-jade-100">最新UIをまとめてON（ページを自動リロードします）</div>
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="w-full bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800 font-bold py-2 rounded text-xs transition-colors select-none"
                            >
                                🗑 Clear All Flags
                            </button>
                        </div>

                        {/* Plan Toggle */}
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                            <h4 className="text-[10px] uppercase font-bold text-blue-400 mb-2 tracking-widest flex items-center justify-between">
                                🛡️ Plan Selection
                                <span className="bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-mono">{planType}</span>
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        window.localStorage.setItem('PLAN_TYPE', 'light');
                                        setPlanType('light');
                                        window.location.reload();
                                    }}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all border ${planType === 'light' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => {
                                        window.localStorage.setItem('PLAN_TYPE', 'pro_personal');
                                        setPlanType('pro_personal');
                                        window.location.reload();
                                    }}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all border ${planType === 'pro_personal' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                                >
                                    Pro Personal
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div>
                            <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest border-b border-slate-800 pb-1">Current Feature Flags</h4>
                            <table className="w-full text-left border-collapse text-[10px]">
                                <tbody>
                                    {ALL_FLAGS.map(f => (
                                        <tr key={f.key} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                            <td className="py-2 pr-2">
                                                <div className="font-mono text-slate-300 font-bold max-w-[140px] truncate" title={f.key}>{f.key}</div>
                                                <div className="text-slate-500 text-[9px] mt-0.5 max-w-[140px] truncate" title={f.description}>{f.description}</div>
                                            </td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => handleToggleFlag(f.key, flagStates[f.key])}
                                                    className="hover:scale-105 active:scale-95 transition-transform"
                                                >
                                                    {flagStates[f.key] ? (
                                                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${flagStates[f.key] === '1' || flagStates[f.key] === 'true' ? 'bg-jade-900/40 text-jade-400 border border-jade-500/20' : 'bg-blue-900/40 text-blue-400 border border-blue-500/20'}`}>
                                                            {flagStates[f.key]}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600 font-mono text-[9px] hover:text-slate-400">unset</span>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Research OS Shortcuts */}
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl space-y-2">
                            <h4 className="text-[10px] uppercase font-bold text-blue-400 tracking-widest flex items-center gap-1">
                                🔬 Research Tools
                            </h4>
                            <button
                                onClick={() => window.location.href = '/admin/research'}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded text-[10px] shadow-sm transition-colors flex items-center justify-center gap-2 select-none"
                            >
                                📊 Open Research Dashboard
                            </button>
                            <p className="text-[8px] text-blue-400/70 text-center uppercase tracking-tighter">
                                Requires FEATURE_RESEARCH_DASHBOARD flag
                            </p>
                        </div>

                        {/* Research Debug Panel Section */}
                        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3 shadow-inner">
                            <ResearchDebugPanel />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevControlCenter;
