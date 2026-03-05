
import React, { useState } from 'react';
import { saveResearchConsent } from '../utils/userSession';

interface DisclaimerScreenProps {
  onAgree: () => void;
  nickname?: string;
}

const CONSENT_VERSION = 'v1.0';

const DisclaimerScreen: React.FC<DisclaimerScreenProps> = ({ onAgree, nickname }) => {
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [isResearchChecked, setIsResearchChecked] = useState(true);

  const handleAgree = () => {
    // 研究同意をバージョン+日時付きで保存
    saveResearchConsent(isResearchChecked, CONSENT_VERSION);
    onAgree();
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 animate-fade-in max-w-lg mx-auto font-noto">

      {/* Greeting */}
      {nickname && (
        <p className="text-center text-[#6FC3B2] font-bold text-sm mb-6 animate-fade-in">
          {nickname}さん、ご利用ありがとうございます
        </p>
      )}

      {/* Brand Header - Compact */}
      <div className="flex flex-col items-center mb-8 text-center">
        <img src="/assets/zetushin.png" alt="舌神" className="w-20 h-20 object-contain mb-4 drop-shadow-md" />
        <h2 className="text-xl font-black text-[#1F3A5F] mb-1">舌神 -ZETUSHIN- <span className="text-xs font-bold text-slate-300 ml-1">ALPHA</span></h2>
        <p className="text-[11px] text-[#6FC3B2] font-black uppercase tracking-[0.3em]">セルフコンディション 観測ガイド</p>
      </div>

      {/* Guide Cards - Compact */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
          <h3 className="font-black text-[#1F3A5F] text-[11px] flex items-center tracking-widest uppercase mb-1">
            <span className="w-1.5 h-1.5 bg-[#6FC3B2] rounded-full mr-2"></span>Guide
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">舌の状態を記録して日々の指標を観測</p>
        </div>
        <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
          <h3 className="font-black text-[#1F3A5F] text-[11px] flex items-center tracking-widest uppercase mb-1">
            <span className="w-1.5 h-1.5 bg-[#6FC3B2] rounded-full mr-2"></span>Analysis
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">AIが東洋医学的な傾向をマッピング</p>
        </div>
      </div>

      {/* Disclaimer - Compact */}
      <div className="border-t border-slate-100 pt-6">
        <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-400 border border-slate-100 mb-4 max-h-28 overflow-y-auto leading-relaxed">
          <p className="mb-2 font-black text-[#B84C3A]">※本アプリは医療診断を行うものではありません。</p>
          <p className="mb-2">このアプリケーションは、舌の画像から考えられる所見を提示し、一般的な健康情報の提供を目的とした「セルフコンディションチェックツール」です。</p>
          <p className="mb-2">医学的なアドバイス、診断、治療の代わりにはなりません。提示結果はあくまで参考情報です。</p>
          <p>健康に関して不安な点がある場合は、必ず医師にご相談ください。</p>
        </div>

        {/* Research Consent - Short */}
        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100 mb-4">
          <label htmlFor="research_agree" className="flex items-start gap-3 cursor-pointer">
            <input
              id="research_agree"
              type="checkbox"
              checked={isResearchChecked}
              onChange={() => setIsResearchChecked(!isResearchChecked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#6FC3B2] focus:ring-[#6FC3B2] cursor-pointer flex-shrink-0"
            />
            <span className="text-[11px] text-slate-600 leading-relaxed font-medium">
              研究協力のお願い：撮影した舌画像と回答は、個人が特定できない形に整えて東洋医学研究に活用します。
            </span>
          </label>
          <p className="text-[10px] text-slate-400 mt-1.5 ml-8">※同意しない場合でも、アプリの通常機能はそのままご利用いただけます。</p>
        </div>

        {/* Terms + Submit */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center group cursor-pointer">
            <input
              id="terms_agree"
              type="checkbox"
              checked={isTermsChecked}
              onChange={() => setIsTermsChecked(!isTermsChecked)}
              className="h-5 w-5 rounded border-slate-300 text-[#6FC3B2] focus:ring-[#6FC3B2] cursor-pointer"
            />
            <label htmlFor="terms_agree" className="ml-3 text-[12px] text-slate-600 cursor-pointer select-none font-bold">
              上記免責事項等の内容を理解し、同意します
            </label>
          </div>

          <button
            onClick={handleAgree}
            disabled={!isTermsChecked}
            className="w-full bg-[#1F3A5F] text-white font-black py-4 px-8 rounded-2xl hover:bg-[#162944] disabled:bg-slate-200 disabled:cursor-not-allowed transition-all duration-300 shadow-lg text-sm tracking-widest uppercase"
          >
            同意して観測を始める
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerScreen;
