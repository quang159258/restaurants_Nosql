import { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Spin } from 'antd';
import { TrophyOutlined, FireOutlined, DollarOutlined } from '@ant-design/icons';
import { fetchAllDish, fetchAllOrders, getAnalyticsOverview } from '../../../services/api.service';

const { Title, Text } = Typography;

const IndexPage = () => {
    const [loading, setLoading] = useState(true);
    const [topDishesToday, setTopDishesToday] = useState([]);
    const [topDishesMonth, setTopDishesMonth] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch all dishes to get soldToday
                const dishesRes = await fetchAllDish(1, 1000, 1);
                const dishesData = dishesRes?.data?.result || dishesRes?.data || [];
                
                // Sort by soldToday for today's top dishes
                const topToday = [...dishesData]
                    .filter(dish => dish.soldToday > 0)
                    .sort((a, b) => (b.soldToday || 0) - (a.soldToday || 0))
                    .slice(0, 5)
                    .map((dish, index) => ({
                        key: dish.id,
                        rank: index + 1,
                        name: dish.name,
                        sold: dish.soldToday || 0,
                        price: dish.price || 0,
                        revenue: (dish.soldToday || 0) * (dish.price || 0)
                    }));
                setTopDishesToday(topToday);

                // Fetch analytics for monthly data
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const analyticsRes = await getAnalyticsOverview({
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                    topLimit: 5
                });
                const analyticsData = analyticsRes?.data?.data || analyticsRes?.data || {};
                setTopDishesMonth(analyticsData.topDishes || []);
                setStats({
                    totalRevenue: analyticsData.totalRevenue || 0,
                    totalOrders: analyticsData.totalOrders || 0,
                    pendingOrders: analyticsData.pendingOrders || 0
                });

                // Fetch recent orders
                const ordersRes = await fetchAllOrders(1, 5);
                const ordersData = ordersRes?.data?.result || ordersRes?.data || [];
                setRecentOrders(ordersData.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const todayColumns = [
        {
            title: 'Hạng',
            dataIndex: 'rank',
            key: 'rank',
            width: 60,
            render: (rank) => (
                <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'default' : rank === 3 ? 'orange' : 'blue'}>
                    #{rank}
                </Tag>
            )
        },
        {
            title: 'Tên món',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Đã bán hôm nay',
            dataIndex: 'sold',
            key: 'sold',
            render: (sold) => <Text strong>{sold}</Text>
        },
        {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (revenue) => (
                <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                    {revenue.toLocaleString('vi-VN')} đ
                </Text>
            )
        },
    ];

    const monthColumns = [
        {
            title: 'Hạng',
            dataIndex: 'rank',
            key: 'rank',
            width: 60,
            render: (_, __, index) => (
                <Tag color={index === 0 ? 'gold' : index === 1 ? 'default' : index === 2 ? 'orange' : 'blue'}>
                    #{index + 1}
                </Tag>
            )
        },
        {
            title: 'Tên món',
            dataIndex: 'dishName',
            key: 'dishName',
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty) => <Text strong>{qty || 0}</Text>
        },
        {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (revenue) => (
                <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                    {revenue?.toLocaleString('vi-VN') || 0} đ
                </Text>
            )
        },
    ];

    const recentOrdersColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Khách hàng',
            dataIndex: 'receiverName',
            key: 'receiverName',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price) => `${price?.toLocaleString('vi-VN') || 0} đ`
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    PENDING: 'blue',
                    CONFIRMED: 'green',
                    DELIVERING: 'orange',
                    DELIVERED: 'teal',
                    CANCELLED: 'red',
                };
                return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
            }
        },
    ];

    return (
        <div className="w-full p-3">
            <Spin spinning={loading}>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                            <div>
                                <Text type="secondary" className="text-sm">Tổng doanh thu tháng</Text>
                                <Title level={3} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>
                                    {stats.totalRevenue.toLocaleString('vi-VN')} đ
                                </Title>
                            </div>
                            <DollarOutlined className="text-4xl text-green-500" />
                        </div>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                            <div>
                                <Text type="secondary" className="text-sm">Tổng đơn hàng</Text>
                                <Title level={3} style={{ margin: '8px 0 0 0' }}>
                                    {stats.totalOrders}
                                </Title>
                            </div>
                            <FireOutlined className="text-4xl text-orange-500" />
                        </div>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                            <div>
                                <Text type="secondary" className="text-sm">Đơn chờ xác nhận</Text>
                                <Title level={3} style={{ margin: '8px 0 0 0', color: '#1890ff' }}>
                                    {stats.pendingOrders}
                                </Title>
                            </div>
                            <TrophyOutlined className="text-4xl text-blue-500" />
                        </div>
                    </Card>
                </div>

                {/* Top Dishes Today and Month */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card 
                        title={
                            <span>
                                <FireOutlined className="mr-2 text-orange-500" />
                                Top món bán chạy hôm nay
                            </span>
                        }
                        className="shadow-md"
                    >
                        {topDishesToday.length > 0 ? (
                            <Table
                                dataSource={topDishesToday}
                                columns={todayColumns}
                                pagination={false}
                                size="small"
                            />
                        ) : (
                            <Text type="secondary">Chưa có dữ liệu bán hàng hôm nay</Text>
                        )}
                    </Card>

                    <Card 
                        title={
                            <span>
                                <TrophyOutlined className="mr-2 text-gold" />
                                Top món bán chạy tháng này
                            </span>
                        }
                        className="shadow-md"
                    >
                        {topDishesMonth.length > 0 ? (
                            <Table
                                dataSource={topDishesMonth.map((item, idx) => ({ ...item, key: idx }))}
                                columns={monthColumns}
                                pagination={false}
                                size="small"
                            />
                        ) : (
                            <Text type="secondary">Chưa có dữ liệu tháng này</Text>
                        )}
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card 
                    title="Đơn hàng gần đây"
                    className="shadow-md"
                >
                    {recentOrders.length > 0 ? (
                        <Table
                            dataSource={recentOrders.map(order => ({ ...order, key: order.id }))}
                            columns={recentOrdersColumns}
                            pagination={false}
                            size="small"
                        />
                    ) : (
                        <Text type="secondary">Chưa có đơn hàng nào</Text>
                    )}
                </Card>
            </Spin>
        </div>
    );
};

export default IndexPage;
