import React, { useState } from 'react';
import versionsData from '../config/versions.json';
import plansData from '../config/plans.json';
import { isDevEnabled, setDevEnabled, getSelectedPlan, setSelectedPlan, getSelectedVersion, setSelectedVersion, isDevConfigurable } from '../utils/devFlags';

interface DevSettingsScreenProps {
    onBack: () => void;
}

const DevSettingsScreen: React.FC<DevSettingsScreenProps> = ({ onBack }) => {
    const [devEnabled, setDevEnabledLocal] = useState(isDevEnabled());
    const [selectedPlan, setSelectedPlanLocal] = useState(getSelectedPlan());
    const [selectedVersion, setSelectedVersionLocal] = useState(getSelectedVersion());
    const masterConfigurable = isDevConfigurable();

    const handleToggleDev = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!masterConfigurable) return;
        const enabled = e.target.checked;
        setDevEnabledLocal(enabled);
        setDevEnabled(enabled);
    };

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const plan = e.target.value;
        setSelectedPlanLocal(plan);
        setSelectedPlan(plan);
    };

    const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const version = e.target.value;
        setSelectedVersionLocal(version);
        setSelectedVersion(version);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-orange-500 max-w-2xl w-full mx-auto my-8">
            {/* Visual Warning Indicator for Dev Mode */}
            {devEnabled && (
                <div className="bg-orange-600 text-white text-center py-2 mb-6 rounded-lg font-bold animate-pulse shadow-md">
                    ⚠️ DEV FEATURE IS CURRENTLY ON ⚠️
                </div>
            )}

            {/* Master Lock Banner */}
            {!masterConfigurable && (
                <div className="bg-slate-100 text-slate-600 text-center py-2 mb-6 rounded-lg text-sm border border-slate-300">
                    🔒 本番環境プロテクト有効: 開発用設定は変更できません。
                </div>
            )}

            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-orange-600 font-mono">🔧 Developer Settings</h2>
                <button
                    onClick={onBack}
                    className="text-slate-500 hover:text-slate-800 font-bold"
                >
                    閉じる [x]
                </button>
            </div>

            <div className="space-y-8">
                {/* Feature Flag */}
                <div className={`p-4 rounded-lg ${masterConfigurable ? 'bg-orange-50' : 'bg-slate-50 opacity-60'}`}>
                    <label className={`flex items-center ${masterConfigurable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input
                            type="checkbox"
                            checked={devEnabled}
                            onChange={handleToggleDev}
                            disabled={!masterConfigurable}
                            className="w-5 h-5 mr-3"
                        />
                        <span className="font-bold text-slate-800">L/P/A 実装基盤を有効化 (DEV_FEATURES)</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-2 ml-8">
                        {masterConfigurable
                            ? "※ ONにすると、既存の解析ロジックではなく新しい `tongueAnalyzerRouter` が使用されます。"
                            : "※ この環境（本番）では有効化できません。"}
                    </p>
                </div>

                {/* Version Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">構成バージョン選択</label>
                    <select
                        value={selectedVersion}
                        onChange={handleVersionChange}
                        className="w-full p-2 border rounded-md"
                    >
                        {versionsData.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                        ))}
                    </select>
                </div>

                {/* Plan Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">アクティブ・プラン設定</label>
                    <select
                        value={selectedPlan}
                        onChange={handlePlanChange}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="legacy">Legacy (Baseline)</option>
                        {Object.entries(plansData).map(([id, plan]) => (
                            <option key={id} value={id}>{plan.name} - {plan.tagline}</option>
                        ))}
                    </select>
                </div>

                <div className="pt-4 mt-6 border-t font-mono text-[10px] text-slate-400">
                    <p>Local Storage Keys:</p>
                    <p>DEV_FEATURES: {devEnabled ? 'true' : 'false'}</p>
                    <p>SELECTED_PLAN: {selectedPlan}</p>
                    <p>SELECTED_VERSION: {selectedVersion}</p>
                    <p className="mt-2 text-blue-500">※ この画面以外に設定への入口はありません。</p>
                </div>
            </div>
        </div>
    );
};

export default DevSettingsScreen;
