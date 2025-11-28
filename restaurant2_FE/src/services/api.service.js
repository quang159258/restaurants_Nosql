import axios from './axios.customize';

const API_PREFIX = "/api/v1";
const AUTH_BASE = `${API_PREFIX}/auth`;
const USER_BASE = "/users";
const DISH_BASE = "/dish";
const CATEGORY_BASE = "/category";
const CART_BASE = "/cart";
const ORDER_BASE = "/orders";
const ANALYTICS_BASE = `${API_PREFIX}/analytics`;
const INVENTORY_BASE = `${API_PREFIX}/inventory`;
const PERMISSION_BASE = "/permissions";
const ROLE_BASE = "/roles";
const PAYMENT_BASE = "/api/payment";

const buildPaginationParams = (page = 1, size = 10) => {
    const safePage = Number(page) || 1;
    const safeSize = Number(size) || 10;
    return `page=${safePage}&size=${safeSize}`;
};

const normalizeImageName = (fileName) => {
    if (!fileName) return "";
    let trimmed = fileName.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0];
            }
        } catch (error) {
            const inner = trimmed.slice(1, trimmed.length - 1);
            const parts = inner.split(",");
            if (parts.length > 0) {
                trimmed = parts[0];
            }
        }
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        trimmed = trimmed.slice(1, -1);
    }
    return trimmed;
};

const createUserApi = (payload) => {
    return axios.post(`${AUTH_BASE}/register`, payload);
};

const updateUserApi = (id, username, gender, phone, address) => {
    const data = {
        id,
        username,
        gender,
        phone,
        address
    };

    return axios.put(`${USER_BASE}`, data);
};
const fetchAllUserAPI = (current, pageSize) => {
    const query = buildPaginationParams(current, pageSize);
    return axios.get(`${USER_BASE}?${query}`);
};

const deleteUserAPI = (id) => {
    return axios.delete(`${USER_BASE}/${id}`);
};

const handleUploadFile = (file) => {

    const URL_BACKEND = "/files";
    let config = {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }

    const bodyFormData = new FormData();
    bodyFormData.append("files", file); // key phải là 'files', đúng với @RequestPart("files")
    return axios.post(URL_BACKEND, bodyFormData, config);
}



const updateUserAvatarApi = (avatar, _id, fullName, phone) => {

    const URL_BACKEND = "/api/v1/user";
    const data = {
        _id: _id,
        avatar: avatar,
        fullName: fullName,
        phone: phone,
    }
    return axios.put(URL_BACKEND, data)
}

const registerUserApi = (fullName, email, password, phone, address) => {
    return createUserApi({
        username: fullName,
        password,
        email,
        phone,
        address,
    });
};


const loginApi = (username, password) => {

    const data = {
        username,
        password,

    }
    return axios.post(`${AUTH_BASE}/login`, data);
};


const getAccountAPI = () => {
    return axios.get(`${AUTH_BASE}/account`);
};

const logoutAPI = () => {
    return axios.post(`${AUTH_BASE}/logout`);
};

const logoutAllSessionsAPI = () => {
    return axios.post(`${AUTH_BASE}/logout-all`);
};

const getSessionsAPI = () => {
    return axios.get(`${AUTH_BASE}/sessions`);
};

const logoutSessionAPI = (sessionId) => {
    return axios.delete(`${AUTH_BASE}/sessions/${sessionId}`);
};

// Admin APIs for managing user sessions
const getAdminUserSessionsAPI = (userId) => {
    return axios.get(`/admin/users/${userId}/sessions`);
};

const logoutAdminUserSessionAPI = (userId, sessionId) => {
    return axios.delete(`/admin/users/${userId}/sessions/${sessionId}`);
};

const logoutAllAdminUserSessionsAPI = (userId) => {
    return axios.delete(`/admin/users/${userId}/sessions`);
};

const fetchAllDish = (page, size, type) => {

    let URL_BACKEND = `${DISH_BASE}?${buildPaginationParams(page, size)}`;
    
    console.log('Fetch dishes URL:', URL_BACKEND, 'type:', type);
    return axios.get(URL_BACKEND);
};

const fetchAllDishByName = (page, size, Name) => {

    const url = `${DISH_BASE}?${buildPaginationParams(page, size)}&filter=name~'${Name}'`;
    return axios.get(url);
}

const adDishInCart = (quantity, price, total, DishID) => {
    const URL_BACKEND = `${CART_BASE}/add-dish`;
    const data = {
        quantity,
        price,
        total,
        dish: {
            id: DishID
        }

    }
    return axios.post(URL_BACKEND, data)
}


