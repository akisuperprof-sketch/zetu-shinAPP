/**
 * SSoT: Anonymous User ID handling for Research Mode.
 * Ensures the ID persists locally but does not tie to PII.
 */

const ANON_USER_KEY = 'z26_anon_uid';

const generateUUID = () => {
    // simplified uuid v4 generator for browser compat
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const getAnonymousUserId = (): string => {
    if (typeof window === 'undefined') return 'server-rendered';
    try {
        let uid = window.localStorage.getItem(ANON_USER_KEY);
        if (!uid) {
            uid = generateUUID();
            window.localStorage.setItem(ANON_USER_KEY, uid);
        }
        return uid;
    } catch {
        return 'generate_error_fallback';
    }
};
