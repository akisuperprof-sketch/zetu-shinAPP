import React from 'react';
import { calculateCoverage, nextRecommendations, generateHeatmap } from '../services/research/dataCoverage';
import { ResearchMetrics } from '../services/research/statisticsEngine';
import { ObservationData } from '../services/research/validityRules';
import { TARGET_LABELS } from '../constants/researchTargets';

interface DataCoveragePanelProps {
    metrics: ResearchMetrics;
    rawRecords: ObservationData[];
}

const DataCoveragePanel: React.FC<DataCoveragePanelProps> = ({ metrics, rawRecords }) => {
    const coverage = calculateCoverage(metrics.distributions);
    const nextList = nextRecommendations(coverage);

    const tongueColors = TARGET_LABELS.tongueColor;
    const coatThicknesses = TARGET_LABELS.coatThickness;

    const heatmapData = generateHeatmap(rawRecords as Record<string, any>[], 'tongueColor', 'coatThickness', tongueColors, coatThicknesses);

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>📊</span> Data Coverage (不足領域可視化)
            </h3>

            <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-600 mb-2">次に集めるべき推奨データ (Top 5)</h4>
                <div className="space-y-2">
                    {nextList.length === 0 ? (
                        <p className="text-xs text-green-600 font-bold">🎉 全てのターゲット数を達成しました！</p>
                    ) : (
                        nextList.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                                <span className="font-bold text-indigo-900">{c.axis} : {c.label}</span>
                                <span className="font-medium text-slate-500 text-[10px]">
                                    {c.count} / {c.target} (不足: <span className="text-rose-500 font-bold">{c.shortage}</span>)
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-slate-600 mb-2">舌色 × 苔厚 ヒートマップ (収集数)</h4>
                <div className="overflow-x-auto text-[10px]">
                    <table className="w-full border-collapse border border-slate-200">
                        <thead>
                            <tr>
                                <th className="border border-slate-200 bg-slate-50 py-1 px-2 font-medium text-slate-500">苔厚 \ 舌色</th>
                                {tongueColors.map(tc => (
                                    <th key={tc} className="border border-slate-200 bg-slate-50 py-1 px-2 font-bold whitespace-nowrap">{tc}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {coatThicknesses.map(ct => (
                                <tr key={ct}>
                                    <td className="border border-slate-200 bg-slate-50 py-1 px-2 font-bold whitespace-nowrap">{ct}</td>
                                    {tongueColors.map(tc => {
                                        const count = heatmapData[ct]?.[tc] || 0;
                                        const bgClass = count === 0 ? 'bg-rose-50/50' : 'bg-green-50/50';
                                        return (
                                            <td key={tc} className={`border border-slate-200 py-1 px-2 text-center text-slate-700 font-medium ${bgClass}`}>
                                                {count}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataCoveragePanel;
