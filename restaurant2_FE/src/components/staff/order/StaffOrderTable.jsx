import { Card, Modal, Space, Table, Tag, Typography, Select } from "antd";
import { useEffect, useState } from "react";
import { fetchAllOrders, getImageUrlFromFileName } from "../../../services/api.service";

const STATUS_COLORS = {
    PENDING: "blue",
    CONFIRMED: "green",
    DELIVERING: "orange",
    DELIVERED: "gold",
    CANCELLED: "red",
};

const STATUS_LABELS = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    DELIVERING: "Đang giao",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
};

const StaffOrderTable = () => {
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(8);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const fetchOrders = async (pageIndex = page, pageSize = size) => {
        setLoading(true);
        try {
            const res = await fetchAllOrders(pageIndex, pageSize);
            const data = res?.data ?? res;
            if (data?.result) {
                let list = data.result;
                if (statusFilter !== "ALL") {
                    list = list.filter((item) => item.status === statusFilter);
                }
                setOrders(list.map((item) => ({ ...item, key: item.id })));
                setPage(data.meta.page);
                setTotal(data.meta.total);
            } else {
                setOrders([]);
                setTotal(0);
            }
        } catch (error) {
            console.error("Không thể tải danh sách đơn hàng", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(page, size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

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
            title: "Số điện thoại",
            dataIndex: "receiverPhone",
            key: "receiverPhone",
        },
        {
            title: "Địa chỉ",
            dataIndex: "receiverAddress",
            key: "receiverAddress",
            ellipsis: true,
        },
        {
            title: "Ngày tạo",
            dataIndex: "date",
            key: "date",
            render: (date) => date ? new Date(date).toLocaleString("vi-VN") : "",
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalPrice",
            key: "totalPrice",
            render: (price) => `${(price || 0).toLocaleString("vi-VN")} đ`,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={STATUS_COLORS[status] || "default"}>
                    {STATUS_LABELS[status] || status}
                </Tag>
            ),
        },
        {
            title: "Chi tiết",
            key: "detail",
            render: (_, record) => (
                <Typography.Link onClick={() => {
                    setSelectedOrder(record);
                    setDetailVisible(true);
                }}>
                    Xem chi tiết
                </Typography.Link>
            ),
        },
    ];

    return (
        <>
            <Card
                style={{ marginBottom: 16 }}
                bodyStyle={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Đơn hàng
                </Typography.Title>
                <Space size="middle">
                    <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        options={[
                            { value: "ALL", label: "Tất cả" },
                            { value: "PENDING", label: "Chờ xác nhận" },
                            { value: "CONFIRMED", label: "Đã xác nhận" },
                            { value: "DELIVERING", label: "Đang giao" },
                            { value: "DELIVERED", label: "Đã giao" },
                            { value: "CANCELLED", label: "Đã hủy" },
                        ]}
                    />
                </Space>
            </Card>
            <Table
                loading={loading}
                columns={columns}
                dataSource={orders}
                pagination={{
                    current: page,
                    pageSize: size,
                    total,
                    showSizeChanger: true,
                    onChange: (current, pageSize) => {
                        setPage(current);
                        setSize(pageSize);
                    },
                }}
            />

            <Modal
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={800}
                title="Chi tiết đơn hàng"
            >
                {selectedOrder && (
                    <Space direction="vertical" style={{ width: "100%" }} size="large">
                        <div>
                            <Typography.Text strong>Mã đơn:</Typography.Text> #{selectedOrder.id}
                        </div>
                        <div>
                            <Typography.Text strong>Người nhận:</Typography.Text> {selectedOrder.receiverName}
                        </div>
                        <div>
                            <Typography.Text strong>Địa chỉ:</Typography.Text> {selectedOrder.receiverAddress}
                        </div>
                        <div>
                            <Typography.Text strong>Trạng thái:</Typography.Text>{" "}
                            <Tag color={STATUS_COLORS[selectedOrder.status] || "default"}>
                                {selectedOrder.status}
                            </Tag>
                        </div>
                        <div>
                            <Typography.Text strong>Tổng tiền:</Typography.Text>{" "}
                            <span style={{ color: "#d4380d", fontWeight: 600 }}>
                                {selectedOrder.totalPrice?.toLocaleString("vi-VN")} đ
                            </span>
                        </div>
                        <div>
                            <Typography.Title level={5}>Danh sách món</Typography.Title>
                            <Table
                                dataSource={(selectedOrder.listOrderItem || []).map((item) => ({
                                    ...item,
                                    key: item.id,
                                }))}
                                pagination={false}
                                columns={[
                                    {
                                        title: "Món",
                                        dataIndex: "name",
                                        key: "name",
                                    },
                                    {
                                        title: "Ảnh",
                                        key: "image",
                                        render: (_, record) => (
                                            <img
                                                src={getImageUrlFromFileName(record.imageUrl)}
                                                alt={record.name}
                                                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                                            />
                                        ),
                                    },
                                    {
                                        title: "Số lượng",
                                        dataIndex: "quantity",
                                        key: "quantity",
                                    },
                                    {
                                        title: "Đơn giá",
                                        dataIndex: "price",
                                        key: "price",
                                        render: (price) => `${(price || 0).toLocaleString("vi-VN")} đ`,
                                    },
                                    {
                                        title: "Thành tiền",
                                        dataIndex: "total",
                                        key: "total",
                                        render: (total) => `${(total || 0).toLocaleString("vi-VN")} đ`,
                                    },
                                ]}
                            />
                        </div>
                    </Space>
                )}
            </Modal>
        </>
    );
};

export default StaffOrderTable;

