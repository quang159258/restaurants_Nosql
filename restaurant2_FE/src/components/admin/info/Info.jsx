import { Avatar, Button, Input, message, Select, Upload } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import bg1 from '../../../assets/img/bg_1.jpg.webp'; // vẫn giữ hình nền
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/auth.context';
import { updateUserApi } from '../../../services/api.service';
import Notification from '../../noti/Notification';

const { Option } = Select;

export const InfoPageAdmin = () => {
    const { user, setUser } = useContext(AuthContext);
    const [userName, setUserName] = useState();
    const [phone, setPhone] = useState();
    const [gender, setGender] = useState();
    const [address, setAddress] = useState();
    const [email, setEmail] = useState();
    const [role, setRole] = useState();
    const [avatarUrl, setAvatarUrl] = useState(
        'https://api.dicebear.com/7.x/thumbs/svg?seed=defaultUser'
    );
    const [notifications, setNotifications] = useState([]);
    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };
    const navigate = useNavigate(); // thêm


    const renderData = () => {
        setUserName(user.username);
        setPhone(user.phone);
        setGender(user.gender);
        setAddress(user.address);
        setEmail(user.email);
        setRole(user.role);
    }
    useEffect(() => {
        renderData();
    }, [user])
    const handleAvatarChange = (info) => {
        const file = info.file.originFileObj;
        if (!file.type.startsWith('image/')) {
            message.error('Chỉ hỗ trợ định dạng ảnh!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    };
    const handleSubmit = async () => {
        debugger
        const res = await updateUserApi(user.id, userName, gender, phone, address);
        if (res.data) {
            addNotification("Update success", "Cập nhật thông tin thành công", "success");
            setUser(res.data);
            console.log("check ", userName, gender, phone, address)

            setTimeout(() => {
                navigate("/");
            }, 2000)
        } else {
            addNotification("Update fall", res.error, "error");

        }
    }
    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Background ảnh */}
            <div
                className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
                style={{
                    backgroundImage: `url(${bg1})`,
                    filter: 'brightness(0.3)',
                    zIndex: -1,
                }}
            />

            {/* Form nằm phía trên background */}
            <div className="relative z-10 flex  justify-center w-full  ">
                <div className="w-full max-w-2xl bg-white px-10 py-8 rounded-2xl shadow-lg p-4">
                    <h1 className="text-xl font-bold text-gray-800 text-center mb-6">Thông tin người dùng</h1>

                    {/* Avatar */}
                    <div className="flex items-center justify-center mb-6">
                        <div>

                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={handleAvatarChange}
                            >
                                <Avatar
                                    size={96}
                                    src={avatarUrl}
                                    className="cursor-pointer hover:opacity-80"
                                    alt="Avatar"
                                />
                            </Upload>
                            <p className="block mb-1 font-medium text-gray-800 text-center">Avatar</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 mt-3">
                        {/* Username */}
                        <div className="mb-4 md:w-[calc(50%-12px)] ">
                            <label className="block mb-1 font-medium text-gray-800">Tên người dùng</label>
                            <Input
                                size="large"
                                prefix={<UserOutlined className="text-gray-400" />}
                                placeholder="Nhập tên người dùng"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Email</label>
                            <Input
                                size="large"
                                prefix={<MailOutlined className="text-gray-400" />}
                                placeholder="Nhập email"
                                disabled
                                value={email}
                            />
                        </div>

                        {/* Phone */}
                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Số điện thoại</label>
                            <Input
                                size="large"
                                prefix={<PhoneOutlined className="text-gray-400" />}
                                placeholder="Nhập số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>



                        {/* Gender */}
                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Giới tính</label>
                            <Select
                                size="large"
                                className="w-full"
                                placeholder="Chọn giới tính"
                                value={gender}
                                onChange={(value) => setGender(value)}
                            >
                                <Option value="MALE">Male</Option>
                                <Option value="FEMALE">Female</Option>
                                <Option value="OTHER">Other</Option>
                            </Select>
                        </div>

                        {/* Phone */}
                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Vai trò</label>
                            <Input
                                size="large"
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Nhập số điện thoại"
                                value={role}
                                onChange={(e) => setPhone(e.target.value)

                                }
                            />
                        </div>

                        {/* Address */}
                        <div className="mb-4 w-100">
                            <label className="block mb-1 font-medium text-gray-800">Địa chỉ</label>
                            <Input
                                size="large"
                                prefix={<HomeOutlined className="text-gray-400" />}
                                placeholder="Nhập địa chỉ"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                    </div>



                    <Button
                        type="primary"
                        size="large"
                        className="btn mt-2 w-full"
                        onClick={() => { handleSubmit() }}
                    >
                        Update
                    </Button>
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
    )
}
