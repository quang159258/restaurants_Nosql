import axios from "axios";
import NProgress from 'nprogress';
import { clearStoredAccessToken, getStoredAccessToken, updateStoredAccessToken } from "../utils/token";

NProgress.configure({
    showSpinner: false,
    trickleSpeed: 100,
});

const baseURL = import.meta.env.VITE_BACKEND_URL || "";

const instance = axios.create({
    baseURL,
    withCredentials: true,
});

const refreshClient = axios.create({
    baseURL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

const refreshAccessToken = async () => {
    const response = await refreshClient.get("/api/v1/auth/refresh");
    const data = response?.data ?? response;
    const payload = data?.data ?? data;
    const newAccessToken = payload?.access_token || payload?.accessToken || data?.access_token;
    if (!newAccessToken) {
        throw new Error("Không thể làm mới access token");
    }
    updateStoredAccessToken(newAccessToken);
    return newAccessToken;
};

instance.interceptors.request.use(
    (config) => {
        NProgress.start();
        const token = getStoredAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        NProgress.done();
        return Promise.reject(error);
    }
);

const unwrapResponse = (response) => {
    if (response?.data && response.data.data !== undefined) {
        return response.data;
    }
    return response;
};

instance.interceptors.response.use(
    (response) => {
        NProgress.done();
        return unwrapResponse(response);
    },
    (error) => {
        NProgress.done();
        const originalRequest = error.config || {};
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
                return Promise.reject(error.response?.data || error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise((resolve, reject) => {
                refreshAccessToken()
                    .then((newToken) => {
                        isRefreshing = false;
                        processQueue(null, newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(instance(originalRequest));
                    })
                    .catch((refreshError) => {
                        isRefreshing = false;
                        processQueue(refreshError, null);
                        clearStoredAccessToken();
                        reject(refreshError.response?.data || refreshError);
                    });
            });
        }

        return Promise.reject(error);
    }
);

export default instance;

