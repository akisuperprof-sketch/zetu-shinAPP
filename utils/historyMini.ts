/**
 * z26_history_mini_v1 localStorage interface
 * Used for maintaining a lightweight local history for continuous engagement
 */

export interface HistoryMiniEntry {
    ts: string;
    score: number;
    typeId?: string;
    typeLabel?: string;
    top1PatternId?: string;
    quality_flag?: boolean;
}

const HISTORY_KEY = 'z26_history_mini_v1';
const MAX_HISTORY = 3;

export const pushHistoryMini = (entry: Omit<HistoryMiniEntry, 'ts'>) => {
    try {
        const history = getHistoryMini();
        const newEntry: HistoryMiniEntry = {
            ...entry,
            ts: new Date().toISOString()
        };
        history.unshift(newEntry);

        // Keep max length
        if (history.length > MAX_HISTORY) {
            history.pop();
        }

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Failed to push history_mini', e);
    }
};

export const getHistoryMini = (): HistoryMiniEntry[] => {
    try {
        const str = localStorage.getItem(HISTORY_KEY);
        if (str) {
            return JSON.parse(str) as HistoryMiniEntry[];
        }
    } catch (e) {
        console.warn('Failed to parse history_mini', e);
    }
    return [];
};

export const getDelta = (currentScore: number, prevScore: number): '↑' | '↓' | '→' => {
    const diff = currentScore - prevScore;
    if (diff > 2) return '↑';     // meaningful improvement
    if (diff < -2) return '↓';    // meaningful decline
    return '→';                   // almost same
};
