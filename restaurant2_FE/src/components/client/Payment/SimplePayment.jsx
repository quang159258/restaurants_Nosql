import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkOutCart, getCart } from "../../../services/api.service";
import { AuthContext } from "../../context/auth.context";
import Notification from "../../noti/Notification";

const SimplePayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setCart } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);
    
    const formData = location.state?.formData;

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    // SimplePayment chỉ dành cho VNPay, không tự động tạo order
    // User phải bấm nút "Thanh toán VNPay" để tạo order và redirect

    const handlePayment = async () => {
        if (!formData) {
            addNotification("Lỗi", "Không có thông tin đơn hàng", "error");
            return;
        }

        // SimplePayment chỉ dành cho VNPay, không xử lý CASH
        if (formData.paymentMethod !== "VNPAY") {
            addNotification("Lỗi", "Trang này chỉ dành cho thanh toán VNPay. Vui lòng quay lại trang xác nhận.", "error");
            setTimeout(() => navigate("/confirm"), 2000);
            return;
        }

        // Validation: Kiểm tra thông tin bắt buộc
        if (!formData.receiverName || formData.receiverName.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập tên người nhận", "warning");
            return;
        }
        if (!formData.receiverPhone || formData.receiverPhone.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập số điện thoại", "warning");
            return;
        }
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.receiverPhone.trim())) {
            addNotification("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại 10-11 chữ số", "warning");
            return;
        }
        if (!formData.receiverEmail || formData.receiverEmail.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập email", "warning");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.receiverEmail.trim())) {
            addNotification("Email không hợp lệ", "Vui lòng nhập email đúng định dạng", "warning");
            return;
        }
        if (!formData.receiverAddress || formData.receiverAddress.trim() === "") {
            addNotification("Thiếu địa chỉ", "Vui lòng chọn đầy đủ địa chỉ giao hàng", "warning");
            return;
        }

        setLoading(true);
        try {
            const response = await checkOutCart(
                formData.receiverName.trim(),
                formData.receiverPhone.trim(),
                formData.receiverAddress.trim(),
                formData.receiverEmail.trim(),
                formData.paymentMethod
            );

            // Backend trả về RestResponse<T> được unwrap bởi axios interceptor
            // Sau unwrap: response = { status, message, data: CheckoutResponse, statusCode }
            // Vậy cần lấy response.data để có CheckoutResponse
            const orderData = response?.data || response;
            
            console.log("Checkout response:", response);
            console.log("Order data:", orderData);
            console.log("Payment URL:", orderData?.paymentUrl);
            
            setOrderCreated(true);
            
            // Refresh cart sau khi checkout thành công (backend đã xóa cart)
            try {
                const cartRes = await getCart();
                // Cart response cũng được wrap tương tự
                const cartData = cartRes?.data || cartRes;
                if (cartData) {
                    setCart(cartData);
                }
            } catch (error) {
                console.error("Không thể refresh cart:", error);
            }
            
            // VNPay: Kiểm tra paymentUrl từ response
            const paymentUrl = orderData?.paymentUrl;
            if (paymentUrl && typeof paymentUrl === 'string' && paymentUrl.trim() !== '') {
                // Redirect to paymentUrl từ VNPayService
                console.log("Redirecting to VNPay:", paymentUrl);
                // Set loading false trước khi redirect
                setLoading(false);
                // Sử dụng window.location.replace để không lưu vào history
                window.location.replace(paymentUrl);
            } else {
                // Nếu không có paymentUrl, có thể VNPay chưa được cấu hình
                console.error("No payment URL in response:", orderData);
                setLoading(false);
                addNotification(
                    "Lỗi", 
                    "Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại hoặc chọn phương thức khác.", 
                    "error"
                );
                setTimeout(() => navigate("/confirm"), 2000);
            }
        } catch (error) {
            console.error("Payment error:", error);
            const errorData = error?.response?.data?.data || error?.response?.data || error?.response || error;
            const serverMessage = errorData?.message || errorData?.error || "Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.";
            setLoading(false);
            addNotification(
                "Lỗi thanh toán", 
                serverMessage, 
                "error"
            );
        }
    };

    if (!formData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-600 mb-4">Không có thông tin đơn hàng</h2>
                    <button 
                        onClick={() => navigate("/")}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Quay về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-center mb-6">Xác nhận thanh toán</h2>
                
                {/* Thông tin đơn hàng */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-3">Thông tin nhận hàng:</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Tên:</span> {formData.receiverName}</p>
                        <p><span className="font-medium">Số điện thoại:</span> {formData.receiverPhone}</p>
                        <p><span className="font-medium">Email:</span> {formData.receiverEmail}</p>
                        <p><span className="font-medium">Địa chỉ:</span> {formData.receiverAddress}</p>
                        <p><span className="font-medium">Phương thức thanh toán:</span> 🏦 VNPay</p>
                    </div>
                </div>

                {/* Thông báo phương thức thanh toán */}
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="text-green-800">
                        <p className="font-medium">🏦 Thanh toán VNPay</p>
                        <p className="text-sm mt-1">
                            Bạn sẽ được chuyển hướng đến trang thanh toán VNPay để hoàn tất giao dịch.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handlePayment}
                        disabled={loading || formData.paymentMethod !== "VNPAY"}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            loading || formData.paymentMethod !== "VNPAY"
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                    >
                        {loading ? "Đang xử lý..." : "Thanh toán VNPay"}
                    </button>
                    
                    <button
                        onClick={() => navigate("/confirm")}
                        className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Quay lại
                    </button>
                </div>

                {/* Notifications */}
                <div className="mt-4">
                    {notifications.map((notif) => (
                        <Notification
                            key={notif.id}
                            message={notif.message}
                            description={notif.description}
                            type={notif.type}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimplePayment;
