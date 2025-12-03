import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Input, Button, message, Steps, Typography, Space, Divider, Spin } from 'antd';
import { UserOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../components/context/auth.context';
import { checkOutCart, getCart, getAllDishInCart } from '../../../services/api.service';
import Notification from '../../../components/noti/Notification';
import AddressSelector from '../../../components/common/AddressSelector';

const { Title, Text } = Typography;

const PaymentPage = () => {
    const { user, cart, setCart } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    useEffect(() => {
        if (location.state?.formData) {
            form.setFieldsValue(location.state.formData);
        } else if (user && user.username) {
            form.setFieldsValue({
                receiverName: user.username,
                receiverPhone: user.phone || '',
                receiverAddress: user.address || '',
                receiverEmail: user.email || ''
            });
        }
    }, [user, form, location.state]);

    useEffect(() => {
        const loadCart = async () => {
            try {
                const summaryRes = await getCart();
                const summaryData = summaryRes?.data ?? summaryRes;
                if (summaryData) {
                    setCart(summaryData);
                }
                const itemsRes = await getAllDishInCart();
                const itemsData = itemsRes?.data ?? itemsRes;
                setCartItems(Array.isArray(itemsData) ? itemsData : []);
            } catch (error) {
                console.error('Không thể tải giỏ hàng:', error);
                setCartItems([]);
            }
        };
        loadCart();
    }, [setCart]);

    const steps = [
        {
            title: 'Thông tin nhận hàng',
            icon: <UserOutlined />,
        },
        {
            title: 'Xác nhận & Thanh toán',
            icon: <CheckCircleOutlined />,
        },
    ];

    const handleNext = () => {
        if (currentStep === 0) {
            form.validateFields(['receiverName', 'receiverPhone', 'receiverAddress', 'receiverEmail'])
                .then(() => {
                    setCurrentStep(1);
                })
                .catch(() => {
                    message.error('Vui lòng điền đầy đủ thông tin nhận hàng');
                });
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleCashPayment = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            const response = await checkOutCart(
                values.receiverName,
                values.receiverPhone,
                values.receiverAddress,
                values.receiverEmail,
                'CASH'
            );

            // Backend trả về RestResponse<T> được unwrap bởi axios interceptor
            // Sau unwrap: response = { status, message, data: CheckoutResponse, statusCode }
            // Vậy cần lấy response.data để có CheckoutResponse
            const orderData = response?.data ?? response;

            if (orderData?.orderId) {
                addNotification(
                    'Đặt hàng thành công',
                    'Đơn hàng của bạn đã được ghi nhận. Nhân viên sẽ xác nhận thanh toán tiền mặt.',
                    'success'
                );

                try {
                    const summaryRes = await getCart();
                    // Cart response cũng được wrap tương tự
                    const summaryData = summaryRes?.data ?? summaryRes;
                    if (summaryData) {
                        setCart(summaryData);
                    }
                } catch (error) {
                    console.error('Không thể cập nhật giỏ hàng sau khi thanh toán:', error);
                }

                setCartItems([]);
                navigate('/thanks', {
                    state: {
                        orderId: orderData.orderId,
                        orderStatus: orderData.status,
                        paymentMethod: orderData.paymentMethod
                    }
                });
            } else {
                throw new Error('Thiếu thông tin đơn hàng trả về.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            addNotification('Lỗi thanh toán', 'Không thể xử lý thanh toán tiền mặt', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Card title="Thông tin nhận hàng" className="mb-4">
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="receiverName"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                            </Form.Item>

                            <Form.Item
                                name="receiverPhone"
                                label="Số điện thoại"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                                ]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                            </Form.Item>

                            <Form.Item
                                name="receiverEmail"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input placeholder="Nhập email" />
                            </Form.Item>

                            <Form.Item
                                name="receiverAddress"
                                label="Địa chỉ nhận hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                            >
                                <AddressSelector />
                            </Form.Item>
                        </Form>
                    </Card>
                );

            case 1:
                return (
                    <Card title="Xác nhận đơn hàng & thanh toán" className="mb-4">
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div className="bg-gray-50 p-4 rounded">
                                <Title level={4}>Thông tin nhận hàng</Title>
                                <p><strong>Người nhận:</strong> {form.getFieldValue('receiverName')}</p>
                                <p><strong>SĐT:</strong> {form.getFieldValue('receiverPhone')}</p>
                                <p><strong>Email:</strong> {form.getFieldValue('receiverEmail')}</p>
                                <p><strong>Địa chỉ:</strong> {form.getFieldValue('receiverAddress')}</p>
                            </div>

                            <Divider />

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Title level={4} style={{ margin: 0 }}>Giỏ hàng</Title>
                                    {loading && <Spin size="small" />}
                                </div>
                                {cartItems.length === 0 ? (
                                    <div className="text-center text-gray-500">
                                        Không có sản phẩm trong giỏ hàng.
                                    </div>
                                ) : (
                                    cartItems.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-2 border-b">
                                            <div>
                                                <Text strong>{item.name}</Text>
                                                <br />
                                                <Text type="secondary">Số lượng: {item.quantity}</Text>
                                            </div>
                                            <Text strong>{item.total?.toLocaleString('vi-VN')} VND</Text>
                                        </div>
                                    ))
                                )}
                                <Divider />
                                <div className="flex justify-between items-center">
                                    <Title level={3}>Tổng cộng:</Title>
                                    <Title level={3} style={{ color: '#C8A97E' }}>
                                        {(cart?.totalPrice || 0).toLocaleString('vi-VN')} VND
                                    </Title>
                                </div>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                loading={loading}
                                onClick={handleCashPayment}
                                block
                            >
                                Xác nhận thanh toán tiền mặt
                            </Button>
                            <Text type="secondary">
                                Sau khi đặt hàng, nhân viên sẽ liên hệ để xác nhận và thu tiền mặt khi giao hàng.
                            </Text>
                        </Space>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <Title level={1} style={{ color: '#C8A97E' }}>
                            Thanh toán đơn hàng
                        </Title>
                        <Text type="secondary">
                            Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng
                        </Text>
                    </div>

                    <Card className="mb-6">
                        <Steps current={currentStep} items={steps} />
                    </Card>

                    {renderStepContent()}

                    <div className="flex justify-between mt-6">
                        <Button 
                            onClick={handlePrev} 
                            disabled={currentStep === 0}
                            size="large"
                        >
                            Quay lại
                        </Button>
                        
                        <Space>
                            <Button 
                                onClick={() => navigate('/cart')}
                                size="large"
                            >
                                Hủy
                            </Button>
                            
                            {currentStep < 1 && (
                                <Button 
                                    type="primary" 
                                    onClick={handleNext}
                                    size="large"
                                >
                                    Tiếp tục
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>

            <Notification notifications={notifications} />
        </div>
    );
};

export default PaymentPage;
