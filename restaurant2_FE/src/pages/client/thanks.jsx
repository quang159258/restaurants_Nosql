// src/pages/ThanksPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handleVNPayCallback } from "../../services/api.service";

const ThanksPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Đang xử lý thanh toán...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processVNPayCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const responseCode = params.get("vnp_ResponseCode");
            const txnRef = params.get("vnp_TxnRef");
            const amount = params.get("vnp_Amount");

            if (responseCode && txnRef) {
                try {
                    const callbackData = {
                        vnp_ResponseCode: responseCode,
                        vnp_TxnRef: txnRef,
                        vnp_Amount: amount
                    };

                    const res = await handleVNPayCallback(callbackData);
                    
                    if (responseCode === "00") {
                        setStatus("🎉 Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.");
                    } else {
                        setStatus("❌ Thanh toán thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
                    }

                    // Redirect về trang chủ sau 5 giây
                    setTimeout(() => {
                        navigate("/");
                    }, 5000);

                } catch (err) {
                    console.error("VNPay callback error:", err);
                    setStatus("❌ Có lỗi xảy ra khi xử lý thanh toán. Vui lòng liên hệ hỗ trợ.");
                }
            } else {
                setStatus("❌ Không có thông tin thanh toán từ VNPay.");
            }
            
            setLoading(false);
        };

        processVNPayCallback();
    }, [navigate]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <div className="bg-white rounded-lg shadow-lg w-[1000px] h-[710px] p-8 relative animate-fadeIn">
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
                    
                    {/* Payment Status */}
                    <div className="mb-8">
                        {loading ? (
                            <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-lg text-gray-600">{status}</span>
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-lg">
                                <div className="text-xl font-medium text-gray-800 mb-4">
                                    {status}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Bạn sẽ được chuyển hướng về trang chủ trong 5 giây...
                                </div>
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
