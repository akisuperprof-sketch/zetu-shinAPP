// TODO: Remove DEBUG_MODE features before production release
// 本番リリース前に必ず false に変更すること

export const DEBUG_MODE = true;

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
