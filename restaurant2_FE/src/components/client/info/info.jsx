import { Avatar, Button, Input, message, Select, Upload } from 'antd';
import {
    LockOutlined, MailOutlined, UserOutlined,
    PhoneOutlined, HomeOutlined, UploadOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import bg1 from '../../../assets/img/bg_1.jpg.webp';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/auth.context';
import Notification from '../../noti/Notification';
import { handleUploadFile, updateUserApi } from '../../../services/api.service';

const { Option } = Select;

export const InfoPage = () => {
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
    const navigate = useNavigate();

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    const renderData = () => {
        setUserName(user.username);
        setPhone(user.phone);
        setGender(user.gender);
        setAddress(user.address);
        setEmail(user.email);
        setRole(user.role);
        if (user.avatar) {
            setAvatarUrl(user.avatar);
        }
    };

    useEffect(() => {
        renderData();
    }, [user]);

    const handleImageUpload = async (file) => {
        // Hiển thị preview
        debugger
        // Tạo URL tạm thời để hiển thị ảnh xem trước
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);


        try {
            const uploadResponse = await handleUploadFile(file);
            console.log("Lỗi upload ảnh:", uploadResponse);

            const fileName = uploadResponse.data;

            // Update avatar trong server và context
            const res = await updateUserApi(user.id, userName, gender, phone, address, fileName);
            if (res.data) {
                addNotification("Cập nhật ảnh", "Ảnh đại diện đã được cập nhật", "success");
                setUser(res.data);
                setAvatarUrl(uploadedUrl);
            } else {
                addNotification("Lỗi", "Không thể cập nhật avatar", "error");
            }
        } catch (error) {
            console.error("Upload thất bại:", error);
            message.error("Upload ảnh thất bại!");
        }

        return false; // Ngăn không cho Upload tự động
    };

    const handleSubmit = async () => {
        debugger
        const res = await updateUserApi(user.id, userName, gender, phone, address, avatarUrl);
        if (res.data) {
            addNotification("Cập nhật thành công", "Thông tin người dùng đã được cập nhật", "success");
            setUser(res.data);
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } else {
            addNotification("Lỗi cập nhật", res.error || "Đã xảy ra lỗi", "error");
        }
    };

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

            {/* Form */}
            <div className="relative z-10 flex justify-center w-full" style={{ marginTop: "150px" }}>
                <div className="w-full max-w-2xl bg-white px-5 py-5 rounded-2xl shadow-lg">
                    <h1 className="text-xl font-bold text-gray-800 text-center mb-6">Thông tin khách hàng</h1>

                    {/* Avatar */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <Avatar size={100} src={avatarUrl} className="mb-2" />
                        <Upload
                            beforeUpload={handleImageUpload}
                            showUploadList={false}
                        >
                            {/* <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                                Cập nhật hình ảnh
                            </Button> */}
                        </Upload>
                    </div>

                    {/* Form Fields */}
                    <div className="flex flex-wrap gap-x-6 mt-3">
                        <div className="mb-4 md:w-[calc(50%-12px)]">
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

                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Email</label>
                            <Input
                                size="large"
                                prefix={<MailOutlined className="text-gray-400" />}
                                placeholder="Email"
                                disabled
                                value={email}
                            />
                        </div>

                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Số điện thoại</label>
                            <Input
                                size="large"
                                prefix={<PhoneOutlined className="text-gray-400" />}
                                placeholder="Số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className="mb-4 md:w-[calc(50%-12px)]">
                            <label className="block mb-1 font-medium text-gray-800">Giới tính</label>
                            <Select
                                size="large"
                                className="w-full"
                                placeholder="Chọn giới tính"
                                value={gender}
                                onChange={(value) => setGender(value)}
                            >
                                <Option value="MALE">Nam</Option>
                                <Option value="FEMALE">Nữ</Option>
                                <Option value="OTHER">Khác</Option>
                            </Select>
                        </div>

                        <div className="mb-4 w-full">
                            <label className="block mb-1 font-medium text-gray-800">Địa chỉ</label>
                            <Input
                                size="large"
                                prefix={<HomeOutlined className="text-gray-400" />}
                                placeholder="Địa chỉ"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        className="btn mt-2 w-full"
                        onClick={handleSubmit}
                    >
                        Cập nhật
                    </Button>
                </div>
            </div>

            {/* Notification */}
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
