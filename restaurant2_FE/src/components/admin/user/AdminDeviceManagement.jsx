import { useState, useEffect } from 'react';
import { Card, List, Button, Tag, message, Popconfirm, Empty, Spin, Typography, Space, Modal, Select } from 'antd';
import { 
    DesktopOutlined, 
    MobileOutlined, 
    TabletOutlined, 
    LogoutOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    DisconnectOutlined,
    UserOutlined
} from '@ant-design/icons';
import { 
    getAdminUserSessionsAPI, 
    logoutAdminUserSessionAPI, 
    logoutAllAdminUserSessionsAPI,
    fetchAllUser
} from '../../../services/api.service';

const { Text, Title } = Typography;
const { Option } = Select;

const AdminDeviceManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            fetchUserSessions(selectedUserId);
        } else {
            setSessions([]);
        }
    }, [selectedUserId]);

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await fetchAllUser(1, 1000); // Get all users
            const userList = response?.data?.result || [];
            setUsers(userList);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Không thể tải danh sách người dùng');
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchUserSessions = async (userId) => {
        try {
            setLoading(true);
            const response = await getAdminUserSessionsAPI(userId);
            const data = response?.data || response;
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching user sessions:', error);
            message.error('Không thể tải danh sách thiết bị của người dùng');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutSession = async (userId, sessionId) => {
        try {
            await logoutAdminUserSessionAPI(userId, sessionId);
            message.success('Đã đăng xuất thiết bị này');
            fetchUserSessions(userId); // Refresh list
        } catch (error) {
            console.error('Error logging out session:', error);
            message.error('Không thể đăng xuất thiết bị');
        }
    };

    const handleLogoutAll = async (userId) => {
        try {
            await logoutAllAdminUserSessionsAPI(userId);
            message.success('Đã đăng xuất tất cả thiết bị của người dùng này');
            fetchUserSessions(userId); // Refresh list
        } catch (error) {
            console.error('Error logging out all sessions:', error);
            message.error('Không thể đăng xuất tất cả thiết bị');
        }
    };

    const getDeviceIcon = (userAgent) => {
        if (!userAgent) return <DesktopOutlined />;
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return <MobileOutlined />;
        }
        if (ua.includes('tablet') || ua.includes('ipad')) {
            return <TabletOutlined />;
        }
        return <DesktopOutlined />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Vừa xong';
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays < 7) return `${diffDays} ngày trước`;
            
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <Card 
            title={
                <Space>
                    <GlobalOutlined />
                    <span>Quản lý thiết bị đăng nhập</span>
                </Space>
            }
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Text strong>Chọn người dùng: </Text>
                    <Select
                        style={{ width: '100%', marginTop: '8px' }}
                        placeholder="Chọn người dùng để xem thiết bị đăng nhập"
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        loading={usersLoading}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={users.map(user => ({
                            value: user.id,
                            label: `${user.name || user.email} (${user.email})`
                        }))}
                    />
                </div>

                {selectedUserId && (
                    <div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spin size="large" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <Empty 
                                description={
                                    <span>
                                        Người dùng <Text strong>{selectedUser?.name || selectedUser?.email}</Text> không có thiết bị nào đang đăng nhập
                                    </span>
                                } 
                            />
                        ) : (
                            <Card
                                title={
                                    <Space>
                                        <UserOutlined />
                                        <span>
                                            Thiết bị của {selectedUser?.name || selectedUser?.email} ({sessions.length})
                                        </span>
                                    </Space>
                                }
                                extra={
                                    sessions.length > 0 && (
                                        <Popconfirm
                                            title="Đăng xuất tất cả thiết bị?"
                                            description={`Bạn có chắc chắn muốn đăng xuất tất cả thiết bị của ${selectedUser?.name || selectedUser?.email} không?`}
                                            onConfirm={() => handleLogoutAll(selectedUserId)}
                                            okText="Đăng xuất tất cả"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button 
                                                danger 
                                                icon={<DisconnectOutlined />}
                                                size="small"
                                            >
                                                Đăng xuất tất cả
                                            </Button>
                                        </Popconfirm>
                                    )
                                }
                            >
                                <List
                                    dataSource={sessions}
                                    renderItem={(session) => (
                                        <List.Item
                                            actions={[
                                                <Popconfirm
                                                    key="logout"
                                                    title="Đăng xuất thiết bị này?"
                                                    description="Bạn có chắc chắn muốn đăng xuất thiết bị này không?"
                                                    onConfirm={() => handleLogoutSession(selectedUserId, session.sessionId)}
                                                    okText="Đăng xuất"
                                                    cancelText="Hủy"
                                                >
                                                    <Button 
                                                        danger 
                                                        icon={<LogoutOutlined />}
                                                        size="small"
                                                    >
                                                        Đăng xuất
                                                    </Button>
                                                </Popconfirm>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                                                        {getDeviceIcon(session.userAgent)}
                                                    </div>
                                                }
                                                title={
                                                    <Space>
                                                        <Text strong>{session.deviceInfo || 'Unknown Device'}</Text>
                                                    </Space>
                                                }
                                                description={
                                                    <Space direction="vertical" size="small" style={{ fontSize: '12px' }}>
                                                        <div>
                                                            <Text type="secondary">IP: </Text>
                                                            <Text code>{session.clientIp || 'Unknown'}</Text>
                                                        </div>
                                                        <div>
                                                            <ClockCircleOutlined /> 
                                                            <Text type="secondary" style={{ marginLeft: '4px' }}>
                                                                Đăng nhập: {formatDate(session.createdAt)}
                                                            </Text>
                                                        </div>
                                                        {session.lastAccessAt && (
                                                            <div>
                                                                <Text type="secondary">
                                                                    Hoạt động cuối: {formatDate(session.lastAccessAt)}
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </Space>
        </Card>
    );
};

export default AdminDeviceManagement;

