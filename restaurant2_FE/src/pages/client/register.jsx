import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import bg from '../../assets/img/bg_3.jpg.webp';
import { Link, useNavigate } from 'react-router-dom';
import { createUserApi } from '../../services/api.service';
import Notification from '../../components/noti/Notification';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setPasswordConfirm] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setPasswordConfirmError] = useState('');
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);


    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };


    const handleSubmitButton = async () => {
        try {
            const res = await createUserApi(username, password, email);
            if (res.data) {
                addNotification("create user", "Tạo user thành công", "success");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                addNotification("Error create user", JSON.stringify(res.error), "error");
            }
        } catch {
            addNotification("Error", "Đã có lỗi xảy ra", "error");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let valid = true;

        if (!username) {
            setUsernameError('Vui lòng nhập tên người dùng!');
            valid = false;
        } else {
            setUsernameError('');
        }

        if (!email) {
            setEmailError('Vui lòng nhập email!');
            valid = false;
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('Vui lòng nhập mật khẩu!');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!confirmPassword) {
            setPasswordConfirmError('Vui lòng xác nhận mật khẩu!');
            valid = false;
        } else if (confirmPassword !== password) {
            setPasswordConfirmError('Mật khẩu xác nhận không khớp!');
            valid = false;
        } else {
            setPasswordConfirmError('');
        }

        if (valid) {
            handleSubmitButton();
        }
    };

    return (
        <div
            className="w-screen h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
            style={{ backgroundImage: `url('${bg}')` }}
        >
            <div
                className="w-[950px] h-[700px] rounded-2xl shadow-lg flex items-center justify-center"
                style={{
                    background: 'transparent',
                    backdropFilter: 'blur(55px)',
                }}
            >
                <div
                    className="w-1/2 h-full px-10 py-8 flex flex-col justify-center rounded-l-2xl"
                    style={{ padding: '40px' }}
                >
                    <h1 className="text-xl font-bold text-white text-center mb-6">Register</h1>

                    {/* Username */}
                    <div className="mb-0.5 relative">
                        <label className="block mb-1 font-medium text-white">Tên người dùng</label>
                        <Input
                            size="large"
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Nhập tên người dùng"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            status={usernameError ? 'error' : ''}
                        />
                        <p className="mt-1 text-red-500 text-sm min-h-[1.25rem]" >
                            {usernameError || '\u00A0'}
                        </p>
                    </div>

                    {/* Email */}
                    <div className="mb-0.5 relative">
                        <label className="block mb-1 font-medium text-white">Email</label>
                        <Input
                            size="large"
                            prefix={<MailOutlined className="text-gray-400" />}
                            placeholder="Nhập email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            status={emailError ? 'error' : ''}
                        />
                        <p className="mt-1 text-red-500 text-sm min-h-[1.25rem] mb-0.5">
                            {emailError || '\u00A0'}
                        </p>
                    </div>

                    {/* Password */}
                    <div className="mb-0.5 relative">
                        <label className="block mb-1 font-medium text-white">Mật khẩu</label>
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            status={passwordError ? 'error' : ''}
                        />
                        <p className="mt-1 text-red-500 text-sm min-h-[1.25rem] mb-0.5">
                            {passwordError || '\u00A0'}
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-0.5 relative">
                        <label className="block mb-1 font-medium text-white">Xác nhận mật khẩu</label>
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            status={confirmPasswordError ? 'error' : ''}
                        />
                        <p className="mt-1 text-red-500 text-sm min-h-[1.25rem] mb-0.5">
                            {confirmPasswordError || '\u00A0'}
                        </p>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        className="btn mt-2"
                        onClick={handleSubmit}
                    >
                        Đăng ký
                    </Button>

                    <div className="text-center text-sm text-white mt-3">
                        <p>
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="primary-color font-medium hover:underline text-white">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Cột phải giữ nguyên */}
                <div
                    className="w-1/2 h-full flex flex-col justify-center items-center"
                    style={{
                        background: 'white',
                        clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 40% 100%)',
                        borderRadius: '20px',
                    }}
                >
                    <p className="text-[80px] text-[#C8A97E] font-primary leading-none mb-0" style={{ paddingLeft: '70px' }}>
                        Feliciano
                    </p>
                    <div className="w-full" style={{ paddingRight: '60px' }}>
                        <p className="text-black text-md text-end" style={{ fontSize: '26px', fontStyle: 'italic', fontWeight: '300', marginTop: '10px', marginBottom: '0' }}>
                            Restaurant
                        </p>
                    </div>
                    <div className="w-full" style={{ paddingRight: '60px', fontStyle: 'italic' }}>
                        <p className="text-black text-end" style={{ fontSize: '22px', fontStyle: 'italic', fontWeight: '300', marginTop: '10px', marginBottom: '0' }}>
                            Best choice for you!
                        </p>
                    </div>
                </div>
            </div>

            {/* Hiển thị thông báo */}
            <div className="fixed top-4 right-4 z-[9999]">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.error}
                        description={notif.description}
                        type={notif.type}
                        onClose={() => {
                            setNotifications((prev) =>
                                prev.filter((item) => item.id !== notif.id)
                            );
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default RegisterPage;
