import { isDevEnabled } from './devFlags';

export const DEBUG_MODE = typeof window !== 'undefined' ? isDevEnabled() : false;

export const DEBUG_KEYS = {
    LAST_REQUEST: 'debug:lastRequest',
    LAST_RESPONSE: 'debug:lastResponse',
    LAST_ERROR: 'debug:lastError'
};

export const saveDebugLog = (key: string, data: any) => {
    if (!DEBUG_MODE) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("DEBUG_MODE: Failed to save to localStorage", e);
    }
};

export const getDebugLog = (key: string) => {
    if (!DEBUG_MODE) return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

if (DEBUG_MODE) {
    console.warn("⚠ DEBUG MODE ACTIVE");
}
