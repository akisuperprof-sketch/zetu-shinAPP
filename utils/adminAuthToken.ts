
const TOKEN_KEY = 'ZETUSHIN_ADMIN_TOKEN';

export const saveAdminToken = (token: string) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
};

export const getAdminToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
};

export const clearAdminToken = () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(TOKEN_KEY);
    }
};

export const isAdminAuthenticated = (): boolean => {
    return !!getAdminToken();
};
