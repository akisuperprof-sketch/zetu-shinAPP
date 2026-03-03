
import React, { useState } from 'react';

interface DisclaimerScreenProps {
  onAgree: () => void;
}

const DisclaimerScreen: React.FC<DisclaimerScreenProps> = ({ onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-primary mb-6 text-center">舌診アシスタントへようこそ</h2>

      {/* 使い方＆メカニズム */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 space-y-6 shadow-sm">
        <div>
          <h3 className="font-bold text-brand-primary mb-2 flex items-center">
            <span className="bg-brand-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 shadow-sm">1</span>
            使い方
          </h3>
          <p className="text-sm text-slate-600 ml-8 leading-relaxed">
            ガイドに従って舌の写真を撮影するだけで、AIが健康状態をチェックします。<br />
            正面写真1枚で手軽に診断する<strong>「シンプルモード」</strong>と、4方向から詳細に分析する<strong>「プロモード」</strong>を選べます。
          </p>
        </div>
        <div>
          <h3 className="font-bold text-brand-primary mb-2 flex items-center">
            <span className="bg-brand-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 shadow-sm">2</span>
            解析の仕組み
          </h3>
          <div className="ml-8 text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>
              本アプリは、高度な画像認識技術を活用しています。
            </p>
            <ul className="list-disc list-outside ml-4 space-y-1 text-slate-600">
              <li>中医学（東洋医学）の専門的な診断基準（舌診）を学習したAIが、撮影された舌の<strong>「色」「形」「大きさ」「苔（こけ）の状態」</strong>を詳細にスキャンします。</li>
              <li>解析された特徴を、30種類以上の舌の所見データベースと照合し、現在の体の状態やリスクを判定します。</li>
              <li>判定結果では、なぜその判断に至ったかの具体的な根拠も提示します。</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-bold text-brand-primary mb-4 text-center">ご利用の前に（免責事項）</h3>
        <div className="bg-white p-4 rounded-lg text-sm text-slate-600 border border-slate-200 mb-6 h-40 overflow-y-auto shadow-sm">
          <p className="mb-2 font-bold text-red-600">本アプリは医療診断を行うものではありません。</p>
          <p className="mb-2">このアプリケーションは、舌の画像から考えられる所見を提示し、一般的な健康情報を提供することを目的としています。</p>
          <p className="mb-2">医学的なアドバイス、診断、治療の代わりにはなりません。提示される結果はあくまで参考情報です。</p>
          <p className="mb-2">健康に関して不安な点や自覚症状がある場合は、本アプリの結果に関わらず、必ず医師や歯科医師などの医療専門家にご相談ください。</p>
          <p>緊急の場合は、直ちに救急医療機関に連絡してください。</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center">
            <input
              id="agree"
              type="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
            />
            <label htmlFor="agree" className="ml-3 text-sm text-slate-700 cursor-pointer select-none">
              上記の内容を理解し、同意します
            </label>
          </div>

          {/* Research Mode Toggle (DEV ONLY) */}
          {import.meta.env.DEV && localStorage.getItem('IS_RESEARCH_MODE') === 'true' && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 w-full max-w-sm">
              <div className="flex items-center">
                <input
                  id="research-agreed"
                  type="checkbox"
                  defaultChecked={localStorage.getItem('RESEARCH_AGREED') === 'true' || localStorage.getItem('IS_RESEARCH_MODE') === 'true'}
                  onChange={(e) => {
                    localStorage.setItem('RESEARCH_AGREED', e.target.checked ? 'true' : 'false');
                    localStorage.setItem('IS_RESEARCH_MODE', 'true'); // Flag to indicate we want to log
                  }}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="research-agreed" className="ml-3 text-xs text-blue-800 cursor-pointer select-none font-black flex items-center">
                  🧪 研究モード (任意)
                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] uppercase">Dev Only</span>
                </label>
              </div>
              <p className="text-[10px] text-blue-600/70 mt-1 ml-7">
                解析結果を匿名ログとしてSupabaseに保存します。研究目的のデータ蓄積にご協力ください。
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onAgree}
          disabled={!isChecked}
          className="mt-6 w-full bg-brand-primary text-white font-bold py-4 px-6 rounded-2xl hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
        >
          同意して診断を始める
        </button>
      </div>
    </div>
  );
};

export default DisclaimerScreen;
