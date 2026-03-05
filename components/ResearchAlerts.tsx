import React from 'react';
import { ResearchMetrics } from '../services/research/statisticsEngine';
import { RESEARCH_THRESHOLDS } from '../constants/researchThresholds';

interface ResearchAlertsProps {
    metrics: ResearchMetrics;
}

const actionGuide: Record<string, string> = {
    'ROI_FAIL': 'ROI取得失敗が多発しています。唇や歯の映り込みを減らし、舌を画面中央に配置するよう促してください。',
    'BLUR_LOW': 'ピンぼけが多発しています。撮影距離を一定にし、手ブレを防ぐ工夫を促してください。',
    'BRIGHTNESS_LOW': '暗い画像が多発しています。均一な照明下での撮影を促し、逆光を避けてください。',
    'BRIGHTNESS_HIGH': '白飛びが多発しています。直射日光や強すぎる照明を避けてください。',
    'HOLD_HIGH': '除外（HOLD）率が高くなっています。撮影環境全体を見直し、ガイドラインを再確認してください。'
};

const ResearchAlerts: React.FC<ResearchAlertsProps> = ({ metrics }) => {
    const alerts: string[] = [];

    if (metrics.roi_failed_rate > RESEARCH_THRESHOLDS.ROI_FAIL_ALERT) alerts.push('ROI_FAIL');
    if (metrics.blur_p10 < RESEARCH_THRESHOLDS.BLUR_MIN) alerts.push('BLUR_LOW');
    if (metrics.brightness_p10 < RESEARCH_THRESHOLDS.BRIGHTNESS_MIN) alerts.push('BRIGHTNESS_LOW');
    if (metrics.brightness_p90 > RESEARCH_THRESHOLDS.BRIGHTNESS_MAX) alerts.push('BRIGHTNESS_HIGH');
    if (metrics.hold_rate > RESEARCH_THRESHOLDS.HOLD_RATE_ALERT) alerts.push('HOLD_HIGH');

    if (alerts.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <h3 className="text-red-800 text-sm font-bold flex items-center gap-2 mb-2">
                <span>⚠️</span> 収集アクション推奨
            </h3>
            <ul className="list-disc list-inside text-red-700 text-xs space-y-1">
                {alerts.map(a => (
                    <li key={a}>{actionGuide[a]}</li>
                ))}
            </ul>
        </div>
    );
};

export default ResearchAlerts;
