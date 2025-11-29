import { Link, Outlet, useNavigate } from "react-router-dom";
import {
    HomeOutlined,
    ShoppingCartOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    InboxOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, Avatar, Dropdown } from 'antd';
import { useContext, useState } from "react";
import { AuthContext } from "../context/auth.context";
import { logoutAPI } from "../../services/api.service";
import NotificationCenter from "../noti/NotificationCenter";

const { Header, Sider, Content } = Layout;

const LayoutStaff = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, resetAuthState } = useContext(AuthContext);
    const navigate = useNavigate();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const handleLogout = async () => {
        try {
            await logoutAPI();
        } catch (error) {
            console.warn('Logout error:', error);
        } finally {
            resetAuthState();
            navigate('/login');
        }
    };

    const items = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/staff/info">Thông tin cá nhân</Link>
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            danger: true,
            label: (
                <div onClick={handleLogout}>
                    Đăng xuất
                </div>
            ),
        },
    ];

    return (
        <Layout
            className="min-h-screen"
            style={{
                background: "linear-gradient(135deg, #f8fbff 0%, #eef1ff 100%)",
            }}
        >
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={250}
                theme="light"
                style={{
                    background: "linear-gradient(180deg, #ffffff 0%, #f1f5ff 100%)",
                    borderRight: "1px solid rgba(200, 169, 126, 0.18)",
                    boxShadow: "8px 0 24px -12px rgba(15, 23, 42, 0.15)",
                }}
            >
                <div className="flex items-center justify-center h-16">
                    {!collapsed ? (
                        <h1 className="text-3xl font-bold text-[#C8A97E] font-[Great_Vibes,cursive]">
                            Feliciano
                        </h1>
                    ) : (
                        <h1 className="text-3xl font-bold text-[#C8A97E] font-[Great_Vibes,cursive]">
                            F
                        </h1>
                    )}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={['2']}
                    items={[
                        {
                            key: '2',
                            icon: <ShoppingCartOutlined />,
                            label: <Link to="/staff">Orders</Link>,
                        },
                        {
                            key: '3',
                            icon: <InboxOutlined />,
                            label: <Link to="/staff/inventory">Nhập kho</Link>,
                        },
                    ]}
                />
                <div className="absolute bottom-0 w-full p-4">
                    <div 
                        onClick={handleLogout}
                        className="flex items-center p-2 text-red-500 rounded cursor-pointer hover:bg-red-50 transition-colors"
                    >
                        <LogoutOutlined className="mr-2" />
                        {!collapsed && <span>Logout</span>}
                    </div>
                </div>
            </Sider>
            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(10px)",
                        borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
                    }}
                >
                    <div className="flex items-center justify-between h-full px-4">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <div className="flex items-center gap-4">
                            <NotificationCenter userRole={user?.role} userId={user?.id} />
                            <Dropdown menu={{ items }} placement="bottomRight">
                                <div className="flex items-center cursor-pointer">
                                    <span className="mr-2">{user?.username || 'Staff'}</span>
                                    <Avatar 
                                        icon={<UserOutlined />}
                                        src={user?.avatar}
                                        className="bg-[#C8A97E]"
                                    />
                                </div>
                            </Dropdown>
                        </div>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: 16,
                        boxShadow: "0 24px 45px -20px rgba(15, 23, 42, 0.08)",
                        border: "1px solid rgba(226, 232, 240, 0.5)",
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}

export default LayoutStaff;