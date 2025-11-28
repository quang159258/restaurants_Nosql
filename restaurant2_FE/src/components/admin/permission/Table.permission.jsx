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
    InputNumber
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
    deletePermission
} from "../../../services/api.service";

const { Title } = Typography;
const { Option } = Select;

const TablePermission = () => {
    const [permissions, setPermissions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
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
            title: 'Tên quyền',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'API Path',
            dataIndex: 'apiPath',
            key: 'apiPath',
            ellipsis: true,
            render: (path) => (
                <Tag color="blue">{path}</Tag>
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
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Button 
                        danger
                        icon={<DeleteOutlined />} 
                        size="small"
                        onClick={() => {
                            console.log("Delete clicked for permission:", record);
                            console.log("Permission ID to delete:", record.id);
                            console.log("Permission ID type:", typeof record.id);
                            console.log("Permission name:", record.name);
                            console.log("Permission API path:", record.apiPath);
                            handleDelete(record.id);
                        }}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        fetchPermissions();
    }, []);

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

    const showModal = () => {
        setEditingPermission(null);
        form.resetFields();
        console.log("Opening permission modal");
        setIsModalVisible(true);
    };

    const handleEdit = (permission) => {
        setEditingPermission(permission);
        form.setFieldsValue({
            name: permission.name,
            apiPath: permission.apiPath,
            method: permission.method,
            module: permission.module
        });
        console.log("Editing permission:", permission);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            console.log("Attempting to delete permission with ID:", id);
            console.log("Current permissions before delete:", permissions);
            
            // Show loading message
            message.loading("Đang xóa quyền...", 0);
            
            const response = await deletePermission(id);
            console.log("Delete response:", response);
            
            // Hide loading message
            message.destroy();
            
            console.log("Permission deleted successfully");
            message.success("Xóa quyền thành công");
            
            // Refresh permissions list
            await fetchPermissions();
        } catch (error) {
            // Hide loading message
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

    const handleSubmit = async (values) => {
        try {
            if (editingPermission) {
                const updateData = { ...values, id: editingPermission.id };
                await updatePermission(updateData);
                message.success("Cập nhật quyền thành công");
            } else {
                await createPermission(values);
                message.success("Tạo quyền thành công");
            }
            
            setIsModalVisible(false);
            form.resetFields();
            fetchPermissions();
        } catch (error) {
            console.error("Error saving permission:", error);
            message.error("Lỗi khi lưu quyền");
        }
    };

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2} className="m-0">Quản lý quyền (Permissions)</Title>
                    <Space>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={fetchPermissions}
                        >
                            Làm mới
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={showModal}
                        >
                            Thêm quyền
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
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
                    onRow={(record) => {
                        console.log("Table row record:", record);
                        console.log("Table row record ID:", record.id);
                        console.log("Table row record name:", record.name);
                        return record;
                    }}
                />

                <Modal
                    title={editingPermission ? "Sửa quyền" : "Thêm quyền mới"}
                    open={isModalVisible}
                    onOk={() => form.submit()}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
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
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        style={{ zIndex: 1000 }}
                    >
                        <Form.Item
                            name="name"
                            label="Tên quyền"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên quyền!' },
                                { min: 3, max: 100, message: 'Tên quyền phải từ 3-100 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Nhập tên quyền" />
                        </Form.Item>

                        <Form.Item
                            name="apiPath"
                            label="API Path"
                            rules={[
                                { required: true, message: 'Vui lòng nhập API path!' },
                                { min: 1, max: 200, message: 'API path phải từ 1-200 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Ví dụ: /users, /orders/{id}" />
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
                                onDropdownVisibleChange={(open) => {
                                    console.log("HTTP Method dropdown open:", open);
                                }}
                                onChange={(value) => {
                                    console.log("HTTP Method selected:", value);
                                }}
                                onFocus={() => {
                                    console.log("HTTP Method select focused");
                                }}
                                onBlur={() => {
                                    console.log("HTTP Method select blurred");
                                }}
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
                                { min: 2, max: 50, message: 'Module phải từ 2-50 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Ví dụ: USERS, ORDERS, DISHES" />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default TablePermission;
