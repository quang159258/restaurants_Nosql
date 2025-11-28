import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOrderInfo } from "../../services/api.service";

const ThanksPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderSummary, setOrderSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const state = location.state;
        if (!state?.orderId) {
            navigate("/");
            return;
        }

        const fetchOrderInfo = async () => {
            try {
                const res = await getOrderInfo(state.orderId);
                const data = res?.data ?? res;
                if (data?.status === "success") {
                    setOrderSummary({
                        orderId: data.orderId,
                        totalPrice: data.totalPrice,
                        paymentMethod: data.paymentMethod,
                        paymentStatus: data.paymentStatus,
                        orderStatus: data.orderStatus
                    });
                } else {
                    setOrderSummary({
                        orderId: state.orderId,
                        paymentMethod: state.paymentMethod ?? "CASH",
                        orderStatus: state.orderStatus ?? "PENDING"
                    });
                }
            } catch (error) {
                console.error("Không thể lấy thông tin đơn hàng:", error);
                setOrderSummary({
                    orderId: state.orderId,
                    paymentMethod: state.paymentMethod ?? "CASH",
                    orderStatus: state.orderStatus ?? "PENDING"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderInfo();
    }, [location.state, navigate]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <div className="bg-white rounded-lg shadow-lg w-[900px] p-8 relative animate-fadeIn">
                <button
                    onClick={() => navigate("/")}
                    className="absolute right-8 text-xl text-black hover:text-red-500 transition-colors"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="text-center">
                    <div className="text-[#C8A97E] text-6xl font-[Great_Vibes,cursive] mb-8">
                        Feliciano
                    </div>

                    <div className="mb-8">
                        {loading ? (
                            <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-lg text-gray-600">Đang tải thông tin đơn hàng...</span>
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                                <div className="text-xl font-medium text-gray-800">
                                    🎉 Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được ghi nhận.
                                </div>
                                <div className="text-left text-gray-700 space-y-1">
                                    <p><strong>Mã đơn hàng:</strong> {orderSummary?.orderId}</p>
                                    <p><strong>Phương thức thanh toán:</strong> Tiền mặt (COD)</p>
                                    <p><strong>Trạng thái đơn hàng:</strong> {orderSummary?.orderStatus}</p>
                                    {orderSummary?.totalPrice != null && (
                                        <p><strong>Tổng tiền:</strong> {orderSummary.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Nhân viên sẽ liên hệ để xác nhận và thu tiền mặt khi giao hàng. Cảm ơn bạn đã tin tưởng chúng tôi!
                                </div>
                                <button
                                    onClick={() => navigate("/")}
                                    className="mt-4 bg-[#dfc094] text-white py-2 px-6 rounded transition hover:scale-105"
                                >
                                    Về trang chủ
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="mt-8 text-2xl font-[Great_Vibes,cursive]">
                        Kính gửi Quý khách hàng thân mến
                    </p>
                    <p className="mt-4 text-xl font-[Great_Vibes,cursive] leading-relaxed">
                        Cảm ơn quý khách đã đặt hàng tại cửa hàng của chúng tôi.
                        Mỗi đơn hàng đều là niềm vinh hạnh và động lực để chúng tôi phục vụ tốt hơn.
                        Rất mong sẽ tiếp tục được đồng hành cùng quý khách trong những lần ghé thăm tiếp theo.
                        <br />
                        Trân trọng!
                    </p>

                    <p className="text-right mt-8 text-xl font-[Great_Vibes,cursive]">
                        Ký Tên
                    </p>
                    <p className="text-right text-xl font-[Great_Vibes,cursive] font-bold">
                        Nguyễn Thành Hoàn
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ThanksPage;
