import React from 'react';

interface AnalysisErrorDetails {
  requestId: string;
  code: string;
  message_public: string;
  stage?: string;
  retryable: boolean;
}

interface AnalysisScreenProps {
  error?: string | AnalysisErrorDetails | null;
  retryCount?: number;
  onRetry?: () => void;
  onBack?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ error, retryCount = 0, onRetry, onBack }) => {
  const isDetailedError = error && typeof error === 'object';
  const displayMessage = isDetailedError ? (error as any).message_public : (error as string);
  const requestId = isDetailedError ? (error as any).requestId : null;
  const errorCode = isDetailedError ? (error as any).code : 'UNKNOWN';
  const isMaxRetries = retryCount >= 3;

  if (error) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-16 h-16 flex items-center justify-center bg-red-50 text-red-500 rounded-full mb-6 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-slate-800 text-center mb-2">解析が中断されました</h2>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 w-full max-w-sm mb-6">
          <p className="text-red-700 text-sm text-center font-bold mb-1">
            {displayMessage}
          </p>
          {isMaxRetries && (
            <p className="text-[10px] text-red-600/70 text-center mt-1">最大試行回数を超えました。</p>
          )}
          {isDetailedError && (
            <div className="mt-3 pt-3 border-t border-red-200/50 flex flex-col items-center">
              <span className="text-[10px] font-mono text-red-400 bg-white px-2 py-0.5 rounded border border-red-100">
                CODE: {errorCode} {(error as any).stage ? `| STAGE: ${(error as any).stage}` : ''}
              </span>
              <button
                onClick={() => {
                  if (requestId) {
                    navigator.clipboard.writeText(requestId);
                    alert("Request ID copied: " + requestId);
                  }
                }}
                className="mt-2 text-[9px] font-mono text-slate-400 underline hover:text-slate-600 cursor-pointer"
              >
                ID: {requestId || 'N/A'} (Copy)
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full max-w-xs space-y-3">
          {!isMaxRetries ? (
            <button
              onClick={onRetry}
              className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              再試行する ({retryCount}/3)
            </button>
          ) : (
            <button
              onClick={() => window.open('mailto:support@example.com?subject=ZETUSHIN_Error_' + requestId)}
              className="w-full bg-slate-800 text-white font-black py-4 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              サポートに報告する
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-sm"
          >
            画像を撮り直す
          </button>
        </div>

        <p className="mt-8 text-[10px] text-slate-400 text-center leading-relaxed">
          {isMaxRetries ? "複数回失敗しました。ネットワーク状況を確認の上、改善しない場合は上記のIDを添えてお問い合わせください。" : "ネットワーク接続を確認し、問題が解決しない場合はRequestIdを添えてサポートへご連絡ください。"}
        </p>

      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      <h2 className="text-2xl font-bold text-brand-primary mt-6">AIが解析中です...</h2>
      <p className="text-slate-600 mt-2 text-center max-w-sm">
        アップロードされた画像を分析しています。結果が表示されるまで、しばらくお待ちください。
      </p>
    </div>
  );
};

export default AnalysisScreen;