const getCart = () => {
    return axios.get(`${CART_BASE}`);
};

const getAllDishInCart = () => {
    return axios.get(`${CART_BASE}/get-all-dish`);
};

const updateQuantity = (id, quantity) => {
    const URL_BACKEND = `${CART_BASE}/update-dish`;
    const data = {
        id,
        quantity,
    }
    return axios.put(URL_BACKEND, data)
}

const deleteDishInCart = (id) => {
    const URL_BACKEND = `${CART_BASE}/delete-dish/${id}`;
    return axios.delete(URL_BACKEND);
};

const checkOutCart = (receiverName, receiverPhone, receiverAddress, receiverEmail, paymentMethod) => {
    const URL_BACKEND = `${CART_BASE}/checkout`;
    const data = {
        receiverName,
        receiverPhone,
        receiverAddress,
        receiverEmail,
        paymentMethod
    }
    return axios.post(URL_BACKEND, data)
}


const fetchMyOrder = () => {
    return axios.get(`${ORDER_BASE}/my`);
};


const fetchAllOrders = (page, size) => {

    const URL_BACKEND = `${ORDER_BASE}/all?${buildPaginationParams(page, size)}`;
    return axios.get(URL_BACKEND);
};

const fetchAllOrdersMy = (page, size) => {

    const URL_BACKEND = `${ORDER_BASE}/my?${buildPaginationParams(page, size)}`;
    return axios.get(URL_BACKEND);
};

const createOrderByAdmin = (payload) => {
    return axios.post(`${ORDER_BASE}/admin`, payload);
};

const updateOrder = async (id, status) => {
    const URL_BACKEND = `${ORDER_BASE}/status/${id}?status=${status}`;
    return axios.put(URL_BACKEND);
};


const updateDish = async (dishData) => {
    const URL_BACKEND = `${DISH_BASE}`;
    const data = {
        id: dishData.id,
        name: dishData.name,
        description: dishData.description,
        price: dishData.price,
        imageUrl: dishData.imageUrl,
        stock: dishData.stock || 0,
        category: {
            id: dishData.categoryId
        }

    }
    return axios.put(URL_BACKEND, data);
};


const deleteDish = (id) => {
    const URL_BACKEND = `${DISH_BASE}/${id}`;
    return axios.delete(URL_BACKEND);
};

const addDish = (dishData) => {
    const URL_BACKEND = `${DISH_BASE}`;

    if (!dishData.categoryId) {
        throw new Error("Category ID is required");
    }
    
    const data = {
        name: dishData.name,
        description: dishData.description,
        price: dishData.price,
        imageUrl: dishData.image,
        stock: dishData.stock || 0,
        category: {
            id: dishData.categoryId
        }
    }
    return axios.post(URL_BACKEND, data);
}

const resolveBackendBaseUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== "") {
        return import.meta.env.VITE_BACKEND_URL.trim();
    }
    if (typeof window !== "undefined" && window.__APP_BACKEND_URL__) {
        return window.__APP_BACKEND_URL__;
    }
    return "http://localhost:8081";
};

