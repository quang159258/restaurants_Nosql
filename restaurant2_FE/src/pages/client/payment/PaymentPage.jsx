import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Input, Button, Select, message, Steps, Typography, Space, Divider } from 'antd';
import { UserOutlined, PhoneOutlined, HomeOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../components/context/auth.context';
import { checkOutCart, getCart } from '../../../services/api.service';
import Notification from '../../../components/noti/Notification';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PaymentPage = () => {
    const { user, cart, setCart } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [orderInfo, setOrderInfo] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    useEffect(() => {
        // Load thông tin từ location state nếu có (từ Confirm page)
        if (location.state?.formData) {
            const { formData } = location.state;
            form.setFieldsValue(formData);
            setCurrentStep(1); // Skip to payment method step
        } else if (user && user.username) {
            // Load thông tin user nếu có
            form.setFieldsValue({
                receiverName: user.username,
                receiverPhone: user.phone || '',
                receiverAddress: user.address || '',
                receiverEmail: user.email || ''
            });
        }
    }, [user, form, location.state]);

    const steps = [
        {
            title: 'Thông tin nhận hàng',
            icon: <UserOutlined />,
        },
        {
            title: 'Phương thức thanh toán',
            icon: <CreditCardOutlined />,
        },
        {
            title: 'Xác nhận đơn hàng',
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
        } else if (currentStep === 1) {
            setCurrentStep(2);
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handlePayment = async (paymentMethod) => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            
            const orderData = {
                receiverName: values.receiverName,
                receiverPhone: values.receiverPhone,
                receiverAddress: values.receiverAddress,
                receiverEmail: values.receiverEmail,
                paymentMethod: paymentMethod
            };

            const res = await checkOutCart(
                orderData.receiverName,
                orderData.receiverPhone,
                orderData.receiverAddress,
                orderData.receiverEmail,
                paymentMethod
            );

            if (res.data) {
                setOrderInfo(res.data);
                
                if (paymentMethod === 'VNPAY') {
                    // Redirect to VNPAY
                    window.location.href = res.data.paymentUrl;
                } else {
                    // COD - redirect to success page
                    navigate('/thanks', { state: { orderId: res.data.id } });
                }
            }
        } catch (error) {
            console.error('Payment error:', error);
            addNotification('Lỗi thanh toán', 'Không thể xử lý thanh toán', 'error');
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
                                <TextArea 
                                    prefix={<HomeOutlined />} 
                                    placeholder="Nhập địa chỉ chi tiết" 
                                    rows={3}
                                />
                            </Form.Item>
                        </Form>
                    </Card>
                );

            case 1:
                return (
                    <Card title="Phương thức thanh toán" className="mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card 
                                hoverable 
                                className="text-center cursor-pointer border-2 border-blue-200"
                                onClick={() => handlePayment('COD')}
                            >
                                <div className="p-4">
                                    <div className="text-4xl mb-2">💰</div>
                                    <Title level={4}>Thanh toán khi nhận hàng</Title>
                                    <Text type="secondary">COD - Cash on Delivery</Text>
                                </div>
                            </Card>

                            <Card 
                                hoverable 
                                className="text-center cursor-pointer border-2 border-green-200"
                                onClick={() => handlePayment('VNPAY')}
                            >
                                <div className="p-4">
                                    <div className="text-4xl mb-2">💳</div>
                                    <Title level={4}>Thanh toán VNPAY</Title>
                                    <Text type="secondary">Thẻ ATM, Visa, Mastercard</Text>
                                </div>
                            </Card>
                        </div>
                    </Card>
                );

            case 2:
                return (
                    <Card title="Xác nhận đơn hàng" className="mb-4">
                        <div className="space-y-4">
                            <div>
                                <Title level={4}>Thông tin đơn hàng</Title>
                                <div className="bg-gray-50 p-4 rounded">
                                    <p><strong>Người nhận:</strong> {form.getFieldValue('receiverName')}</p>
                                    <p><strong>SĐT:</strong> {form.getFieldValue('receiverPhone')}</p>
                                    <p><strong>Email:</strong> {form.getFieldValue('receiverEmail')}</p>
                                    <p><strong>Địa chỉ:</strong> {form.getFieldValue('receiverAddress')}</p>
                                </div>
                            </div>

                            <Divider />

                            <div>
                                <Title level={4}>Giỏ hàng</Title>
                                {cart.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                            <Text strong>{item.dishName}</Text>
                                            <br />
                                            <Text type="secondary">Số lượng: {item.quantity}</Text>
                                        </div>
                                        <Text strong>{item.price.toLocaleString()} VND</Text>
                                    </div>
                                ))}
                                
                                <Divider />
                                
                                <div className="flex justify-between items-center">
                                    <Title level={3}>Tổng cộng:</Title>
                                    <Title level={3} style={{ color: '#C8A97E' }}>
                                        {cart.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()} VND
                                    </Title>
                                </div>
                            </div>
                        </div>
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
                            
                            {currentStep < 2 && (
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
