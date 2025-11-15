import React, { useContext, useState } from 'react';
import { Input, Button, Checkbox, Form } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import bg from '../../assets/img/bg_3.jpg.webp';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loginApi } from '../../services/api.service';
import Notification from '../../components/noti/Notification';
import { AuthContext } from '../../components/context/auth.context';
import { persistAccessToken } from '../../utils/token';

const LoginPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [remember, setRemember] = useState(true);
    const navigate = useNavigate();
    const { user, setUser, setAccessToken } = useContext(AuthContext);

    const [notifications, setNotifications] = useState([]);
    
    const addNotification = (messageText, description, type) => {
        const id = Date.now();
        const newNotif = { id, message: messageText, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset errors
        setEmailError('');
        setPasswordError('');

        // Validate inputs
        let isValid = true;
        if (!email) {
            setEmailError('Please enter your email');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Please enter a valid email');
            isValid = false;
        }

        if (!password) {
            setPasswordError('Please enter your password');
            isValid = false;
        }

        if (!isValid) return;

        try {
            setLoading(true);
            const res = await loginApi(email, password);
            if (res && res.data) {
                const { access_token, user } = res.data;
                persistAccessToken(access_token, remember);
                setUser(user);
                setAccessToken(access_token);
                addNotification("Login successful", "Welcome back!", "success");

                // Redirect based on user role
                const role = user.role?.name || '';
                if (role === "SUPER_ADMIN") {
                    navigate("/admin");
                } else if (role === "STAFF") {
                    navigate("/staff");
                } else {
                    navigate("/");
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            addNotification("Login failed", "Invalid email or password. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div
            className="w-screen h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
            style={{ backgroundImage: `url('${bg}')` }}
        >
            <div
                className="w-[850px] h-[460px] rounded-2xl shadow-lg flex items-center justify-center"
                style={{
                    background: 'transparent',
                    backdropFilter: 'blur(55px)',
                }}
            >
                <div className="w-1/2 h-full px-10 py-8 flex flex-col justify-center rounded-l-2xl " style={{
                    padding: "40px"
                }}>
                    <h1 className="text-xl font-bold text-white text-center mb-8">Login</h1>

                    {/* Block: Email */}
                    <div className="mb-4 relative">
                        <label className="block mb-1 font-medium text-white">Email</label>
                        <Input
                            size="large"
                            prefix={<MailOutlined className="text-gray-400" />}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            status={emailError ? 'error' : ''}
                        />
                        {emailError && (
                            <p className="absolute text-red-500 text-sm top-full left-0 mt-1">
                                {emailError}
                            </p>
                        )}
                    </div>

                    {/* Block: Mật khẩu */}
                    <div className="mb-2 relative">
                        <label className="block mb-1 font-medium text-white">Mật khẩu</label>
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            status={passwordError ? 'error' : ''}
                        />
                        <p className="mt-1 text-red-500 text-sm min-h-[1.25rem]">
                            {passwordError || '\u00A0'}
                        </p>
                    </div>

                    {/* Block: Ghi nhớ và Quên mật khẩu */}
                    <div className="flex justify-between items-center mb-3 " >
                        <Checkbox className="text-white" checked={remember} onChange={(e) => setRemember(e.target.checked)}>
                            Remember me
                        </Checkbox>
                        <a href="#" className="text-sm text-white hover:text-[#C8A97E] transition">
                            Forgot password?
                        </a>
                    </div>

                    {/* Block: Nút đăng nhập */}
                    <Button
                        type="primary"
                        size="large"
                        className="btn"
                        onClick={handleSubmit} // Gọi hàm thủ công
                    >
                        Login
                    </Button>

                    {/* Block: Link đăng ký */}
                    <div className="text-center text-sm text-white mt-4">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register" className="primary-color font-medium hover:underline text-white">
                                Register now
                            </Link>
                        </p>
                    </div>

                </div>

                {/* Cột phải giữ nguyên */}
                <div
                    className="w-1/2 h-full  flex flex-col justify-center items-center "
                    style={{
                        background: 'white',
                        clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 40% 100%)',
                        borderRadius: '20px',
                    }}
                >
                    <p
                        className="text-[80px]  text-[#C8A97E] font-primary leading-none mb-0"
                        style={{
                            paddingLeft: '70px',
                        }}
                    >
                        Feliciano
                    </p>
                    <div
                        className="w-full "
                        style={{
                            paddingRight: '60px',
                        }}
                    >
                        <p
                            className="text-black  text-md text-end"
                            style={{
                                marginTop: '10px',
                                fontSize: '26px',
                                lineHeight: '24px',
                                letterSpacing: '1px',
                                fontStyle: 'italic',
                                marginBottom: "0",
                                fontWeight: "300"
                            }}
                        >
                            Restaurant
                        </p>
                    </div>

                    <div
                        className="w-full "
                        style={{
                            paddingRight: '60px',
                            fontStyle: 'italic',
                        }}
                    >
                        <p className=" text-black text-end"
                            style={{
                                marginTop: '10px',
                                fontSize: '22px',
                                lineHeight: '24px',
                                letterSpacing: '1px',
                                fontStyle: 'italic',
                                marginBottom: "0",
                                fontWeight: "300"
                            }}>Best choice for you!</p>
                    </div>
                </div>
            </div>

            {/* Hiển thị thông báo */}
            <div className="fixed top-4 right-4 z-[9999]">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
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

export default LoginPage;