const buildImageUrl = (fileName) => {
    const normalized = normalizeImageName(fileName);
    if (!normalized) return "";
    if (normalized.startsWith("http")) {
        return normalized;
    }
    const baseUrl = resolveBackendBaseUrl();
    const normalizedBase = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
    // Backend có static resource handler cho /storage/** và endpoint /images/{fileName}
    // Ưu tiên dùng /storage/ vì đó là static resource handler
    const normalizedPath = normalized.startsWith("/storage") || normalized.startsWith("/images") || normalized.startsWith("/files")
        ? normalized
        : `/storage/${normalized}`;
    const cleanedPath = normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`;
    return `${normalizedBase}${cleanedPath}`;
};

const getImageUrl = async (fileName) => {
    return buildImageUrl(fileName);
};

// Utility function để xử lý image URL
const getImageUrlFromFileName = (fileName) => {
    return buildImageUrl(fileName);
};



const fetchAllUser = (page, size) => {
    return fetchAllUserAPI(page, size);
};

const fetchAllOrderById = (page, size, id) => {
    const url = `${ORDER_BASE}/all?${buildPaginationParams(page, size)}&filter=id==${id}`;
    return axios.get(url);
};

const loginWithGoogle = (apiGoogle) => {
    return axios.post(apiGoogle);
}

const changePassword = ({ currentPassword, newPassword }) => {
    return axios.put(`${AUTH_BASE}/change-password`, { currentPassword, newPassword });
};

const getVnpayConfig = () => {
    return axios.get(`${PAYMENT_BASE}/vnpay/config`);
};

const createVnpayPaymentLink = (orderId) => {
    return axios.post(`${PAYMENT_BASE}/vnpay/order/${orderId}`);
};

const getAnalyticsOverview = (params = {}) => {
    const query = new URLSearchParams();
    const { startDate, endDate, topLimit } = params;

    if (startDate) {
        query.append("startDate", startDate);
    }
    if (endDate) {
        query.append("endDate", endDate);
    }
    if (topLimit !== undefined && topLimit !== null) {
        query.append("topLimit", topLimit);
    }

    const queryString = query.toString();
    const url = `${ANALYTICS_BASE}/overview${queryString ? `?${queryString}` : ""}`;
    return axios.get(url);
};

// Simple Payment APIs
const confirmCashPayment = (orderId) => {
    const URL_BACKEND = `${PAYMENT_BASE}/cash/confirm/${orderId}`;
    return axios.post(URL_BACKEND);
};

const getOrderInfo = (orderId) => {
    const URL_BACKEND = `${PAYMENT_BASE}/order/${orderId}`;
    return axios.get(URL_BACKEND);
};

// Category CRUD Operations
const fetchAllCategories = () => {
    return axios.get(`${CATEGORY_BASE}`);
};

const fetchCategoryById = (id) => {
    return axios.get(`${CATEGORY_BASE}/${id}`);
};

const createCategory = (categoryData) => {
    return axios.post(`${CATEGORY_BASE}`, categoryData);
};

const updateCategory = (id, categoryData) => {
    return axios.put(`${CATEGORY_BASE}/${id}`, categoryData);
};

const deleteCategory = (id) => {
    return axios.delete(`${CATEGORY_BASE}/${id}`);
};

// Inventory Management APIs
const importStock = (dishId, data) => {
    const URL_BACKEND = `${INVENTORY_BASE}/import/${dishId}`;
    return axios.post(URL_BACKEND, data);
};

const updateStock = (dishId, data) => {
    const URL_BACKEND = `${INVENTORY_BASE}/stock/${dishId}`;
    return axios.put(URL_BACKEND, data);
};

// Permission Management APIs
const fetchAllPermissions = (page = 1, size = 100) => {
    const URL_BACKEND = `${PERMISSION_BASE}?${buildPaginationParams(page, size)}`;
    return axios.get(URL_BACKEND);
};

const createPermission = (data) => {
    return axios.post(`${PERMISSION_BASE}`, data);
};

const updatePermission = (data) => {
    return axios.put(`${PERMISSION_BASE}`, data);
};

const deletePermission = (id) => {
    return axios.delete(`${PERMISSION_BASE}/${id}`);
};

// Role Management APIs
const fetchAllRoles = (page = 1, size = 100) => {
    const URL_BACKEND = `${ROLE_BASE}?${buildPaginationParams(page, size)}`;
    return axios.get(URL_BACKEND);
};

const createRole = (data) => {
    return axios.post(`${ROLE_BASE}`, data);
};

const updateRole = (data) => {
    return axios.put(`${ROLE_BASE}`, data);
};

const deleteRole = (id) => {
    return axios.delete(`${ROLE_BASE}/${id}`);
};

export {
    createUserApi, fetchAllUserAPI, updateUserApi,
    deleteUserAPI, handleUploadFile, updateUserAvatarApi,
    registerUserApi, loginApi, getAccountAPI, logoutAPI, logoutAllSessionsAPI, getSessionsAPI, logoutSessionAPI,
    getAdminUserSessionsAPI, logoutAdminUserSessionAPI, logoutAllAdminUserSessionsAPI,
    fetchAllCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchAllDish, adDishInCart, getCart, getAllDishInCart,
    updateQuantity, deleteDishInCart, checkOutCart, fetchMyOrder, updateDish, deleteDish,
    fetchAllDishByName, addDish, fetchAllOrders, updateOrder, getImageUrl, getImageUrlFromFileName, fetchAllUser, fetchAllOrdersMy,
    createOrderByAdmin,
    loginWithGoogle,
    importStock, updateStock,
    fetchAllPermissions, createPermission, updatePermission, deletePermission,
    fetchAllRoles, createRole, updateRole, deleteRole,
    confirmCashPayment, getOrderInfo, getAnalyticsOverview,
    buildImageUrl,
    changePassword,
    getVnpayConfig,
    createVnpayPaymentLink
}