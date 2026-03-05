
import React, { useState } from 'react';
import { AnalysisMode, PlanType } from '../types';
import { isDevEnabled } from '../utils/devFlags';
import { getSession, updateNickname, clearSession } from '../utils/userSession';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    devMode: boolean;
    setDevMode: (enabled: boolean) => void;
    analysisMode?: AnalysisMode;
    setAnalysisMode?: (mode: AnalysisMode) => void;
    planType?: PlanType;
    onLogout?: () => void;
}

const PLAN_LABELS: Record<string, { label: string; desc: string; badge: string }> = {
    free: { label: '無料プラン', desc: '月3回まで解析可能', badge: 'FREE' },
    light: { label: 'Lightプラン', desc: '標準解析・月10回', badge: 'LIGHT' },
    pro_personal: { label: 'Pro Personal', desc: '詳細解析・無制限', badge: 'PRO' },
    student_program: { label: 'Student Program', desc: '学生先行テスト', badge: 'STUDENT' },
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, devMode, setDevMode, analysisMode, setAnalysisMode, planType, onLogout }) => {
    if (!isOpen) return null;

    // 本番では isDevEnabled()=false（import.meta.env.PRODハードガード）
    const isDevToolsVisible = isDevEnabled();

    const session = getSession();
    const [editingNickname, setEditingNickname] = useState(false);
    const [nicknameInput, setNicknameInput] = useState(session?.nickname || '');

    const handleSaveNickname = () => {
        const trimmed = nicknameInput.trim();
        if (trimmed && trimmed.length <= 20) {
            updateNickname(trimmed);
            setEditingNickname(false);
            // Refresh to apply nickname change
            window.location.reload();
        }
    };

    const handleLogout = () => {
        if (window.confirm('ログアウトしますか？\nニックネームがリセットされます。')) {
            clearSession();
            onLogout?.();
            onClose();
            window.location.reload();
        }
    };

    const currentPlan = planType || 'free';
    const planInfo = PLAN_LABELS[currentPlan] || PLAN_LABELS.free;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">設定</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                        &times;
                    </button>
                </div>
                <div className="p-5 space-y-5">

                    {/* === ユーザー情報 === */}
                    {session && (
                        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ユーザー情報</p>
                                <button
                                    onClick={handleLogout}
                                    className="text-[10px] text-slate-400 hover:text-[#B84C3A] transition-colors"
                                >
                                    ログアウト
                                </button>
                            </div>
                            {editingNickname ? (
                                <div className="flex gap-2">
                                    <input
                                        value={nicknameInput}
                                        onChange={e => setNicknameInput(e.target.value)}
                                        maxLength={20}
                                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-bold text-[#1F3A5F] focus:border-[#6FC3B2] outline-none"
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleSaveNickname()}
                                    />
                                    <button
                                        onClick={handleSaveNickname}
                                        className="px-3 py-1.5 bg-[#6FC3B2] text-white text-xs font-bold rounded-lg"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingNickname(false)}
                                        className="px-2 text-slate-400 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-base font-black text-[#1F3A5F]">{session.nickname}さん</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {session.role === 'student' ? '🎓 学生' : session.role === 'staff' ? '🏥 教職員' : '👤 一般'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingNickname(true)}
                                        className="text-xs text-[#6FC3B2] font-bold hover:underline"
                                    >
                                        編集
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === プラン情報（Phase1表示） === */}
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ご利用プラン</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-[#1F3A5F]">{planInfo.label}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{planInfo.desc}</p>
                            </div>
                            <span className="px-2 py-1 bg-[#1F3A5F] text-white text-[10px] font-black rounded-md tracking-wider">
                                {planInfo.badge}
                            </span>
                        </div>
                    </div>

                    {/* === 研究同意ステータス === */}
                    {session && (
                        <div className="flex items-center justify-between text-[11px] px-1">
                            <span className="text-slate-500">研究協力</span>
                            <span className={`font-bold ${session.researchAgreed ? 'text-[#6FC3B2]' : 'text-slate-400'}`}>
                                {session.researchAgreed ? `同意済み (${session.researchConsentVersion || 'v1.0'})` : '未同意'}
                            </span>
                        </div>
                    )}

                    {/* === アプリ情報 === */}
                    <div className="border-t border-slate-100 pt-3">
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                            舌神 -ZETUSHIN- は東洋医学に基づくセルフコンディション観測ツールです。医療診断を行うものではありません。
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                            {typeof (window as any).__BUILD_INFO__ !== 'undefined'
                                ? `${(window as any).__BUILD_INFO__.version} / sha:${(window as any).__BUILD_INFO__.sha}`
                                : 'build info unavailable'}
                        </p>
                    </div>

                    {/* === DEV限定ツール === */}
                    {isDevToolsVisible && (
                        <>
                            <div className="border-t-2 border-orange-300 pt-3">
                                <p className="text-xs font-black text-orange-500 mb-2 uppercase tracking-wider">🛠 Dev Tools</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">開発者モード</p>
                                    <p className="text-xs text-slate-500 mt-1">詳細なデバッグ情報を表示</p>
                                </div>
                                <button
                                    onClick={() => setDevMode(!devMode)}
                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${devMode ? 'bg-[#6FC3B2]' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${devMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {analysisMode !== undefined && setAnalysisMode && (
                                <div>
                                    <p className="font-bold text-slate-800 text-sm mb-2">解析モード</p>
                                    <div className="flex gap-2">
                                        {Object.values(AnalysisMode).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setAnalysisMode(mode)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analysisMode === mode ? 'bg-[#1F3A5F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
