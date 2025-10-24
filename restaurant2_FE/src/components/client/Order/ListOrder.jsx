import { useEffect, useState } from "react";
import { fetchAllOrders, fetchAllOrdersMy, fetchMyOrder, getImageUrl } from "../../../services/api.service";
import { Modal, Space, Table } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";

const ListOrder = () => {
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


    // Hàm lấy dữ liệu món ăn
    const getOrders = async (page, size) => {
        try {

            const res = await fetchAllOrdersMy(page, size);
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
            render: (status) => {
                const colorMap = {
                    PENDING: "text-blue-500",
                    CONFIRMED: "text-green-500",
                    DELIVERED: "text-orange-500",
                    CANCELED: "text-red-500",
                };

                const textMap = {
                    PENDING: "Chờ xác nhận",
                    CONFIRMED: "Đã xác nhận",
                    DELIVERED: "Đã giao hàng",
                    CANCELED: "Đã hủy",
                };

                return (
                    <span className={`font-medium ${colorMap[status] || "text-black"}`}>
                        {textMap[status] || status}
                    </span>
                );
            },
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            render: (method) => (
                <span className="font-medium">
                    {method === "CASH" ? "💰 Tiền mặt" : "🏦 VNPay"}
                </span>
            ),
        },
        {
            title: "Trạng thái TT",
            dataIndex: "paymentStatus",
            key: "paymentStatus",
            render: (status) => {
                const colorMap = {
                    UNPAID: "text-red-500",
                    PAID: "text-green-500",
                    FAILED: "text-red-600",
                };

                const textMap = {
                    UNPAID: "Chưa thanh toán",
                    PAID: "Đã thanh toán",
                    FAILED: "Thanh toán thất bại",
                };

                return (
                    <span className={`font-medium ${colorMap[status] || "text-gray-500"}`}>
                        {textMap[status] || status}
                    </span>
                );
            },
        },


        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <div className="text-left">
                    <Space size="middle" >
                        <a onClick={() => handleView(record)}>
                            <EyeOutlined style={{ color: "#1890ff" }} />
                        </a>
                    </Space>
                </div>

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
            <div className="container my-5 ">
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
            </div>
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
        </>
    );
}

export default ListOrder