import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Card,
    Typography,
    Space,
    Tag,
    Popconfirm,
    message,
    Descriptions,
    Modal,
    Badge,
    Tooltip
} from "antd";
import {
    ReloadOutlined,
    LogoutOutlined,
    DeleteOutlined,
    EyeOutlined,
    DesktopOutlined,
    MobileOutlined,
    TabletOutlined,
    GlobalOutlined
} from "@ant-design/icons";
import { fetchAllUser, getAdminUserSessionsAPI, logoutAdminUserSessionAPI, logoutAllAdminUserSessionsAPI } from "../../../services/api.service";
import Notification from "../../noti/Notification";

const { Title } = Typography;

const SessionManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState({});
    const [userSessions, setUserSessions] = useState({});
    const [expandedRows, setExpandedRows] = useState([]);
    const [sessionModalVisible, setSessionModalVisible] = useState(false);
    const [selectedUserSessions, setSelectedUserSessions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const addNotification = (message, description, type) => {
        Notification({ message, description, type });
    };

    const getUsers = async () => {
        try {
            setLoading(true);
            const res = await fetchAllUser(1, 1000); // Lấy tất cả users
            const usersList = res.data.result || [];
            setUsers(usersList);
            
            // Tự động load sessions cho tất cả users
            if (usersList.length > 0) {
                await loadAllUserSessions(usersList);
            }
        } catch (error) {
            addNotification("Lỗi", "Không thể tải danh sách người dùng", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadAllUserSessions = async (usersList) => {
        // Load sessions cho tất cả users song song
        const sessionPromises = usersList.map(user => 
            getUserSessions(user.id).catch(error => {
                // Bỏ qua lỗi cho từng user, không hiển thị notification
                console.warn(`Failed to load sessions for user ${user.id}:`, error);
                return [];
            })
        );
        
        await Promise.all(sessionPromises);
    };

    const getUserSessions = async (userId, showError = false) => {
        try {
            setSessionsLoading(prev => ({ ...prev, [userId]: true }));
            const res = await getAdminUserSessionsAPI(userId);
            
            // Backend trả về ResponseEntity<List<ResSessionInfoDTO>>
            // Axios interceptor unwrapResponse sẽ trả về response.data nếu có response.data.data
            // Nếu không, trả về response (có thể là response.data)
            // Vì backend trả về List trực tiếp, response.data sẽ là array
            let sessions = [];
            if (Array.isArray(res)) {
                // Nếu interceptor đã unwrap và trả về array trực tiếp
                sessions = res;
            } else if (res && Array.isArray(res.data)) {
                // Nếu interceptor trả về { data: [...] }
                sessions = res.data;
            } else {
                // Fallback
                sessions = res?.data || [];
            }
            
            console.log(`[DEBUG] Parsed sessions for user ${userId}:`, sessions);
            console.log(`[DEBUG] Sessions count:`, sessions.length);
            setUserSessions(prev => ({ ...prev, [userId]: sessions }));
            return sessions;
        } catch (error) {
            console.error(`[ERROR] Failed to load sessions for user ${userId}:`, error);
            console.error(`[ERROR] Error response:`, error.response);
            if (showError) {
                addNotification("Lỗi", `Không thể tải sessions của user ${userId}: ${error.message || 'Unknown error'}`, "error");
            }
            // Set empty array on error
            setUserSessions(prev => ({ ...prev, [userId]: [] }));
            return [];
        } finally {
            setSessionsLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleLogoutSession = async (userId, sessionId) => {
        try {
            await logoutAdminUserSessionAPI(userId, sessionId);
            addNotification("Thành công", "Đã đăng xuất session", "success");
            // Refresh sessions
            await getUserSessions(userId);
        } catch (error) {
            addNotification("Lỗi", "Không thể đăng xuất session", "error");
        }
    };

    const handleLogoutAllSessions = async (userId) => {
        try {
            await logoutAllAdminUserSessionsAPI(userId);
            addNotification("Thành công", "Đã đăng xuất tất cả sessions", "success");
            // Refresh sessions
            await getUserSessions(userId);
        } catch (error) {
            addNotification("Lỗi", "Không thể đăng xuất tất cả sessions", "error");
        }
    };

    const handleViewSessions = async (userId) => {
        const sessions = await getUserSessions(userId, true);
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setSelectedUserSessions(sessions);
        setSessionModalVisible(true);
    };

    const getDeviceIcon = (userAgent) => {
        if (!userAgent) return <DesktopOutlined />;
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return <MobileOutlined />;
        }
        if (ua.includes("tablet") || ua.includes("ipad")) {
            return <TabletOutlined />;
        }
        return <DesktopOutlined />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        } catch (error) {
            return dateString;
        }
    };

    const getSessionCount = (userId) => {
        return userSessions[userId]?.length || 0;
    };

    useEffect(() => {
        getUsers();
    }, []);

    const sessionColumns = [
        {
            title: "Thiết bị",
            key: "device",
            width: 100,
            render: (_, record) => (
                <Space>
                    {getDeviceIcon(record.userAgent)}
                    <span>{record.deviceInfo || "Unknown"}</span>
                </Space>
            )
        },
        {
            title: "IP Address",
            dataIndex: "clientIp",
            key: "clientIp",
            width: 150
        },
        {
            title: "User Agent",
            dataIndex: "userAgent",
            key: "userAgent",
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text?.substring(0, 50)}...</span>
                </Tooltip>
            )
        },
        {
            title: "Thời gian tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 180,
            render: (text) => formatDate(text)
        },
        {
            title: "Truy cập cuối",
            dataIndex: "lastAccessAt",
            key: "lastAccessAt",
            width: 180,
            render: (text) => formatDate(text)
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 120,
            render: (_, record) => (
                <Space>
                    {record.current || record.isCurrent ? (
                        <Tag color="green">Phiên hiện tại</Tag>
                    ) : record.active ? (
                        <Tag color="blue">Đang hoạt động</Tag>
                    ) : (
                        <Tag color="default">Không hoạt động</Tag>
                    )}
                </Space>
            )
        },
        {
            title: "Hành động",
            key: "action",
            width: 120,
            render: (_, record) => (
                <Popconfirm
                    title="Bạn có chắc muốn đăng xuất session này?"
                    onConfirm={() => handleLogoutSession(record.userId, record.sessionId)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                >
                    <Button
                        danger
                        size="small"
                        icon={<LogoutOutlined />}
                        disabled={record.isCurrent}
                    >
                        Đăng xuất
                    </Button>
                </Popconfirm>
            )
        }
    ];

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80
        },
        {
            title: "Tên người dùng",
            dataIndex: "name",
            key: "name",
            ellipsis: true
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            ellipsis: true
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            width: 120,
            render: (role) => {
                const color = role === "SUPER_ADMIN" ? "red" : role === "STAFF" ? "blue" : "green";
                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            title: "Số phiên đăng nhập",
            key: "sessionCount",
            width: 150,
            render: (_, record) => {
                const count = getSessionCount(record.id);
                return (
                    <Space>
                        <Badge count={count} showZero>
                            <span>{count} phiên</span>
                        </Badge>
                    </Space>
                );
            }
        },
        {
            title: "Hành động",
            key: "action",
            width: 200,
            render: (_, record) => {
                const userId = record.id;
                const sessionCount = getSessionCount(userId);
                return (
                    <Space>
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewSessions(userId)}
                            loading={sessionsLoading[userId]}
                        >
                            Xem phiên
                        </Button>
                        {sessionCount > 0 && (
                            <Popconfirm
                                title="Bạn có chắc muốn đăng xuất tất cả sessions của user này?"
                                onConfirm={() => handleLogoutAllSessions(userId)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                >
                                    Đăng xuất tất cả
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                );
            }
        }
    ];

    return (
        <div>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2} className="m-0 flex items-center gap-2">
                        <GlobalOutlined />
                        Quản lý phiên đăng nhập
                    </Title>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={async () => {
                                await getUsers();
                            }}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} người dùng`
                    }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <GlobalOutlined />
                        <span>Chi tiết phiên đăng nhập - {selectedUser?.name || selectedUser?.email}</span>
                    </Space>
                }
                open={sessionModalVisible}
                onCancel={() => setSessionModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setSessionModalVisible(false)}>
                        Đóng
                    </Button>,
                    selectedUserSessions.length > 0 && (
                        <Popconfirm
                            key="logoutAll"
                            title="Bạn có chắc muốn đăng xuất tất cả sessions?"
                            onConfirm={() => {
                                handleLogoutAllSessions(selectedUser?.id);
                                setSessionModalVisible(false);
                            }}
                            okText="Đồng ý"
                            cancelText="Hủy"
                        >
                            <Button key="logoutAll" danger icon={<DeleteOutlined />}>
                                Đăng xuất tất cả
                            </Button>
                        </Popconfirm>
                    )
                ]}
                width={1200}
            >
                {selectedUserSessions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <Typography.Text type="secondary">
                            Người dùng này không có phiên đăng nhập nào đang hoạt động.
                        </Typography.Text>
                    </div>
                ) : (
                    <Table
                        columns={sessionColumns.map(col => {
                            if (col.key === "action") {
                                return {
                                    ...col,
                                    render: (_, record) => (
                                        <Popconfirm
                                            title="Bạn có chắc muốn đăng xuất session này?"
                                            onConfirm={() => handleLogoutSession(selectedUser?.id, record.sessionId)}
                                            okText="Đồng ý"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                danger
                                                size="small"
                                                icon={<LogoutOutlined />}
                                                disabled={record.isCurrent}
                                            >
                                                Đăng xuất
                                            </Button>
                                        </Popconfirm>
                                    )
                                };
                            }
                            return col;
                        })}
                        dataSource={selectedUserSessions.map(session => ({
                            ...session,
                            userId: selectedUser?.id
                        }))}
                        rowKey="sessionId"
                        pagination={false}
                        size="small"
                    />
                )}
            </Modal>
        </div>
    );
};

export default SessionManagement;

