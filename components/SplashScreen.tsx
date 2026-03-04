import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

    useEffect(() => {
        // 0.4s fade-in
        const holdTimer = setTimeout(() => {
            setPhase('hold');
        }, 400);

        // 0.4s (in) + 2.1s (hold) = 2.5s
        const outTimer = setTimeout(() => {
            setPhase('out');
        }, 2500);

        // 2.5s (start out) + 0.4s (fade out) = 2.9s
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 2900);

        return () => {
            clearTimeout(holdTimer);
            clearTimeout(outTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-400 ease-in-out font-noto bg-white ${phase === 'out' ? 'opacity-0' : 'opacity-100'
                }`}
            style={{
                backgroundImage: 'url(/assets/splash-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Character */}
            <div className={`mb-8 transform transition-all duration-700 delay-100 ${phase === 'in' ? 'scale-90 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
                }`}>
                <img src="/assets/zetushin.png" alt="Zetushin" className="w-[240px] drop-shadow-xl" />
            </div>

            {/* Logo Group */}
            <div className={`text-center transform transition-all duration-700 delay-300 ${phase === 'in' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}>
                <img src="/assets/logo-zetushin.png" alt="舌神 -ZETUSHIN-" className="h-16 mx-auto mb-4" />
                <p className="text-[#1F3A5F] text-[15px] font-black tracking-[0.5em] leading-relaxed">
                    舌からわかる<br />今日のコンディション
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
