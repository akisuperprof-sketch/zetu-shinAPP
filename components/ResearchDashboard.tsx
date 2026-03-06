import React, { useEffect, useState } from 'react';
import { ObservationData } from '../services/research/validityRules';
import { calculateMetrics, ResearchMetrics } from '../services/research/statisticsEngine';
import ResearchAlerts from './ResearchAlerts';
import DataCoveragePanel from './DataCoveragePanel';
import { isFeatureEnabled } from '../utils/featureFlags';
import { evaluateExpertAgreement, ExpertEvaluationMetrics } from '../services/research/expertEvaluation';
import { evaluateResearchState, ResearchState } from '../services/research/researchOS';
import { getNextResearchActions } from '../services/research/researchPlanner';

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

    useEffect(() => {
        if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return;

        const loadData = async () => {
            setLoading(true);
            try {
                let dataToUse = records;
                if (!dataToUse || dataToUse.length === 0) {
                    const res = await fetch('/api/research/dashboard_data');
                    if (res.ok) {
                        dataToUse = await res.json();
                    } else {
                        dataToUse = [];
                    }
                }
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
        };

        loadData();
    }, [records]);

    if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return null;
    if (loading || !allTimeMetrics) return <div className="p-8 text-center animate-pulse text-slate-500">Loading Data...</div>;

    const labeledPercent = (allTimeMetrics.labeled_rate * 100).toFixed(1);
    const validPercent = (allTimeMetrics.valid_rate * 100).toFixed(1);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in font-noto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#1F3A5F] flex items-center gap-2 tracking-tight">
                    <span className="text-3xl">🔬</span> Research Dashboard v1.3
                </h2>
                {onBack && (
                    <button onClick={onBack} className="text-sm bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors font-bold text-slate-700">
                        戻る
                    </button>
                )}
            </div>

            {/* Research OS Panel */}
            {isFeatureEnabled('FEATURE_RESEARCH_OS') && researchStateOS && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 border-l-4 border-l-blue-500">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span>🧠</span> Research OS Layer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">Current Research Stage</p>
                            <p className="text-lg font-black text-blue-700">{researchStateOS.stage}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">Model Readiness Score</p>
                            <div className="flex items-end gap-1">
                                <p className="text-2xl font-black text-emerald-600">{researchStateOS.model_readiness.score}</p>
                                <p className="text-xs text-slate-400 font-bold mb-1">/ 100</p>
                            </div>
                            <p className="text-[10px] mt-1 text-slate-500">{researchStateOS.model_readiness.ready ? '✅ READY' : '❌ NOT READY'}</p>
                        </div>
                    </div>

                    {researchStateOS.shortage_top5.length > 0 && (
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-4">
                            <p className="text-xs font-bold text-orange-800 mb-2">Top Shortages</p>
                            <ul className="text-xs space-y-1 text-orange-700">
                                {researchStateOS.shortage_top5.map((s, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-orange-100/50 pb-1">
                                        <span>{s.axis} = {s.label}</span>
                                        <span className="font-bold">need +{s.shortage}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 mb-2">Next Recommended Actions</p>
                        <ul className="list-disc list-inside space-y-1">
                            {researchStateOS.next_actions.map((action, idx) => (
                                <li key={idx} className="text-sm text-blue-600 font-medium">{action}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Alerts if any thresholds are exceeded */}
            {isFeatureEnabled('FEATURE_RESEARCH_ALERTS') && (
                <ResearchAlerts metrics={allTimeMetrics} />
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Records</p>
                    <p className="text-2xl font-black text-slate-800">{allTimeMetrics.total_records}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Labeled Rate</p>
                    <p className="text-2xl font-black text-blue-600">{labeledPercent}%</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valid Rate</p>
                    <p className="text-2xl font-black text-indigo-600">{validPercent}%</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ROI Failed</p>
                    <p className="text-2xl font-black text-rose-500">{(allTimeMetrics.roi_failed_rate * 100).toFixed(1)}%</p>
                </div>
            </div>

            {/* Coverage Panel */}
            {isFeatureEnabled('FEATURE_DATA_COVERAGE') && (
                <DataCoveragePanel metrics={allTimeMetrics} rawRecords={fetchedRecords} />
            )}

            {/* Exclusion Reasons */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-inner mb-8">
                <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                    <span>⚠️</span> Top Exclusion Reasons
                </h3>
                {allTimeMetrics.exclusion_reasons_top.length === 0 ? (
                    <p className="text-xs text-slate-500">除外データはありません</p>
                ) : (
                    <ul className="space-y-2">
                        {allTimeMetrics.exclusion_reasons_top.map((r, i) => (
                            <li key={i} className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-600">{r.reason}</span>
                                <span className="font-medium text-slate-500">{r.count} 件</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Expert Evaluation */}
            {isFeatureEnabled('FEATURE_EXPERT_EVALUATION') && expertMetrics && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                    <h3 className="text-sm font-black text-slate-800 mb-4">🩺 Expert Agreement (v0)</h3>
                    <div className="flex gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl flex-1 border border-slate-100">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">Agreement Rate</p>
                            <p className="text-2xl font-black text-green-600">{(expertMetrics.agreement_rate * 100).toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl flex-1 border border-slate-100">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">Unlabeled Rate</p>
                            <p className="text-2xl font-black text-orange-500">{(expertMetrics.unlabeled_rate * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quality Score & Estimator placeholders */}
            {isFeatureEnabled('FEATURE_QUALITY_SCORE') && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                    <h3 className="text-sm font-black text-slate-800 mb-2">📷 Quality Score Distrib (v0)</h3>
                    <p className="text-xs text-slate-500">Coming soon as features are extracted.</p>
                </div>
            )}

            {isFeatureEnabled('FEATURE_HEAT_COLD_ESTIMATOR') && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                    <h3 className="text-sm font-black text-slate-800 mb-2">🔥 Heat-Cold Score Distrib (v0)</h3>
                    <p className="text-xs text-slate-500">Coming soon based on vision layer integration.</p>
                </div>
            )}
        </div>
    );
};

export default ResearchDashboard;
