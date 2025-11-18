import { Button, Divider, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import { createOrderByAdmin, fetchAllDish, fetchAllOrders, fetchAllUser, getImageUrl, updateOrder } from "../../../services/api.service";
import { StopOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import Notification from "../../noti/Notification";
import AddressSelector from "../../common/AddressSelector";

const OrderTable = () => {
    const [dishes, setDishes] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [size, setSize] = useState(8);
    const [notifications, setNotifications] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [dishOptions, setDishOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [orderForm] = Form.useForm();
    const watchedItems = Form.useWatch ? (Form.useWatch("items", orderForm) || []) : [];
    const estimatedTotal = useMemo(() => {
        return watchedItems.reduce((sum, item) => {
            const dish = dishOptions.find((option) => option.id === item?.dishId);
            const price = dish?.price || 0;
            const qty = Number(item?.quantity) || 0;
            return sum + price * qty;
        }, 0);
    }, [watchedItems, dishOptions]);


    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };
    const STATUS_OPTIONS = [
        { label: "Chờ xác nhận", value: "PENDING" },
        { label: "Đã xác nhận", value: "CONFIRMED" },
        { label: "Đã giao hàng", value: "DELIVERED" },
        { label: "Đã hủy", value: "CANCELED" },
    ];

    // Hàm lấy dữ liệu món ăn
    const getOrders = async (page, size) => {
        try {

            const res = await fetchAllOrders(page, size);
            if (res.data && res.data.result) {
                const dishesWithKey = res.data.result.map((item) => ({
                    ...item,
                    key: item.id.toString(),
                }));
                setDishes(dishesWithKey);
                setPage(res.data.meta.page);
                setTotal(res.data.meta.total);
            }
            console.log(res.data)
        } catch (error) {
            console.error("Lỗi khi lấy danh sách món ăn:", error);
        }
    };

    // Lấy danh sách món ăn khi page, size hoặc type thay đổi
    useEffect(() => {
        getOrders(page, size);
    }, [page, size]);

    const handleStatusChange = async (id, statusOrder) => {
        const res = await updateOrder(id, statusOrder);
        if (res.data) {
            addNotification("Update order", "Cập nhật thông tin order thành công ", "success");
            getOrders(page, size);
        } else {
            addNotification("Error update", "Cập nhật thông tin order thất bại", "error");

        }
    }

    const handleCancelOrder = async (record) => {
        if (record.status === 'CANCELED') {
            addNotification("Thông báo", "Đơn hàng đã được hủy trước đó", "warning");
            return;
        }
        
        const res = await updateOrder(record.id, 'CANCELED');
        if (res.data) {
            addNotification("Hủy đơn hàng", "Đã hủy đơn hàng thành công", "success");
            getOrders(page, size);
        } else {
            addNotification("Lỗi", "Không thể hủy đơn hàng", "error");
        }
    }

    const loadReferenceData = async () => {
        try {
            const [dishRes, userRes] = await Promise.all([
                fetchAllDish(1, 500, 1),
                fetchAllUser(1, 100)
            ]);

            const dishPayload = dishRes?.data ?? dishRes;
            const dishList = dishPayload?.result || dishPayload?.data || dishPayload || [];
            setDishOptions(
                (dishList || []).map((dish) => ({
                    id: dish.id,
                    name: dish.name,
                    price: dish.price || 0,
                    stock: dish.stock || 0,
                }))
            );

            const userPayload = userRes?.data ?? userRes;
            const userList = userPayload?.result || userPayload?.data || [];
            setUserOptions(userList || []);
        } catch (error) {
            console.error("Không thể tải dữ liệu tham chiếu", error);
            addNotification("Lỗi", "Không thể tải dữ liệu món ăn hoặc người dùng", "error");
        }
    };

    const openCreateOrderModal = () => {
        setIsCreateOrderOpen(true);
        orderForm.resetFields();
        orderForm.setFieldsValue({
            paymentMethod: "CASH",
            items: [{ dishId: null, quantity: 1 }]
        });
        loadReferenceData();
    };

    const closeCreateOrderModal = () => {
        setIsCreateOrderOpen(false);
        orderForm.resetFields();
    };

    const handleAdminUserSelect = (userId) => {
        const selectedUser = userOptions.find((user) => user.id === userId);
        if (selectedUser) {
            orderForm.setFieldsValue({
                receiverName: selectedUser.name || "",
                receiverPhone: selectedUser.phone || "",
                receiverEmail: selectedUser.email || "",
                receiverAddress: selectedUser.address || "",
            });
        }
    };

    const handleCreateOrder = async (values) => {
        const items = (values.items || []).filter((item) => item && item.dishId);
        if (!items.length) {
            addNotification("Lỗi", "Vui lòng chọn ít nhất một món ăn", "error");
            return;
        }

        const payload = {
            userId: values.userId || null,
            receiverName: values.receiverName,
            receiverPhone: values.receiverPhone,
            receiverAddress: values.receiverAddress,
            receiverEmail: values.receiverEmail,
            paymentMethod: values.paymentMethod || "CASH",
            items: items.map((item) => ({
                dishId: item.dishId,
                quantity: Number(item.quantity) || 1,
            })),
        };

        setCreatingOrder(true);
        try {
            await createOrderByAdmin(payload);
            addNotification("Thành công", "Đã tạo đơn hàng mới", "success");
            closeCreateOrderModal();
            getOrders(page, size);
        } catch (error) {
            console.error("Không thể tạo đơn hàng", error);
            const messageError = error?.message || error?.response?.data?.message || "Không thể tạo đơn hàng";
            addNotification("Lỗi", messageError, "error");
        } finally {
            setCreatingOrder(false);
        }
    };

    const handleView = (order) => {
        setSelectedOrder(order);   // lưu thông tin order
        setIsModalVisible(true);   // mở modal
    };


    const columns = [
        {
            title: "Mã đơn",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Người nhận",
            dataIndex: "receiverName",
            key: "receiverName",
        },
        {
            title: "SĐT",
            dataIndex: "receiverPhone",
            key: "receiverPhone",
        },
        {
            title: "Địa chỉ",
            dataIndex: "receiverAddress",
            key: "receiverAddress",
        },
        {
            title: "Ngày đặt",
            dataIndex: "date",
            key: "date",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalPrice",
            key: "totalPrice",
            render: (price) => `${price.toLocaleString()} đ`,
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            render: (method) => (
                <Tag color={method === "CASH" ? "orange" : "blue"}>
                    {method === "CASH" ? "💰 COD" : method === "VNPAY" ? "🏦 VNPay" : method || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status, record) => {
                const normalized = status || "";
                const colorMap = {
                    PENDING: "blue",
                    CONFIRMED: "green",
                    DELIVERING: "orange",
                    DELIVERED: "teal",
                    CANCELLED: "red",
                };

                const textMap = {
                    PENDING: "Chờ xác nhận",
                    CONFIRMED: "Đã xác nhận",
                    DELIVERING: "Đang giao",
                    DELIVERED: "Đã giao",
                    CANCELLED: "Đã hủy",
                };

                // Xác định nút tiếp theo có thể bấm
                const getNextStatus = (currentStatus) => {
                    switch (currentStatus) {
                        case "PENDING":
                            return "CONFIRMED";
                        case "CONFIRMED":
                            return "DELIVERING";
                        case "DELIVERING":
                            return "DELIVERED";
                        default:
                            return null;
                    }
                };

                const nextStatus = getNextStatus(normalized);
                const isCancelled = normalized === "CANCELLED";
                const isDelivered = normalized === "DELIVERED";

                return (
                    <Space direction="vertical" size="small">
                        <Tag color={colorMap[normalized] || "default"}>
                            {textMap[normalized] || normalized}
                        </Tag>
                        {!isCancelled && !isDelivered && nextStatus && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => handleStatusChange(record.id, nextStatus)}
                                style={{
                                    background: nextStatus === "CONFIRMED" ? "#52c41a" :
                                                nextStatus === "DELIVERING" ? "#faad14" :
                                                nextStatus === "DELIVERED" ? "#1890ff" : "#C8A97E",
                                    borderColor: nextStatus === "CONFIRMED" ? "#52c41a" :
                                                nextStatus === "DELIVERING" ? "#faad14" :
                                                nextStatus === "DELIVERED" ? "#1890ff" : "#C8A97E",
                                }}
                            >
                                {nextStatus === "CONFIRMED" ? "Xác nhận" :
                                 nextStatus === "DELIVERING" ? "Đang giao" :
                                 nextStatus === "DELIVERED" ? "Đã giao" : ""}
                            </Button>
                        )}
                    </Space>
                );
            },
        },

        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => handleView(record)}>
                        <EyeOutlined style={{ color: "#1890ff" }} />
                    </a>
                    {record.status !== 'CANCELLED' && (
                        <a onClick={() => handleCancelOrder(record)}>
                            <StopOutlined style={{ color: "orange" }} />
                        </a>
                    )}
                </Space>
            ),
        },
    ];

    const [itemsWithImageUrl, setItemsWithImageUrl] = useState([]);

    useEffect(() => {
        async function fetchImageUrls() {
            if (!selectedOrder) return;

            const items = await Promise.all(
                selectedOrder.listOrderItem.map(async (item) => {
                    const fullImageUrl = await getImageUrl(item.imageUrl);
                    return {
                        ...item,
                        fullImageUrl,
                    };
                })
            );
            setItemsWithImageUrl(items);
        }

        fetchImageUrls();
    }, [selectedOrder]);

    // search 
    const handleSearch = async (e) => {
        console.log(e.target.value);
        const name = e.target.value;
        // const res = await fetchAllDishByName(page, size, name);
        // if (res.data && res.data.result) {
        //     const dishesWithKey = res.data.result.map((item) => ({
        //         ...item,
        //         key: item.id.toString(),
        //     }));
        //     console.log(dishesWithKey);

        //     setDishes(dishesWithKey);
        //     setPage(res.data.meta.page);
        //     setTotal(res.data.meta.total);
        // }
    }

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
                        List Orders
                    </p>
                </div>
                <div className="flex items-center ">
                    <span className="m-3 px-3 rounded text-white"
                        style={{
                            background: "#C8A97E",
                        }}>
                        Search by id
                    </span>
                    <input
                        onChange={(e) => { handleSearch(e) }}
                        className="px-2 border rounded text-black bg-white"
                        type="text"
                        placeholder="search"
                        style={{
                            border: "1px solid #C8A97E",
                        }}

                    />
                    <Button
                        type="primary"
                        className="ms-3"
                        onClick={openCreateOrderModal}
                        style={{ background: "#C8A97E", borderColor: "#C8A97E" }}
                    >
                        Tạo đơn mới
                    </Button>
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
                title={<span className="block px-3 py-2" style={{ fontSize: 20 }}> Chi tiết đơn hàng</span>}
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={900}

            >
                {selectedOrder && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', background: "#f9fafb", }}
                        className="p-3"
                    >
                        {/* Cột trái: Thông tin đơn hàng */}
                        <div style={{
                            padding: '20px',
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ marginBottom: 16, color: "#1890ff" }}> Thông tin đơn hàng</h3>
                            <p><strong>Mã đơn:</strong> #{selectedOrder.id}</p>
                            <p><strong>Người nhận:</strong> {selectedOrder.receiverName}</p>
                            <p><strong>SĐT:</strong> {selectedOrder.receiverPhone}</p>
                            <p><strong>Địa chỉ:</strong> {selectedOrder.receiverAddress}</p>
                            <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
                            <p>
                                <strong>Trạng thái:</strong>{" "}
                                <span
                                    style={{
                                        color:
                                            selectedOrder.status === "PENDING" ? "#1890ff" :
                                                selectedOrder.status === "CONFIRMED" ? "green" :
                                                    selectedOrder.status === "DELIVERING" ? "#faad14" :
                                                        selectedOrder.status === "DELIVERED" ? "#52c41a" : "red",
                                        fontWeight: 600
                                    }}>
                                    {selectedOrder.status}
                                </span>
                            </p>
                            <p><strong>Tổng tiền:</strong> <span style={{ color: '#d4380d', fontWeight: 'bold' }}>{selectedOrder.totalPrice.toLocaleString()} đ</span></p>
                        </div>

                        {/* Cột phải: Danh sách món ăn */}
                        <div style={{
                            padding: '20px',
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ marginBottom: 16, color: "#1890ff" }}> Danh sách món ăn</h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                                {itemsWithImageUrl.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            marginBottom: 16,
                                            background: "#f9f9f9",
                                            borderRadius: 10,
                                            alignItems: "center",
                                        }}
                                    >
                                        <img
                                            src={item.fullImageUrl}
                                            alt={item.name}
                                            style={{ width: 70, height: 90, objectFit: "cover", borderRadius: 8, marginRight: 20 }}
                                        />
                                        <div>
                                            <p style={{ fontSize: 16, fontWeight: 600 }}>{item.name}</p>
                                            <p>
                                                Số lượng: <strong>{item.quantity}</strong>
                                            </p>
                                            <p>
                                                Đơn giá: <strong>{item.price.toLocaleString()} đ</strong>
                                            </p>
                                            <p style={{ color: "#d4380d" }}>
                                                Thành tiền: <strong>{item.total.toLocaleString()} đ</strong>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={isCreateOrderOpen}
                onCancel={closeCreateOrderModal}
                footer={null}
                width={920}
                title={<span style={{ fontSize: 20, fontWeight: 600 }}>Tạo đơn hàng mới</span>}
            >
                <Form
                    layout="vertical"
                    form={orderForm}
                    onFinish={handleCreateOrder}
                >
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item label="Khách hàng (tùy chọn)" name="userId">
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="Chọn khách hàng"
                                    optionFilterProp="label"
                                    getPopupContainer={(triggerNode) => triggerNode.parentElement}
                                    onChange={handleAdminUserSelect}
                                    options={userOptions.map((user) => ({
                                        value: user.id,
                                        label: `${user.name || user.username || 'Khách'} - ${user.email}`,
                                    }))}
                                />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Phương thức thanh toán"
                                name="paymentMethod"
                                initialValue="CASH"
                                rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán" }]}
                            >
                                <Select
                                    getPopupContainer={(triggerNode) => triggerNode.parentElement}
                                    options={[
                                        { value: "CASH", label: "Tiền mặt" },
                                    ]}
                                />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Tên người nhận"
                                name="receiverName"
                                rules={[{ required: true, message: "Nhập tên người nhận" }]}
                            >
                                <Input placeholder="Nguyễn Văn A" />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Số điện thoại"
                                name="receiverPhone"
                                rules={[{ required: true, message: "Nhập số điện thoại" }]}
                            >
                                <Input placeholder="0123 456 789" />
                            </Form.Item>
                        </div>
                        <div className="col-md-12">
                            <Form.Item
                                label="Email"
                                name="receiverEmail"
                                rules={[{ type: "email", message: "Email không hợp lệ" }]}
                            >
                                <Input placeholder="customer@example.com" />
                            </Form.Item>
                        </div>
                        <div className="col-md-12">
                            <Form.Item
                                label="Địa chỉ"
                                name="receiverAddress"
                                rules={[{ required: true, message: "Nhập địa chỉ giao hàng" }]}
                            >
                                <AddressSelector />
                            </Form.Item>
                        </div>
                    </div>

                    <Divider>Xác nhận món ăn</Divider>
                    <Form.List
                        name="items"
                        rules={[
                            {
                                validator: async (_, value) => {
                                    if (!value || !value.length) {
                                        return Promise.reject(new Error("Vui lòng thêm ít nhất 1 món ăn"));
                                    }
                                }
                            }
                        ]}
                    >
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => {
                                    const { key, name, ...restField } = field;
                                    return (
                                    <Space
                                        key={key}
                                        align="baseline"
                                        style={{ display: "flex", marginBottom: 12 }}
                                    >
                                        <Form.Item
                                            {...restField}
                                            label={index === 0 ? "Món ăn" : ""}
                                            name={[name, "dishId"]}
                                            rules={[{ required: true, message: "Chọn món" }]}
                                            style={{ minWidth: 320 }}
                                        >
                                            <Select
                                                placeholder="Chọn món"
                                                showSearch
                                                optionFilterProp="label"
                                                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                                                options={dishOptions.map((dish) => ({
                                                    value: dish.id,
                                                    label: `${dish.name} - ${dish.price?.toLocaleString("vi-VN")}đ`,
                                                }))}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            label={index === 0 ? "Số lượng" : ""}
                                            name={[name, "quantity"]}
                                            rules={[{ required: true, message: "Nhập số lượng" }]}
                                        >
                                            <InputNumber min={1} max={1000} placeholder="1" />
                                        </Form.Item>
                                        {fields.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<MinusCircleOutlined />}
                                                onClick={() => remove(name)}
                                            />
                                        )}
                                    </Space>
                                )})}
                                <Button
                                    type="dashed"
                                    onClick={() => add({ quantity: 1 })}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ marginBottom: 16 }}
                                >
                                    Thêm món
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider />
                    <div className="flex justify-between items-center mb-3">
                        <span style={{ fontWeight: 600 }}>Tạm tính:</span>
                        <span style={{ fontWeight: 700, color: "#d4380d", fontSize: 18 }}>
                            {estimatedTotal.toLocaleString("vi-VN")} đ
                        </span>
                    </div>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={creatingOrder}
                        block
                        style={{ background: "#C8A97E", borderColor: "#C8A97E", height: 48 }}
                    >
                        Tạo đơn hàng
                    </Button>
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
        </>
    );
}

export default OrderTable