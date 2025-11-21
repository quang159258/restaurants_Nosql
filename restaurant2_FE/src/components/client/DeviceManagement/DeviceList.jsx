import { useState, useEffect } from 'react';
import { Card, List, Button, Tag, message, Popconfirm, Empty, Spin, Typography, Space } from 'antd';
import { 
    DesktopOutlined, 
    MobileOutlined, 
    TabletOutlined, 
    LogoutOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    DisconnectOutlined
} from '@ant-design/icons';
import { getSessionsAPI, logoutSessionAPI, logoutAllSessionsAPI } from '../../../services/api.service';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/auth.context';

const { Text, Title } = Typography;

const DeviceList = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);
    const navigate = useNavigate();
    const { resetAuthState, setAccessToken } = useContext(AuthContext);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await getSessionsAPI();
            const data = response?.data || response;
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            message.error('Không thể tải danh sách thiết bị');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleLogoutSession = async (sessionId) => {
        try {
            await logoutSessionAPI(sessionId);
            message.success('Đã đăng xuất thiết bị này');
            fetchSessions(); // Refresh list
        } catch (error) {
            console.error('Error logging out session:', error);
            message.error('Không thể đăng xuất thiết bị');
        }
    };

    const handleLogoutAll = async () => {
        try {
            setLogoutAllLoading(true);
            await logoutAllSessionsAPI();
            message.success('Đã đăng xuất tất cả thiết bị');
            
            // Reset auth state
            resetAuthState();
            if (setAccessToken) {
                setAccessToken('');
            }
            
            // Redirect về login sau 1 giây
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        } catch (error) {
            console.error('Error logging out all sessions:', error);
            message.error('Không thể đăng xuất tất cả thiết bị');
            // Vẫn reset state và redirect nếu API fail
            resetAuthState();
            if (setAccessToken) {
                setAccessToken('');
            }
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        } finally {
            setLogoutAllLoading(false);
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
            
            // Format full date if older than 7 days
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

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <Card>
                <Empty description="Không có thiết bị nào đang đăng nhập" />
            </Card>
        );
    }

    return (
        <Card 
            title={
                <Space>
                    <GlobalOutlined />
                    <span>Thiết bị đã đăng nhập ({sessions.length})</span>
                </Space>
            }
            extra={
                sessions.length > 1 && (
                    <Popconfirm
                        title="Đăng xuất tất cả thiết bị?"
                        description="Bạn sẽ bị đăng xuất khỏi tất cả thiết bị, bao gồm cả thiết bị này. Bạn có chắc chắn không?"
                        onConfirm={handleLogoutAll}
                        okText="Đăng xuất tất cả"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, loading: logoutAllLoading }}
                    >
                        <Button 
                            danger 
                            icon={<DisconnectOutlined />}
                            loading={logoutAllLoading}
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
                            session.isCurrent ? (
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                    Thiết bị này
                                </Tag>
                            ) : (
                                <Popconfirm
                                    title="Đăng xuất thiết bị này?"
                                    description="Bạn có chắc chắn muốn đăng xuất thiết bị này không?"
                                    onConfirm={() => handleLogoutSession(session.sessionId)}
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
                            )
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <div style={{ fontSize: '24px', color: session.isCurrent ? '#52c41a' : '#1890ff' }}>
                                    {getDeviceIcon(session.userAgent)}
                                </div>
                            }
                            title={
                                <Space>
                                    <Text strong>{session.deviceInfo || 'Unknown Device'}</Text>
                                    {session.isCurrent && (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>
                                            Đang sử dụng
                                        </Tag>
                                    )}
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
    );
};

export default DeviceList;

