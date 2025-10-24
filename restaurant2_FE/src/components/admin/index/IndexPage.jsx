import { RiseOutlined, ShoppingOutlined, LineChartOutlined } from '@ant-design/icons';

const IndexPage = () => {
    return (
        <div className="w-full p-3">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 - Tổng giảm giá */}
                <div className="bg-white rounded-2xl p-3 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="bg-orange-100 text-orange-500 p-3 rounded-full">
                                <RiseOutlined className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-gray-700 text-sm">Tổng giảm giá</h3>
                                <h1 className="text-2xl font-bold text-gray-900">1,000$</h1>
                            </div>
                        </div>
                        <div className="relative w-16 h-16">
                            <svg className="absolute top-0 left-0" width="64" height="64">
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="150.8" strokeDashoffset="120" strokeLinecap="round" transform="rotate(-90 32 32)" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-yellow-500">20%</div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Cập nhật 14 giờ trước</p>
                </div>

                {/* Card 2 - Tiền lãi */}
                <div className="bg-white rounded-2xl p-3 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-pink-100 text-pink-500 p-3 rounded-full">
                                <ShoppingOutlined className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-gray-700 text-sm">Tiền lãi</h3>
                                <h1 className="text-2xl font-bold text-gray-900">5,000$</h1>
                            </div>
                        </div>
                        <div className="relative w-16 h-16">
                            <svg className="absolute top-0 left-0" width="64" height="64">
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#d946ef" strokeWidth="6" strokeDasharray="150.8" strokeDashoffset="30" strokeLinecap="round" transform="rotate(-90 32 32)" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-pink-500">80%</div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Cập nhật 14 giờ trước</p>
                </div>

                {/* Card 3 - Thu nhập */}
                <div className="bg-white rounded-2xl p-3 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 text-green-500 p-3 rounded-full">
                                <LineChartOutlined className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-gray-700 text-sm">Thu nhập</h3>
                                <h1 className="text-2xl font-bold text-gray-900">25,000$</h1>
                            </div>
                        </div>
                        <div className="relative w-16 h-16">
                            <svg className="absolute top-0 left-0" width="64" height="64">
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                <circle r="24" cx="32" cy="32" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="150.8" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 32 32)" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-green-500">100%</div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Cập nhật 14 giờ trước</p>
                </div>
            </div>

            {/* Table Section - Đơn hàng gần đây */}
            <div className="mt-5">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h2>
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Tên món ăn</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Số lượng</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Đơn giá</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Thành tiền</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-3 px-4 text-gray-800">Ngũ cốc</td>
                                <td className="py-3 px-4 text-gray-800">10</td>
                                <td className="py-3 px-4 text-gray-800">15$</td>
                                <td className="py-3 px-4 text-pink-500 font-medium">150$</td>
                                <td className="py-3 px-4"><button className="text-blue-500 hover:underline">Chi tiết</button></td>
                            </tr>
                            <tr className="border-t hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-3 px-4 text-gray-800">Bánh mì</td>
                                <td className="py-3 px-4 text-gray-800">5</td>
                                <td className="py-3 px-4 text-gray-800">20$</td>
                                <td className="py-3 px-4 text-pink-500 font-medium">100$</td>
                                <td className="py-3 px-4"><button className="text-blue-500 hover:underline">Chi tiết</button></td>
                            </tr>
                            <tr className="border-t hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-3 px-4 text-gray-800">Rượu vang</td>
                                <td className="py-3 px-4 text-gray-800">2</td>
                                <td className="py-3 px-4 text-gray-800">50$</td>
                                <td className="py-3 px-4 text-pink-500 font-medium">100$</td>
                                <td className="py-3 px-4"><button className="text-blue-500 hover:underline">Chi tiết</button></td>
                            </tr>
                            <tr className="border-t hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-3 px-4 text-gray-800">Bò bít tết</td>
                                <td className="py-3 px-4 text-gray-800">10</td>
                                <td className="py-3 px-4 text-gray-800">30$</td>
                                <td className="py-3 px-4 text-pink-500 font-medium">300$</td>
                                <td className="py-3 px-4"><button className="text-blue-500 hover:underline">Chi tiết</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IndexPage;