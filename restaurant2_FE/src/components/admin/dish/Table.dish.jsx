import React, { useEffect, useState } from "react";
import {
    Space,
    Table,
    Image,
    Modal,
    Form,
    Input,
    Button,
    Select,
    message,
    InputNumber,
    Tag,
    Tooltip,
    Card,
    Typography,
    Divider,
    Empty,
    Upload,
} from "antd";
import {
    fetchAllDish,
    fetchAllCategories,
    handleUploadFile,
    updateDish,
    deleteDish,
    fetchAllDishByName,
    getImageUrlFromFileName,
    updateStock,
} from "../../../services/api.service";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    DatabaseOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import Notification from "../../noti/Notification";
import AddDish from "./Add.dish";
import foodPlaceholder from "../../../assets/img/food-1.webp";

const TableDish = () => {
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [size, setSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [form] = Form.useForm();

    const [isCreate, setCreate] = useState(false);

    const [notifications, setNotifications] = useState([]);

    // Stock update modal states
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedDishForStock, setSelectedDishForStock] = useState(null);
    const [stockForm] = Form.useForm();


    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };
    // Hàm lấy dữ liệu món ăn

    const getDishes = async (pageIndex, pageSize) => {
        try {
            // Không filter theo category, lấy tất cả dishes
            const res = await fetchAllDish(pageIndex, pageSize, null);
            console.log("API Response:", res);
            
            const data = res?.data ?? res;
            console.log("Parsed data:", data);
            
            if (data?.result && Array.isArray(data.result)) {
                setDishes(
                    data.result.map((item) => ({
                        ...item,
                        key: item.id,
                    }))
                );
                setPage(data.meta?.page || pageIndex);
                setTotal(data.meta?.total || 0);
            } else if (Array.isArray(data)) {
                setDishes(data.map((item) => ({ ...item, key: item.id })));
                setTotal(data.length);
            } else {
                console.warn("Unexpected data structure:", data);
                setDishes([]);
                setTotal(0);
                addNotification(
                    "Cảnh báo", 
                    "Không thể lấy dữ liệu món ăn. Vui lòng kiểm tra lại.", 
                    "warning"
                );
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách món ăn:", error);
            console.error("Error details:", error.response?.data || error.message);
            setDishes([]);
            setTotal(0);
            addNotification(
                "Lỗi", 
                error.response?.data?.message || error.message || "Không thể tải danh sách món ăn", 
                "error"
            );
        }
    };

    // Lấy danh mục
    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await fetchAllCategories();
                const data = res?.data ?? res;
                if (Array.isArray(data)) {
                    setCategories(data);
                } else if (data?.data && Array.isArray(data.data)) {
                    setCategories(data.data);
                } else {
                    setCategories([]);
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách danh mục:", error);
                setCategories([]);
            }
        };
        getCategories();
    }, []);

    // Lấy danh sách món ăn khi page, size thay đổi
    useEffect(() => {
        getDishes(page, size);
    }, [page, size]);

    // const reload = () => {
    //     getDishes(page, size, type);
    // }
    // Hàm xử lý khi bấm "Chỉnh sửa"
    const handleEdit = (record) => {
        setSelectedDish(record);
        setPreviewImage(null); // Reset preview image khi mở modal
        form.setFieldsValue({
            id: record.id,
            name: record.name,
            description: record.description,
            price: record.price,
            categoryId: record.category?.id || record.categoryId || undefined,
            stock: record.stock || 0,
            imageUrl: record.imageUrl,
        });
        setIsModalOpen(true);
    };

    // Hàm xử lý khi bấm "Xóa"
    const handleDelete = async (record) => {
        const res = await deleteDish(record.id);
        const data = res?.data ?? res;
        if (data) {
            addNotification("Xóa món ăn", `Đã xóa món "${record.name}" thành công`, "success");
            getDishes(page, size);
        } else {
            addNotification("Xóa món ăn", "Xóa món ăn thất bại", "error");
        }
    };

    // Hàm xử lý khi bấm "Nhập kho"
    const handleStockUpdate = (record) => {
        setSelectedDishForStock(record);
        stockForm.setFieldsValue({
            stock: record.stock || 0
        });
        setIsStockModalOpen(true);
    };

    // Hàm xử lý cập nhật tồn kho
    const handleStockSubmit = async (values) => {
        if (!selectedDishForStock) return;
        try {
            const response = await updateStock(selectedDishForStock.id, { stock: values.stock });
            const result = response?.data ?? response;
            if (result?.success) {
                addNotification(
                    "Cập nhật tồn kho",
                    result.message || `Đã cập nhật tồn kho món "${selectedDishForStock.name}" thành ${values.stock}`,
                    "success"
                );
                setIsStockModalOpen(false);
                stockForm.resetFields();
                getDishes(page, size);
            } else {
                throw new Error(result?.message || "Cập nhật tồn kho không thành công");
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            const messageError =
                error?.message ||
                error?.response?.data?.message ||
                "Có lỗi xảy ra khi cập nhật tồn kho";
            addNotification("Lỗi khi cập nhật tồn kho", messageError, "error");
        }
    };

    // Hàm xử lý khi bấm "Cập nhật" thông tin món ăn
    const handleUpdate = async (values) => {
        try {
            const payload = {
                id: values.id,
                name: values.name,
                description: values.description,
                price: values.price,
                stock: values.stock,
                imageUrl: values.imageUrl || selectedDish?.imageUrl || "",
            };
            
            // Chỉ thêm category nếu categoryId có giá trị
            if (values.categoryId) {
                payload.category = {
                    id: values.categoryId,
                };
            } else {
                // Nếu không có categoryId, gửi empty object để backend giữ nguyên category hiện tại
                payload.category = {};
            }
            
            const res = await updateDish(payload);
            const data = res?.data ?? res;
            if (data) {
                addNotification("Cập nhật món ăn", `Đã cập nhật món "${values.name}" thành công`, "success");
                setIsModalOpen(false);
                setPreviewImage(null);
                form.resetFields();
                getDishes(page, size); // Làm mới danh sách món ăn
            } else {
                addNotification("Cập nhật món ăn", "Cập nhật món ăn thất bại", "error");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật món ăn:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "Cập nhật món ăn thất bại!";
            message.error(errorMessage);
            addNotification("Lỗi khi cập nhật món ăn", errorMessage, "error");
        }
    };

    // Hàm xử lý khi chọn và upload hình ảnh
    const handleImageUpload = async (file) => {
        try {
            const reader = new FileReader();
            reader.onload = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);

            const uploadResponse = await handleUploadFile(file);
            const fileName = uploadResponse?.data ?? uploadResponse;
            if (!fileName) {
                throw new Error("Không lấy được tên file sau khi upload");
            }
            form.setFieldsValue({ imageUrl: fileName });
            addNotification("Upload ảnh", "Tải ảnh món ăn thành công", "success");
        } catch (error) {
            console.error("Lỗi upload ảnh:", error);
            message.error("Upload ảnh thất bại!");
        }
    };

    // Hàm đóng modal
    const handleCancel = () => {
        setIsModalOpen(false);
        setPreviewImage(null);
        form.resetFields();
    };


    // search 
    const handleSearch = async (value) => {
        const keyword = value.trim();
        if (!keyword) {
            getDishes(1, size);
            setPage(1);
            return;
        }

        try {
            const res = await fetchAllDishByName(1, size, keyword);
            const data = res?.data ?? res;
            if (data?.result) {
                setDishes(data.result.map((item) => ({ ...item, key: item.id })));
                setPage(data.meta.page);
                setTotal(data.meta.total);
            } else {
                setDishes([]);
                setTotal(0);
            }
        } catch (error) {
            console.error("Lỗi khi tìm kiếm món ăn:", error);
            message.error("Không thể tìm kiếm món ăn");
        }
    };

    const columns = [
        {
            title: "Ảnh",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url) => (
                <Image
                    width={72}
                    height={72}
                    preview={false}
                    style={{ objectFit: "cover", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
                    src={getImageUrlFromFileName(url)}
                    alt="dish"
                    fallback={foodPlaceholder}
                />
            ),
        },
        {
            title: "Tên món",
            dataIndex: "name",
            key: "name",
            render: (text) => <Typography.Text strong>{text}</Typography.Text>,
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            render: (price) => (
                <Typography.Text style={{ color: "#C8A97E", fontWeight: 600 }}>
                    {price.toLocaleString("vi-VN")} đ
                </Typography.Text>
            ),
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            render: (stock) => (
                <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"} style={{ fontSize: 14, padding: "4px 12px" }}>
                    {stock || 0}
                </Tag>
            ),
        },
        {
            title: "Đã bán hôm nay",
            dataIndex: "soldToday",
            key: "soldToday",
            render: (sold) => (
                <Tag color="purple" style={{ fontSize: 14, padding: "4px 12px" }}>
                    {sold || 0}
                </Tag>
            ),
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            render: (cat) => (
                <Tag color="geekblue" style={{ textTransform: "capitalize" }}>
                    {cat?.name || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Nhập kho",
            key: "stockUpdate",
            render: (_, record) => (
                <Tooltip title="Nhập thêm hàng">
                    <Button
                        type="primary"
                        shape="round"
                        icon={<DatabaseOutlined />}
                        onClick={() => handleStockUpdate(record)}
                    >
                        Nhập kho
                    </Button>
                </Tooltip>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#1d4ed8" }} />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa món ăn">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredCategories = categories.filter((cat) => cat.name?.toLowerCase() !== "all");

    return (
        <>
            <Card
                className="mb-4 shadow-lg"
                bodyStyle={{ padding: "18px 24px" }}
                style={{
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)",
                    border: "1px solid #e5e7ff",
                }}
            >
                <Space
                    className="w-full"
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                >
                    <Space
                        align="center"
                        className="w-full"
                        style={{ justifyContent: "space-between" }}
                    >
                        <div>
                            <Typography.Title level={3} style={{ marginBottom: 4, color: "#1f2937" }}>
                                Quản lý món ăn
                            </Typography.Title>
                            <Typography.Text style={{ color: "#6b7280" }}>
                                Quản lý danh sách món ăn, hình ảnh, tồn kho và danh mục
                            </Typography.Text>
                        </div>
                        <Space>
                            <Input.Search
                                placeholder="Tìm kiếm món ăn..."
                                allowClear
                                enterButton={<Button icon={<SearchOutlined />}>Tìm kiếm</Button>}
                                size="large"
                                onSearch={handleSearch}
                                style={{ width: 320 }}
                            />
                            <Button
                                type="default"
                                size="large"
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setPage(1);
                                    getDishes(1, size);
                                }}
                            >
                                Làm mới
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => setCreate(true)}
                                style={{ background: "#C8A97E", borderColor: "#C8A97E" }}
                            >
                                Thêm món
                            </Button>
                        </Space>
                    </Space>
                    <Divider style={{ margin: "12px 0" }} />
                    <Space size={[8, 8]} wrap>
                        <Tag color="processing">
                            Tổng danh mục: <strong>{filteredCategories.length}</strong>
                        </Tag>
                        <Tag color="purple">
                            Tổng món ăn: <strong>{total}</strong>
                        </Tag>
                    </Space>
                </Space>
            </Card>

            <Table
                columns={columns}
                dataSource={dishes}
                pagination={{
                    current: page,
                    pageSize: size,
                    total: total,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} món ăn`,
                    onChange: (page, pageSize) => {
                        setPage(page);
                        setSize(pageSize);
                    },
                }}
                locale={{
                    emptyText: (
                        <Empty
                            description="Chưa có món ăn nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ),
                }}
                bordered
                style={{ background: "#fff", borderRadius: 16 }}
                scroll={{ x: 1024 }}
            />
            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width={1014}
                style={{ padding: "0", borderRadius: "40px" }}
                getContainer={false} // bạn vẫn giữ cái này
            >
                <div className="row">
                    {/* Ảnh xem trước */}
                    <div className="col-md-7">
                        <div
                            className="modal__img"
                            style={{
                                backgroundImage: `url(${previewImage || getImageUrlFromFileName(selectedDish?.imageUrl)})`,
                                width: "100%",
                                height: "100%",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                padding: "0 0",
                                minHeight: "400px",
                            }}
                        />
                    </div>

                    {/* Form cập nhật thông tin */}
                    <div className="col-md-5" style={{ paddingRight: "36px", paddingTop: "20px" }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdate}
                        >
                            <Form.Item name="imageUrl" hidden>
                                <Input />
                            </Form.Item>
                            <div className="row">
                                {/* Tên món */}
                                <div className="col-12">
                                    <Form.Item
                                        name="id"
                                        hidden
                                    >
                                        <Input style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Tên món */}
                                <div className="col-12">
                                    <Form.Item
                                        name="name"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Tên món</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập tên món!" }]}
                                    >
                                        <Input style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Danh mục */}

                                <div className="col-12" style={
                                    { marginBottom: "24px" }
                                }>
                                    {/* Trường ẩn để Form ghi nhận giá trị categoryId */}
                                    <Form.Item name="categoryId" hidden>
                                        <input type="hidden" />
                                    </Form.Item>


                                    <span style={{ fontWeight: 600, fontSize: 18, paddingBottom: "8px", display: "block" }}>Loại món</span>
                                    <select
                                        style={{
                                            width: '100%',
                                            fontSize: 16,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: '1px solid #d9d9d9',
                                        }}
                                        value={form.getFieldValue('categoryId') || ''}
                                        onChange={(e) => form.setFieldsValue({ categoryId: parseInt(e.target.value) || undefined })}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {filteredCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>


                                </div>
                                {/* Mô tả */}
                                <div className="col-12">
                                    <Form.Item
                                        name="description"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Mô tả</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                                    >
                                        <Input.TextArea rows={3} style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Giá */}
                                <div className="col-12">
                                    <Form.Item
                                        name="price"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Giá</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
                                    >
                                        <Input type="number" min={0} style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Tồn kho */}
                                <div className="col-12">
                                    <Form.Item
                                        name="stock"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Tồn kho</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập số lượng tồn kho!" }]}
                                    >
                                        <Input type="number" min={0} style={{ fontSize: 16 }} placeholder="Nhập số lượng tồn kho" />
                                    </Form.Item>
                                </div>

                                {/* Upload ảnh và nút Cập nhật hình ảnh */}
                                <div className="col-12 mb-3">
                                    <Upload
                                        beforeUpload={(file) => {
                                            handleImageUpload(file);
                                            // Trả về false để không upload tự động, vì bạn tự handle upload rồi
                                            return false;
                                        }}
                                        showUploadList={false} // không hiển thị danh sách file đã upload
                                        accept="image/*"
                                    >
                                        <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                                            Cập nhật hình ảnh
                                        </Button>
                                    </Upload>
                                </div>

                                {/* Nút cập nhật */}
                                <div className="col-12 mb-2">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ width: "100%", padding: "10px 0", fontSize: 16 }}
                                    >
                                        Cập nhật thông tin
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </div>
            </Modal>

            {/* Hiển thị thông báo */}
            <div className="fixed top-4 right-4 z-[9999]">
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.error}
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

            {/* Stock Update Modal */}
            <Modal
                title="Cập nhật tồn kho"
                open={isStockModalOpen}
                onOk={() => stockForm.submit()}
                onCancel={() => {
                    setIsStockModalOpen(false);
                    stockForm.resetFields();
                }}
                okText="Cập nhật"
                cancelText="Hủy"
                width={400}
            >
                <Form
                    form={stockForm}
                    layout="vertical"
                    onFinish={handleStockSubmit}
                >
                    <Typography.Paragraph type="secondary">
                        Món: <Typography.Text strong>{selectedDishForStock?.name}</Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
                        Tồn kho hiện tại:{" "}
                        <Typography.Text strong>{selectedDishForStock?.stock ?? 0}</Typography.Text>
                    </Typography.Paragraph>

                    <Form.Item
                        name="stock"
                        label="Số lượng tồn kho mới"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số lượng tồn kho!' },
                            { type: 'number', min: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0!' }
                        ]}
                    >
                        <InputNumber
                            placeholder="Nhập số lượng tồn kho"
                            style={{ width: '100%' }}
                            min={0}
                            max={9999}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <AddDish

                isCreate={isCreate}
                setCreate={setCreate}
            // reload={reload}
            />
        </>
    );
};

export default TableDish;