import React, { useRef, useState, useEffect } from 'react';
import { analyzeImageData, getQualityFeedback } from '../utils/imageQualityAnalyzer';
import { AnalysisMode } from '../types';
import { getCaptureGuideV2 } from '../utils/captureGuideV2';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
    plan?: AnalysisMode;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, plan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isGuideV2Enabled = typeof window !== 'undefined' && localStorage.getItem('FF_CAPTURE_GUIDE_V2') === '1';
    const isRewardEnabled = typeof window !== 'undefined' && localStorage.getItem('FF_CAPTURE_REWARD_V1') === '1';
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('role') || 'FREE' : 'FREE';

    // Real-time quality states
    const [quality, setQuality] = useState<any>(null);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [showReward, setShowReward] = useState(false); // Task B: Capture Reward

    useEffect(() => {
        let currentStream: MediaStream | null = null;
        let analysisInterval: any = null;

        const startCamera = async () => {
            try {
                const constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user"
                    }
                };
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(currentStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = currentStream;
                }

                // Start periodic analysis
                analysisInterval = setInterval(() => {
                    performLiveAnalysis();
                }, 2000); // 2sec interval to keep it lightweight

            } catch (err: any) {
                console.error("Camera error:", err);
                setError("カメラの起動に失敗しました。カメラへのアクセスを許可してください。" + (err.message || ""));
            }
        };

        const performLiveAnalysis = () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d', { willReadFrequently: true });

                if (context && video.videoWidth > 0) {
                    // Small sampling canvas for speed
                    const w = 128;
                    const h = (video.videoHeight / video.videoWidth) * w;
                    canvas.width = w;
                    canvas.height = h;
                    context.drawImage(video, 0, 0, w, h);

                    try {
                        const imageData = context.getImageData(0, 0, w, h);
                        const metrics = analyzeImageData(imageData.data, w, h);
                        const { feedback } = getQualityFeedback(metrics);
                        setQuality(metrics);
                        setAlerts(feedback);
                    } catch (e) {
                        // Silent fail for real-time
                    }
                }
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (analysisInterval) clearInterval(analysisInterval);
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && stream) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // Ensure natural aspect ratio
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });

                        const isGuideOk = getCaptureGuideV2(quality || null, userRole).isOk;
                        if (isRewardEnabled && isGuideOk) {
                            setShowReward(true);
                            setTimeout(() => {
                                onCapture(file);
                            }, 500); // Wait for animation
                        } else {
                            onCapture(file);
                        }
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const isPro = plan === AnalysisMode.Pro;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl">
                {error ? (
                    <div className="p-12 text-center text-white">
                        <p className="text-red-400 font-bold mb-4 text-lg">エラー</p>
                        <p className="text-slate-300 mb-8">{error}</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm transition-colors">閉じる</button>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto bg-black transform scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Capture Guide V2 / Analysis Feedback Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex flex-col items-center pointer-events-none z-10 transition-all font-sans">
                            {isGuideV2Enabled ? (
                                <div className="flex flex-col items-center gap-2 mt-2">
                                    <div className="text-[10px] font-bold text-white/80 bg-black/50 px-4 py-1.5 mb-1 rounded-full tracking-wider border border-white/10">
                                        📸 撮影ガイド：撮影時に自動チェックします
                                    </div>
                                    <div className={`px-6 py-2 rounded-full text-[12px] font-black shadow-2xl backdrop-blur-md border transition-all ${getCaptureGuideV2(quality || null, userRole).isOk ? 'bg-brand-primary/90 text-white border-jade-400/50 scale-105' : 'bg-slate-900/80 text-blue-100 border-white/10'}`}>
                                        {getCaptureGuideV2(quality || null, userRole).message}
                                    </div>

                                    {/* 📸 Pre-capture Checklist (Visual Indicators) */}
                                    <div className="flex gap-2 animate-fade-in mt-1">
                                        {[
                                            { label: '明るさ', ok: quality && quality.brightness_mean >= 80 && quality.brightness_mean <= 180, icon: '🔅' },
                                            { label: '角度', ok: quality && quality.blur_score >= 15, icon: '📐' },
                                            { label: '影・色彩', ok: quality && quality.saturation_mean >= 20 && quality.saturation_mean <= 80, icon: '👤' }
                                        ].map((item, idx) => {
                                            const isMeasuring = !quality;
                                            const stateIcon = isMeasuring ? '⏳' : (item.ok ? '✅' : '⚠️');
                                            const stateClass = isMeasuring ? 'bg-black/60 text-white/50 border-white/10' : (item.ok ? 'bg-jade-500/20 text-jade-300 border-jade-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40');

                                            return (
                                                <div key={idx} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black backdrop-blur-sm transition-all shadow-sm ${stateClass}`}>
                                                    <span className={item.ok ? 'animate-pulse' : (isMeasuring ? 'animate-spin' : '')}>{stateIcon}</span> {item.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                alerts.length > 0 && (
                                    <div className="space-y-2">
                                        {alerts.map((a, i) => (
                                            <div key={i} className="bg-yellow-400/90 text-slate-900 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-lg animate-bounce-subtle backdrop-blur-sm border border-yellow-500">
                                                ⚠️ {a.message}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>

                        {/* Soft Ellipse Guide for Tongue Alignment */}
                        {isGuideV2Enabled && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={`w-[60%] h-[70%] border-2 rounded-[100%] max-w-[200px] max-h-[300px] transition-all duration-500 ${getCaptureGuideV2(quality || null, userRole).isOk ? 'border-jade-400 border-solid shadow-[0_0_30px_rgba(111,195,178,0.3)]' : 'border-white/20 border-dashed'}`}></div>
                            </div>
                        )}

                        {/* Pro Detailed Stats */}
                        {isPro && quality && (
                            <div className="absolute top-14 right-4 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-[9px] text-white/80 font-mono space-y-1 z-10">
                                <div>BRIGHT: {quality.brightness_mean}</div>
                                <div>SHARP: {quality.blur_score}</div>
                                <div>SAT: {quality.saturation_mean}</div>
                            </div>
                        )}

                        <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-8 items-center px-8 z-20">
                            <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white rounded-full px-6 py-3 text-[11px] font-bold backdrop-blur-md transition-all border border-white/10 active:scale-95">
                                キャンセル
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => {
                                        const btn = document.getElementById('capture-btn-flash');
                                        if (btn) {
                                            btn.classList.remove('hidden');
                                            btn.classList.add('animate-ping');
                                            setTimeout(() => btn.classList.add('hidden'), 500);
                                        }
                                        handleCapture();
                                    }}
                                    disabled={!stream}
                                    className="w-20 h-20 rounded-full bg-white border-8 border-slate-200/20 shadow-2xl hover:scale-105 active:scale-90 transition-all flex items-center justify-center group disabled:opacity-50 disabled:grayscale"
                                >
                                    <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-900 group-hover:border-brand-primary transition-colors flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200" />
                                    </div>
                                    {/* Capture Flash Effect */}
                                    <div id="capture-btn-flash" className="absolute inset-0 rounded-full bg-white/80 hidden pointer-events-none" />
                                </button>

                                {getCaptureGuideV2(quality || null, userRole).isOk && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-jade-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg animate-bounce-subtle">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="w-24 text-right">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{isPro ? 'PRO MODE' : 'LITE MODE'}</span>
                            </div>
                        </div>

                        {/* 🎉 Capture Reward Overlay (v1.5) */}
                        {showReward && (
                            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-fade-in bg-brand-primary/20 backdrop-blur-sm">
                                <div className="bg-white/95 px-8 py-4 rounded-full shadow-2xl border border-white/20 flex items-center gap-3 transform scale-110">
                                    <span className="text-2xl animate-bounce-subtle">✨</span>
                                    <span className="text-brand-primary font-black tracking-widest uppercase text-sm">Perfect Capture</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <p className="text-white/40 text-[10px] mt-6 font-medium tracking-wide">正面を向いて、舌を自然に出した状態で撮影してください</p>
        </div>
    );
};

export default CameraCapture;
