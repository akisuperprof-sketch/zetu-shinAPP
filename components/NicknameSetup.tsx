import React, { useState } from 'react';
import { createSession, UserRole } from '../utils/userSession';

interface NicknameSetupProps {
    onComplete: () => void;
}

const NicknameSetup: React.FC<NicknameSetupProps> = ({ onComplete }) => {
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState<UserRole>('general');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const trimmed = nickname.trim();
        if (!trimmed) {
            setError('ニックネームを入力してください');
            return;
        }
        if (trimmed.length > 20) {
            setError('20文字以内で入力してください');
            return;
        }
        createSession(trimmed, role);
        onComplete();
    };

    const roles: { value: UserRole; label: string; icon: string }[] = [
        { value: 'student', label: '学生', icon: '🎓' },
        { value: 'staff', label: '教職員・医療従事者', icon: '🏥' },
        { value: 'general', label: '一般ユーザー', icon: '👤' },
    ];

    return (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 animate-fade-in max-w-md mx-auto font-noto">
            {/* Header */}
            <div className="text-center mb-8">
                <img src="/assets/zetushin.png" alt="舌神" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-md" />
                <h2 className="text-2xl font-black text-[#1F3A5F] mb-2">はじめまして！</h2>
                <p className="text-sm text-slate-500">あなたのことを教えてください</p>
            </div>

            {/* Nickname Input */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    ニックネーム <span className="text-[#B84C3A] text-xs">*必須</span>
                </label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value);
                        setError('');
                    }}
                    placeholder="例: あき"
                    maxLength={20}
                    autoFocus
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-bold text-[#1F3A5F] placeholder-slate-300 focus:border-[#6FC3B2] focus:ring-2 focus:ring-[#6FC3B2]/20 outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {error && <p className="text-[#B84C3A] text-xs mt-2 font-bold">{error}</p>}
                {nickname.trim() && (
                    <p className="text-[#6FC3B2] text-sm mt-2 font-bold animate-fade-in">
                        → {nickname.trim()}さんとしてご利用いただけます
                    </p>
                )}
            </div>

            {/* Role Selection */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    ご利用区分
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {roles.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRole(r.value)}
                            className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all text-left ${role === r.value
                                    ? 'border-[#6FC3B2] bg-[#6FC3B2]/5 shadow-sm'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <span className="mr-3 text-xl">{r.icon}</span>
                            <span className={`text-sm font-bold ${role === r.value ? 'text-[#1F3A5F]' : 'text-slate-600'}`}>
                                {r.label}
                            </span>
                            {role === r.value && (
                                <span className="ml-auto text-[#6FC3B2] text-xl">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!nickname.trim()}
                className="w-full bg-[#1F3A5F] text-white font-black py-4 px-6 rounded-2xl hover:bg-[#162944] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg text-base tracking-wider"
            >
                はじめる
            </button>

            <p className="text-center text-[10px] text-slate-400 mt-4">
                ニックネームは後から設定画面で変更できます
            </p>
        </div>
    );
};

export default NicknameSetup;
