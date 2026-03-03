
import React, { useState } from 'react';
import { TONGUE_FINDINGS } from '../constants';
import { RiskLevel } from '../types';

interface FindingsDictionaryScreenProps {
    onBack: () => void;
    devMode?: boolean;
}

const FindingsDictionaryScreen: React.FC<FindingsDictionaryScreenProps> = ({ onBack, devMode }) => {
    const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL');

    const filteredFindings = TONGUE_FINDINGS.filter(f =>
        filter === 'ALL' ? true : f.riskLevel === filter
    );

    const getRiskColor = (level: RiskLevel) => {
        switch (level) {
            case RiskLevel.Red: return 'bg-red-50 border-red-200';
            case RiskLevel.Yellow: return 'bg-yellow-50 border-yellow-200';
            case RiskLevel.Green: return 'bg-green-50 border-green-200';
        }
    };

    const getBadgeColor = (level: RiskLevel) => {
        switch (level) {
            case RiskLevel.Red: return 'bg-red-100 text-red-800';
            case RiskLevel.Yellow: return 'bg-yellow-100 text-yellow-800';
            case RiskLevel.Green: return 'bg-green-100 text-green-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-fade-in min-h-[50vh]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">舌所見図鑑</h2>
                <button onClick={onBack} className="text-slate-500 hover:text-slate-700 font-medium">
                    戻る
                </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
                中医学に基づく舌の所見一覧です。ご自身の体調管理の参考にしてください。
            </p>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {['ALL', RiskLevel.Red, RiskLevel.Yellow, RiskLevel.Green].map(level => (
                    <button
                        key={level}
                        onClick={() => setFilter(level as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === level
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {level === 'ALL' ? 'すべて' : `${level}`}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {filteredFindings.map((finding) => (
                    <div key={finding.key} className={`border rounded-lg p-4 ${getRiskColor(finding.riskLevel)}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-800">{finding.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${getBadgeColor(finding.riskLevel)}`}>
                                {finding.riskLevel}
                            </span>
                        </div>
                        {devMode && finding.imageUrl && (
                            <div className="mb-3 w-full h-32 bg-white rounded-md overflow-hidden flex items-center justify-center border border-slate-200 shadow-sm relative">
                                <img src={finding.imageUrl} alt={finding.name} className="h-full object-contain hover:scale-105 transition-transform duration-300" />
                                <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1 rounded opacity-80 font-bold">DEV</span>
                            </div>
                        )}
                        <p className="text-sm mb-2 font-bold text-slate-700">{finding.condition}</p>
                        <p className="text-sm mb-3 text-slate-600">{finding.shortDescription}</p>

                        <div className="mt-auto pt-3 border-t border-slate-200 text-xs text-slate-600">
                            <p className="mb-1"><span className="font-bold">理由:</span> {finding.reason}</p>
                            <p><span className="font-bold">推奨:</span> {finding.recommendedAction}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FindingsDictionaryScreen;
