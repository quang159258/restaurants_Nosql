import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag } from 'antd';
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchAllDish, updateDish } from '../../services/api.service';
import Notification from '../noti/Notification';

const InventoryManagement = () => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [form] = Form.useForm();
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        setLoading(true);
        try {
            // Không filter theo category, lấy tất cả dishes
            const res = await fetchAllDish(1, 100, null);
            const data = res?.data ?? res;
            if (data?.result && Array.isArray(data.result)) {
                setDishes(data.result);
            } else if (Array.isArray(data)) {
                setDishes(data);
            } else {
                setDishes([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
            setDishes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = (record) => {
        setSelectedDish(record);
        form.setFieldsValue({
            id: record.id,
            name: record.name,
            currentStock: record.stock || 0,
            newStock: record.stock || 0,
        });
        setIsModalOpen(true);
    };

    const handleImportStock = (record) => {
        setSelectedDish(record);
        form.setFieldsValue({
            id: record.id,
            name: record.name,
            currentStock: record.stock || 0,
            importQuantity: 0,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            const dishData = {
                id: values.id,
                name: values.name,
                stock: values.newStock || values.importQuantity + values.currentStock,
            };
            
            const res = await updateDish(dishData);
            if (res.data) {
                addNotification("Cập nhật thành công", "Tồn kho đã được cập nhật", "success");
                fetchDishes();
                setIsModalOpen(false);
                form.resetFields();
            } else {
                addNotification("Lỗi cập nhật", "Không thể cập nhật tồn kho", "error");
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật tồn kho:', error);
            addNotification("Lỗi", "Có lỗi xảy ra khi cập nhật tồn kho", "error");
        }
    };

    const getStockStatus = (stock) => {
        if (stock > 20) return { color: 'green', text: 'Đủ hàng' };
        if (stock > 10) return { color: 'orange', text: 'Sắp hết' };
        if (stock > 0) return { color: 'red', text: 'Sắp hết' };
        return { color: 'red', text: 'Hết hàng' };
    };

    const columns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Tồn kho hiện tại',
            dataIndex: 'stock',
            key: 'stock',
            width: 120,
            render: (stock) => {
                const status = getStockStatus(stock || 0);
                return (
                    <Tag color={status.color}>
                        {stock || 0} - {status.text}
                    </Tag>
                );
            },
        },
        {
            title: 'Đã bán hôm nay',
            dataIndex: 'soldToday',
            key: 'soldToday',
            width: 120,
            render: (sold) => sold || 0,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'available',
            key: 'available',
            width: 100,
            render: (available) => (
                <Tag color={available ? 'green' : 'red'}>
                    {available ? 'Có sẵn' : 'Tạm ngưng'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleUpdateStock(record)}
                        icon={<EditOutlined />}
                    >
                        Cập nhật
                    </Button>
                    <Button 
                        type="default" 
                        size="small"
                        onClick={() => handleImportStock(record)}
                        icon={<PlusOutlined />}
                    >
                        Nhập kho
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Quản lý tồn kho</h1>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchDishes}
                    loading={loading}
                >
                    Làm mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={dishes}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                }}
            />

            <Modal
                title={selectedDish ? `Cập nhật tồn kho - ${selectedDish.name}` : 'Cập nhật tồn kho'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item name="name" label="Tên sản phẩm">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item name="currentStock" label="Tồn kho hiện tại">
                        <InputNumber disabled style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="newStock"
                        label="Tồn kho mới"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho mới!' }]}
                    >
                        <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            placeholder="Nhập số lượng tồn kho mới"
                        />
                    </Form.Item>

                    <Form.Item
                        name="importQuantity"
                        label="Số lượng nhập thêm"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng nhập!' }]}
                    >
                        <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            placeholder="Nhập số lượng muốn thêm vào kho"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <div className="flex justify-end space-x-2">
                            <Button onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Cập nhật
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Hiển thị thông báo */}
            <div className="fixed top-4 right-4 z-[9999]">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
                        description={notif.description}
                        type={notif.type}
                        onClose={() => {
                            setNotifications((prev) =>
                                prev.filter((item) => item.id !== notif.id)
                            );
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default InventoryManagement;
