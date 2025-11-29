import { Avatar, Button, Input, message, Select, Upload, Divider } from 'antd';
import {
    MailOutlined, UserOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import bg1 from '../../../assets/img/bg_1.jpg.webp';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/auth.context';
import Notification from '../../noti/Notification';
import { handleUploadFile, updateUserApi, changePassword, getAccountAPI } from '../../../services/api.service';
import AddressSelector from '../../common/AddressSelector';
import DeviceList from '../DeviceManagement/DeviceList';

const { Option } = Select;

// Helper function to normalize role
const normalizeRole = (role) => {
    if (typeof role === "string") return role;
    return role?.name || "";
};

export const InfoPage = () => {
    const { user, setUser } = useContext(AuthContext);
    const [userName, setUserName] = useState();
    const [phone, setPhone] = useState();
    const [gender, setGender] = useState();
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState();
    const [role, setRole] = useState();
    const [avatarUrl, setAvatarUrl] = useState(
        'https://api.dicebear.com/7.x/thumbs/svg?seed=defaultUser'
    );
    const [notifications, setNotifications] = useState([]);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
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
        setAddress(user.address || "");
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
        // Tạo URL tạm thời để hiển thị ảnh xem trước
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarUrl(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            const uploadResponse = await handleUploadFile(file);
            const fileName = uploadResponse?.data || uploadResponse;

            if (!fileName) {
                throw new Error("Không lấy được tên file sau khi upload");
            }

            // Update avatar trong server và context
            // Note: Avatar is handled separately, not in updateUserApi
            const res = await updateUserApi(user.id, userName, gender, phone, address);
            if (res && res.data) {
                // Fetch updated user info to get full user object
                const accountRes = await getAccountAPI();
                if (accountRes && accountRes.data) {
                    setUser(accountRes.data);
                }
                addNotification("Cập nhật ảnh", "Ảnh đại diện đã được cập nhật", "success");
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
        try {
            const res = await updateUserApi(user.id, userName, gender, phone, address);
            if (res && res.data) {
                // Fetch updated user info to get full user object
                const accountRes = await getAccountAPI();
                if (accountRes && accountRes.data) {
                    setUser(accountRes.data);
                }
                addNotification("Cập nhật thành công", "Thông tin người dùng đã được cập nhật", "success");
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } else {
                addNotification("Lỗi cập nhật", res?.error || "Đã xảy ra lỗi", "error");
            }
        } catch (error) {
            console.error("Update error:", error);
            addNotification("Lỗi cập nhật", error?.response?.data?.message || "Đã xảy ra lỗi", "error");
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            addNotification("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường mật khẩu", "warning");
            return;
        }
        if (newPassword.length < 6) {
            addNotification("Mật khẩu yếu", "Mật khẩu mới phải có ít nhất 6 ký tự", "warning");
            return;
        }
        if (newPassword !== confirmPassword) {
            addNotification("Không khớp", "Xác nhận mật khẩu không trùng khớp", "warning");
            return;
        }
        try {
            setPasswordLoading(true);
            await changePassword({ currentPassword, newPassword, confirmPassword });
            addNotification("Thành công", "Đã đổi mật khẩu", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Không thể đổi mật khẩu";
            addNotification("Lỗi", errorMsg, "error");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-x-hidden pb-16">
            {/* Background ảnh */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{
                    backgroundImage: `url(${bg1})`,
                    filter: 'brightness(0.3)',
                    zIndex: -1,
                }}
            />

            {/* Form */}
            <div className="relative z-10 flex justify-center w-full py-16">
                <form className="w-full max-w-2xl bg-white px-5 py-5 rounded-2xl shadow-lg" autoComplete="off">
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
                            <AddressSelector value={address} onChange={setAddress} />
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

                    <Divider />

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h2>
                        <Input.Password
                            placeholder="Mật khẩu hiện tại"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            size="large"
                            autoComplete="off"
                        />
                        <Input.Password
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            size="large"
                            autoComplete="off"
                        />
                        <Input.Password
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            size="large"
                            autoComplete="off"
                        />
                        <Button
                            type="primary"
                            danger
                            ghost
                            block
                            loading={passwordLoading}
                            onClick={handleChangePassword}
                        >
                            Đổi mật khẩu
                        </Button>
                    </div>

                    <Divider />

                    {/* Device Management - All users can see their own sessions */}
                    <div className="mt-4">
                        <DeviceList />
                    </div>
                </form>
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
