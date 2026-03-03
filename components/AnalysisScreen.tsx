import React from 'react';

interface AnalysisScreenProps {
  error?: string | null;
  onRetry?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ error, onRetry }) => {
  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 flex items-center justify-center bg-red-100 text-red-500 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">解析に失敗しました</h2>
        <p className="text-red-600 text-center max-w-sm font-medium mb-6">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          再試行する
        </button>
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
