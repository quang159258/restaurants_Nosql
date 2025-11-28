import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import bg from '../../assets/img/bg_3.jpg.webp';
import { Link, useNavigate } from 'react-router-dom';
import { registerUserApi } from '../../services/api.service';
import Notification from '../../components/noti/Notification';
import AddressSelector from '../../components/common/AddressSelector';

const { Title, Text } = Typography;

const RegisterPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, description, type) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, description, type }]);
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const res = await registerUserApi(
                values.fullName,
                values.email,
                values.password,
                values.phone,
                values.address
            );
            if (res?.data) {
                addNotification("Đăng ký thành công", "Vui lòng đăng nhập để tiếp tục", "success");
                setTimeout(() => navigate('/login'), 1500);
            } else {
                addNotification("Đăng ký thất bại", res?.message || "Vui lòng thử lại", "error");
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || "Đã có lỗi xảy ra";
            addNotification("Đăng ký thất bại", errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center flex items-center justify-center px-4 py-8"
            style={{ backgroundImage: `url('${bg}')` }}
        >
            <Row className="w-full max-w-5xl bg-white/90 rounded-2xl shadow-2xl overflow-hidden">
                <Col xs={24} md={12} className="bg-white p-8">
                    <div className="mb-6 text-center">
                        <Title level={2} style={{ marginBottom: 0 }}>Tạo tài khoản</Title>
                        <Text type="secondary">Hoàn tất thông tin để trải nghiệm Feliciano</Text>
                    </div>
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                            <Input size="large" prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không hợp lệ" }
                            ]}
                        >
                            <Input size="large" prefix={<MailOutlined />} placeholder="email@example.com" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label="Mật khẩu"
                                    rules={[
                                        { required: true, message: "Nhập mật khẩu" },
                                        { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }
                                    ]}
                                >
                                    <Input.Password size="large" prefix={<LockOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Xác nhận mật khẩu"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: "Nhập lại mật khẩu" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password size="large" prefix={<LockOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[
                                { required: true, message: "Nhập số điện thoại" },
                                { pattern: /^\d{10,11}$/, message: "Số điện thoại không hợp lệ" }
                            ]}
                        >
                            <Input size="large" prefix={<PhoneOutlined />} placeholder="0123456789" />
                        </Form.Item>

                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: "Vui lòng chọn địa chỉ" }]}
                        >
                            <AddressSelector
                                value={form.getFieldValue("address")}
                                onChange={(value) => form.setFieldsValue({ address: value })}
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                        >
                            Đăng ký
                        </Button>

                        <div className="text-center mt-4">
                            <Text>Đã có tài khoản? </Text>
                            <Link to="/login">Đăng nhập ngay</Link>
                        </div>
                    </Form>
                </Col>
                <Col xs={24} md={12} className="bg-[#0f172a] text-white p-10 flex flex-col justify-between">
                    <div>
                        <p className="text-5xl font-[Great_Vibes,cursive] text-[#C8A97E] mb-2">Feliciano</p>
                        <p className="text-xl italic">Best choice for your dining experience</p>
                    </div>
                    <div className="space-y-4">
                        <p>✔️ Đặt bàn nhanh chóng</p>
                        <p>✔️ Theo dõi đơn hàng của bạn</p>
                        <p>✔️ Nhận ưu đãi độc quyền</p>
                    </div>
                </Col>
            </Row>

            <div className="fixed top-4 right-4 z-[9999]">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
                        description={notif.description}
                        type={notif.type}
                        onClose={() => setNotifications((prev) => prev.filter((item) => item.id !== notif.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default RegisterPage;
