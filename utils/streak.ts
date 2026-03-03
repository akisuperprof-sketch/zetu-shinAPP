
/**
 * 継続日数（ストリーク）管理ユーティリティ
 */

const STORAGE_KEYS = {
    LAST_DATE: 'z26_last_done_date',
    STREAK_DAYS: 'z26_streak_days',
    TOTAL_DAYS: 'z26_total_days',
    VERSION: 'z26_streak_version'
};

const FEATURE_FLAG = 'FF_STREAK_V1';

export interface StreakData {
    active: boolean;
    streakDays: number;
    totalDays: number;
    lastDate: string | null;
    justUpdated: boolean;
}

/**
 * 現在のストリーク状態を取得する（更新はしない）
 */
export function getStreakData(): StreakData {
    if (typeof window === 'undefined') {
        return { active: false, streakDays: 0, totalDays: 0, lastDate: null, justUpdated: false };
    }

    const active = localStorage.getItem(FEATURE_FLAG) === '1';
    const streakDays = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK_DAYS) || '0', 10);
    const totalDays = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_DAYS) || '0', 10);
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);

    return { active, streakDays, totalDays, lastDate, justUpdated: false };
}

/**
 * 診断完了時にストリークを更新する
 */
export function updateStreak(): StreakData {
    const data = getStreakData();
    if (!data.active) return data;

    const now = new Date();
    const today = formatDate(now);

    // 同日複数回はカウントしない
    if (data.lastDate === today) {
        return { ...data, justUpdated: false };
    }

    const yesterday = formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    let newStreak = 1;
    let newTotal = data.totalDays + 1;

    if (data.lastDate === yesterday) {
        newStreak = data.streakDays + 1;
    }

    // 保存
    localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
    localStorage.setItem(STORAGE_KEYS.STREAK_DAYS, newStreak.toString());
    localStorage.setItem(STORAGE_KEYS.TOTAL_DAYS, newTotal.toString());
    localStorage.setItem(STORAGE_KEYS.VERSION, 'v1');

    return {
        active: true,
        streakDays: newStreak,
        totalDays: newTotal,
        lastDate: today,
        justUpdated: true
    };
}

/**
 * 日付を YYYY-MM-DD 形式に変換
 */
function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * ストリークに応じたお祝いメッセージを取得
 */
export function getCelebrateMessage(streakDays: number): string | null {
    if (streakDays === 3) return '3日連続ですね！素晴らしい継続力です。';
    if (streakDays === 7) return '1週間継続おめでとうございます！習慣化できていますね。';
    if (streakDays === 30) return '1ヶ月継続達成！もはや生活の一部ですね。';
    return null;
}
