import React from 'react';

interface TutorialScreenProps {
    onClose: () => void;
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-fade-in font-noto">
            <div className="max-w-sm w-full space-y-12 text-center">
                {/* Step 1: Brain/Deity Branding */}
                <div className="space-y-4">
                    <img src="/assets/zetushin.png" alt="舌神" className="w-24 h-24 mx-auto drop-shadow-md" />
                    <h2 className="text-2xl font-black text-[#1F3A5F]">観測のコツ</h2>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                        より正確なコンディション観測のために、以下の3点に注意しておくれ。
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-8 text-left">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#6FC3B2] text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">1</div>
                        <div>
                            <p className="font-black text-[#1F3A5F] text-sm mb-1">明るい場所で</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">室内なら窓際など、自然光が入る明るい場所が理想的だね。</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#6FC3B2] text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">2</div>
                        <div>
                            <p className="font-black text-[#1F3A5F] text-sm mb-1">舌をまっすぐ出す</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">力まずに、舌を自然にまっすぐ出しておくれ。</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#6FC3B2] text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">3</div>
                        <div>
                            <p className="font-black text-[#1F3A5F] text-sm mb-1">枠に合わせる</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">画面のガイド枠に舌を合わせると、解析がスムーズになるよ。</p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={onClose}
                    className="w-full bg-[#1F3A5F] text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-[#162944] transition-all active:scale-[0.98] text-sm tracking-[0.2em] uppercase"
                >
                    理解した
                </button>
            </div>
        </div>
    );
};

export default TutorialScreen;
