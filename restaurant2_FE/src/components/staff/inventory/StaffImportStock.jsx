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
    ImportOutlined,
    EyeOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {
    fetchAllDish,
    importStock,
    fetchAllDishByName,
    getImageUrlFromFileName
} from '../../../services/api.service';
import foodPlaceholder from '../../../assets/img/food-1.webp';

const { Title } = Typography;

const StaffImportStock = () => {
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
                    src={getImageUrlFromFileName(imageUrl) || foodPlaceholder}
                    alt="Dish"
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                    onError={(e) => { e.currentTarget.src = foodPlaceholder; }}
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
                            Nhập kho
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
                </Space>
            ),
        },
    ];

    const importQuantity = Form.useWatch('importQuantity', form) || 0;

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        setLoading(true);
        try {
            const res = await fetchAllDish(1, 100, 1);
            const data = res?.data ?? res;
            if (data?.result) {
                setDishes(data.result);
            } else if (Array.isArray(data)) {
                setDishes(data);
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

    const handleSearch = async (value) => {
        setSearchText(value);
        if (!value.trim()) {
            fetchDishes();
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetchAllDishByName(1, 100, value);
            const data = res?.data ?? res;
            if (data?.result) {
                setDishes(data.result);
            } else if (Array.isArray(data)) {
                setDishes(data);
            }
        } catch (error) {
            message.error('Lỗi khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            await importStock(selectedDish.id, { quantity: values.importQuantity });
            message.success(`Nhập kho thành công: +${values.importQuantity} sản phẩm`);
            
            setIsModalVisible(false);
            form.resetFields();
            fetchDishes();
        } catch (error) {
            message.error('Lỗi khi nhập kho');
        }
    };

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="m-0">Nhập kho</Title>
                        <p className="text-gray-500 m-0">Chỉ có quyền nhập kho, không thể sửa/xóa món ăn</p>
                    </div>
                    <Space>
                        <Input.Search
                            placeholder="Tìm kiếm món ăn..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                        />
                        <Button 
                            icon={<ReloadOutlined />}
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
                    title={`Nhập kho: ${selectedDish?.name}`}
                    open={isModalVisible}
                    onOk={() => form.submit()}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                    }}
                    okText="Nhập kho"
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
                                { required: true, message: 'Vui lòng nhập số lượng' },
                                { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                            ]}
                        >
                            <InputNumber 
                                placeholder="Nhập số lượng"
                                style={{ width: '100%' }}
                                min={1}
                            />
                        </Form.Item>

                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm text-blue-600 m-0">
                                <strong>Lưu ý:</strong> Sau khi nhập kho, tồn kho mới sẽ là: 
                                <span className="font-bold">
                                    {(selectedDish?.stock || 0) + (importQuantity || 0)}
                                </span>
                            </p>
                        </div>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default StaffImportStock;
