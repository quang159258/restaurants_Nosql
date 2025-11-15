const ACCESS_TOKEN_KEY = 'access_token';
const TOKEN_STORAGE_KEY = 'token_storage';

const getStoragePreference = () => {
    if (typeof window === "undefined") return null;
    if (window.localStorage.getItem(ACCESS_TOKEN_KEY)) return window.localStorage;
    if (window.sessionStorage.getItem(ACCESS_TOKEN_KEY)) return window.sessionStorage;
    const storageType = window.localStorage.getItem(TOKEN_STORAGE_KEY) === 'session'
        ? window.sessionStorage
        : window.localStorage;
    return storageType;
};

export const getStoredAccessToken = () => {
    if (typeof window === "undefined") return "";
    return (
        window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
        window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
        ""
    );
};

const dispatchTokenEvent = (token) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: { accessToken: token } }));
};

export const persistAccessToken = (token, remember = true) => {
    if (typeof window === "undefined") return;
    const primaryStorage = remember ? window.localStorage : window.sessionStorage;
    const secondaryStorage = remember ? window.sessionStorage : window.localStorage;
    primaryStorage.setItem(ACCESS_TOKEN_KEY, token);
    primaryStorage.setItem(TOKEN_STORAGE_KEY, remember ? 'local' : 'session');
    secondaryStorage.removeItem(ACCESS_TOKEN_KEY);
    secondaryStorage.removeItem(TOKEN_STORAGE_KEY);
    dispatchTokenEvent(token);
};

export const updateStoredAccessToken = (token) => {
    if (typeof window === "undefined") return;
    const storage = getStoragePreference() || window.localStorage;
    storage.setItem(ACCESS_TOKEN_KEY, token);
    if (!storage.getItem(TOKEN_STORAGE_KEY)) {
        storage.setItem(TOKEN_STORAGE_KEY, storage === window.localStorage ? 'local' : 'session');
    }
    dispatchTokenEvent(token);
};

export const clearStoredAccessToken = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    dispatchTokenEvent("");
};

