import React, { useState } from 'react';
import { EXPERT_PATTERNS, TONGUE_COLORS, COAT_THICKNESSES, COAT_COLORS, MOISTURES, ExpertPatternType } from '../constants/expertPattern';
import { getSession } from '../utils/userSession';
import { isFeatureEnabled } from '../utils/featureFlags';

interface ObservationInputPanelProps {
    analysisId?: string;
    onSave?: (data: any) => void;
}

const ObservationInputPanel: React.FC<ObservationInputPanelProps> = ({ analysisId, onSave }) => {
    const [tongueColor, setTongueColor] = useState<string>('不明');
    const [coatThickness, setCoatThickness] = useState<string>('不明');
    const [coatColor, setCoatColor] = useState<string>('不明');
    const [moisture, setMoisture] = useState<string>('不明');
    const [pattern, setPattern] = useState<string>('不明');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const patternKeys = Object.keys(EXPERT_PATTERNS) as ExpertPatternType[];

    const session = getSession();
    const isLogEnabled = isFeatureEnabled('FEATURE_OBSERVATION_LOG');
    const canSave = session?.researchAgreed === true && isLogEnabled;

    const handleSave = async () => {
        if (!isLogEnabled) {
            alert('ログ保存機能は現在無効化されています。');
            return;
        }
        if (!session?.researchAgreed) {
            alert('研究への同意がないため保存できません。');
            return;
        }

        const payload = { tongueColor, coatThickness, coatColor, moisture, pattern, anonId: session.anonId };

        if (onSave) {
            onSave(payload);
            setSaved(true);
            return;
        }

        if (!analysisId) {
            alert('保存対象の解析IDがありません。');
            return;
        }

        try {
            setSaving(true);
            const res = await fetch('/api/analyze/update_v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysis_id: analysisId,
                    expert_observation: payload
                })
            });

            if (res.ok) {
                setSaved(true);
            } else {
                alert('保存に失敗しました。');
            }
        } catch (e) {
            console.error('Observation save failed', e);
            alert('保存中にエラーが発生しました。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 shadow-sm mt-6">
            <h4 className="text-[12px] font-black text-indigo-800 flex items-center gap-2 mb-4 tracking-widest uppercase">
                <span className="text-[14px]">🔬</span> 研究用観察入力 (Research Only)
            </h4>

            <div className="space-y-4">
                <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">舌色 (Tongue Color)</label>
                    <div className="flex flex-wrap gap-2">
                        {TONGUE_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setTongueColor(c)}
                                className={`px-3 py-1 text-[12px] rounded-full border ${tongueColor === c ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">苔厚 (Coat Thickness)</label>
                    <div className="flex flex-wrap gap-2">
                        {COAT_THICKNESSES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCoatThickness(c)}
                                className={`px-3 py-1 text-[12px] rounded-full border ${coatThickness === c ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">苔色 (Coat Color)</label>
                    <div className="flex flex-wrap gap-2">
                        {COAT_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setCoatColor(c)}
                                className={`px-3 py-1 text-[12px] rounded-full border ${coatColor === c ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">津液 (Moisture)</label>
                    <div className="flex flex-wrap gap-2">
                        {MOISTURES.map(c => (
                            <button
                                key={c}
                                onClick={() => setMoisture(c)}
                                className={`px-3 py-1 text-[12px] rounded-full border ${moisture === c ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">エキスパート判定 (Expert Pattern)</label>
                    <div className="flex flex-wrap gap-2">
                        {patternKeys.map(k => (
                            <button
                                key={k}
                                onClick={() => setPattern(k)}
                                className={`px-3 py-1 text-[12px] rounded-full border ${pattern === k ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                {EXPERT_PATTERNS[k]}
                            </button>
                        ))}
                        <button
                            onClick={() => setPattern('不明')}
                            className={`px-3 py-1 text-[12px] rounded-full border ${pattern === '不明' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            不明
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end flex-col items-end">
                <button
                    onClick={handleSave}
                    disabled={saving || saved || !canSave}
                    className={`px-6 py-2 rounded-full text-[13px] font-bold shadow-md transition-colors ${saved ? 'bg-green-500 text-white' : canSave ? 'bg-[#1F3A5F] text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        } disabled:opacity-50`}
                >
                    {saving ? '保存中...' : saved ? '保存完了' : '研究ログとして保存'}
                </button>
                {!canSave && (
                    <p className="text-[10px] text-red-500 mt-1">※研究への同意がないため保存できません</p>
                )}
            </div>
        </div>
    );
};

export default ObservationInputPanel;
