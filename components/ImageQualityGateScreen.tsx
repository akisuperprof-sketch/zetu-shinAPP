
import React from 'react';

interface ImageQualityGateScreenProps {
    onRetry: () => void;
    onViewGuide: () => void;
    reason: string;
}

const ImageQualityGateScreen: React.FC<ImageQualityGateScreenProps> = ({ onRetry, onViewGuide, reason }) => {
    const advice = React.useMemo(() => {
        if (reason.includes("暗すぎ")) {
            return {
                title: "明るさを確保してください",
                items: ["室内照明を上げる、または窓際へ移動する", "カメラの露出設定を上げる", "舌に影が落ちない角度で撮影する"]
            };
        }
        if (reason.includes("明るすぎ") || reason.includes("白飛び")) {
            return {
                title: "光の当たり方を調整してください",
                items: ["ライトを直接当てるのをやめる", "カメラを少し離してズームで調整する", "露出を少し下げる"]
            };
        }
        if (reason.includes("ぼけて") || reason.includes("ピント")) {
            return {
                title: "ピントを固定してください",
                items: ["舌の中央にピントが合うまで静止する", "脇を締めて手ブレを防ぐ", "連写機能で数枚撮影してみる"]
            };
        }
        return {
            title: "共通のアドバイス",
            items: ["口を大きく開け、舌全体を入れる", "舌を突き出しすぎない", "加工アプリは使用しない"]
        };
    }, [reason]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-xl border border-orange-100 max-w-md mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">撮影し直してください</h2>
            <div className="bg-orange-50 px-4 py-2 rounded-full mb-6">
                <span className="text-orange-700 font-bold text-sm">理由: {reason}</span>
            </div>

            <div className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                    <span className="w-1.5 h-4 bg-orange-500 rounded-full mr-2"></span>
                    {advice.title}
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                    {advice.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5 font-bold">・</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>

                <hr className="my-4 border-slate-200" />

                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">基本ルール</h3>
                <ul className="text-[11px] text-slate-500 space-y-1">
                    <li>・舌全体（先端から根元まで）を入れる</li>
                    <li>・自然な光の下で撮影する</li>
                    <li>・加工・フィルターはオフにする</li>
                </ul>
            </div>

            <div className="flex flex-col w-full gap-3">
                <button
                    onClick={onRetry}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                >
                    再撮影する
                </button>
                <button
                    onClick={onViewGuide}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all text-sm"
                >
                    良い撮影例を確認する
                </button>
            </div>
        </div>
    );
};

export default ImageQualityGateScreen;
