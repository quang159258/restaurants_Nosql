import React from 'react';
import { Result, Button, Card, Typography, Divider, Space } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Trang mock data cho kết quả thanh toán VNPay thành công
 */
const VNPaySuccess = () => {
    const navigate = useNavigate();

    // Mock data
    const mockOrderData = {
        orderId: 'ORD-2024-001234',
        transactionId: 'VNPAY-20241215-123456',
        amount: 450000,
        paymentMethod: 'VNPay',
        paymentTime: '15/12/2024 14:30:25',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'nguyenvana@example.com',
        customerPhone: '0901234567',
        deliveryAddress: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
        items: [
            { name: 'Phở Bò', quantity: 2, price: 120000 },
            { name: 'Bánh Mì Thịt Nướng', quantity: 1, price: 45000 },
            { name: 'Cà Phê Sữa Đá', quantity: 3, price: 95000 }
        ]
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/order');
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Success Result */}
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
                        title={
                            <Title level={2} style={{ color: '#52c41a', marginTop: '20px' }}>
                                Thanh toán thành công!
                            </Title>
                        }
                        subTitle={
                            <Text style={{ fontSize: '16px' }}>
                                Giao dịch của bạn đã được xử lý thành công. Đơn hàng đang được chuẩn bị.
                            </Text>
                        }
                    />

                    {/* Order Details Card */}
                    <Card 
                        className="mt-6 shadow-lg"
                        title={
                            <Space>
                                <FileTextOutlined />
                                <span>Chi tiết đơn hàng</span>
                            </Space>
                        }
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Order Info */}
                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Mã đơn hàng:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px', fontWeight: 'bold' }}>
                                    {mockOrderData.orderId}
                                </Text>
                            </div>
                            
                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Mã giao dịch:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockOrderData.transactionId}
                                </Text>
                            </div>

                            <Divider />

                            {/* Payment Info */}
                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Phương thức thanh toán:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockOrderData.paymentMethod}
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Thời gian thanh toán:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockOrderData.paymentTime}
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Tổng tiền:</Text>
                                <Text 
                                    style={{ 
                                        fontSize: '24px', 
                                        marginLeft: '8px', 
                                        fontWeight: 'bold',
                                        color: '#52c41a'
                                    }}
                                >
                                    {mockOrderData.amount.toLocaleString('vi-VN')} ₫
                                </Text>
                            </div>

                            <Divider />

                            {/* Customer Info */}
                            <div>
                                <Title level={5}>Thông tin khách hàng</Title>
                                <div style={{ marginTop: '8px' }}>
                                    <Text><strong>Tên:</strong> {mockOrderData.customerName}</Text><br />
                                    <Text><strong>Email:</strong> {mockOrderData.customerEmail}</Text><br />
                                    <Text><strong>Số điện thoại:</strong> {mockOrderData.customerPhone}</Text><br />
                                    <Text><strong>Địa chỉ giao hàng:</strong> {mockOrderData.deliveryAddress}</Text>
                                </div>
                            </div>

                            <Divider />

                            {/* Order Items */}
                            <div>
                                <Title level={5}>Sản phẩm đã đặt</Title>
                                <div style={{ marginTop: '12px' }}>
                                    {mockOrderData.items.map((item, index) => (
                                        <div 
                                            key={index}
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                padding: '8px 0',
                                                borderBottom: index < mockOrderData.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                            }}
                                        >
                                            <Text>
                                                {item.name} x {item.quantity}
                                            </Text>
                                            <Text strong>
                                                {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Space>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-6 text-center">
                        <Space size="large">
                            <Button 
                                type="primary" 
                                size="large"
                                icon={<ShoppingOutlined />}
                                onClick={handleContinueShopping}
                                style={{ minWidth: '150px' }}
                            >
                                Tiếp tục mua sắm
                            </Button>
                            <Button 
                                size="large"
                                icon={<FileTextOutlined />}
                                onClick={handleViewOrders}
                                style={{ minWidth: '150px' }}
                            >
                                Xem đơn hàng
                            </Button>
                            <Button 
                                size="large"
                                onClick={handlePrintReceipt}
                                style={{ minWidth: '150px' }}
                            >
                                In hóa đơn
                            </Button>
                        </Space>
                    </div>

                    {/* Info Message */}
                    <Card className="mt-6" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
                        <Text style={{ color: '#0050b3' }}>
                            <strong>Lưu ý:</strong> Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút. 
                            Đơn hàng sẽ được giao trong vòng 30-45 phút.
                        </Text>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VNPaySuccess;

