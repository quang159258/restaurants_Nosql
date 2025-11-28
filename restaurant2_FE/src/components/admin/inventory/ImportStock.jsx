import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Button, 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    message, 
    Space, 
    Card,
    Typography,
    Tag,
    Tooltip
} from 'antd';
import { 
    PlusOutlined, 
    ImportOutlined, 
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { 
    fetchAllDish, 
    importStock,
    updateStock,
    deleteDish,
    fetchAllDishByName
} from '../../../services/api.service';

const { Title } = Typography;

const ImportStock = () => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 80,
            render: (imageUrl) => (
                <img 
                    src={imageUrl} 
                    alt="Dish" 
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                />
            ),
        },
        {
            title: 'Tên món',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            render: (categoryName) => (
                <Tag color="blue">{categoryName}</Tag>
            ),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price?.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Tồn kho hiện tại',
            dataIndex: 'stock',
            key: 'stock',
            render: (stock) => (
                <Tag color={stock <= 10 ? 'red' : stock <= 50 ? 'orange' : 'green'}>
                    {stock || 0}
                </Tag>
            ),
        },
        {
            title: 'Đã bán hôm nay',
            dataIndex: 'soldToday',
            key: 'soldToday',
            render: (soldToday) => soldToday || 0,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'available',
            key: 'available',
            render: (available) => (
                <Tag color={available ? 'green' : 'red'}>
                    {available ? 'Có sẵn' : 'Hết hàng'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Nhập kho">
                        <Button 
                            type="primary" 
                            icon={<ImportOutlined />}
                            size="small"
                            onClick={() => handleImport(record)}
                        >
                            Nhập
                        </Button>
                    </Tooltip>
                    <Tooltip title="Cập nhật tồn kho">
                        <Button 
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleUpdateStock(record)}
                        >
                            Sửa
                        </Button>
                    </Tooltip>
                    <Tooltip title="Xem chi tiết">
                        <Button 
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewDetails(record)}
                        >
                            Xem
                        </Button>
                    </Tooltip>
                    <Tooltip title="Xóa món">
                        <Button 
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDelete(record.id)}
                        >
                            Xóa
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        setLoading(true);
        try {
            const res = await fetchAllDish(1, 100, 1);
            if (res.data && res.data.result) {
                setDishes(res.data.result);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách món ăn');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = (dish) => {
        setSelectedDish(dish);
        form.setFieldsValue({
            dishId: dish.id,
            dishName: dish.name,
            currentStock: dish.stock || 0,
            importQuantity: 0
        });
        setIsModalVisible(true);
    };

    const handleUpdateStock = (dish) => {
        setSelectedDish(dish);
        form.setFieldsValue({
            dishId: dish.id,
            dishName: dish.name,
            currentStock: dish.stock || 0,
            newStock: dish.stock || 0
        });
        setIsModalVisible(true);
    };

    const handleViewDetails = (dish) => {
        Modal.info({
            title: `Chi tiết món: ${dish.name}`,
            content: (
                <div>
                    <p><strong>Tên:</strong> {dish.name}</p>
                    <p><strong>Mô tả:</strong> {dish.description}</p>
                    <p><strong>Giá:</strong> {dish.price?.toLocaleString('vi-VN')} VNĐ</p>
                    <p><strong>Danh mục:</strong> {dish.category?.name}</p>
                    <p><strong>Tồn kho:</strong> {dish.stock || 0}</p>
                    <p><strong>Đã bán hôm nay:</strong> {dish.soldToday || 0}</p>
                    <p><strong>Trạng thái:</strong> {dish.available ? 'Có sẵn' : 'Hết hàng'}</p>
                </div>
            ),
            width: 600,
        });
    };

    const handleDelete = async (dishId) => {
        Modal.confirm({
            title: 'Xác nhận xóa món ăn',
            content: 'Bạn có chắc chắn muốn xóa món ăn này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await deleteDish(dishId);
                    message.success('Xóa món ăn thành công');
                    fetchDishes();
                } catch (error) {
                    message.error('Lỗi khi xóa món ăn');
                }
            },
        });
    };

    const handleSearch = async (value) => {
        setSearchText(value);
        if (!value.trim()) {
            fetchDishes();
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetchAllDishByName(1, 100, value);
            if (res.data && res.data.result) {
                setDishes(res.data.result);
            }
        } catch (error) {
            message.error('Lỗi khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (values.importQuantity) {
                // Nhập kho
                await importStock(selectedDish.id, { quantity: values.importQuantity });
                message.success(`Nhập kho thành công: +${values.importQuantity} sản phẩm`);
            } else if (values.newStock !== undefined) {
                // Cập nhật tồn kho
                await updateStock(selectedDish.id, { stock: values.newStock });
                message.success('Cập nhật tồn kho thành công');
            }
            
            setIsModalVisible(false);
            form.resetFields();
            fetchDishes();
        } catch (error) {
            message.error('Lỗi khi thực hiện thao tác');
        }
    };

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2} className="m-0">Quản lý tồn kho</Title>
                    <Space>
                        <Input.Search
                            placeholder="Tìm kiếm món ăn..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={fetchDishes}
                        >
                            Làm mới
                        </Button>
                    </Space>
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
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} của ${total} món ăn`,
                    }}
                    scroll={{ x: 1200 }}
                />

                <Modal
                    title={selectedDish ? `Nhập kho: ${selectedDish.name}` : 'Cập nhật tồn kho'}
                    open={isModalVisible}
                    onOk={() => form.submit()}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                    }}
                    okText="Xác nhận"
                    cancelText="Hủy"
                    width={500}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item name="dishId" hidden>
                            <Input />
                        </Form.Item>

                        <Form.Item label="Tên món ăn">
                            <Input disabled value={selectedDish?.name} />
                        </Form.Item>

                        <Form.Item label="Tồn kho hiện tại">
                            <InputNumber 
                                disabled 
                                value={selectedDish?.stock || 0}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="importQuantity"
                            label="Số lượng nhập thêm"
                            rules={[
                                { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                            ]}
                        >
                            <InputNumber 
                                placeholder="Nhập số lượng"
                                style={{ width: '100%' }}
                                min={1}
                            />
                        </Form.Item>

                        <Form.Item
                            name="newStock"
                            label="Tồn kho mới (cập nhật trực tiếp)"
                            rules={[
                                { type: 'number', min: 0, message: 'Tồn kho không được âm' }
                            ]}
                        >
                            <InputNumber 
                                placeholder="Nhập tồn kho mới"
                                style={{ width: '100%' }}
                                min={0}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default ImportStock;
