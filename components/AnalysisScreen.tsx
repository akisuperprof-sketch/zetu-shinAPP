import React, { useState, useEffect } from 'react';

interface AnalysisErrorDetails {
  requestId: string;
  code: string;
  message_public: string;
  stage?: string;
  retryable: boolean;
  status?: number;
  route?: string;
}

interface AnalysisScreenProps {
  error?: string | AnalysisErrorDetails | null;
  retryCount?: number;
  onRetry?: () => void;
  onBack?: () => void;
  onDevLocalCheck?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ error, retryCount = 0, onRetry, onBack, onDevLocalCheck }) => {
  const isDetailedError = error && typeof error === 'object';
  const displayMessage = isDetailedError ? (error as any).message_public : (error as string);
  const requestId = isDetailedError ? (error as any).requestId : null;
  const errorCode = isDetailedError ? (error as any).code : 'UNKNOWN';
  const status = isDetailedError ? (error as any).status : null;
  const route = isDetailedError ? (error as any).route : null;

  const isMaxRetries = retryCount >= 3;
  const isRateLimit = errorCode === 'RATE_LIMIT';

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (error && !isMaxRetries) {
      let waitTime = 0;
      if (isRateLimit) {
        // 429: 15秒 + 0〜5秒のジッター（Thundering Herd対策）
        waitTime = 15 + Math.floor(Math.random() * 6);
      } else {
        waitTime = retryCount === 0 ? 2 : retryCount === 1 ? 5 : 15;
      }
      setCountdown(waitTime);
    } else {
      setCountdown(null);
    }
  }, [error, isMaxRetries, isRateLimit, retryCount]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      if (onRetry) onRetry();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onRetry]);

  if (error) {
    if (isRateLimit && !isMaxRetries) {
      // 429専用エラー処理 UI
      return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center min-h-[450px]">
          <div className="w-16 h-16 flex items-center justify-center bg-orange-50 text-orange-500 rounded-full mb-6 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 text-center mb-2">現在アクセスが集中しています</h2>

          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 w-full max-w-sm mb-6">
            <p className="text-orange-700 text-sm text-center font-bold mb-1">
              診断AIサーバーが混雑しています。<br />少し待ってから自動再試行します。
            </p>
            {countdown !== null && (
              <p className="text-xl text-orange-600 text-center font-black mt-3 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></span>
                あと {countdown} 秒
              </p>
            )}
            <div className="mt-4 pt-3 border-t border-orange-200/50 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                status: {status || 429} | code: {errorCode}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                route: {route || '/api/analyze'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                sha: {(window as any).__BUILD_INFO__?.sha || 'unknown'}
              </span>
              <button
                onClick={() => {
                  if (requestId) {
                    navigator.clipboard.writeText(requestId);
                    alert("Request ID copied: " + requestId);
                  }
                }}
                className="mt-1 text-[9px] font-mono text-slate-400 underline hover:text-slate-600 cursor-pointer"
              >
                ID: {requestId || 'N/A'} (Copy)
              </button>
            </div>
          </div>

          <div className="flex flex-col w-full max-w-xs space-y-3">
            <button
              disabled
              className="w-full bg-slate-300 text-white font-black py-4 rounded-xl shadow-none cursor-not-allowed opacity-70"
            >
              再試行する ({retryCount}/3)
            </button>
            <button
              onClick={onBack}
              className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-sm"
            >
              画像を撮り直す
            </button>
            {onDevLocalCheck && (
              <button
                onClick={onDevLocalCheck}
                className="w-full mt-2 border-2 border-dashed border-slate-300 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-xs flex justify-center items-center gap-2"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                DEV LOCAL CHECKで進む
              </button>
            )}
          </div>
        </div>
      );
    }

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
          {!isMaxRetries && countdown !== null && countdown > 0 && (
            <p className="text-red-600 text-sm font-bold text-center mt-2 flex items-center justify-center gap-1">
              あと {countdown} 秒で再試行します...
            </p>
          )}
          {isDetailedError && (
            <div className="mt-3 pt-3 border-t border-red-200/50 flex flex-col items-center">
              <span className="text-[10px] font-mono text-red-400 bg-white px-2 py-0.5 rounded border border-red-100 mb-1">
                CODE: {errorCode} {(error as any).stage ? `| STAGE: ${(error as any).stage}` : ''}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                status: {status || 'N/A'} | route: {route || 'N/A'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mb-1">
                sha: {(window as any).__BUILD_INFO__?.sha || 'unknown'}
              </span>
              <button
                onClick={() => {
                  if (requestId) {
                    navigator.clipboard.writeText(requestId);
                    alert("Request ID copied: " + requestId);
                  }
                }}
                className="mt-1 text-[9px] font-mono text-slate-400 underline hover:text-slate-600 cursor-pointer"
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
              disabled={countdown !== null}
              className={`w-full font-black py-4 rounded-xl transition-all shadow-md ${countdown !== null ? 'bg-slate-300 text-white cursor-not-allowed opacity-70' : 'bg-red-600 text-white hover:opacity-90 active:scale-95'}`}
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
          {onDevLocalCheck && (
            <button
              onClick={onDevLocalCheck}
              className="w-full mt-2 border-2 border-dashed border-slate-300 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-xs flex justify-center items-center gap-2"
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              DEV LOCAL CHECKで進む
            </button>
          )}
        </div>
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
