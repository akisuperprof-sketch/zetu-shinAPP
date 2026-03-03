
import React, { useState, useCallback } from 'react';
import { FindingResult, RiskLevel } from '../types';
import { askAiAboutFinding } from '../services/geminiService';

interface FindingCardProps {
  finding: FindingResult;
}

const riskStyles: Record<RiskLevel, { bg: string; border: string; text: string; icon: string; }> = {
  [RiskLevel.Red]: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', icon: '🚨' },
  [RiskLevel.Yellow]: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', icon: '⚠️' },
  [RiskLevel.Green]: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', icon: '✅' },
};

const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const styles = riskStyles[finding.riskLevel];

  const handleAskAI = useCallback(async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAiResponse('');
    const response = await askAiAboutFinding(finding, question);
    setAiResponse(response);
    setIsLoading(false);
  }, [question, finding]);


  return (
    <div className={`p-5 rounded-2xl shadow-sm border-l-8 transition-all duration-300 ${styles.bg} ${styles.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-start">
        <div className="text-3xl mr-4 mb-2 sm:mb-0">{styles.icon}</div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${styles.text}`}>{finding.name}</h3>

          {/* AI Explanation Area */}
          {finding.aiExplanation && (
            <div className="mt-2 mb-3 p-3 bg-white/70 border border-current border-opacity-20 rounded-lg">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1">AI解析コメント</span>
              <p className="text-slate-900 text-sm font-medium leading-relaxed">
                {finding.aiExplanation}
              </p>
            </div>
          )}

          <p className="mt-1 text-slate-700">{finding.shortDescription}</p>
        </div>
      </div>

      <div className="mt-4 pl-0 sm:pl-11">
        <div className="bg-white/60 rounded-lg p-4 border border-slate-200">
          <p className="font-semibold text-slate-800">推奨アクション</p>
          <p className="text-blue-700 font-medium mt-1">{finding.recommendedAction}</p>
          <p className="text-xs text-slate-500 mt-2"><strong>理由：</strong>{finding.reason}</p>
        </div>
      </div>

      <div className="mt-4 pl-0 sm:pl-11">
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-brand-primary hover:underline">
          {isExpanded ? 'AIアシスタントを閉じる' : 'AIアシスタントに質問する ▼'}
        </button>
        {isExpanded && (
          <div className="mt-3 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in-fast">
            <p className="text-xs text-slate-500 mb-3">この所見についてAIに質問できます。これは医療相談ではありません。</p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`例：「${finding.name}」について、もっと詳しく教えてください。`}
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-brand-primary focus:border-brand-primary"
              rows={2}
            />
            <button
              onClick={handleAskAI}
              disabled={isLoading || !question.trim()}
              className="mt-2 w-full sm:w-auto bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:bg-slate-300 transition-opacity text-sm shadow-sm"
            >
              {isLoading ? '考え中...' : 'AIに質問する'}
            </button>

            {aiResponse && (
              <div className="mt-4 p-4 bg-white rounded-md border border-slate-200">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingCard;
