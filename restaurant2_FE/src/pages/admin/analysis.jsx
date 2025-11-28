import { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Select, Statistic, Table, Typography, List, Space } from "antd";
import { getAnalyticsOverview } from "../../services/api.service";

const { Title, Text } = Typography;

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

const AnalysisPage = () => {
    const [range, setRange] = useState("30");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const days = parseInt(range, 10);
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - (isNaN(days) ? 30 : days) + 1);
                const params = {
                    startDate: toIsoDate(start),
                    endDate: toIsoDate(end),
                    topLimit: 5,
                };
                const res = await getAnalyticsOverview(params);
                const payload = res?.data ?? res;
                setData(payload?.data ?? payload);
            } catch (error) {
                console.error("Không thể tải analytics", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [range]);

    const topDishesColumns = useMemo(() => [
        { title: "Món ăn", dataIndex: "dishName", key: "dishName" },
        { title: "Số lượng", dataIndex: "quantity", key: "quantity", render: (val) => numberFormatter.format(val || 0) },
        {
            title: "Doanh thu",
            dataIndex: "revenue",
            key: "revenue",
            render: (val) => currencyFormatter.format(val || 0),
        },
    ], []);

    const revenueTrend = useMemo(() => data?.revenueTrend || [], [data]);

    return (
        <div className="p-4 space-y-4">
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Title level={3} style={{ margin: 0 }}>Tổng quan doanh thu</Title>
                <Select
                    value={range}
                    onChange={setRange}
                    options={[
                        { value: "7", label: "7 ngày" },
                        { value: "30", label: "30 ngày" },
                        { value: "90", label: "90 ngày" },
                    ]}
                />
            </Space>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Doanh thu"
                            value={data?.totalRevenue || 0}
                            formatter={(value) => currencyFormatter.format(value)}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Tổng đơn"
                            value={data?.totalOrders || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Đơn chờ xác nhận"
                            value={data?.pendingOrders || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Đơn đang giao"
                            value={data?.deliveringOrders || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Đơn đã giao"
                            value={data?.deliveredOrders || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Đơn chưa thanh toán"
                            value={data?.unpaidOrders || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={8}>
                    <Card loading={loading}>
                        <Statistic
                            title="Khách hàng mới"
                            value={data?.newCustomers || 0}
                            formatter={(value) => numberFormatter.format(value)}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Biểu đồ doanh thu theo ngày" loading={loading}>
                        {revenueTrend.length === 0 ? (
                            <Text type="secondary">Chưa có dữ liệu.</Text>
                        ) : (
                            <List
                                dataSource={revenueTrend}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                            <Text>{formatDate(item.date)}</Text>
                                            <Text strong>{currencyFormatter.format(item.revenue || 0)}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Món bán chạy" loading={loading}>
                        <Table
                            dataSource={(data?.topDishes || []).map((item, idx) => ({ key: idx, ...item }))}
                            columns={topDishesColumns}
                            pagination={false}
                            locale={{ emptyText: "Chưa có dữ liệu" }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

const toIsoDate = (date) => {
    return date.toISOString().split("T")[0];
};

const formatDate = (value) => {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString("vi-VN");
    } catch (error) {
        return value;
    }
};

export default AnalysisPage;

