import React, { useRef } from 'react';
import { DiagnosisResult, UserInfo } from '../types';
import { colors } from '../styles/tokens';

interface ShareCardSystemProps {
    result: DiagnosisResult;
    userInfo: UserInfo | null;
    nickname: string;
}

const PALETTE = {
    deepNavy: '#1E293B',
    jade: '#10B981',
    cinnabar: '#EF4444',
    offWhite: '#F8FAFC'
};

/**
 * ZETUSHIN SNS Share Card System (Future Feature)
 * Feature Flag: FEATURE_SHARE_CARD
 */
const ShareCardSystem: React.FC<ShareCardSystemProps> = ({ result, userInfo, nickname }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Note: Actual image generation (Canvas/html2canvas) would go here.
    // For the design mockup, we build the DOM structure.

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div
                ref={cardRef}
                style={{
                    width: '1080px',
                    height: '1350px',
                    backgroundColor: PALETTE.offWhite,
                    color: PALETTE.deepNavy,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    padding: '80px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: `1px solid ${PALETTE.deepNavy}20`,
                    position: 'relative',
                    // Transform for preview scale if needed
                    transform: 'scale(0.3)',
                    transformOrigin: 'top center',
                    marginBottom: '-945px' // Offset scale
                }}
                className="shadow-2xl rounded-sm"
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 style={{ color: PALETTE.jade, fontSize: '48px', fontWeight: 900, letterSpacing: '2px' }}>ZETUSHIN</h1>
                        <p style={{ fontSize: '24px', opacity: 0.7, marginTop: '8px' }}>AI Tongue Diagnosis Research</p>
                    </div>
                    <div style={{ fontSize: '20px', textAlign: 'right', opacity: 0.6 }}>
                        {new Date().toLocaleDateString('ja-JP')}
                    </div>
                </div>

                {/* Main Result */}
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div style={{ fontSize: '32px', marginBottom: '24px' }}>
                        {nickname}さんの体調傾向
                    </div>
                    <div
                        style={{
                            fontSize: '120px',
                            fontWeight: 900,
                            color: PALETTE.jade,
                            marginBottom: '16px',
                            lineHeight: 1
                        }}
                    >
                        {result.top3?.[0]?.name || "推定体質"}
                    </div>
                    <div style={{ fontSize: '42px', color: PALETTE.deepNavy, opacity: 0.8 }}>
                        バランス良好
                    </div>
                </div>

                {/* Footer info and medical disclaimer */}
                <div style={{ borderTop: `2px solid ${PALETTE.deepNavy}10`, paddingTop: '40px' }}>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div style={{ fontSize: '20px', opacity: 0.8, lineHeight: 1.6 }}>
                            <span style={{ fontWeight: 700 }}>匿名研究参加中</span><br />
                            舌画像と回答は、個人を特定できない形に整えてAI学習と東洋医学研究に活用されます。
                        </div>
                        <div style={{ fontSize: '20px', opacity: 0.8, textAlign: 'right' }}>
                            #舌診AI #ZETUSHIN #未病
                        </div>
                    </div>

                    <div style={{ fontSize: '18px', opacity: 0.5, textAlign: 'center' }}>
                        【免責事項】本結果は医療行為（診断・治療等）に代わるものではありません。体調に不安がある場合は医師にご相談ください。
                    </div>
                </div>
            </div>

            <div className="text-sm text-slate-500 italic">
                (Feature Flag: SHARE_CARD is implementation only, not visible to general users)
            </div>
        </div>
    );
};

export default ShareCardSystem;
