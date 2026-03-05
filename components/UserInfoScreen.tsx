import React, { useState, useEffect } from 'react';
import { UserInfo, Gender } from '../types';
import { getLastUserInfo } from '../services/historyService';
import { isDevEnabled, getSelectedPlan } from '../utils/devFlags';
import { getSession } from '../utils/userSession';
import liteQuestions from '../config/questionnaires/lite.json';

interface UserInfoScreenProps {
  onNext: (info: UserInfo) => void;
}

const UserInfoScreen: React.FC<UserInfoScreenProps> = ({ onNext }) => {
  const [age, setAge] = useState<number | ''>('');
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [concerns, setConcerns] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extraAnswers, setExtraAnswers] = useState<Record<string, any>>({
    q3: 50, // Default for ranges
    q4: 50,
    q5: 50,
    q6: "安定している"
  });

  const devEnabled = isDevEnabled();
  const activePlan = getSelectedPlan();

  useEffect(() => {
    getLastUserInfo().then(info => {
      if (info) {
        setAge(info.age);
        setGender(info.gender);
        setHeight(info.height);
        setWeight(info.weight);
        setConcerns(info.concerns);
        if (info.age_range) setAgeRange(info.age_range);
        if (info.answers) setExtraAnswers(info.answers);
      }
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (age === '' && !ageRange) newErrors.age = '年齢を入力してください';
    if (!gender) newErrors.gender = '性別を選択してください';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext({
        age,
        gender,
        height,
        weight,
        concerns,
        age_range: ageRange || undefined,
        answers: extraAnswers
      });
    }
  };

  // 開発モード用：追加質問のレンダリング
  const renderDevQuestions = () => {
    if (!devEnabled || activePlan === 'legacy') return null;

    // q1, q2 は既存フィールド（年齢・性別）なので除外
    const questions = liteQuestions.filter(q => q.id !== 'q1' && q.id !== 'q2');

    return (
      <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
        <h3 className="text-orange-700 font-bold mb-4 flex items-center">
          <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full mr-2">DEV</span>
          Liteプラン 追加ヒアリング
        </h3>
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id}>
              <label className="block text-sm font-bold text-slate-700 mb-1">{q.text}</label>
              {q.type === 'range' && (
                <div className="flex flex-col">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={extraAnswers[q.id] || 50}
                    onChange={(e) => setExtraAnswers({ ...extraAnswers, [q.id]: e.target.value })}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{q.minLabel}</span>
                    <span>{q.maxLabel}</span>
                  </div>
                </div>
              )}
              {q.type === 'select' && (
                <select
                  value={extraAnswers[q.id]}
                  onChange={(e) => setExtraAnswers({ ...extraAnswers, [q.id]: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                >
                  {q.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const GenderButton: React.FC<{ value: Gender }> = ({ value }) => (
    <button
      onClick={() => setGender(value)}
      className={`px-4 py-2 rounded-md font-medium border transition-colors ${gender === value
        ? 'bg-brand-primary text-white border-brand-primary'
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
    >
      {value}
    </button>
  );

  const AGE_RANGES = [
    { label: '9歳以下', code: 'U09' },
    { label: '10-14歳', code: '10_14' },
    { label: '15-19歳', code: '15_19' },
    { label: '20-24歳', code: '20_24' },
    { label: '25-29歳', code: '25_29' },
    { label: '30-34歳', code: '30_34' },
    { label: '35-39歳', code: '35_39' },
    { label: '40-44歳', code: '40_44' },
    { label: '45-49歳', code: '45_49' },
    { label: '50-54歳', code: '50_54' },
    { label: '55-59歳', code: '55_59' },
    { label: '60-64歳', code: '60_64' },
    { label: '65-69歳', code: '65_69' },
    { label: '70歳以上', code: '70P' },
    { label: '回答しない', code: 'NA' },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-4 text-center">{getSession()?.nickname ? `${getSession()!.nickname}さんの` : ''}基本情報の入力</h2>

      {/* バリデーションエラーのサマリー（1画面で見える位置に） */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{Object.values(errors).join(' / ')}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Row 1: 年齢（ドロップダウン）＋ 詳細年齢 ＋ 性別 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 年齢セレクト */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              年齢 <span className="text-red-500">*</span>
            </label>
            <select
              value={ageRange || ''}
              onChange={(e) => {
                const code = e.target.value;
                setAgeRange(code || null);
                if (code === 'NA') setAge('');
              }}
              className={`w-full p-2.5 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all appearance-none bg-white ${errors.age ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
            >
              <option value="">年齢を選択</option>
              {AGE_RANGES.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* 性別 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              性別 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <GenderButton value={Gender.Male} />
              <GenderButton value={Gender.Female} />
            </div>
          </div>
        </div>

        {/* Row 2: 詳細年齢（任意）は小さく1行で */}
        <div>
          <input
            type="tel"
            name="age"
            value={age}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) {
                setAge(val === '' ? '' : Number(val));
                const n = Number(val);
                if (val !== '') {
                  if (n <= 9) setAgeRange('U09');
                  else if (n <= 14) setAgeRange('10_14');
                  else if (n <= 19) setAgeRange('15_19');
                  else if (n <= 24) setAgeRange('20_24');
                  else if (n <= 29) setAgeRange('25_29');
                  else if (n <= 34) setAgeRange('30_34');
                  else if (n <= 39) setAgeRange('35_39');
                  else if (n <= 44) setAgeRange('40_44');
                  else if (n <= 49) setAgeRange('45_49');
                  else if (n <= 54) setAgeRange('50_54');
                  else if (n <= 59) setAgeRange('55_59');
                  else if (n <= 64) setAgeRange('60_64');
                  else if (n <= 69) setAgeRange('65_69');
                  else setAgeRange('70P');
                }
              }
            }}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            placeholder="詳細年齢を入力（任意）"
          />
        </div>

        {/* Row 3: 身長 + 体重 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">身長 (cm)</label>
            <input
              type="tel"
              name="height"
              value={height}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) setHeight(val === '' ? '' : Number(val));
              }}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              placeholder="例: 170"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">体重 (kg)</label>
            <input
              type="tel"
              name="weight"
              value={weight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) setWeight(val === '' ? '' : Number(val));
              }}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              placeholder="例: 60"
            />
          </div>
        </div>

        {/* Row 4: 症状メモ（コンパクト） */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">最近気になる症状など（任意）</label>
          <textarea
            name="concerns"
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
            rows={2}
            placeholder="例：最近疲れやすい、口が乾く、など"
          />
        </div>

        {renderDevQuestions()}

        {/* 次へ進むボタン */}
        <button
          onClick={handleSubmit}
          className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
        >
          次へ進む
        </button>
      </div>
    </div>
  );
};

export default UserInfoScreen;
