// import axios from "axios";
import { Avatar } from 'antd';
import axios from './axios.customize';

const createUserApi = (username, password, email) => {

    const URL_BACKEND = "/api/v1/auth/register";
    const data = {
        username: username,
        password: password,
        email: email,
    }
    return axios.post(URL_BACKEND, data)
}

const updateUserApi = (id, username, gender, phone, address) => {
    const URL_BACKEND = "/users";
    const data = {
        id: id,
        username: username,
        gender: gender,
        phone: phone,
        address: address
    };

    return axios.put(URL_BACKEND, data);
};
const fetchAllUserAPI = (current, pageSize) => {
    const URL_BACKEND = `/api/v1/user?current=${current}&pageSize=${pageSize}`;
    return axios.get(URL_BACKEND)
}

const deleteUserAPI = (id) => {
    const URL_BACKEND = `/api/v1/user/${id}`;//backtick
    return axios.delete(URL_BACKEND);
}

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

const registerUserApi = (fullName, email, password, phone) => {

    const URL_BACKEND = "/api/v1/user/register";
    const data = {
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
    }
    return axios.post(URL_BACKEND, data)
}


const loginApi = (username, password) => {

    const URL_BACKEND = "/api/v1/auth/login";
    const data = {
        username: username,
        password: password,

    }
    return axios.post(URL_BACKEND, data)
}


const getAccountAPI = () => {
    const URL_BACKEND = "/api/v1/auth/account";
    return axios.get(URL_BACKEND);
}

const logoutAPI = () => {
    const URL_BACKEND = "/api/v1/auth/logout";
    // const URL_BACKEND = "/logout";
    return axios.post(URL_BACKEND);
}

const fetchAllDish = (page, size, type) => {

    const URL_BACKEND = type == 1 ? `/dish?page=${page}&size=${size}` : `/dish?page=${page}&size=${size}?&filter=category.id~'${type}'`;
    return axios.get(URL_BACKEND)
}

const fetchAllDishByName = (page, size, Name) => {

    const url = `/dish?page=${page}&size=${size}&filter=name~'${Name}'`;
    return axios.get(url);
}

const adDishInCart = (quantity, price, total, DishID) => {
    const URL_BACKEND = "/cart/add-dish";
    const data = {
        quantity: quantity,
        price: price,
        total: total,
        dish: {
            id: DishID
        }

    }
    return axios.post(URL_BACKEND, data)
}


const getCart = () => {
    const URL_BACKEND = "/cart";
    return axios.get(URL_BACKEND)
}

const getAllDishInCart = () => {
    const URL_BACKEND = "/cart/get-all-dish";
    return axios.get(URL_BACKEND)
}

const updateQuantity = (id, quantity) => {
    const URL_BACKEND = "/cart/update-dish";
    const data = {
        id: id,
        quantity: quantity,
    }
    return axios.put(URL_BACKEND, data)
}

const deleteDishInCart = (id) => {
    const URL_BACKEND = `cart/delete-dish/${id}`;
    return axios.delete(URL_BACKEND)
}

const checkOutCart = (receiverName, receiverPhone, receiverAddress, receiverEmail, paymentMethod) => {
    const URL_BACKEND = "/cart/checkout";
    const data = {
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        receiverAddress: receiverAddress,
        receiverEmail: receiverEmail,
        paymentMethod: paymentMethod
    }
    return axios.post(URL_BACKEND, data)
}


const fetchMyOrder = () => {
    const URL_BACKEND = "/orders/my";
    return axios.get(URL_BACKEND)
}


const fetchAllOrders = (page, size) => {

    const URL_BACKEND = `/orders/all?page=${page}&size=${size}`;
    return axios.get(URL_BACKEND)
}

const fetchAllOrdersMy = (page, size) => {

    const URL_BACKEND = `/orders/my?page=${page}&size=${size}`;
    return axios.get(URL_BACKEND)
}

const updateOrder = async (id, status) => {
    // debugger
    const URL_BACKEND = `/orders/status/${id}`;
    const formData = new FormData();
    formData.append("status", status);

    let config = {
        headers: {
            "Content-Type": "form-data"
        }
    }


    return axios.put(URL_BACKEND, formData, config);
};


const updateDish = async (dishData) => {
    debugger
    const URL_BACKEND = "/dish";
    console.log("check id ", dishData.name)
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
    const URL_BACKEND = `/dish/${id}`;
    return axios.delete(URL_BACKEND)
}

const addDish = (dishData) => {
    const URL_BACKEND = "/dish";
    console.log("check id ", dishData.name)
    console.log("dishData.categoryId:", dishData.categoryId)
    console.log("dishData:", dishData)
    
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
    console.log("Sending data to backend:", data)
    return axios.post(URL_BACKEND, data);
}

const getImageUrl = async (fileName) => {
    try {
        const res = await axios.get(`http://localhost:8081/pre-signed-url/${fileName}`);
        return res.data; // Trả về URL thực tế
    } catch (error) {
        console.error("Lỗi khi lấy URL ảnh:", error);
        return ""; // Trả về chuỗi rỗng nếu lỗi
    }
};

