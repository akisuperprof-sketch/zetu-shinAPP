
import React, { useState } from 'react';

interface DisclaimerScreenProps {
  onAgree: () => void;
}

const DisclaimerScreen: React.FC<DisclaimerScreenProps> = ({ onAgree }) => {
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [isResearchChecked, setIsResearchChecked] = useState(true);

  const handleAgree = () => {
    localStorage.setItem('RESEARCH_AGREED', isResearchChecked ? 'true' : 'false');
    onAgree();
  };

  return (
    <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-[0_40px_100px_rgba(31,58,95,0.05)] border border-slate-100 animate-fade-in max-w-3xl mx-auto font-noto relative overflow-hidden">

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-12 text-center">
        <img src="/assets/zetushin.png" alt="舌神" className="w-32 h-32 object-contain mb-8 drop-shadow-md" />
        <h2 className="text-3xl font-black text-[#1F3A5F] mb-3 tracking-tighter">舌神 -ZETUSHIN- <span className="text-sm font-bold text-slate-300 ml-2">ALPHA</span></h2>
        <p className="text-[13px] text-[#6FC3B2] font-black uppercase tracking-[0.4em]">今日のコンディション 観測ガイド</p>
      </div>

      {/* Mecha & Guide */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
          <h3 className="font-black text-[#1F3A5F] text-[14px] flex items-center tracking-widest uppercase">
            <span className="w-2 h-2 bg-[#6FC3B2] rounded-full mr-3"></span> Guide
          </h3>
          <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
            ガイドに従って舌の状態を記録して、日々の指標を観測しましょう。
          </p>
        </div>
        <div className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
          <h3 className="font-black text-[#1F3A5F] text-[14px] flex items-center tracking-widest uppercase">
            <span className="w-2 h-2 bg-[#6FC3B2] rounded-full mr-3"></span> Analysis
          </h3>
          <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
            AIが舌の特徴を抽出し、東洋医学的な傾向（虚実・寒熱）をマッピングします。
          </p>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="border-t border-slate-100 pt-12">
        <h3 className="font-black text-[#1F3A5F] mb-6 text-center text-sm uppercase tracking-widest">ご利用の前に（免責事項）</h3>
        <div className="bg-slate-50 p-6 rounded-2xl text-[12px] text-slate-400 border border-slate-100 mb-8 h-40 overflow-y-auto font-medium leading-relaxed">
          <p className="mb-4 font-black text-[#B84C3A]">※本アプリは医療診断を行うものではありません。</p>
          <p className="mb-4">このアプリケーションは、舌の画像から考えられる所見を提示し、一般的な健康情報の提供を目的とした「セルフコンディションチェックツール」です。</p>
          <p className="mb-4">医学的なアドバイス、診断、治療の代わりにはなりません。提示結果はあくまで参考情報です。</p>
          <p className="mb-4">健康に関して不安な点がある場合は、本アプリの結果に関わらず、必ず医師にご相談ください。</p>
          <p>緊急の場合は、直ちに救急医療機関に連絡してください。</p>
        </div>

        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-100 mb-8">
          <label htmlFor="research_agree" className="flex items-start gap-3 cursor-pointer">
            <input
              id="research_agree"
              type="checkbox"
              checked={isResearchChecked}
              onChange={() => setIsResearchChecked(!isResearchChecked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#6FC3B2] focus:ring-[#6FC3B2] cursor-pointer flex-shrink-0"
            />
            <span className="text-[12px] text-slate-600 leading-relaxed font-medium">
              研究協力のお願い：撮影した舌画像と回答は、個人が特定できない形に整えて東洋医学研究に活用します。
            </span>
          </label>
          <p className="text-[10px] text-slate-400 mt-2 ml-8">※同意しない場合でも、アプリの通常機能はそのままご利用いただけます。</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center group cursor-pointer">
            <input
              id="terms_agree"
              type="checkbox"
              checked={isTermsChecked}
              onChange={() => setIsTermsChecked(!isTermsChecked)}
              className="h-5 w-5 rounded border-slate-300 text-[#6FC3B2] focus:ring-[#6FC3B2] cursor-pointer"
            />
            <label htmlFor="terms_agree" className="ml-4 text-[13px] text-slate-600 cursor-pointer select-none font-bold">
              上記免責事項等の内容を理解し、同意します
            </label>
          </div>

          <button
            onClick={handleAgree}
            disabled={!isTermsChecked}
            className="w-full bg-[#1F3A5F] text-white font-black py-6 px-10 rounded-[2.5rem] hover:bg-[#162944] disabled:bg-slate-200 disabled:cursor-not-allowed transition-all duration-300 shadow-xl text-[15px] tracking-widest uppercase"
          >
            同意して観測を始める
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerScreen;
