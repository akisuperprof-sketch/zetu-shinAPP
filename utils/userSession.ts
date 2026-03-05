/**
 * ユーザーセッション管理（L1ログイン — localStorage）
 * 
 * Supabase Auth本格移行までの暫定実装。
 * 将来はSupabase profiles テーブルに移行可能な設計。
 */

const KEY_ANON_ID = 'ZETUSHIN_ANON_ID';
const KEY_NICKNAME = 'ZETUSHIN_NICKNAME';
const KEY_ROLE = 'ZETUSHIN_ROLE';
const KEY_RESEARCH_AGREED = 'RESEARCH_AGREED';
const KEY_RESEARCH_VERSION = 'RESEARCH_CONSENT_VERSION';
const KEY_RESEARCH_DATE = 'RESEARCH_CONSENT_DATE';
const KEY_CREATED_AT = 'ZETUSHIN_SESSION_CREATED';

export type UserRole = 'student' | 'staff' | 'general';

export interface UserSession {
    anonId: string;
    nickname: string;
    role: UserRole;
    createdAt: string;
    researchAgreed: boolean;
    researchConsentVersion: string | null;
    researchConsentDate: string | null;
}

/** 匿名ID生成（UUID v4互換） */
const generateAnonId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
};

/** セッションが存在するか */
export const hasSession = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(KEY_NICKNAME);
};

/** セッション取得 */
export const getSession = (): UserSession | null => {
    if (typeof window === 'undefined') return null;
    const nickname = localStorage.getItem(KEY_NICKNAME);
    if (!nickname) return null;
    return {
        anonId: localStorage.getItem(KEY_ANON_ID) || '',
        nickname,
        role: (localStorage.getItem(KEY_ROLE) as UserRole) || 'general',
        createdAt: localStorage.getItem(KEY_CREATED_AT) || '',
        researchAgreed: localStorage.getItem(KEY_RESEARCH_AGREED) === 'true',
        researchConsentVersion: localStorage.getItem(KEY_RESEARCH_VERSION),
        researchConsentDate: localStorage.getItem(KEY_RESEARCH_DATE),
    };
};

/** セッション作成（初回ニックネーム設定） */
export const createSession = (nickname: string, role: UserRole): UserSession => {
    const anonId = localStorage.getItem(KEY_ANON_ID) || generateAnonId();
    const now = new Date().toISOString();
    localStorage.setItem(KEY_ANON_ID, anonId);
    localStorage.setItem(KEY_NICKNAME, nickname);
    localStorage.setItem(KEY_ROLE, role);
    localStorage.setItem(KEY_CREATED_AT, now);
    return {
        anonId,
        nickname,
        role,
        createdAt: now,
        researchAgreed: false,
        researchConsentVersion: null,
        researchConsentDate: null,
    };
};

/** ニックネーム更新 */
export const updateNickname = (nickname: string): void => {
    localStorage.setItem(KEY_NICKNAME, nickname);
};

/** 研究同意を保存（バージョン追跡付き） */
export const saveResearchConsent = (agreed: boolean, version: string = 'v1.0'): void => {
    localStorage.setItem(KEY_RESEARCH_AGREED, agreed ? 'true' : 'false');
    if (agreed) {
        localStorage.setItem(KEY_RESEARCH_VERSION, version);
        localStorage.setItem(KEY_RESEARCH_DATE, new Date().toISOString());
    }
};

/** 挨拶文を生成 */
export const getGreeting = (): string => {
    const session = getSession();
    if (!session) return 'ようこそ';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'こんばんは';
    return `${session.nickname}さん、${timeGreeting}`;
};

/** セッション削除（ログアウト） */
export const clearSession = (): void => {
    localStorage.removeItem(KEY_NICKNAME);
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_CREATED_AT);
    // anonIdとresearch consentは保持（再ログインで紐付け可能にするため）
};
