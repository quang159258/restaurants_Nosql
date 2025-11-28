import React, { useEffect, useState } from "react";
import { 
    Table, 
    Button, 
    Modal, 
    Form, 
    Input, 
    Select, 
    message, 
    Space, 
    Card,
    Typography,
    Tag,
    Transfer,
    Checkbox,
    InputNumber,
    Tabs
} from "antd";
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined
} from "@ant-design/icons";
import { 
    fetchAllPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    fetchAllRoles,
    createRole,
    updateRole,
    deleteRole
} from "../../../services/api.service";

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const RolePermissionManager = () => {
    // Permission states
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [permissionForm] = Form.useForm();

    // Role states
    const [roles, setRoles] = useState([]);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm] = Form.useForm();
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Permission columns
    const permissionColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Tên quyền',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (name) => (
                <Tag color="blue">{name}</Tag>
            ),
        },
        {
            title: 'API Path',
            dataIndex: 'apiPath',
            key: 'apiPath',
            width: 250,
            render: (path) => (
                <Tag color="green">{path}</Tag>
            ),
        },
        {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            width: 100,
            render: (method) => {
                const colors = {
                    'GET': 'green',
                    'POST': 'blue',
                    'PUT': 'orange',
                    'DELETE': 'red'
                };
                return <Tag color={colors[method] || 'default'}>{method}</Tag>;
            },
        },
        {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            width: 120,
            render: (module) => (
                <Tag color="purple">{module}</Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEditPermission(record)}
                    >
                        Sửa
                    </Button>
                    <Button 
                        danger
                        icon={<DeleteOutlined />} 
                        size="small"
                        onClick={() => handleDeletePermission(record.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    // Role columns
    const roleColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Tên vai trò',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (name) => (
                <Tag color="blue">{name}</Tag>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 300,
        },
        {
            title: 'Quyền',
            dataIndex: 'permissions',
            key: 'permissions',
            width: 200,
            render: (permissions) => (
                <Space wrap>
                    {permissions?.map((permission) => (
                        <Tag key={permission.id} color="green">
                            {permission.name}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEditRole(record)}
                    >
                        Sửa
                    </Button>
                    <Button 
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteRole(record.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    // Permission functions
    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const res = await fetchAllPermissions(1, 1000);
            console.log("Permissions response:", res);
            if (res.data && res.data.result) {
                console.log("Setting permissions from res.data.result:", res.data.result);
                setPermissions(res.data.result);
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            message.error("Lỗi khi tải danh sách quyền");
        } finally {
            setLoading(false);
        }
    };

    const showPermissionModal = () => {
        setEditingPermission(null);
        permissionForm.resetFields();
        console.log("Opening permission modal");
        setIsPermissionModalVisible(true);
    };

    const handleEditPermission = (permission) => {
        setEditingPermission(permission);
        permissionForm.setFieldsValue({
            name: permission.name,
            apiPath: permission.apiPath,
            method: permission.method,
            module: permission.module
        });
        console.log("Editing permission:", permission);
        setIsPermissionModalVisible(true);
    };

    const handleDeletePermission = async (id) => {
        try {
            console.log("Attempting to delete permission with ID:", id);
            console.log("Current permissions before delete:", permissions);
            
            message.loading("Đang xóa quyền...", 0);
            
            const response = await deletePermission(id);
            console.log("Delete response:", response);
            
            message.destroy();
            
            console.log("Permission deleted successfully");
            message.success("Xóa quyền thành công");
            
            await fetchPermissions();
        } catch (error) {
            message.destroy();
            
            console.error("Error deleting permission:", error);
            console.error("Error details:", error.response?.data || error.message);
            console.error("Error status:", error.response?.status);
            console.error("Error config:", error.config);
            console.error("Error request URL:", error.config?.url);
            console.error("Error request method:", error.config?.method);
            
            message.error(`Lỗi khi xóa quyền: ${error.response?.data?.message || error.message}`);
        }
    };

    const handlePermissionSubmit = async (values) => {
        try {
            if (editingPermission) {
                const updateData = { ...values, id: editingPermission.id };
                await updatePermission(updateData);
                message.success("Cập nhật quyền thành công");
            } else {
                await createPermission(values);
                message.success("Tạo quyền thành công");
            }
            setIsPermissionModalVisible(false);
            permissionForm.resetFields();
            fetchPermissions();
        } catch (error) {
            console.error("Error submitting permission:", error);
            message.error("Lỗi khi lưu quyền");
        }
    };

    // Role functions
    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetchAllRoles(1, 1000);
            console.log("Roles response:", res);
            if (res.data && res.data.result) {
                console.log("Setting roles from res.data.result:", res.data.result);
                setRoles(res.data.result);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            message.error("Lỗi khi tải danh sách vai trò");
        } finally {
            setLoading(false);
        }
    };

    const showRoleModal = () => {
        setEditingRole(null);
        roleForm.resetFields();
        setSelectedPermissions([]);
        console.log("Opening role modal");
        setIsRoleModalVisible(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        roleForm.setFieldsValue({
            name: role.name,
            description: role.description
        });
        const permissionIds = role.permissions?.map(p => p.id) || [];
        setSelectedPermissions(permissionIds);
        console.log("Editing role:", role);
        console.log("Role permissions:", role.permissions);
        console.log("Permission IDs:", permissionIds);
        console.log("Setting selectedPermissions to:", permissionIds);
        setIsRoleModalVisible(true);
    };

    const handleDeleteRole = async (id) => {
        try {
            console.log("Attempting to delete role with ID:", id);
            message.loading("Đang xóa vai trò...", 0);
            
            const response = await deleteRole(id);
            console.log("Delete response:", response);
            
            message.destroy();
            
            console.log("Role deleted successfully");
            message.success("Xóa vai trò thành công");
            
            await fetchRoles();
        } catch (error) {
            message.destroy();
            
            console.error("Error deleting role:", error);
            console.error("Error details:", error.response?.data || error.message);
            message.error(`Lỗi khi xóa vai trò: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleRoleSubmit = async (values) => {
        try {
            const roleData = {
                ...values,
                permissionIds: selectedPermissions
            };
            
            console.log("Submitting role data:", roleData);
            console.log("Selected permissions:", selectedPermissions);
            console.log("Form values:", values);
            console.log("Editing role:", editingRole);
            
            if (editingRole) {
                console.log("Updating role:", editingRole.id);
                const updateData = { ...roleData, id: editingRole.id };
                console.log("Update data:", updateData);
                await updateRole(updateData);
                message.success("Cập nhật vai trò thành công");
            } else {
                console.log("Creating new role");
                await createRole(roleData);
                message.success("Tạo vai trò thành công");
            }
            setIsRoleModalVisible(false);
            roleForm.resetFields();
            setSelectedPermissions([]);
            fetchRoles();
        } catch (error) {
            console.error("Error submitting role:", error);
            console.error("Error details:", error.response?.data || error.message);
            console.error("Error status:", error.response?.status);
            console.error("Error config:", error.config);
            message.error(`Lỗi khi lưu vai trò: ${error.response?.data?.message || error.message}`);
        }
    };

    const handlePermissionChange = (newTargetKeys, direction, moveKeys) => {
        console.log("Permission change:", { newTargetKeys, direction, moveKeys });
        console.log("Current selectedPermissions:", selectedPermissions);
        console.log("New target keys:", newTargetKeys);
        setSelectedPermissions(newTargetKeys);
        console.log("Updated selectedPermissions:", newTargetKeys);
    };

    useEffect(() => {
        fetchPermissions();
        fetchRoles();
    }, []);

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2} className="m-0">Quản lý Vai trò và Quyền</Title>
                    <Space>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchPermissions();
                                fetchRoles();
                            }}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </div>

                <Tabs defaultActiveKey="permissions">
                    <TabPane tab="Quản lý Quyền" key="permissions">
                        <div className="flex justify-between items-center mb-4">
                            <Title level={4} className="m-0">Danh sách Quyền</Title>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={showPermissionModal}
                            >
                                Thêm quyền
                            </Button>
                        </div>

                        <Table
                            columns={permissionColumns}
                            dataSource={permissions}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} của ${total} quyền`,
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </TabPane>

                    <TabPane tab="Quản lý Vai trò" key="roles">
                        <div className="flex justify-between items-center mb-4">
                            <Title level={4} className="m-0">Danh sách Vai trò</Title>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={showRoleModal}
                            >
                                Thêm vai trò
                            </Button>
                        </div>

                        <Table
                            columns={roleColumns}
                            dataSource={roles}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} của ${total} vai trò`,
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </TabPane>
                </Tabs>

                {/* Permission Modal */}
                <Modal
                    title={editingPermission ? "Sửa quyền" : "Thêm quyền mới"}
                    open={isPermissionModalVisible}
                    onOk={() => permissionForm.submit()}
                    onCancel={() => {
                        setIsPermissionModalVisible(false);
                        permissionForm.resetFields();
                    }}
                    okText={editingPermission ? "Cập nhật" : "Tạo"}
                    cancelText="Hủy"
                    width={600}
                    destroyOnClose={true}
                    maskClosable={false}
                    zIndex={1000}
                    style={{ zIndex: 1000 }}
                    maskStyle={{ zIndex: 1000 }}
                >
                    <Form
                        form={permissionForm}
                        layout="vertical"
                        onFinish={handlePermissionSubmit}
                        style={{ zIndex: 1000 }}
                    >
                        <Form.Item
                            name="name"
                            label="Tên quyền"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên quyền!' },
                            ]}
                        >
                            <Input placeholder="Nhập tên quyền" />
                        </Form.Item>

                        <Form.Item
                            name="apiPath"
                            label="API Path"
                            rules={[
                                { required: true, message: 'Vui lòng nhập API path!' },
                            ]}
                        >
                            <Input placeholder="Nhập API path" />
                        </Form.Item>

                        <Form.Item
                            name="method"
                            label="HTTP Method"
                            rules={[{ required: true, message: 'Vui lòng chọn HTTP method!' }]}
                        >
                            <Select 
                                placeholder="Chọn HTTP method"
                                getPopupContainer={(trigger) => trigger.parentElement.parentElement}
                                dropdownStyle={{ 
                                    zIndex: 9999
                                }}
                                showSearch={false}
                                allowClear
                                dropdownMatchSelectWidth={true}
                            >
                                <Option value="GET">GET</Option>
                                <Option value="POST">POST</Option>
                                <Option value="PUT">PUT</Option>
                                <Option value="DELETE">DELETE</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="module"
                            label="Module"
                            rules={[
                                { required: true, message: 'Vui lòng nhập module!' },
                            ]}
                        >
                            <Input placeholder="Nhập module" />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Role Modal */}
                <Modal
                    title={editingRole ? "Sửa vai trò" : "Thêm vai trò mới"}
                    open={isRoleModalVisible}
                    onOk={() => roleForm.submit()}
                    onCancel={() => {
                        setIsRoleModalVisible(false);
                        roleForm.resetFields();
                        setSelectedPermissions([]);
                    }}
                    okText={editingRole ? "Cập nhật" : "Tạo"}
                    cancelText="Hủy"
                    width={800}
                    destroyOnClose={true}
                    maskClosable={false}
                    zIndex={1000}
                    style={{ zIndex: 1000 }}
                    maskStyle={{ zIndex: 1000 }}
                >
                    <Form
                        form={roleForm}
                        layout="vertical"
                        onFinish={handleRoleSubmit}
                        style={{ zIndex: 1000 }}
                    >
                        <Form.Item
                            name="name"
                            label="Tên vai trò"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên vai trò!' },
                            ]}
                        >
                            <Input placeholder="Nhập tên vai trò" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Mô tả"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mô tả!' },
                            ]}
                        >
                            <Input.TextArea placeholder="Nhập mô tả vai trò" rows={3} />
                        </Form.Item>

                        <Form.Item
                            label="Quyền"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một quyền!' }]}
                        >
                            <div>
                                <p>Selected Permissions: {selectedPermissions.join(', ')}</p>
                                <Transfer
                                    dataSource={permissions.map(p => ({
                                        key: p.id,
                                        title: p.name,
                                        description: `${p.method} ${p.apiPath}`,
                                    }))}
                                    titles={['Quyền có sẵn', 'Quyền đã chọn']}
                                    targetKeys={selectedPermissions}
                                    onChange={handlePermissionChange}
                                    render={item => item.title}
                                    listStyle={{
                                        width: 300,
                                        height: 300,
                                    }}
                                    showSearch
                                    filterOption={(search, item) => {
                                        return item.title.toLowerCase().includes(search.toLowerCase()) ||
                                               item.description.toLowerCase().includes(search.toLowerCase());
                                    }}
                                    onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                                        console.log("Transfer onSelectChange:", { sourceSelectedKeys, targetSelectedKeys });
                                    }}
                                    onScroll={(direction, e) => {
                                        console.log("Transfer onScroll:", { direction, e });
                                    }}
                                />
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default RolePermissionManager;
