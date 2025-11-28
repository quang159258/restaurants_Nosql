import { useState, useEffect } from "react";
import { fetchAllOrdersMy, confirmCashPayment } from "../../../services/api.service";
import Notification from "../../noti/Notification";

const CashPaymentManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    // Lấy danh sách đơn hàng chờ thanh toán tiền mặt
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetchAllOrdersMy(1, 100);
            if (response.status === 200) {
                const cashOrders = response.data.data.filter(order => 
                    order.paymentMethod === "CASH" && order.paymentStatus === "UNPAID"
                );
                setOrders(cashOrders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            addNotification("Lỗi", "Không thể tải danh sách đơn hàng", "error");
        } finally {
            setLoading(false);
        }
    };

    // Xác nhận thanh toán tiền mặt
    const handleConfirmPayment = async (orderId) => {
        try {
            const response = await confirmCashPayment(orderId);
            if (response.status === 200) {
                addNotification(
                    "Thành công", 
                    "Đã xác nhận thanh toán tiền mặt", 
                    "success"
                );
                fetchOrders(); // Refresh danh sách
            }
        } catch (error) {
            console.error("Error confirming payment:", error);
            addNotification("Lỗi", "Không thể xác nhận thanh toán", "error");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    💰 Quản lý thanh toán tiền mặt
                </h2>
                <p className="text-gray-600">
                    Xác nhận thanh toán cho các đơn hàng COD
                </p>
            </div>

            {/* Notifications */}
            <div className="mb-4">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
                        description={notif.description}
                        type={notif.type}
                    />
                ))}
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Không có đơn hàng nào chờ thanh toán tiền mặt
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đơn hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng tiền
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.paymentRef}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.receiverName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.receiverPhone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-green-600">
                                                {formatPrice(order.totalPrice)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleConfirmPayment(order.id)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                                            >
                                                ✅ Xác nhận đã nhận tiền
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashPaymentManager;
