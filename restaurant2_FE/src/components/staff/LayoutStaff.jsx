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
    const { user, setUser, setCart } = useContext(AuthContext);
    const navigate = useNavigate();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const handleLogout = async () => {
        try {
            await logoutAPI();
            // Clear all auth related data
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
            setCart([]);
            // Redirect to login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local data and redirect even if API call fails
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
            setCart([]);
            navigate('/login');
        }
    };

    const items = [
        {
            key: '1',
            label: (
                <div onClick={handleLogout}>
                    Logout
                </div>
            ),
        },
    ];

    return (
        <Layout className="min-h-screen">
            <Sider trigger={null} collapsible collapsed={collapsed} width={250} theme="light">
                <div className="flex items-center justify-center h-16">
                    {!collapsed ? (
                        <h1 className="text-2xl font-bold text-[#C8A97E]">Feliciano</h1>
                    ) : (
                        <h1 className="text-2xl font-bold text-[#C8A97E]">F</h1>
                    )}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={[
                        {
                            key: '1',
                            icon: <HomeOutlined />,
                            label: <Link to="/staff">Dashboard</Link>,
                        },
                        {
                            key: '2',
                            icon: <ShoppingCartOutlined />,
                            label: <Link to="/staff/orders">Orders</Link>,
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
                        className="flex items-center p-2 text-red-500 rounded cursor-pointer hover:bg-red-50"
                    >
                        <LogoutOutlined className="mr-2" />
                        {!collapsed && <span>Logout</span>}
                    </div>
                </div>
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
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
                            <NotificationCenter userRole="staff" />
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
                        borderRadius: 8,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}

export default LayoutStaff;