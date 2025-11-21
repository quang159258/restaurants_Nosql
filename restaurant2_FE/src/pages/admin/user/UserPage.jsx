import React from "react";
import { Card, Typography, Space, Button, Divider } from "antd";
import { UserOutlined, ReloadOutlined } from "@ant-design/icons";
import UserTable from "../../../components/admin/user/Table.User";
import AdminDeviceManagement from "../../../components/admin/user/AdminDeviceManagement";

const { Title } = Typography;

const UserPageAdmin = () => {
    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2} className="m-0 flex items-center gap-2">
                        <UserOutlined />
                        Quản lý người dùng
                    </Title>
                    <Space>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={() => window.location.reload()}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </div>
                <UserTable />
            </Card>
            
            <Divider />
            
            <Card>
                <AdminDeviceManagement />
            </Card>
        </div>
    );
}

export default UserPageAdmin