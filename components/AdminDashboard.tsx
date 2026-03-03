
import React, { useState, useEffect } from 'react';
import { getLatestPayloadForDebug } from '../utils/debugStorage';

interface ReportSummary {
    total_reviews: number;
    exact_rate: number;
    group_rate: number;
    partial_rate: number;
    mismatch_rate: number;
    pattern_accuracy: {
        def_id: string;
        exact_rate: number;
        group_rate: number;
        mismatch_rate: number;
        total: number;
    }[];
}

interface HeatmapData {
    matrix: { ai_def_id: string; doctor_def_id: string; count: number }[];
    ai_totals: Record<string, number>;
    doctor_totals: Record<string, number>;
}

interface ConfidenceData {
    buckets: { range: string; exact_rate: number; total: number }[];
}

interface QualityByImageData {
    buckets: { metric: string; bucket: string; total: number; exact_rate: number; group_rate: number; mismatch_rate: number }[];
}

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [selectedRole, setSelectedRole] = useState<'ALL' | 'STUDENT' | 'GENERAL'>('ALL');
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
    const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
    const [qualityImages, setQualityImages] = useState<QualityByImageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const roleParam = selectedRole === 'GENERAL' ? 'GENERAL' : selectedRole;
                const [sumRes, heatRes, confRes, qualRes] = await Promise.all([
                    fetch(`/api/report/quality?role=${roleParam}`),
                    fetch(`/api/report/heatmap?role=${roleParam}`),
                    fetch(`/api/report/confidence?role=${roleParam}`),
                    fetch(`/api/report/qualityByImage?role=${roleParam}`)
                ]);

                if (!sumRes.ok || !heatRes.ok || !confRes.ok || !qualRes.ok) {
                    throw new Error("APIエラーが発生しました。DB移行（user_role/quality追加）が未完了の可能性があります。");
                }

                const sumData = await sumRes.json();
                const heatData = await heatRes.json();
                const confData = await confRes.json();
                const qualData = await qualRes.json();

                setSummary(sumData);
                setHeatmap(heatData);
                setConfidence(confData);
                setQualityImages(qualData);
            } catch (err: any) {
                console.error("Fetch failed:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedRole]);

    if (loading && !summary) return <div className="p-8 text-center text-slate-500">分析中...</div>;

    const heatmapMatrix = heatmap?.matrix || [];
    const aiPatterns = Object.keys(heatmap?.ai_totals || {}).sort();
    const docPatterns = Object.keys(heatmap?.doctor_totals || {}).sort();

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">精度可視化ダッシュボード v1.2</h1>
                        <p className="text-xs text-slate-500 mt-1">実データ整合検証：AI診断 vs 医師レビュー (層別分析対応)</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        {(['ALL', 'STUDENT', 'GENERAL'] as const).map(role => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedRole === role
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {role === 'ALL' ? '全体' : role === 'STUDENT' ? 'Student' : '一般(L/P)'}
                            </button>
                        ))}
                    </div>

                    <button onClick={onBack} className="text-sm bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors">戻る</button>
                </div>

                {/* Explain Tree Internal Section (DEV + FF) */}
                {import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('FF_EXPLAIN_TREE_V1') === '1' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 border-l-4 border-l-orange-500 animate-fade-in">
                        <div className="flex justify-between items-center gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">INTERNAL</span>
                                    Explain Tree (v1 推論構造の可視化)
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-1">最新の解析結果（SSOT Payload）を構造化し、非医療表現でツリー出力します。</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const debugInfo = getLatestPayloadForDebug();
                                        if (!debugInfo) return alert("最新の解析データが見つかりません。一度診断を実行して結果画面を表示してください。");
                                        const { payload, ts } = debugInfo;

                                        const { getExplainTreeV1 } = await import('../utils/explainTree');
                                        const { explainTreeToHtml } = await import('../utils/explainTreeToHtml');

                                        const meta = {
                                            build: '2026.03.02.02',
                                            role: selectedRole,
                                            generatedAt: new Date(ts).toLocaleString('ja-JP')
                                        };

                                        const tree = getExplainTreeV1(payload, selectedRole === 'STUDENT' ? 'STUDENT' : 'PRO', "自動判定：良好な画像品質");
                                        const html = explainTreeToHtml(tree, meta);

                                        // Open in new tab (using Blob URL)
                                        const blob = new Blob([html], { type: 'text/html' });
                                        const url = URL.createObjectURL(blob);
                                        const newTab = window.open(url, '_blank');
                                        if (!newTab) {
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `explain_tree_${ts.split('T')[0]}.html`;
                                            a.click();
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert("構造生成に失敗しました。");
                                    }
                                }}
                                className="bg-orange-50/50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold py-2 px-6 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                ツリー生成・閲覧
                            </button>
                        </div>
                    </div>
                )}

                {loading && <div className="fixed top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] animate-pulse shadow-lg z-50">更新中...</div>}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-8 shadow-sm">
                        <p className="font-bold mb-2">⚠ {error}</p>
                        <ul className="text-xs list-disc ml-5 space-y-1">
                            <li><code>analyses</code> テーブルに <code>user_role</code> カラムが存在するか確認してください。</li>
                            <li>最新の移行スクリプト <code>supabase/migrations/20260302_add_user_role.sql</code> を適用してください。</li>
                        </ul>
                    </div>
                )}

                {!summary || summary.total_reviews === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-500 border border-slate-200">
                        選択された条件（{selectedRole}）の確定レビューがまだありません。
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* 1. Global Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                                <p className="text-slate-400 text-[10px] uppercase font-bold">Total Reviews</p>
                                <p className="text-3xl font-black text-blue-600">{summary.total_reviews}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                                <p className="text-slate-400 text-[10px] uppercase font-bold text-green-600">Exact (S)</p>
                                <p className="text-3xl font-black text-green-600">{summary.exact_rate.toFixed(1)}%</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                                <p className="text-slate-400 text-[10px] uppercase font-bold text-indigo-600">Major (S+A)</p>
                                <p className="text-3xl font-black text-indigo-600">{summary.group_rate.toFixed(1)}%</p>
                            </div>
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                                <p className="text-orange-400 text-[10px] uppercase font-bold">Mismatch (C)</p>
                                <p className="text-3xl font-black text-orange-600">{summary.mismatch_rate.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 2. Heatmap Section */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-auto">
                                <h2 className="text-lg font-bold mb-4 flex items-center">
                                    <span className="mr-2">{selectedRole === 'STUDENT' ? '🎓' : '🔥'}</span>
                                    {selectedRole === 'STUDENT' ? 'Student専用ヒートマップ' : '診断クロス集計'}
                                </h2>
                                <table className="min-w-full text-[10px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-1 border border-slate-100 bg-slate-50 text-slate-400">AI \ Doc</th>
                                            {docPatterns.map(p => (
                                                <th key={p} className="p-1 border border-slate-100 bg-slate-50 rotate-45 h-16 whitespace-nowrap align-bottom">{p.replace('P_', '')}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aiPatterns.map(ai => (
                                            <tr key={ai}>
                                                <td className="p-1 border border-slate-100 bg-slate-50 font-bold">{ai.replace('P_', '')}</td>
                                                {docPatterns.map(doc => {
                                                    const cell = heatmapMatrix.find(m => m.ai_def_id === ai && m.doctor_def_id === doc);
                                                    const count = cell?.count || 0;
                                                    const intensity = count > 0 ? Math.min(count * 20, 100) : 0;
                                                    return (
                                                        <td
                                                            key={doc}
                                                            className="p-1 border border-slate-100 text-center"
                                                            style={{ backgroundColor: count > 0 ? `rgba(37, 99, 235, ${intensity / 100})` : 'transparent', color: intensity > 50 ? 'white' : 'inherit' }}
                                                        >
                                                            {count || ''}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-[9px] text-slate-400 mt-4">※層別（{selectedRole}）における分布状況です。</p>
                            </div>

                            <div className="space-y-8">
                                {/* 3. Pattern Accuracy Ranking */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h2 className="text-sm font-bold mb-4">証別一致率ランキング (Exact)</h2>
                                    <div className="space-y-2">
                                        {summary.pattern_accuracy
                                            .sort((a, b) => b.exact_rate - a.exact_rate)
                                            .slice(0, 5)
                                            .map(p => (
                                                <div key={p.def_id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded">
                                                    <span className="font-mono text-[10px] truncate max-w-[120px]">{p.def_id}</span>
                                                    <span className="font-bold text-green-600">{p.exact_rate.toFixed(0)}% <span className="text-[10px] text-slate-400 font-normal">({p.total})</span></span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* 4. Mismatch Top 3 */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h2 className="text-sm font-bold mb-4 text-orange-600">改善優先：不一致トップ3</h2>
                                    <div className="space-y-2">
                                        {summary.pattern_accuracy
                                            .sort((a, b) => b.mismatch_rate - a.mismatch_rate)
                                            .filter(p => p.total >= 1)
                                            .slice(0, 3)
                                            .map(p => (
                                                <div key={p.def_id} className="text-xs p-2 bg-orange-50 rounded border border-orange-100">
                                                    <div className="flex justify-between font-bold text-orange-700 mb-1">
                                                        <span className="font-mono text-[10px]">{p.def_id}</span>
                                                        <span>{p.mismatch_rate.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-orange-200 h-1 rounded overflow-hidden">
                                                        <div className="bg-orange-500 h-full" style={{ width: `${p.mismatch_rate}%` }}></div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* 5. Confidence Buckets */}
                                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                                    <h2 className="text-sm font-bold mb-4 text-blue-400">医師確信度と一致率の相関</h2>
                                    <div className="space-y-3">
                                        {confidence?.buckets.map(b => (
                                            <div key={b.range}>
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span>確信度: {b.range}%</span>
                                                    <span className="font-bold text-blue-300">{b.exact_rate.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                                                    <div className="bg-blue-500 h-full" style={{ width: `${b.exact_rate}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-4 italic">※選択中の層別（{selectedRole}）でのデータです。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: Image Quality Correlation (v1) */}
                {qualityImages && qualityImages.buckets.length > 0 && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden mt-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">画像品質 × 精度相関 (v1)</h3>
                            <p className="text-xs text-slate-500 mt-1">撮影品質が AI 判定精度に与える影響。Mismatch 率が高いバケットを改善対象として特定します。</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-bold">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Metric</th>
                                        <th className="px-4 py-3">Bucket</th>
                                        <th className="px-4 py-3 text-center">Total</th>
                                        <th className="px-4 py-3 text-right">Exact Match</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">Mismatch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {qualityImages.buckets.map((b, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-slate-700">{b.metric}</td>
                                            <td className="px-4 py-3 text-slate-600">{b.bucket}</td>
                                            <td className="px-4 py-3 text-center font-mono text-slate-500">{b.total}</td>
                                            <td className="px-4 py-3 text-right text-green-600">{b.exact_rate.toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold px-2 py-1 rounded ${b.mismatch_rate >= 20 ? 'bg-red-100 text-red-700' : 'text-slate-600'}`}>
                                                    {b.mismatch_rate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AdminDashboard;
