import React, { useEffect, useState } from "react";
import { Space, Table, Image, Modal, Form, Input, Button, Select, Upload, message, Popconfirm, InputNumber } from "antd";
import { fetchAllDish, fetchAllCategories, handleUploadFile, updateDish, deleteDish, fetchAllDishByName, getImageUrl, getImageUrlFromFileName } from "../../../services/api.service";
import { DeleteOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import Notification from "../../noti/Notification";
import AddDish from "./Add.dish";

const TableDish = () => {
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [type, setType] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [size, setSize] = useState(4);
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

    const getDishes = async (page, size, type) => {
        try {
            const res = await fetchAllDish(page, size, type);
            if (res.data && res.data.result) {
                debugger
                // const enrichedDishes = await Promise.all(
                //     res.data.result.map(async (item) => {
                //         const imageUrl = await getImageUrl(item.imageUrl); // gọi API từ file service
                //         return {
                //             ...item,
                //             key: item.id.toString(),
                //             imageUrl,
                //         };
                //     })
                // );

                setDishes(res.data.result);
                setPage(res.data.meta.page);
                setTotal(res.data.meta.total);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách món ăn:", error);
        }
    };

    // Lấy danh mục
    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await fetchAllCategories();
                if (res.data) {
                    setCategories(res.data);
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách danh mục:", error);
            }
        };
        getCategories();
    }, []);

    // Lấy danh sách món ăn khi page, size hoặc type thay đổi
    useEffect(() => {
        getDishes(page, size, type);
    }, [page, size, type]);

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
            categoryId: record.category.id,
            stock: record.stock || 0,
        });
        setIsModalOpen(true);
    };

    // Hàm xử lý khi bấm "Xóa"
    const handleDelete = async (record) => {
        console.log("Xóa món:", record);
        const res = await deleteDish(record.id);
        if (res.data) {
            addNotification("Delete user", "Xóa  món ăn thành công", "success");

        } else {
            addNotification("Error delete", "Xóa   món ăn thất bại", "error");

        }
        getDishes(page, size, type);
    };

    // Hàm xử lý khi bấm "Nhập kho"
    const handleStockUpdate = (record) => {
        console.log("Stock update clicked for dish:", record);
        setSelectedDishForStock(record);
        stockForm.setFieldsValue({
            stock: record.stock || 0
        });
        setIsStockModalOpen(true);
    };

    // Hàm xử lý cập nhật tồn kho
    const handleStockSubmit = async (values) => {
        try {
            console.log("Stock update values:", values);
            console.log("Selected dish for stock:", selectedDishForStock);
            
            const updateData = {
                ...selectedDishForStock,
                stock: values.stock
            };
            
            console.log("Stock update data:", updateData);
            
            await updateDish(updateData);
            addNotification("Cập nhật tồn kho thành công", `Đã cập nhật tồn kho món "${selectedDishForStock.name}" thành ${values.stock}`, "success");
            setIsStockModalOpen(false);
            stockForm.resetFields();
            getDishes(page, size, type);
        } catch (error) {
            console.error("Error updating stock:", error);
            addNotification("Lỗi khi cập nhật tồn kho", error.response?.data?.message || "Có lỗi xảy ra", "error");
        }
    };

    // Hàm xử lý khi bấm "Cập nhật" thông tin món ăn
    const handleUpdate = async (values) => {
        try {
            console.log("Cập nhật món ăn:", { ...values });
            const res = await updateDish(values);
            if (res.data) {
                addNotification("Update user", "Cập nhật   món ăn thành công", "success");
            } else {
                addNotification("Error update", "Cập nhật   món ăn thất bại", "error");

            }
            setIsModalOpen(false);
            setPreviewImage(null);
            form.resetFields();
            getDishes(page, size, type); // Làm mới danh sách món ăn
        } catch (error) {
            console.error("Lỗi khi cập nhật món ăn:", error);
            message.error("Cập nhật món ăn thất bại!");
        }
    };

    // Hàm xử lý khi chọn và upload hình ảnh
    const handleImageUpload = async (file) => {
        debugger
        // Tạo URL tạm thời để hiển thị ảnh xem trước
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        debugger
        try {
            const uploadResponse = await handleUploadFile(file);
            console.log("Lỗi upload ảnh:", uploadResponse);

            const fileName = uploadResponse.data;
            const imageUrl = await getImageUrl(fileName);
            form.setFieldsValue({ image: fileName });
            // Bước 2: Lấy dữ liệu từ form và cập nhật món ăn
            const formValues = form.getFieldsValue();
            const dishData = {
                id: selectedDish.id,
                name: formValues.name,
                description: formValues.description,
                price: formValues.price,
                imageUrl: imageUrl, // Sử dụng fileName từ API upload
                categoryId: formValues.categoryId,
            };

            // Gọi API cập nhật món ăn
            console.log("Cập nhật món ăn:", dishData);
            const updateResponse = await updateDish(dishData); // Giả sử bạn có hàm updateDish để gọi API PUT /dish
            if (updateResponse.data) {
                addNotification("Update image", "Cập nhật hình ảnh món ăn thành công", "success");
            }
            // message.success("Cập nhật hình ảnh và thông tin món ăn thành công!");
            setIsModalOpen(false); // Đóng modal
            setPreviewImage(null); // Reset ảnh xem trước
            form.resetFields(); // Reset form
            getDishes(page, size, type); // Làm mới danh sách món ăn

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
    const handleSearch = async (e) => {
        console.log(e.target.value);
        const name = e.target.value;
        const res = await fetchAllDishByName(page, size, name);
        if (res.data && res.data.result) {
            const dishesWithKey = res.data.result.map((item) => ({
                ...item,
                key: item.id.toString(),
            }));
            console.log(dishesWithKey);

            setDishes(dishesWithKey);
            setPage(res.data.meta.page);
            setTotal(res.data.meta.total);
        }
    }
    const columns = [
        {
            title: "Ảnh",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url) => (
                <Image width={70} height={90} src={getImageUrlFromFileName(url)} alt="dish" />
            ),
        },
        {
            title: "Tên món",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            render: (price) => `${price.toLocaleString()} đ`,
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            render: (stock) => (
                <span style={{ 
                    color: stock > 10 ? '#52c41a' : stock > 0 ? '#faad14' : '#ff4d4f',
                    fontWeight: 'bold'
                }}>
                    {stock || 0}
                </span>
            ),
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            render: (cat) => (
                <div>
                    <p>{cat.name}</p>
                </div>
            ),
        },
        {
            title: "Nhập kho",
            key: "stockUpdate",
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleStockUpdate(record)}
                    >
                        Nhập kho
                    </Button>
                </Space>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => handleEdit(record)}>
                        <EditOutlined style={{ color: "#1890ff" }} />
                    </a>
                    <a onClick={() => handleDelete(record)}>
                        <DeleteOutlined style={{ color: "red" }} />
                    </a>

                </Space>
            ),
        },
    ];

    const filteredCategories = categories.filter(cat => cat.name.toLowerCase() !== "all");


    return (
        <>
            <div
                className="header flex py-3 p-4 justify-between"
                style={{
                    backgroundColor: "rgba(112, 139, 200, 0.18)",
                }}
            >
                <div>
                    <p
                        style={{
                            color: "#C8A97E",
                            fontSize: "32px",
                            margin: "0",
                        }}
                    >
                        List Dish
                    </p>
                </div>
                <div>
                    <input
                        onChange={(e) => { handleSearch(e) }}
                        className="px-2 border rounded text-black bg-white"
                        type="text"
                        placeholder="search"
                        style={{
                            border: "1px solid #C8A97E",
                        }}

                    />
                    <button
                        className="m-3 px-3 rounded text-white"
                        style={{
                            background: "#C8A97E",
                        }}
                        onClick={() => {
                            setCreate(true)
                        }}
                    >
                        add dish
                    </button>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={dishes}
                pagination={{
                    current: page,
                    pageSize: size,
                    total: total,
                    onChange: (page, pageSize) => {
                        setPage(page);
                        setSize(pageSize);
                    },
                }}
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
                                        defaultValue={form.getFieldValue('categoryId') || ''}
                                        onChange={(e) => form.setFieldsValue({ categoryId: parseInt(e.target.value) })}
                                    >
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
                    <Form.Item
                        name="stock"
                        label="Số lượng tồn kho"
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