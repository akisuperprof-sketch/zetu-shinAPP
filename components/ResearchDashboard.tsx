import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ObservationData } from '../services/research/validityRules';
import { calculateMetrics, ResearchMetrics } from '../services/research/statisticsEngine';
import ResearchAlerts from './ResearchAlerts';
import DataCoveragePanel from './DataCoveragePanel';
import { isFeatureEnabled } from '../utils/featureFlags';
import { evaluateExpertAgreement, ExpertEvaluationMetrics } from '../services/research/expertEvaluation';
import { evaluateResearchState, ResearchState } from '../services/research/researchOS';
import { getNextResearchActions } from '../services/research/researchPlanner';
import { getAdminToken } from '../utils/adminAuthToken';

import ResearchImageInjectionPanel from './ResearchImageInjectionPanel';

interface ResearchDashboardProps {
    records?: ObservationData[];
    onBack?: () => void;
}

const ResearchDashboard: React.FC<ResearchDashboardProps> = ({ records, onBack }) => {
    const [allTimeMetrics, setAllTimeMetrics] = useState<ResearchMetrics | null>(null);
    const [expertMetrics, setExpertMetrics] = useState<ExpertEvaluationMetrics | null>(null);
    const [researchStateOS, setResearchStateOS] = useState<ResearchState | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchedRecords, setFetchedRecords] = useState<ObservationData[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'ops' | 'overview' | 'timeline'>('ops');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [uiMode, setUiMode] = useState<'modern' | 'stack'>('modern');
    const [showHelp, setShowHelp] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let dataToUse = records;
            let dashboardStats = null;

            if (!dataToUse || dataToUse.length === 0) {
                const token = getAdminToken();
                const res = await fetch('/api/research/dashboard_data', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.records) {
                        dataToUse = json.records;
                        dashboardStats = json.stats;
                    } else {
                        // Backwards compatibility if it returns array
                        dataToUse = json;
                    }
                } else {
                    dataToUse = [];
                }
            }

            setStats(dashboardStats);
            setFetchedRecords(dataToUse || []);
            setAllTimeMetrics(calculateMetrics(dataToUse || []));
            setExpertMetrics(evaluateExpertAgreement(dataToUse || []));

            const stateOS = evaluateResearchState(dataToUse || []);
            setResearchStateOS(stateOS);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [records]);

    useEffect(() => {
        if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return;
        loadData();

        // Update document title for the dashboard
        const originalTitle = document.title;
        document.title = '舌神ダッシュボード';

        return () => {
            document.title = originalTitle;
        };
    }, [loadData, refreshTrigger]);

    // Pre-calculate values for UI to keep render functions clean
    const { todayCount, dailyTargetPercent, totalProgressPercent } = useMemo(() => {
        const todayJST = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        const todayData = stats?.daily_summary?.find((s: any) => s.target_date_jst === todayJST);
        const count = todayData?.upload_count || 0;
        const total = stats?.total_observations || 0;

        return {
            todayCount: count,
            dailyTargetPercent: Math.min((count / 50) * 100, 100),
            totalProgressPercent: Math.min((total / 1000) * 100, 100)
        };
    }, [stats]);

    if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return null;
    if (loading || !allTimeMetrics) return <div className="p-8 text-center animate-pulse text-slate-500">データを読み込み中...</div>;

    const labeledPercent = (allTimeMetrics.total_records > 0) ? (allTimeMetrics.labeled_rate * 100).toFixed(1) : "0.0";
    const validPercent = (allTimeMetrics.total_records > 0) ? (allTimeMetrics.valid_rate * 100).toFixed(1) : "0.0";

    const systemStatus = {
        upload: stats?.total_observations > 0 ? "active" : "pending",
        storage: stats?.total_observations > 0 ? "completed" : "active",
        db: (stats?.total_observations > 0 && stats?.total_analyses > 0) ? "completed" : "active",
        segmentation: (stats?.quality_summary?.length > 0) ? "active" : "pending",
        features: (fetchedRecords.length > 0) ? "active" : "pending",
        coverage: (fetchedRecords.length > 0) ? "active" : "pending"
    };

    const renderOpsTabStack = () => (
        <div className="animate-fade-in">
            {/* 1. Collector Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span>📊</span> Collector Status
                    </h3>
                    <div className="bg-indigo-600 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase">
                        Phase: {fetchedRecords.length === 0 ? "収集期" : "評価期"}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Progress</p>
                            <p className="text-2xl font-black text-slate-800">{stats?.total_observations || 0} <span className="text-xs text-slate-400">/ 1000</span></p>
                        </div>
                        <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${totalProgressPercent}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Daily Target</p>
                            <p className="text-2xl font-black text-indigo-600">
                                {todayCount}
                                <span className="text-xs text-indigo-400 ml-1">/ 50</span>
                            </p>
                        </div>
                        <div className="mt-2 w-full bg-indigo-50 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${dailyTargetPercent}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Records</p>
                        <p className="text-2xl font-black text-emerald-600">{stats?.total_analyses || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.total_observations > 0 ? ((stats?.total_analyses / stats?.total_observations) * 100).toFixed(0) : 0}%</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    ℹ️ Images Collected: {stats?.total_observations || 0} / 1000 goal. Daily target is set to 50 samples.
                </p>
            </div>

            {/* 1.5 Distribution Charts */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span>📊</span> Distribution Analysis
                    </h3>
                    <div className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        Updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {fetchedRecords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tongue Color Distribution */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tongue Color</h4>
                            <div className="space-y-2">
                                {Object.entries(allTimeMetrics.distributions.tongueColor).map(([label, count]) => (
                                    <div key={label} className="group">
                                        <div className="flex justify-between items-center text-[10px] mb-1">
                                            <span className="font-bold text-slate-700">{label}</span>
                                            <span className="font-black text-slate-400">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-rose-400 h-full group-hover:bg-rose-500 transition-all" style={{ width: `${((count as number) / fetchedRecords.length) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Coat Thickness Distribution */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Coat Thickness</h4>
                            <div className="space-y-2">
                                {Object.entries(allTimeMetrics.distributions.coatThickness).map(([label, count]) => (
                                    <div key={label} className="group">
                                        <div className="flex justify-between items-center text-[10px] mb-1">
                                            <span className="font-bold text-slate-700">{label}</span>
                                            <span className="font-black text-slate-400">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-amber-400 h-full group-hover:bg-amber-500 transition-all" style={{ width: `${((count as number) / fetchedRecords.length) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                        <div className="text-4xl mb-4 opacity-20">📈</div>
                        <p className="text-xs text-slate-400 font-bold text-center">
                            分布を表示するための特徴量抽出済みデータがまだありません。<br />
                            <span className="text-[10px] font-medium">ラベル付与が完了するとここに統計が表示されます。</span>
                        </p>
                    </div>
                )}
            </div>

            {/* 2. Next Target */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span>🎯</span> Next Target
                </h3>
                {researchStateOS && researchStateOS.shortage_top5.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {researchStateOS.shortage_top5.map((s, idx) => (
                            <div key={idx} className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex justify-between items-center">
                                <span className="text-[11px] font-black text-orange-900">{s.axis}={s.label}</span>
                                <span className="text-[10px] font-black text-orange-600">Need +{s.shortage}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-4">
                        <p className="text-xs text-slate-500 font-bold">
                            現在、具体的なターゲットを算出するための十分な特徴量データがありません。<br />
                            **ターゲット検出は、特徴量抽出および分析の反映後にアクティブ化されます。**
                        </p>
                    </div>
                )}
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    ℹ️ This panel shows what kind of data should be collected next to improve research coverage.
                </p>
            </div>

            {/* 3. Review Queue */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span>🔍</span> Review Queue
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Not Processed</p>
                        <p className="text-lg font-black text-slate-600">{stats?.review_counts?.not_processed || 0}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Low Quality</p>
                        <p className="text-lg font-black text-amber-600">{stats?.review_counts?.low_quality || 0}</p>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Failed Processing</p>
                        <p className="text-lg font-black text-rose-600">{stats?.review_counts?.failed || 0}</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    ℹ️ This panel shows records that may need review before being used for research.
                </p>
            </div>

            {/* 4. Coverage Explanation */}
            {fetchedRecords.length === 0 && (
                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 mb-8 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🌍</div>
                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span>⚠️</span> Coverage Explanation
                    </h3>
                    <div className="bg-white/80 rounded-2xl p-5 border border-amber-300 mb-4">
                        <ul className="text-xs text-amber-900 space-y-3 font-bold">
                            <li className="flex gap-2"><span>📷</span> <span>**現在は画像収集フェーズです**：母数を増やすことを優先しているため、詳細な統計は未算出です。</span></li>
                            <li className="flex gap-2"><span>🛡️</span> <span>**分析レコード未反映**：保存は完了していますが、カバレッジ集計ロジックがまだアクティブではありません。</span></li>
                            <li className="flex gap-2"><span>⚙️</span> <span>**特徴量抽出待ち**：投入された画像に対して、専門家によるラベル付与が完了次第、カバレッジが増加します。</span></li>
                        </ul>
                    </div>
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed italic bg-amber-100/50 p-3 rounded-xl border border-amber-200">
                        ℹ️ Coverage does not always increase immediately after upload. It increases after the required processing stage is completed.
                    </p>
                </div>
            )}

            {/* 5. Processing Mode Guide */}
            <div className="bg-slate-900 rounded-[32px] p-6 text-white mb-8 border border-slate-800">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>⚙️</span> Processing Mode Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">OFF</h4>
                        <p className="text-[11px] font-bold text-slate-300">Save images only. Best for fast bulk injection.</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">LIGHT</h4>
                        <p className="text-[11px] font-bold text-slate-300">Lightweight edge-based cropping and quality scoring.</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">FULL</h4>
                        <p className="text-[11px] font-bold text-slate-300">High-precision segmentation using SAM model.</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                    ℹ️ These modes control how deeply the image is processed after upload.
                </p>
            </div>

            {/* Recent Uploads (Confirm success) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                        <span>⏱️</span> 最近のアップロード (最新10件)
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Realtime</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-2 text-left font-bold text-slate-400 uppercase">Timestamp (JST)</th>
                                <th className="py-2 text-left font-bold text-slate-400 uppercase">Mode</th>
                                <th className="py-2 text-left font-bold text-slate-400 uppercase">Status</th>
                                <th className="py-2 text-center font-bold text-slate-400 uppercase">Score</th>
                                <th className="py-2 text-center font-bold text-slate-400 uppercase">Artifacts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!stats?.recent_uploads || stats.recent_uploads.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic font-medium">データがありません</td></tr>
                            ) : (
                                stats.recent_uploads.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2 font-mono text-slate-500">{r.created_at_jst?.replace('T', ' ').substring(0, 19)}</td>
                                        <td className="py-2 font-black text-slate-800 tracking-tighter">{r.processing_mode}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] ${r.segmentation_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {r.segmentation_status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-center font-black text-slate-600">{r.quality_score || '-'}</td>
                                        <td className="py-2 text-center">
                                            <div className="flex justify-center gap-1">
                                                <span title="Original" className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                {r.processed_path && <span title="Processed" className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                                                {r.mask_path && <span title="Mask" className="w-2 h-2 rounded-full bg-amber-400"></span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ResearchImageInjectionPanel onRefresh={() => setRefreshTrigger(prev => prev + 1)} />

            {/* 7. Future: Food Therapy Engine Connection */}
            <div className="mt-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden border border-indigo-500/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-500 p-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-100">Food Therapy Engine Connection</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-xs text-indigo-200/80 font-bold leading-relaxed mb-4">
                                舌診研究データから導き出された体質スコアを、外部の食養生エンジン（s-1 chat系統）に転送し、最適な薬膳アドバイスを取得するパイプラインを準備中です。
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black text-indigo-300">STATUS: STANDBY</div>
                                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black text-emerald-400">API: READY</div>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-2xl border border-white/5 p-4 font-mono text-[9px] text-indigo-300/60 leading-tight">
                            {"// Connection Protocol Preview"}<br />
                            {"POST /engine/v1/recommend"}<br />
                            {"{"}<br />
                            {"  constitution: \"yin_deficiency\","}<br />
                            {"  axes: { thermal: -2, moisture: -1 },"}<br />
                            {"  user_context: \"fatigue\""}<br />
                            {"}"}
                        </div>
                    </div>
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-2xl font-black text-xs text-white uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-400/30">
                        <span>🔌</span> Connect Engine (Next Phase)
                    </button>
                </div>
            </div>

            {/* 6. Operations Help */}
            <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <span>📖</span> Operations Help
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[11px] font-bold text-slate-600">
                    <div className="flex gap-3">
                        <span className="bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                        <p>Upload image using the Injection Panel below.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                        <p>Confirm success in Recent Uploads (Overview or Operations tab).</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                        <p>Check Collector Status for counts and phasting.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">4</span>
                        <p>Read Coverage Explanation if numbers are lower than expected.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">5</span>
                        <p>Review Next Target to decide what to upload next.</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold italic">
                        ℹ️ This operator guide helps you navigate the research pipeline efficiently.
                    </p>
                </div>
            </div>
        </div>
    );
    const renderOpsTabModern = () => (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
            {/* Left Column: Metrics & History */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                {/* Distribution Analysis (Compact) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <span>📊</span> 分析分布 (Distribution)
                        </h3>
                    </div>
                    {fetchedRecords.length > 0 ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tongue Color</h4>
                                <div className="space-y-1.5">
                                    {Object.entries(allTimeMetrics.distributions.tongueColor).map(([label, count]) => (
                                        <div key={label} className="group">
                                            <div className="flex justify-between items-center text-[9px] mb-0.5">
                                                <span className="font-bold text-slate-600">{label}</span>
                                                <span className="font-black text-slate-400">{count}</span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                                                <div className="bg-rose-400 h-full" style={{ width: `${((count as number) / fetchedRecords.length) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Coat Thickness</h4>
                                <div className="space-y-1.5">
                                    {Object.entries(allTimeMetrics.distributions.coatThickness).map(([label, count]) => (
                                        <div key={label} className="group">
                                            <div className="flex justify-between items-center text-[9px] mb-0.5">
                                                <span className="font-bold text-slate-600">{label}</span>
                                                <span className="font-black text-slate-400">{count}</span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                                                <div className="bg-amber-400 h-full" style={{ width: `${((count as number) / fetchedRecords.length) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl bg-slate-50/30">
                            <p className="text-[10px] text-slate-400 font-bold text-center">データ待ち (Pending)</p>
                        </div>
                    )}
                </div>

                {/* Next Target / Review Queue (Merged Compact) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span>🔍</span> ステータス概要 (Summary)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Not Processed</p>
                            <p className="text-sm font-black text-slate-600">{stats?.review_counts?.not_processed || 0}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[8px] font-black text-amber-500 uppercase mb-1">Low Quality</p>
                            <p className="text-sm font-black text-amber-600">{stats?.review_counts?.low_quality || 0}</p>
                        </div>
                    </div>
                    {researchStateOS && researchStateOS.shortage_top5.length > 0 && (
                        <div className="space-y-1">
                            {researchStateOS.shortage_top5.slice(0, 3).map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[9px] bg-indigo-50/50 px-2 py-1 rounded">
                                    <span className="font-black text-indigo-900">{s.axis}={s.label}</span>
                                    <span className="font-black text-indigo-500">Need +{s.shortage}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Uploads (Mini) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                            <span>⏱️</span> 最近の投入履歴 (Recent)
                        </h3>
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-auto pr-1">
                        {!stats?.recent_uploads || stats.recent_uploads.length === 0 ? (
                            <p className="text-[9px] text-slate-400 text-center py-4">履歴なし</p>
                        ) : (
                            stats.recent_uploads.map((r: any) => (
                                <div key={r.id} className="flex justify-between items-center p-2 bg-slate-50/50 rounded-lg text-[9px] hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-slate-400">{r.created_at_jst?.split('T')[1].substring(0, 8)}</span>
                                        <span className="font-black text-slate-700">{r.processing_mode}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-500">{r.quality_score || '-'}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full font-black uppercase text-[7px] ${r.segmentation_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                            {r.segmentation_status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Upload / Operation */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                <ResearchImageInjectionPanel onRefresh={() => setRefreshTrigger(prev => prev + 1)} />

                {/* Collapsible Help Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="w-full px-5 py-3 flex items-center justify-between text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span>📖</span> 運用ガイド・ヘルプ (Operations Help)
                        </span>
                        <span className="text-xs transition-transform duration-300" style={{ transform: showHelp ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    {showHelp && (
                        <div className="px-5 pb-5 animate-slide-down">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 pt-2">
                                <p className="flex gap-2"><span>1.</span> インジェクションパネルから画像を投入</p>
                                <p className="flex gap-2"><span>2.</span> 左側の「最新履歴」で成功を確認</p>
                                <p className="flex gap-2"><span>3.</span> 収集状況（全体/日次）のゲージ変化を監視</p>
                                <p className="flex gap-2"><span>4.</span> 「ステータス概要」でエラーや低品質データをチェック</p>
                            </div>
                            {/* Processing Mode Mini Guide */}
                            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2">
                                <div><h4 className="text-[8px] font-black text-slate-400">OFF</h4><p className="text-[8px] text-slate-400">保存のみ(高速)</p></div>
                                <div><h4 className="text-[8px] font-black text-emerald-400">LIGHT</h4><p className="text-[8px] text-slate-400">簡易補正・採点</p></div>
                                <div><h4 className="text-[8px] font-black text-indigo-400">FULL</h4><p className="text-[8px] text-slate-400">高度セグメント</p></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Phase Preview (Condensed) */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                            <span>🔌</span> Food Therapy Engine (Next Phase)
                        </h3>
                        <div className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black text-emerald-400 border border-white/5">DB READY</div>
                    </div>
                    <p className="text-[10px] text-indigo-200/70 font-bold leading-relaxed">
                        収集されたデータから導き出された体質スコアを薬膳アドバイスエンジンへ転送する準備が完了しています。
                    </p>
                </div>
            </div>
        </div>
    );


    const renderOverviewTab = () => (
        <div className="animate-fade-in space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest relative">
                    <span>🚩</span> Current Development Phase
                </h3>
                <div className="flex items-center gap-4 relative">
                    <div className="bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Phase 1</p>
                        <p className="text-xl font-black">{researchStateOS?.stage === 'DATA_COLLECTION' ? 'Image Collection' : 'Data Balancing'}</p>
                    </div>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-200 w-1/3"></div>
                    </div>
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl text-slate-400 font-bold">
                        <p className="text-[10px] font-black uppercase tracking-widest">Next</p>
                        <p className="text-sm font-black">Model Alignment</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(systemStatus).map(([key, status]) => (
                    <div key={key} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'completed' ? 'bg-emerald-500' : status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
                            }`}></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{key}</p>
                            <p className="text-xs font-black text-slate-700 capitalize">{status}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative">
                <h3 className="text-sm font-black text-indigo-300 mb-10 flex items-center gap-2 uppercase tracking-widest">
                    <span>🔗</span> Research Pipeline Flow
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-4 relative overflow-x-auto pb-4">
                    {[
                        { label: 'Upload', status: systemStatus.upload },
                        { label: 'Storage', status: systemStatus.storage },
                        { label: 'DB', status: systemStatus.db },
                        { label: 'Segment', status: systemStatus.segmentation },
                        { label: 'Features', status: systemStatus.features },
                        { label: 'Coverage', status: systemStatus.coverage },
                        { label: 'Dataset', status: 'pending' }
                    ].map((step, idx, arr) => (
                        <React.Fragment key={step.label}>
                            <div className={`flex flex-col items-center gap-2 min-w-[64px] ${step.status === 'pending' ? 'opacity-30' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${step.status === 'completed' ? 'bg-emerald-500 border-emerald-400' : step.status === 'active' ? 'bg-blue-600 border-blue-400 animate-pulse' : 'bg-slate-800 border-slate-700'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight">{step.label}</span>
                            </div>
                            {idx < arr.length - 1 && <div className="hidden md:block w-4 h-px bg-slate-700"></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-[11px] font-black text-emerald-600 uppercase mb-4">✅ Completed Features</h4>
                    <ul className="space-y-2">
                        {['Image Injection Pipeline', 'Signed URL Upload', 'Expert Logic Simulator', 'Dashboard v1.4'].map(f => (
                            <li key={f} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <span className="text-emerald-500">✔</span> {f}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase mb-4">📊 Data Collection Status</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Images</p><p className="text-2xl font-black">{stats?.total_observations || 0}</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Analysis</p><p className="text-2xl font-black">{stats?.total_analyses || 0}</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Labeled</p><p className="text-2xl font-black">{fetchedRecords.length}</p></div>
                    </div>
                </div>

                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20">
                    <h4 className="text-[11px] font-black text-blue-100 uppercase tracking-widest mb-4">💡 Next Recommended Actions</h4>
                    <ul className="space-y-3">
                        {researchStateOS?.next_actions.map((action, i) => (
                            <li key={i} className="text-xs font-black leading-tight flex gap-2">
                                <span className="opacity-50">•</span> {action}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderTimelineTab = () => (
        <div className="animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <span>⏳</span> Research Activity Timeline
                </h3>
                <div className="space-y-4 relative before:absolute before:left-[31px] before:top-4 before:bottom-0 before:w-px before:bg-slate-100">
                    {!stats?.timeline || stats.timeline.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 italic">No events recorded.</p>
                    ) : (
                        stats.timeline.map((ev: any) => (
                            <div key={ev.id} className="relative pl-16 py-2">
                                <div className="absolute left-0 w-[64px] text-[10px] font-mono text-slate-400 text-right pr-4 pt-1">
                                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={`absolute left-[24px] w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ring-slate-100 ${ev.event_type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                                    }`}></div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ev.event_type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                                            }`}>{ev.event_type}</span>
                                        <span className="text-[8px] font-mono text-slate-400">{ev.related_id?.substring(0, 8)}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-700 leading-normal">{ev.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in font-noto pb-20">
            {/* Header with Switcher */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-black text-[#1F3A5F] flex items-center gap-2 tracking-tight">
                        <span className="text-3xl">🔬</span> 舌神ダッシュボード v1.6
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-10">ZETUSHIN Research Framework</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setUiMode('modern')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${uiMode === 'modern' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            MODERN
                        </button>
                        <button
                            onClick={() => setUiMode('stack')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${uiMode === 'stack' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            STACK (OLD)
                        </button>
                    </div>
                    {onBack && (
                        <button onClick={onBack} className="text-sm bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors font-bold text-slate-700">戻る</button>
                    )}
                </div>
            </div>

            {/* KPI Band (Top段 コンパクト配置) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">全体進捗 (Total)</p>
                    <div className="flex items-end gap-2">
                        <p className="text-xl font-black text-slate-800">{stats?.total_observations || 0}</p>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">/ 1000</p>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${totalProgressPercent}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 ring-2 ring-indigo-50">
                    <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">本日の目標 (Daily)</p>
                    <div className="flex items-end gap-2">
                        <p className="text-xl font-black text-indigo-600">{todayCount}</p>
                        <p className="text-[10px] font-bold text-indigo-300 mb-1">/ 50</p>
                    </div>
                    <div className="mt-2 w-full bg-indigo-50 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${dailyTargetPercent}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">収集件数 (Records)</p>
                    <p className="text-xl font-black text-slate-800">{stats?.total_analyses || 0}</p>
                    <p className="text-[9px] font-bold text-emerald-500 mt-1">Valid Rate: {stats?.total_observations > 0 ? ((stats?.total_analyses / stats?.total_observations) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[9px] font-black text-rose-500 uppercase mb-1">要確認 (Review)</p>
                    <p className="text-xl font-black text-rose-600">{stats?.review_counts?.not_processed || 0}</p>
                    <p className="text-[9px] font-bold text-rose-400 mt-1">Failed/Low: {(stats?.review_counts?.low_quality || 0) + (stats?.review_counts?.failed || 0)}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
                {(['ops', 'overview', 'timeline'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab === 'ops' ? 'Operations' : tab === 'overview' ? 'Project Overview' : 'Timeline'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'ops' ? (
                uiMode === 'modern' ? renderOpsTabModern() : renderOpsTabStack()
            ) : activeTab === 'overview' ? (
                renderOverviewTab()
            ) : (
                renderTimelineTab()
            )}
        </div>
    );
};

export default ResearchDashboard;
