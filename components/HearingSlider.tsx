import React from 'react';

interface Question {
  id: string;
  text: string;
}

const scale = [
  { label: "なし", value: 0 },
  { label: "あり", value: 1 },
  { label: "とてもあり", value: 2 },
  { label: "わからない", value: 3 }
];

export const HEARING_QUESTIONS: Question[] = [
  { id: "Q01", text: "すぐ疲れる" },
  { id: "Q02", text: "息切れしやすい／声が小さい" },
  { id: "Q03", text: "症状が慢性的に続く" },
  { id: "Q04", text: "寝ても回復しにくい" },
  { id: "Q05", text: "下垂や漏れがある（尿漏れ・脱肛感など）" },
  { id: "Q06", text: "症状が急に強く出る" },
  { id: "Q07", text: "張りや圧迫感が強い" },
  { id: "Q08", text: "分泌物が多い（痰・鼻水・帯下など）" },
  { id: "Q09", text: "口臭や便臭が強い" },
  { id: "Q10", text: "イライラが強く爆発しやすい" },
  { id: "Q11", text: "冷えやすい" },
  { id: "Q12", text: "温めると楽になる" },
  { id: "Q13", text: "冷たい飲食で悪化する" },
  { id: "Q14", text: "のぼせやすい／顔が赤くなる" },
  { id: "Q15", text: "口が渇く／冷たい物が欲しい" },
  { id: "Q16", text: "便や尿が濃い／熱い感じがある" },
  { id: "Q17", text: "重だるい／むくみやすい" },
  { id: "Q18", text: "雨や湿気で悪化しやすい" },
  { id: "Q19", text: "乾燥が気になる（喉・皮膚・便が硬いなど）" },
  { id: "Q20", text: "寝汗が出る／ほてりがある" }
];

export interface HearingSliderProps {
  question: Question;
  value: number | undefined;
  onChange: (id: string, value: number) => void;
}

export const HearingSlider: React.FC<HearingSliderProps> = ({ question, value, onChange }) => {
  return (
    <div className="mb-6 p-6 bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group">
      <p className="text-base font-extrabold text-slate-800 mb-6 flex items-center gap-3">
        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full group-hover:scale-150 transition-transform"></span>
        {question.text}
      </p>
      <div className="flex gap-2.5">
        {scale.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => onChange(question.id, opt.value)}
              className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all duration-300 ${isSelected
                ? 'bg-slate-900 text-white shadow-[0_10px_25px_rgba(15,23,42,0.2)] ring-2 ring-slate-900/10 scale-[1.02]'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100 hover:border-slate-200'
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
