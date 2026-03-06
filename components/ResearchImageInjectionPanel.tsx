
import React, { useState, useRef, useCallback } from 'react';
import { getSession } from '../utils/userSession';
import { isFeatureEnabled } from '../utils/featureFlags';
import { FileUploadStatus, UploadBatchSummary } from '../types/researchUpload';

/**
 * 開発・研究用 画像大量投入パネル (v1)
 * 既存の research_save パイプラインを流用して、ローカルから複数の画像を直接投入する。
 */
const ResearchImageInjectionPanel: React.FC = () => {
    const [files, setFiles] = useState<FileUploadStatus[]>([]);
    const [uploading, setUploading] = useState(false);
    const [batchName, setBatchName] = useState('');
    const [memo, setMemo] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Feature Flag and Component Level Guard
    const isInjectionEnabled = isFeatureEnabled('FEATURE_RESEARCH_IMAGE_INJECTION');

    if (!isInjectionEnabled) return null;

    const session = getSession();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selectedFiles = Array.from(e.target.files) as File[];

        const newFiles: FileUploadStatus[] = selectedFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file: file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
            size: file.size
        }));

        // Validate
        const validatedFiles = newFiles.map(f => {
            const ext = f.file.name.split('.').pop()?.toLowerCase();
            const isValidExt = ['jpg', 'jpeg', 'png'].includes(ext || '');
            const isValidSize = f.size > 0;

            if (!isValidExt) return { ...f, status: 'skipped' as const, error: 'Unsupported extension' };
            if (!isValidSize) return { ...f, status: 'skipped' as const, error: 'Empty file' };
            return f;
        });

        setFiles(prev => [...prev, ...validatedFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearFiles = () => {
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const startUpload = async () => {
        if (files.length === 0 || uploading) return;
        setUploading(true);

        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
            const f = updatedFiles[i];
            if (f.status !== 'pending') continue;

            updatedFiles[i] = { ...f, status: 'uploading' };
            setFiles([...updatedFiles]);

            try {
                const base64 = await convertToBase64(f.file);

                // Construct payload similar to doObservationLog in App.tsx
                const payload = {
                    anon_id: session?.anonId || 'INJECTION_USER',
                    image_base64: base64,
                    image_mime_type: f.file.type,
                    age_range: 'unknown',
                    gender: 'その他',
                    chief_complaint: `[IMAGE_INJECTION] Batch: ${batchName || 'none'} | Memo: ${memo || 'none'}`,
                    consent_version: 'injection_v1.0',
                    consent_at: new Date().toISOString(),
                    answers_json: { injection: true, batch_name: batchName, memo: memo },
                    questionnaire_version: 'injection_v1.0',
                    scores_json: { xuShi: 0, heatCold: 0, zaoShi: 0 },
                    pattern_ids: [],
                    analysis_mode: 'standard'
                };

                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research_save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    updatedFiles[i] = { ...f, status: 'success' };
                } else {
                    const errData = await res.json().catch(() => ({}));
                    updatedFiles[i] = { ...f, status: 'failed', error: errData.error || `HTTP ${res.status}` };
                }
            } catch (err: any) {
                updatedFiles[i] = { ...f, status: 'failed', error: err.message };
            }
            setFiles([...updatedFiles]);
        }
        setUploading(false);
    };

    const summary: UploadBatchSummary = {
        total: files.length,
        success: files.filter(f => f.status === 'success').length,
        failed: files.filter(f => f.status === 'failed').length,
        skipped: files.filter(f => f.status === 'skipped').length,
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 mt-6 font-noto text-white animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
                    <span className="text-xl">📥</span> Research Data Injection
                </h3>
                <div className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black rounded-full border border-red-500/30 uppercase tracking-tighter">
                    Internal Use Only
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Batch Name (optional)</label>
                    <input
                        type="text"
                        value={batchName}
                        onChange={e => setBatchName(e.target.value)}
                        placeholder="e.g. Hospital_A_2026"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Memo (optional)</label>
                    <input
                        type="text"
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                        placeholder="e.g. 10 samples for validation"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors mb-6 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <span className="text-4xl mb-3">🖼️</span>
                <p className="text-xs font-bold text-slate-300">画像をここにドラッグ、またはクリックして選択</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">JPG, PNG (Multiple selection allowed)</p>
            </div>

            {files.length > 0 && (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                            <img src={f.previewUrl} className="w-10 h-10 rounded-lg object-cover bg-black" alt="preview" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold truncate">{f.file.name}</div>
                                <div className="text-[9px] text-slate-500 lowercase">{(f.size / 1024).toFixed(1)} KB</div>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                f.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                    f.status === 'skipped' ? 'bg-slate-500/20 text-slate-400' :
                                        f.status === 'uploading' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' :
                                            'bg-slate-700 text-slate-400'
                                }`}>
                                {f.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase">Selected</div>
                        <div className="text-lg font-black">{summary.total}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[9px] font-black text-emerald-500 uppercase">Success</div>
                        <div className="text-lg font-black text-emerald-400">{summary.success}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[9px] font-black text-red-500 uppercase">Failed</div>
                        <div className="text-lg font-black text-red-400">{summary.failed}</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={clearFiles}
                        disabled={uploading || files.length === 0}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-full text-xs font-black transition-all uppercase tracking-widest"
                    >
                        Clear
                    </button>
                    <button
                        onClick={startUpload}
                        disabled={uploading || summary.total === 0 || summary.success + summary.failed + summary.skipped === summary.total}
                        className="px-8 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-full text-xs font-black transition-all uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    >
                        {uploading ? 'Uploading...' : 'Start Injection'}
                    </button>
                </div>
            </div>

            <p className="text-[9px] text-slate-500 mt-4 text-center uppercase tracking-widest">
                ※ 投入データは research_save パイプラインを通じて Supabase に保存されます
            </p>
        </div>
    );
};

export default ResearchImageInjectionPanel;
