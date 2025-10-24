import React, { useEffect, useState } from 'react';
import { Result, Button, Spin, Card, Typography, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateOrder } from '../../../services/api.service';
import Notification from '../../../components/noti/Notification';

const { Title, Text } = Typography;

const VNPayCallback = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [orderInfo, setOrderInfo] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    useEffect(() => {
        const processPaymentCallback = async () => {
            try {
                setLoading(true);

                // Lấy thông tin từ URL params
                const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
                const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus');
                const vnp_TxnRef = searchParams.get('vnp_TxnRef');
                const vnp_Amount = searchParams.get('vnp_Amount');
                const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');

                console.log('VNPAY Callback Params:', {
                    vnp_ResponseCode,
                    vnp_TransactionStatus,
                    vnp_TxnRef,
                    vnp_Amount,
                    vnp_OrderInfo
                });

                // Kiểm tra kết quả thanh toán
                if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                    // Thanh toán thành công
                    setPaymentStatus('success');
                    
                    // Cập nhật trạng thái đơn hàng
                    if (vnp_TxnRef) {
                        try {
                            await updateOrder(vnp_TxnRef, 'CONFIRMED');
                            addNotification('Thanh toán thành công', 'Đơn hàng đã được xác nhận', 'success');
                        } catch (error) {
                            console.error('Error updating order:', error);
                            addNotification('Lỗi cập nhật', 'Không thể cập nhật trạng thái đơn hàng', 'error');
                        }
                    }

                    setOrderInfo({
                        orderId: vnp_TxnRef,
                        amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : 0,
                        orderInfo: vnp_OrderInfo
                    });

                } else {
                    // Thanh toán thất bại
                    setPaymentStatus('failed');
                    addNotification('Thanh toán thất bại', 'Giao dịch không thành công', 'error');
                }

            } catch (error) {
                console.error('Payment callback error:', error);
                setPaymentStatus('error');
                addNotification('Lỗi xử lý', 'Có lỗi xảy ra khi xử lý thanh toán', 'error');
            } finally {
                setLoading(false);
            }
        };

        processPaymentCallback();
    }, [searchParams]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/order');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center p-8">
                    <Spin size="large" />
                    <Title level={3} className="mt-4">Đang xử lý thanh toán...</Title>
                    <Text type="secondary">Vui lòng chờ trong giây lát</Text>
                </Card>
            </div>
        );
    }

    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <Result
                            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            title="Thanh toán thành công!"
                            subTitle={
                                <div className="text-center">
                                    <Text>Đơn hàng của bạn đã được xác nhận</Text>
                                    {orderInfo && (
                                        <div className="mt-4 p-4 bg-green-50 rounded">
                                            <Text strong>Mã đơn hàng: {orderInfo.orderId}</Text>
                                            <br />
                                            <Text strong>Số tiền: {orderInfo.amount?.toLocaleString()} VND</Text>
                                        </div>
                                    )}
                                </div>
                            }
                            extra={[
                                <Button type="primary" key="continue" onClick={handleContinueShopping}>
                                    Tiếp tục mua sắm
                                </Button>,
                                <Button key="orders" onClick={handleViewOrders}>
                                    Xem đơn hàng
                                </Button>,
                            ]}
                        />
                    </div>
                </div>
                <Notification notifications={notifications} />
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <Result
                            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            title="Thanh toán thất bại"
                            subTitle="Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
                            extra={[
                                <Button type="primary" key="retry" onClick={() => navigate('/payment')}>
                                    Thử lại
                                </Button>,
                                <Button key="home" onClick={handleContinueShopping}>
                                    Về trang chủ
                                </Button>,
                            ]}
                        />
                    </div>
                </div>
                <Notification notifications={notifications} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title="Có lỗi xảy ra"
                        subTitle="Không thể xử lý kết quả thanh toán. Vui lòng liên hệ hỗ trợ."
                        extra={[
                            <Button type="primary" key="home" onClick={handleContinueShopping}>
                                Về trang chủ
                            </Button>,
                        ]}
                    />
                </div>
            </div>
            <Notification notifications={notifications} />
        </div>
    );
};

export default VNPayCallback;
