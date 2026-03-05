import React, { useEffect, useState } from 'react';
import { ObservationData } from '../services/research/validityRules';
import { calculateMetrics, ResearchMetrics } from '../services/research/statisticsEngine';
import ResearchAlerts from './ResearchAlerts';
import DataCoveragePanel from './DataCoveragePanel';
import { isFeatureEnabled } from '../utils/featureFlags';

interface ResearchDashboardProps {
    records: ObservationData[]; // Will be fetched from backend normally, but we accept it as props for now
}

const ResearchDashboard: React.FC<ResearchDashboardProps> = ({ records }) => {
    const [allTimeMetrics, setAllTimeMetrics] = useState<ResearchMetrics | null>(null);

    useEffect(() => {
        if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return;
        if (records) {
            setAllTimeMetrics(calculateMetrics(records));
        }
    }, [records]);

    if (!isFeatureEnabled('FEATURE_RESEARCH_DASHBOARD')) return null;
    if (!allTimeMetrics) return <div className="p-4 text-center">Loading Data...</div>;

    const labeledPercent = (allTimeMetrics.labeled_rate * 100).toFixed(1);
    const validPercent = (allTimeMetrics.valid_rate * 100).toFixed(1);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in font-noto">
            <h2 className="text-2xl font-black text-[#1F3A5F] mb-6 flex items-center gap-2 tracking-tight">
                <span className="text-3xl">🔬</span> Research Dashboard v1.3
            </h2>

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
                <DataCoveragePanel metrics={allTimeMetrics} rawRecords={records} />
            )}

            {/* Exclusion Reasons */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-inner">
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
        </div>
    );
};

export default ResearchDashboard;
