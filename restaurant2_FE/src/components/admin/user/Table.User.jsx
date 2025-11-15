import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, Select, Tag, Space, Card, Typography } from "antd";
import { EditOutlined, UserOutlined, ReloadOutlined } from "@ant-design/icons";
import Notification from "../../noti/Notification";
import { fetchAllUser, fetchAllRoles, updateUserApi } from "../../../services/api.service";
import AddressSelector from "../../common/AddressSelector";

const { Option } = Select;

const UserTable = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(8);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // State cho modal
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [userRole, setUserRole] = useState("");

    const addNotification = (message, description, type) => {
        Notification({ message, description, type });
    };

    const getUsers = async (page, size) => {
        try {
            setLoading(true);
            const res = await fetchAllUser(page, size);
            setUsers(res.data.result);
            setTotal(res.data.meta.total);
        } catch (error) {
            addNotification("Lỗi", "Không thể tải danh sách người dùng", "error");
        } finally {
            setLoading(false);
        }
    };

    const getRoles = async () => {
        try {
            const res = await fetchAllRoles();
            setRoles(res.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    useEffect(() => {
        getUsers(page, size);
        getRoles();
    }, [page, size]);

    const handleView = (user) => {
        setSelectedUser(user);
        setUserName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setGender(user.gender || "");
        setAddress(user.address || "");
        setAvatarUrl(user.avatar || "");
        setUserRole(user.role || "");
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleSubmit = async () => {
        try {
            await updateUserApi(selectedUser.id, userName, gender, phone, address);
            addNotification("Thành công", "Đã cập nhật thông tin người dùng", "success");
            setIsModalVisible(false);
            getUsers(page, size);
        } catch (error) {
            addNotification("Lỗi", "Không thể cập nhật thông tin người dùng", "error");
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'red';
            case 'STAFF': return 'blue';
            case 'USER': return 'green';
            default: return 'default';
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "Tên", dataIndex: "name", key: "name", ellipsis: true },
        { title: "Email", dataIndex: "email", key: "email", ellipsis: true },
        { 
            title: "Vai trò", 
            dataIndex: "role", 
            key: "role",
            width: 120,
            render: (role) => (
                <Tag color={getRoleColor(role)} icon={<UserOutlined />}>
                    {role}
                </Tag>
            )
        },
        { title: "Giới tính", dataIndex: "gender", key: "gender", width: 100 },
        { title: "Địa chỉ", dataIndex: "address", key: "address", ellipsis: true },
        {
            title: "Hành động",
            key: "action",
            width: 100,
            render: (_, record) => (
                <Button 
                    icon={<EditOutlined />}
                    onClick={() => handleView(record)} 
                    type="primary"
                    size="small"
                >
                    Sửa
                </Button>
            )
        }
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: size,
                    total,
                    onChange: (p, s) => {
                        setPage(p);
                        setSize(s);
                    }
                }}
            />

            <Modal
                title="Thông tin người dùng"
                visible={isModalVisible}
                onCancel={handleCancel}
                onOk={handleSubmit}
                okText="Cập nhật"
                cancelText="Đóng"
            >
                {selectedUser && (
                    <div>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <img
                                src={avatarUrl || "https://via.placeholder.com/100"}
                                alt="Avatar"
                                width={100}
                                height={100}
                                style={{ borderRadius: "50%", objectFit: "cover" }}
                            />
                        </div>
                        <Input
                            style={{ marginBottom: 10 }}
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Tên người dùng"
                        />
                        <Input
                            style={{ marginBottom: 10 }}
                            value={email}
                            disabled
                            placeholder="Email (không thể sửa)"
                        />
                        <Input
                            style={{ marginBottom: 10 }}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Số điện thoại"
                        />
                        <Select
                            value={gender}
                            onChange={(value) => setGender(value)}
                            style={{ width: "100%", marginBottom: 10 }}
                            placeholder="Giới tính"
                        >
                            <Option value="MALE">Nam</Option>
                            <Option value="FEMALE">Nữ</Option>
                        </Select>
                        <AddressSelector value={address} onChange={setAddress} />
                        <Select
                            style={{ width: "100%", marginBottom: 10 }}
                            value={userRole}
                            onChange={setUserRole}
                            placeholder="Vai trò"
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.name}>
                                    {role.name} - {role.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default UserTable;
