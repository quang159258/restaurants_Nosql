import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkOutCart } from "../../../services/api.service";
import Notification from "../../noti/Notification";

const SimplePayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const formData = location.state?.formData;

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    const handlePayment = async () => {
        if (!formData) {
            addNotification("Lỗi", "Không có thông tin đơn hàng", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await checkOutCart(
                formData.receiverName,
                formData.receiverPhone,
                formData.receiverAddress,
                formData.receiverEmail,
                formData.paymentMethod
            );

            if (response.status === 200) {
                const orderData = response.data;
                
                if (formData.paymentMethod === "VNPAY" && orderData.paymentUrl) {
                    // Redirect to VNPay
                    window.location.href = orderData.paymentUrl;
                } else {
                    // Cash payment - redirect to success page
                    addNotification(
                        "Đặt hàng thành công!", 
                        "Đơn hàng của bạn đã được tạo. Vui lòng chờ xác nhận từ nhân viên.", 
                        "success"
                    );
                    
                    setTimeout(() => {
                        navigate("/orders", { state: { orderId: orderData.orderId } });
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("Payment error:", error);
            addNotification(
                "Lỗi thanh toán", 
                "Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.", 
                "error"
            );
        } finally {
            setLoading(false);
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
                        <p><span className="font-medium">Phương thức thanh toán:</span> 
                            {formData.paymentMethod === "CASH" ? " 💰 Tiền mặt" : " 🏦 VNPay"}
                        </p>
                    </div>
                </div>

                {/* Thông báo phương thức thanh toán */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    {formData.paymentMethod === "CASH" ? (
                        <div className="text-blue-800">
                            <p className="font-medium">💰 Thanh toán tiền mặt</p>
                            <p className="text-sm mt-1">
                                Bạn sẽ thanh toán khi nhận hàng. Nhân viên sẽ xác nhận thanh toán sau khi giao hàng.
                            </p>
                        </div>
                    ) : (
                        <div className="text-green-800">
                            <p className="font-medium">🏦 Thanh toán VNPay</p>
                            <p className="text-sm mt-1">
                                Bạn sẽ được chuyển hướng đến trang thanh toán VNPay để hoàn tất giao dịch.
                            </p>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            loading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : formData.paymentMethod === "CASH"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                    >
                        {loading ? "Đang xử lý..." : 
                         formData.paymentMethod === "CASH" ? "Xác nhận đặt hàng" : "Thanh toán VNPay"}
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
