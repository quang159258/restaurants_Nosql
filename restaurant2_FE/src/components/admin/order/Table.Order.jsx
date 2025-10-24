import { Modal, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { fetchAllOrders, getImageUrl, updateOrder } from "../../../services/api.service";
import { StopOutlined, EyeOutlined } from "@ant-design/icons";
import Notification from "../../noti/Notification";

const OrderTable = () => {
    const [dishes, setDishes] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [size, setSize] = useState(8);
    const [notifications, setNotifications] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);


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
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status, record) => {
                const colorMap = {
                    PENDING: "blue",
                    CONFIRMED: "green",
                    DELIVERED: "orange",
                    CANCELED: "red",
                };

                return (
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(record.id, e.target.value)}
                        style={{
                            color: colorMap[status] || "black",
                        }}
                    >
                        <option value="PENDING" style={{ color: "blue" }}>Chờ xác nhận</option>
                        <option value="CONFIRMED" style={{ color: "green" }}>Đã xác nhận</option>
                        <option value="DELIVERED" style={{ color: "orange" }}>Đã giao hàng</option>
                        <option value="CANCELED" style={{ color: "red" }}>Đã hủy</option>
                    </select>
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
                    {record.status !== 'CANCELED' && (
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
                    {/* <button
                        className="m-3 px-3 rounded text-white"
                        style={{
                            background: "#C8A97E",
                        }}
                        onClick={() => {
                            setCreate(true)
                        }}
                    >
                        add dish
                    </button> */}
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
                                <span style={{
                                    color:
                                        selectedOrder.status === "PENDING" ? "#1890ff" :
                                            selectedOrder.status === "CONFIRMED" ? "green" :
                                                selectedOrder.status === "DELIVERED" ? "#faad14" :
                                                    "red",
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

            {/* Hiển thị thông báo */}
            < div className="fixed top-4 right-4 z-[9999]" >
                {
                    notifications.map((notif) => (
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
                    ))
                }
            </div>
        </>
    );
}

export default OrderTable