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
    Checkbox
} from "antd";
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined
} from "@ant-design/icons";
import { 
    fetchAllRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchAllPermissions
} from "../../../services/api.service";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TableRole = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const columns = [
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
            ellipsis: true,
            render: (name) => (
                <Tag color="blue" icon={<UserOutlined />}>{name}</Tag>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Số quyền',
            dataIndex: 'permissions',
            key: 'permissions',
            width: 120,
            render: (permissions) => (
                <Tag color="green">{permissions?.length || 0} quyền</Tag>
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
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Button 
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(record.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    // Debug effect to track permissions state
    useEffect(() => {
        console.log("Permissions state changed:", permissions);
    }, [permissions]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetchAllRoles(1, 1000);
            if (res.data && res.data.result) {
                setRoles(res.data.result);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            message.error("Lỗi khi tải danh sách vai trò");
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await fetchAllPermissions(1, 1000);
            console.log("Permissions response:", res.data);
            
            // Try different response formats
            let permissionsData = [];
            if (res.data && res.data.result) {
                permissionsData = res.data.result;
            } else if (res.data && Array.isArray(res.data)) {
                permissionsData = res.data;
            } else if (res.data && res.data.data) {
                permissionsData = res.data.data;
            }
            
            console.log("Permissions loaded:", permissionsData.length);
            setPermissions(permissionsData);
            
            if (permissionsData.length === 0) {
                console.log("No permissions found in response");
                message.warning("Không tìm thấy quyền nào trong hệ thống");
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            message.error("Lỗi khi tải danh sách quyền");
            setPermissions([]);
        }
    };

    const showModal = () => {
        setEditingRole(null);
        form.resetFields();
        console.log("Opening role modal");
        console.log("Current permissions state:", permissions);
        setIsModalVisible(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        form.setFieldsValue({
            name: role.name,
            description: role.description,
            permissionIds: role.permissions?.map(p => p.id) || []
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteRole(id);
            message.success("Xóa vai trò thành công");
            fetchRoles();
        } catch (error) {
            console.error("Error deleting role:", error);
            message.error("Lỗi khi xóa vai trò");
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingRole) {
                const updateData = { ...values, id: editingRole.id };
                await updateRole(updateData);
                message.success("Cập nhật vai trò thành công");
            } else {
                await createRole(values);
                message.success("Tạo vai trò thành công");
            }
            
            setIsModalVisible(false);
            form.resetFields();
            fetchRoles();
        } catch (error) {
            console.error("Error saving role:", error);
            message.error("Lỗi khi lưu vai trò");
        }
    };

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="m-0">Quản lý vai trò (Roles)</Title>
                        <p className="text-gray-500 text-sm">
                            Permissions loaded: {permissions.length} | 
                            Roles loaded: {roles.length}
                        </p>
                    </div>
                    <Space>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={fetchRoles}
                        >
                            Làm mới
                        </Button>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={fetchPermissions}
                            type="default"
                        >
                            Reload Permissions
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={showModal}
                        >
                            Thêm vai trò
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
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

                <Modal
                    title={editingRole ? "Sửa vai trò" : "Thêm vai trò mới"}
                    open={isModalVisible}
                    onOk={() => form.submit()}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                    }}
                    okText={editingRole ? "Cập nhật" : "Tạo"}
                    cancelText="Hủy"
                    width={800}
                    destroyOnClose={true}
                    maskClosable={false}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="name"
                            label="Tên vai trò"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên vai trò!' },
                                { min: 2, max: 50, message: 'Tên vai trò phải từ 2-50 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Nhập tên vai trò" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Mô tả"
                            rules={[
                                { max: 200, message: 'Mô tả không được quá 200 ký tự!' }
                            ]}
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="Nhập mô tả vai trò (tùy chọn)" 
                            />
                        </Form.Item>

                        <Form.Item
                            name="permissionIds"
                            label="Quyền hạn"
                            rules={[
                                { required: true, message: 'Vui lòng chọn ít nhất một quyền!' }
                            ]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Chọn quyền hạn"
                                style={{ width: '100%' }}
                                loading={permissions.length === 0}
                                showSearch
                                allowClear
                                getPopupContainer={(trigger) => trigger.parentElement}
                                dropdownStyle={{ zIndex: 9999 }}
                                maxTagCount="responsive"
                                filterOption={(input, option) => {
                                    const text = option?.children || option?.label || '';
                                    return String(text).toLowerCase().includes(input.toLowerCase());
                                }}
                                notFoundContent={permissions.length === 0 ? "Đang tải..." : "Không tìm thấy quyền nào"}
                                onDropdownVisibleChange={(open) => {
                                    console.log("Dropdown open:", open);
                                }}
                            >
                                {permissions.map(permission => (
                                    <Option key={permission.id} value={permission.id} label={`${permission.name} (${permission.method} ${permission.apiPath})`}>
                                        {permission.name} ({permission.method} {permission.apiPath})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default TableRole;
