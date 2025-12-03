import React from 'react';
import { Result, Button, Card, Typography, Alert, Space } from 'antd';
import { CloseCircleOutlined, ReloadOutlined, HomeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Trang mock data cho kết quả thanh toán VNPay thất bại
 */
const VNPayFailed = () => {
    const navigate = useNavigate();

    // Mock data
    const mockFailureData = {
        orderId: 'ORD-2024-001234',
        transactionId: 'VNPAY-20241215-123456',
        amount: 450000,
        failureReason: 'Giao dịch bị từ chối bởi ngân hàng. Vui lòng kiểm tra lại thông tin thẻ hoặc số dư tài khoản.',
        errorCode: '07',
        errorMessage: 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        paymentTime: '15/12/2024 14:30:25',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'nguyenvana@example.com',
        customerPhone: '0901234567'
    };

    const handleRetryPayment = () => {
        navigate('/payment');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleContactSupport = () => {
        // Mock: Có thể mở email client hoặc chat support
        window.location.href = `mailto:support@restaurant.com?subject=Hỗ trợ thanh toán - ${mockFailureData.orderId}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Failure Result */}
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '72px' }} />}
                        title={
                            <Title level={2} style={{ color: '#ff4d4f', marginTop: '20px' }}>
                                Thanh toán thất bại
                            </Title>
                        }
                        subTitle={
                            <Text style={{ fontSize: '16px' }}>
                                Giao dịch không thể hoàn tất. Vui lòng kiểm tra lại thông tin và thử lại.
                            </Text>
                        }
                    />

                    {/* Error Details Card */}
                    <Card 
                        className="mt-6 shadow-lg"
                        title={
                            <Space>
                                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                                <span>Chi tiết lỗi</span>
                            </Space>
                        }
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Error Alert */}
                            <Alert
                                message="Giao dịch không thành công"
                                description={mockFailureData.failureReason}
                                type="error"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />

                            {/* Transaction Info */}
                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Mã đơn hàng:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px', fontWeight: 'bold' }}>
                                    {mockFailureData.orderId}
                                </Text>
                            </div>
                            
                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Mã giao dịch:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockFailureData.transactionId}
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Mã lỗi:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px', color: '#ff4d4f' }}>
                                    {mockFailureData.errorCode}
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Thông báo lỗi:</Text>
                                <Text style={{ fontSize: '14px', marginLeft: '8px', color: '#666' }}>
                                    {mockFailureData.errorMessage}
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Số tiền:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockFailureData.amount.toLocaleString('vi-VN')} ₫
                                </Text>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: '14px', color: '#666' }}>Thời gian:</Text>
                                <Text style={{ fontSize: '16px', marginLeft: '8px' }}>
                                    {mockFailureData.paymentTime}
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    {/* Common Reasons Card */}
                    <Card className="mt-6" title="Nguyên nhân thường gặp">
                        <ul style={{ paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}>
                                <Text>Số dư tài khoản không đủ</Text>
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <Text>Thông tin thẻ không chính xác (số thẻ, ngày hết hạn, CVV)</Text>
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <Text>Thẻ bị khóa hoặc hết hạn</Text>
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <Text>Giao dịch vượt quá hạn mức cho phép</Text>
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <Text>Ngân hàng từ chối giao dịch do nghi ngờ bảo mật</Text>
                            </li>
                            <li>
                                <Text>Kết nối mạng không ổn định</Text>
                            </li>
                        </ul>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-6 text-center">
                        <Space size="large" wrap>
                            <Button 
                                type="primary" 
                                size="large"
                                icon={<ReloadOutlined />}
                                onClick={handleRetryPayment}
                                style={{ minWidth: '150px' }}
                            >
                                Thử lại thanh toán
                            </Button>
                            <Button 
                                size="large"
                                icon={<HomeOutlined />}
                                onClick={handleGoHome}
                                style={{ minWidth: '150px' }}
                            >
                                Về trang chủ
                            </Button>
                            <Button 
                                size="large"
                                onClick={handleContactSupport}
                                style={{ minWidth: '150px' }}
                            >
                                Liên hệ hỗ trợ
                            </Button>
                        </Space>
                    </div>

                    {/* Support Info */}
                    <Card className="mt-6" style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text strong style={{ color: '#d46b08' }}>Cần hỗ trợ?</Text>
                            <Text style={{ color: '#d46b08' }}>
                                Nếu bạn đã bị trừ tiền nhưng đơn hàng chưa được xác nhận, vui lòng liên hệ với chúng tôi:
                            </Text>
                            <Text style={{ color: '#d46b08' }}>
                                <strong>Email:</strong> support@restaurant.com | 
                                <strong> Hotline:</strong> 1900-xxxx
                            </Text>
                            <Text style={{ color: '#d46b08', fontSize: '12px' }}>
                                Vui lòng cung cấp mã đơn hàng: <strong>{mockFailureData.orderId}</strong>
                            </Text>
                        </Space>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VNPayFailed;

