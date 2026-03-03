import React, { useState } from 'react';
import { DEBUG_MODE, getDebugLog } from '../utils/debugConfig';
import { YIN_DEF_IDS } from '../constants/patternGroups';

// TODO: Remove DEBUG_MODE features before production release
// 本番リリース前に必ず DEBUG_MODE を false に変更すること

interface DebugPanelProps {
    plan?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ plan }) => {
    if (!DEBUG_MODE) return null;

    const [isOpen, setIsOpen] = useState(false);

    const isDummy = import.meta.env.DEV && localStorage.getItem("DUMMY_TONGUE") === "true";
    const currentPreset = localStorage.getItem("DUMMY_PRESET") || "none";

    const toggleDummy = () => {
        const val = localStorage.getItem("DUMMY_TONGUE") === "true";
        localStorage.setItem("DUMMY_TONGUE", val ? "false" : "true");
        window.location.reload();
    };

    const setPreset = (preset: string) => {
        localStorage.setItem("DUMMY_PRESET", preset);
        localStorage.setItem("DUMMY_TONGUE", "true");
        window.location.reload();
    };

    const formatJSON = (data: any) => {
        if (!data) return "None";
        return JSON.stringify(data, null, 2);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-red-600 text-white text-xs px-3 py-2 rounded-full shadow-xl opacity-80 hover:opacity-100 z-50 font-mono"
            >
                🐞 DEBUG
            </button>
        );
    }

    const lastReq = getDebugLog('debug:lastRequest');
    const lastRes = getDebugLog('debug:lastResponse');
    const lastErr = getDebugLog('debug:lastError');

    // Quick Extractors for specified debug info
    const level = lastRes?.data?.parsed?.guard?.level || lastRes?.data?.guard?.level || "N/A";
    const top1 = lastRes?.data?.parsed?.diagnosis?.top1_id || lastRes?.data?.top3?.[0]?.id || "N/A";
    const top3 = lastRes?.data?.parsed?.diagnosis?.top3_ids || lastRes?.data?.top3?.map((t: any) => t.id) || "N/A";
    const templateKey = lastRes?.data?.parsed?.display?.template_key || "N/A";
    const reqId = lastRes?.data?.savedId || "N/A";

    // Quick Hearing Info (Assuming it's inside lastReq parts)
    let answeredState = "N/A";
    try {
        // Rough approximation, detailed hearing info would be passed down via props if possible,
        // but parsing lastReq is the most decoupled way here.
        const reqText = lastReq?.parts?.[0]?.text;
        if (reqText && reqText.includes('Q01')) {
            // We know it has hearing data. Real count should be handled in HearingScreen directly for precise UI
            answeredState = "Check HearingScreen for exact counts";
        }
    } catch (e) { }

    return (
        <div className="fixed bottom-4 right-4 w-[400px] max-h-[80vh] bg-slate-900 border border-red-500 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col font-mono text-xs text-green-400">
            <div className="bg-red-900 text-white p-2 flex justify-between items-center flex-shrink-0">
                <span className="font-bold flex items-center">
                    <span className="mr-2">🐞</span> DEBUG PANEL
                    {isDummy && <span className="ml-2 bg-white text-red-900 px-1 rounded text-[8px] animate-pulse">DUMMY MODE</span>}
                </span>
                <button onClick={() => setIsOpen(false)} className="hover:bg-red-800 p-1 rounded">
                    Close [X]
                </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-4">
                <div>
                    <h3 className="text-white font-bold mb-1 border-b border-slate-700">Quick Stats</h3>
                    <ul className="space-y-1 mt-2 text-[10px]">
                        <li><span className="text-slate-500">active_plan:</span> <span className={plan === 'pro' ? 'text-amber-400 font-bold' : 'text-slate-300'}>{plan?.toUpperCase() || "N/A"}</span> {localStorage.getItem('FORCE_PRO') === 'true' && <span className="text-[8px] bg-red-900 text-white px-1 ml-1 rounded">FORCE_PRO</span>}</li>
                        <li><span className="text-slate-500">guard.level:</span> {level}</li>
                        <li><span className="text-slate-500">top1_id:</span> {top1}</li>
                        <li><span className="text-slate-500">top3_ids:</span> {JSON.stringify(top3)}</li>
                        <li><span className="text-slate-500">template_key:</span> {templateKey}</li>
                        <li><span className="text-slate-500">request_id:</span> {reqId}</li>
                        <li><span className="text-slate-500">Hearing:</span> {answeredState}</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-1 border-b border-slate-700">Test Controls</h3>
                    <div className="flex flex-col gap-2 mt-2">
                        <button
                            onClick={() => {
                                localStorage.setItem("FORCE_PRO", "true");
                                localStorage.setItem("DUMMY_TONGUE", "true");
                                localStorage.setItem("DUMMY_PRESET", "lv4");
                                localStorage.setItem("DEBUG_AUTO_TEST", "v1");
                                window.location.reload();
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse"
                        >
                            🚀 QUICK LV4 TEST (AUTO)
                        </button>

                        <button
                            onClick={toggleDummy}
                            className={`px-2 py-1 rounded border text-[10px] font-bold ${isDummy ? 'bg-red-900 border-red-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                        >
                            {isDummy ? '🔴 DUMMY TONGUE: ON' : '⚪ DUMMY TONGUE: OFF'}
                        </button>

                        {isDummy && (
                            <div className="grid grid-cols-3 gap-1">
                                <button onClick={() => setPreset('lv2')} className={`p-1 border text-[8px] rounded ${currentPreset === 'lv2' ? 'bg-blue-900 border-blue-400' : 'bg-slate-900 border-slate-800'}`}>LV2: Mild</button>
                                <button onClick={() => setPreset('lv3')} className={`p-1 border text-[8px] rounded ${currentPreset === 'lv3' ? 'bg-blue-900 border-blue-400' : 'bg-slate-900 border-slate-800'}`}>LV3: Mod</button>
                                <button onClick={() => setPreset('lv4')} className={`p-1 border text-[8px] rounded ${currentPreset === 'lv4' ? 'bg-blue-900 border-blue-400' : 'bg-slate-900 border-slate-800'}`}>LV4: Clear</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mb-2">
                    <button onClick={() => copyToClipboard(formatJSON(lastReq))} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">Copy Request</button>
                    <button onClick={() => copyToClipboard(formatJSON(lastRes))} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">Copy Response</button>
                    <button onClick={() => copyToClipboard(formatJSON(lastErr))} className="bg-slate-800 hover:bg-red-900 px-2 py-1 rounded border border-red-900">Copy Error</button>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-1 border-b border-slate-700">Last Error</h3>
                    <pre className="bg-black p-2 rounded max-h-32 overflow-auto">{formatJSON(lastErr)}</pre>
                </div>
            </div>
        </div>
    );
};
