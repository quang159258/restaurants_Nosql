import React, { useEffect, useState } from 'react';
import { Result, Button, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Notification from '../../../components/noti/Notification';

const { Title, Text } = Typography;

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [orderInfo, setOrderInfo] = useState({});
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    useEffect(() => {
        const status = searchParams.get('status') || 'failed';
        const message = searchParams.get('message');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');

        setPaymentStatus(status);
        const decoded = message ? decodeURIComponent(message) : null;

        setOrderInfo({
            orderId,
            amount: amount ? Number(amount) : null,
            message: decoded
        });

        if (decoded) {
            addNotification(status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại', decoded, status === 'success' ? 'success' : 'error');
        } else if (status === 'success') {
            addNotification('Thanh toán thành công', 'Đơn hàng của bạn đã được xác nhận', 'success');
        } else {
            addNotification('Thanh toán thất bại', 'Giao dịch không thành công', 'error');
        }

        // Auto redirect về /order sau khi thanh toán thành công
        if (status === 'success') {
            setTimeout(() => {
                navigate('/order', { state: { orderId } });
            }, 2000);
        }
    }, [searchParams, navigate]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/order', { state: { orderId: orderInfo?.orderId } });
    };

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
                                    {orderInfo?.orderId && (
                                        <div className="mt-4 p-4 bg-green-50 rounded">
                                            <Text strong>Mã đơn hàng: {orderInfo.orderId}</Text>
                                            <br />
                                            {orderInfo.amount && (
                                                <Text strong>Số tiền: {orderInfo.amount?.toLocaleString('vi-VN')} VND</Text>
                                            )}
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

    if (paymentStatus !== 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <Result
                            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            title="Thanh toán thất bại"
                            subTitle={orderInfo?.message || "Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}
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
};

export default PaymentResult;
