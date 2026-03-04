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
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fade-in font-noto">
            <div className="w-full max-w-2xl bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl aspect-[9/16] sm:aspect-video flex items-center justify-center">
                {error ? (
                    <div className="p-12 text-center text-white">
                        <p className="text-red-400 font-bold mb-4 text-lg">エラー</p>
                        <p className="text-slate-300 mb-8">{error}</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm transition-colors">閉じる</button>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black transform scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* 1. 撮影ガイドオーバーレイ (Tongue Frame) */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
                            <img src="/assets/guides/overlay-tongue-frame.png" alt="Guide" className="w-[85%] h-auto max-w-[320px]" />
                        </div>

                        {/* 2. 警告メッセージエリア (明るさ・ブレ・距離) */}
                        <div className="absolute top-10 left-0 right-0 flex flex-col items-center pointer-events-none z-30 px-6 gap-3 font-noto">
                            {quality ? (
                                <>
                                    {quality.brightness_mean < 70 && (
                                        <div className="bg-[#B84C3A] text-white px-5 py-2 rounded-full text-[11px] font-black shadow-lg animate-pulse border border-white/10 uppercase tracking-widest flex items-center gap-2">
                                            <span>⚠️</span> 暗すぎます：明るい場所へ移動してください
                                        </div>
                                    )}
                                    {quality.blur_score < 12 && quality.brightness_mean >= 70 && (
                                        <div className="bg-slate-900/90 text-white px-5 py-2 rounded-full text-[11px] font-black shadow-lg border border-white/10 uppercase tracking-widest flex items-center gap-2">
                                            <span>⚠️</span> ブレています：固定して撮影してください
                                        </div>
                                    )}
                                    {/* 距離ガイドの簡易的な推測 (ピントが合わず、かつ明るすぎる等のノイズを検知) */}
                                    {quality.blur_score < 8 && quality.brightness_mean > 180 && (
                                        <div className="bg-[#1F3A5F] text-white px-5 py-2 rounded-full text-[11px] font-black shadow-lg border border-white/10 uppercase tracking-widest flex items-center gap-2">
                                            <span>📏</span> 近すぎます：少し離してください
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-[10px] text-white/20 font-black animate-pulse uppercase tracking-[0.2em]">Analyzing...</div>
                            )}
                        </div>

                        {/* Top Info Badge */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full flex justify-center">
                            <div className="text-[10px] font-black text-white/40 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full tracking-[0.3em] uppercase border border-white/5">
                                Capture Guide Active
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-8 items-center px-8 z-40">
                            <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white rounded-full px-6 py-3 text-[11px] font-black backdrop-blur-md transition-all border border-white/10 active:scale-95 uppercase tracking-widest">
                                Cancel
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
                                    <div className="w-14 h-14 rounded-full bg-white border-2 border-[#1F3A5F] group-hover:border-[#6FC3B2] transition-colors flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
                                    </div>
                                    <div id="capture-btn-flash" className="absolute inset-0 rounded-full bg-white/80 hidden pointer-events-none" />
                                </button>

                                {/* Success Check */}
                                {quality && quality.brightness_mean >= 80 && quality.blur_score >= 15 && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#6FC3B2] rounded-full border-2 border-black flex items-center justify-center shadow-lg animate-bounce-subtle">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="w-24 text-right">
                                <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">{isPro ? 'PRO Mode' : 'Standard'}</span>
                            </div>
                        </div>

                        {/* 🎉 Capture Reward Overlay (v1.5) */}
                        {showReward && (
                            <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center bg-[#6FC3B2]/10 backdrop-blur-sm animate-fade-in">
                                <div className="bg-white/95 px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 transform scale-110">
                                    <span className="text-2xl animate-bounce-subtle">✨</span>
                                    <span className="text-[#1F3A5F] font-black tracking-[0.2em] uppercase text-xs">Perfect Capture</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <p className="text-white/30 text-[10px] mt-8 font-black uppercase tracking-[0.5em] text-center">Center the tongue within the frame and hold steady</p>
        </div>
    );
};

export default CameraCapture;