// Utility function để xử lý image URL
const getImageUrlFromFileName = (fileName) => {
    if (!fileName) return "";
    
    // Nếu đã là URL đầy đủ, trả về luôn
    if (fileName.startsWith('http')) {
        return fileName;
    }
    
    // Nếu chỉ là tên file, tạo URL trực tiếp từ MinIO
    return `http://localhost:9000/restaurant/${fileName}`;
};



const fetchAllUser = (page, size) => {
    const URL_BACKEND = `/users?page=${page}&size=${size}`;
    return axios.get(URL_BACKEND)
}

const fetchAllOrderById = (page, size, id) => {
    const url = `/orders/all?page=${page}&size=${size}?&filter=category.id~'${type}'`;
    return axios.get(url);
}

const loginWithGoogle = (apiGoogle) => {
    return axios.post(apiGoogle);
}

// Simple Payment APIs
const confirmCashPayment = (orderId) => {
    const URL_BACKEND = `/api/payment/cash/confirm/${orderId}`;
    return axios.post(URL_BACKEND);
};

const handleVNPayCallback = (callbackData) => {
    const URL_BACKEND = `/api/payment/vnpay/callback`;
    return axios.post(URL_BACKEND, callbackData);
};

const getOrderInfo = (orderId) => {
    const URL_BACKEND = `/api/payment/order/${orderId}`;
    return axios.get(URL_BACKEND);
};

const paymentCallback = (vnp_ResponseCode, vnp_TxnRef) => {
    const URL_BACKEND = "/cart/call-back-vnpay";
    const data = {
        vnp_ResponseCode,
        vnp_TxnRef
    };
    return axios.post(URL_BACKEND, data);
};

// Category CRUD Operations
const fetchAllCategories = () => {
    const URL_BACKEND = "/category";
    return axios.get(URL_BACKEND);
};

const fetchCategoryById = (id) => {
    const URL_BACKEND = `/category/${id}`;
    return axios.get(URL_BACKEND);
};

const createCategory = (categoryData) => {
    const URL_BACKEND = "/category";
    return axios.post(URL_BACKEND, categoryData);
};

const updateCategory = (id, categoryData) => {
    const URL_BACKEND = `/category/${id}`;
    return axios.put(URL_BACKEND, categoryData);
};

const deleteCategory = (id) => {
    const URL_BACKEND = `/category/${id}`;
    return axios.delete(URL_BACKEND);
};

// Inventory Management APIs
const importStock = (dishId, data) => {
    const URL_BACKEND = `/api/v1/inventory/import/${dishId}`;
    return axios.post(URL_BACKEND, data);
};

const updateStock = (dishId, data) => {
    const URL_BACKEND = `/api/v1/inventory/stock/${dishId}`;
    return axios.put(URL_BACKEND, data);
};

// Permission Management APIs
const fetchAllPermissions = (page = 1, size = 100) => {
    const URL_BACKEND = `/permissions?page=${page}&size=${size}`;
    return axios.get(URL_BACKEND);
};

const createPermission = (data) => {
    const URL_BACKEND = `/permissions`;
    return axios.post(URL_BACKEND, data);
};

const updatePermission = (data) => {
    const URL_BACKEND = `/permissions`;
    return axios.put(URL_BACKEND, data);
};

const deletePermission = (id) => {
    const URL_BACKEND = `/permissions/${id}`;
    return axios.delete(URL_BACKEND);
};

// Role Management APIs
const fetchAllRoles = (page = 1, size = 100) => {
    const URL_BACKEND = `/roles?page=${page}&size=${size}`;
    return axios.get(URL_BACKEND);
};

const createRole = (data) => {
    const URL_BACKEND = `/roles`;
    return axios.post(URL_BACKEND, data);
};

const updateRole = (data) => {
    const URL_BACKEND = `/roles`;
    return axios.put(URL_BACKEND, data);
};

const deleteRole = (id) => {
    const URL_BACKEND = `/roles/${id}`;
    return axios.delete(URL_BACKEND);
};

// VNPAY Payment APIs
const createVNPayPayment = (orderData) => {
    const URL_BACKEND = `/api/v1/payment/vnpay/create`;
    return axios.post(URL_BACKEND, orderData);
};

export {
    createUserApi, fetchAllUserAPI, updateUserApi,
    deleteUserAPI, handleUploadFile, updateUserAvatarApi,
    registerUserApi, loginApi, getAccountAPI, logoutAPI,
    fetchAllCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchAllDish, adDishInCart, getCart, getAllDishInCart,
    updateQuantity, deleteDishInCart, checkOutCart, fetchMyOrder, updateDish, deleteDish,
    fetchAllDishByName, addDish, fetchAllOrders, updateOrder, getImageUrl, getImageUrlFromFileName, fetchAllUser, fetchAllOrdersMy,
    loginWithGoogle, paymentCallback,
    importStock, updateStock,
    fetchAllPermissions, createPermission, updatePermission, deletePermission,
    fetchAllRoles, createRole, updateRole, deleteRole,
    createVNPayPayment,
    confirmCashPayment, getOrderInfo, handleVNPayCallback
}