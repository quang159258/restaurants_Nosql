import { useContext, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    AppstoreOutlined,
    BarChartOutlined,
    HomeOutlined,
    LogoutOutlined,
    SafetyOutlined,
    ShoppingCartOutlined,
    TagsOutlined,
    TeamOutlined,
    UserOutlined,
    GlobalOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography, theme } from "antd";
import NotificationCenter from "../noti/NotificationCenter";
import { AuthContext } from "../context/auth.context";
import { logoutAPI } from "../../services/api.service";

const { Header, Sider, Content } = Layout;

const LayoutAdmin = () => {
    const { user, setAccessToken, resetAuthState } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = async () => {
        try {
            await logoutAPI();
        } catch (error) {
            console.warn("Logout API failed, clearing local session", error);
        } finally {
            resetAuthState();
            setAccessToken("");
            navigate("/login");
        }
    };

    const sidebarItems = useMemo(
        () => [
            {
                key: "/admin",
                icon: <HomeOutlined />,
                label: <Link to="/admin">Tổng quan</Link>,
            },
            {
                key: "/admin/dish",
                icon: <AppstoreOutlined />,
                label: <Link to="/admin/dish">Quản lý món ăn</Link>,
            },
            {
                key: "/admin/orders",
                icon: <ShoppingCartOutlined />,
                label: <Link to="/admin/orders">Đơn hàng</Link>,
            },
            {
                key: "/admin/user",
                icon: <TeamOutlined />,
                label: <Link to="/admin/user">Người dùng</Link>,
            },
            {
                key: "/admin/analysis",
                icon: <BarChartOutlined />,
                label: <Link to="/admin/analysis">Phân tích</Link>,
            },
            {
                key: "/admin/category",
                icon: <TagsOutlined />,
                label: <Link to="/admin/category">Danh mục</Link>,
            },
            {
                key: "/admin/role-permission",
                icon: <SafetyOutlined />,
                label: <Link to="/admin/role-permission">Vai trò & Quyền</Link>,
            },
            {
                key: "/admin/sessions",
                icon: <GlobalOutlined />,
                label: <Link to="/admin/sessions">Quản lý phiên đăng nhập</Link>,
            },
        ],
        []
    );

    const profileMenu = {
        items: [
            {
                key: "profile",
                icon: <UserOutlined />,
                label: <Link to="/admin/info">Thông tin cá nhân</Link>,
            },
            {
                key: "logout",
                icon: <LogoutOutlined />,
                danger: true,
                label: <span onClick={handleLogout}>Đăng xuất</span>,
            },
        ],
    };

const selectedKey =
    sidebarItems.find((item) => location.pathname.startsWith(item.key))?.key || "/admin";

    return (
    <Layout className="min-h-screen" style={{ background: "#f5f6fb" }}>
        <Sider
            width={260}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            theme="light"
            style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f3f4ff 100%)",
                borderRight: "1px solid rgba(200, 169, 126, 0.18)",
                boxShadow: "8px 0 24px -12px rgba(15, 23, 42, 0.15)",
            }}
        >
            <div
                className="flex items-center justify-center h-20"
                style={{
                    fontFamily: "Great Vibes, cursive",
                    fontSize: collapsed ? 28 : 40,
                    color: "#C8A97E",
                    transition: "all 0.3s ease",
                }}
            >
                Feliciano
            </div>
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={sidebarItems}
                style={{
                    borderInlineEnd: "none",
                    background: "transparent",
                    fontWeight: 500,
                }}
            />
            <div className="px-4 pb-6 mt-auto">
                <Button
                    block
                    shape="round"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{
                        background: "rgba(255, 77, 79, 0.12)",
                        border: "none",
                        color: "#ff4d4f",
                        fontWeight: 600,
                    }}
                >
                    {!collapsed && "Đăng xuất"}
                </Button>
            </div>
        </Sider>

        <Layout style={{ overflow: "hidden" }}>
            <Header
                style={{
                    padding: "0 32px",
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography.Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                    Bảng điều khiển quản trị
                </Typography.Title>

                <Space size="large" align="center">
                    <NotificationCenter userRole={user?.role?.name} userId={user?.id} />
                    <Dropdown menu={profileMenu} placement="bottomRight" trigger={["click"]}>
                        <Space
                            style={{
                                cursor: "pointer",
                                padding: "6px 12px",
                                borderRadius: 999,
                                background: "#f5f7ff",
                            }}
                        >
                            <Avatar
                                size={40}
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: "#C8A97E" }}
                            />
                            {!collapsed && (
                                <div className="flex flex-col leading-tight">
                                    <Typography.Text strong>{user?.username || "Admin"}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Quản trị viên
                                    </Typography.Text>
                                </div>
                            )}
                        </Space>
                    </Dropdown>
                </Space>
            </Header>

            <Content
                style={{
                    margin: "24px",
                    padding: "24px",
                    minHeight: "calc(100vh - 112px)",
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                    boxShadow: "0 24px 45px -20px rgba(15, 23, 42, 0.08)",
                }}
            >
                <Outlet />
            </Content>
        </Layout>
    </Layout>
);

};

export default LayoutAdmin;


