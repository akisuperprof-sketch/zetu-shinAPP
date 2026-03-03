
import React, { useState } from 'react';

interface DoctorReviewFormProps {
    analysisId: string;
}

const DoctorReviewForm: React.FC<DoctorReviewFormProps> = ({ analysisId }) => {
    const [patternId, setPatternId] = useState('');
    const [confidence, setConfidence] = useState(80);
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'submitted'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');

        try {
            // 1. Create Review (Draft)
            const resCreate = await fetch('/api/review/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysis_id: analysisId,
                    doctor_pattern_def_id: patternId,
                    doctor_confidence: confidence,
                    doctor_comment: comment,
                    reviewer_id_hash: 'doctor_001' // Mock
                })
            });
            const { data } = await resCreate.json();

            // 2. Submit Review (Lock)
            await fetch('/api/review/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_id: data.review_id })
            });

            setStatus('submitted');
        } catch (err) {
            console.error(err);
            setStatus('idle');
            alert('保存に失敗しました');
        }
    };

    if (status === 'submitted') {
        return (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-700 text-sm font-bold text-center">
                ✅ 医師レビューを送信しました。検証データとして保存されました。
            </div>
        );
    }

    return (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-white mt-8 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">🩺</span> 医師による検証レビュー (Admin)
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">正解の証ID</label>
                    <input
                        type="text"
                        required
                        placeholder="例: P_KIDNEY_YIN_DEF"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                        value={patternId}
                        onChange={e => setPatternId(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">確信度 (%)</label>
                    <input
                        type="range" min="0" max="100"
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        value={confidence}
                        onChange={e => setConfidence(parseInt(e.target.value))}
                    />
                    <div className="text-right text-xs mt-1 text-blue-400 font-bold">{confidence}%</div>
                </div>
                <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">コメント (任意)</label>
                    <textarea
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm h-20 focus:border-blue-500 outline-none"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
                <button
                    disabled={status === 'saving' || !patternId}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    {status === 'saving' ? '保存中...' : 'レビューを確定する'}
                </button>
            </form>
        </div>
    );
};

export default DoctorReviewForm;
