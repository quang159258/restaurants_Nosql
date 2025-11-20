import { useContext, useEffect, useState } from "react";
import { Radio } from "antd";
import bg3 from "../../../assets/img/bg_3.jpg.webp";
import food1 from "../../../assets/img/food-1.webp";
import { AuthContext } from "../../context/auth.context";
import { getAllDishInCart, getCart, getVnpayConfig, checkOutCart } from "../../../services/api.service";
import Notification from "../../noti/Notification";
import { useNavigate } from "react-router-dom";
import AddressSelector from "../../common/AddressSelector";
const ConfirmPage = () => {
    const { user, cart, setCart } = useContext(AuthContext);
    const [listItemCart, setListItemCart] = useState([]);
    const navigate = useNavigate();

    const [name, setName] = useState(user.username);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email);
    const [notifications, setNotifications] = useState([]);
    const [addressValue, setAddressValue] = useState(user.address || "");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [vnpayAvailable, setVnpayAvailable] = useState(true);

    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };


    useEffect(() => {
        setAddressValue(user.address || "");
    }, [user.address]);

    useEffect(() => {
        const fetchVnpay = async () => {
            try {
                const res = await getVnpayConfig();
                if (typeof res?.data?.enabled === "boolean") {
                    setVnpayAvailable(res.data.enabled);
                }
            } catch {
                // If API call fails we keep VNPay enabled so checkout can still proceed.
            }
        };
        fetchVnpay();
    }, []);

    // Lấy giỏ hàng
    const fetchCart = async () => {
        const res = await getAllDishInCart();
        if (res.data) {
            setListItemCart(res.data);
        } else {
            setListItemCart([]);
        }
        const res2 = await getCart();
        setCart(res2.data);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // Xử lý checkout
    const handleCheckOut = async () => {
        // Validation: Kiểm tra cart có items không
        if (!listItemCart || listItemCart.length === 0) {
            addNotification("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng", "warning");
            return;
        }

        // Validation: Kiểm tra thông tin bắt buộc
        if (!name || name.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập tên người nhận", "warning");
            return;
        }
        if (!phone || phone.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập số điện thoại", "warning");
            return;
        }
        // Validate phone format (10-11 số)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone.trim())) {
            addNotification("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại 10-11 chữ số", "warning");
            return;
        }
        if (!email || email.trim() === "") {
            addNotification("Thiếu thông tin", "Vui lòng nhập email", "warning");
            return;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            addNotification("Email không hợp lệ", "Vui lòng nhập email đúng định dạng", "warning");
            return;
        }
        if (!addressValue || addressValue.trim() === "") {
            addNotification("Thiếu địa chỉ", "Vui lòng chọn đầy đủ địa chỉ giao hàng", "warning");
            return;
        }
        if (paymentMethod === "VNPAY" && !vnpayAvailable) {
            addNotification("VNPay không khả dụng", "Vui lòng chọn phương thức thanh toán khác", "warning");
            return;
        }
        
        // Prevent duplicate orders: Set loading state
        setLoading(true);
        
        // Nếu là COD, tạo order luôn
        if (paymentMethod === "CASH") {
            try {
                const response = await checkOutCart(
                    name.trim(),
                    phone.trim(),
                    addressValue.trim(),
                    email.trim(),
                    paymentMethod
                );
                
                if (response.status === 200) {
                    const orderData = response.data;
                    // Refresh cart sau khi checkout thành công
                    await fetchCart();
                    addNotification(
                        "Đặt hàng thành công!", 
                        "Đơn hàng của bạn đã được tạo. Vui lòng chờ xác nhận từ nhân viên.", 
                        "success"
                    );
                    setTimeout(() => {
                        navigate("/order", { state: { orderId: orderData.orderId } });
                    }, 2000);
                }
            } catch (error) {
                console.error("Error creating order:", error);
                const serverMessage = error?.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.";
                addNotification("Lỗi", serverMessage, "error");
            } finally {
                setLoading(false);
            }
        } else if (paymentMethod === "VNPAY") {
            // Nếu là VNPay, chuyển sang /payment
            setLoading(false); // Reset loading vì chưa tạo order
            navigate("/payment", {
                state: {
                    formData: {
                        receiverName: name.trim(),
                        receiverPhone: phone.trim(),
                        receiverAddress: addressValue.trim(),
                        receiverEmail: email.trim(),
                        paymentMethod
                    }
                }
            });
        }
    };


    return (
        <div
            className="flex justify-center items-center min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url('${bg3}')` }}
        >
            <div className="flex rounded-xl overflow-hidden w-[1000px] h-[600px]">
                {/* Form Thông Tin */}
                <div className="bg-white w-1/2 p-4">
                    <h2 className="text-xl font-semibold mb-4">Điền thông tin giao hàng</h2>
                    <form className="space-y-4">
                        <input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                            }}
                            type="text"
                            placeholder=" Name"
                            className=" w-full border-b border-gray-300 focus:outline-none mb-4 px-2"
                        />
                        <input
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value)
                            }}
                            type="text"
                            placeholder=" Phone"
                            className="w-full border-b border-gray-300 focus:outline-none mb-4 px-2"
                        />
                        <input
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                            }}
                            type="email"
                            placeholder=" Email"
                            className="w-full border-b border-gray-300 focus:outline-none mb-4 px-2"
                        />

                        <AddressSelector value={addressValue} onChange={setAddressValue} />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phương thức thanh toán
                            </label>
                            <Radio.Group
                                className="flex flex-col gap-2"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <Radio value="CASH">💰 Tiền mặt (COD)</Radio>
                                <Radio value="VNPAY" disabled={!vnpayAvailable}>
                                    🏦 VNPay {!vnpayAvailable && <span className="text-gray-400 text-sm">(không khả dụng)</span>}
                                </Radio>
                            </Radio.Group>
                        </div>
                    </form>
                </div>

                {/* Danh Sách Giỏ Hàng */}
                <div className="bg-black w-1/2 p-4 text-white ">
                    <div>
                        <h2 className="text-xl mb-4">Danh sách đặt hàng</h2>
                        <ul className="max-h-72 overflow-y-auto p-0">
                            {listItemCart.map((item) => (
                                <li className="mb-4" key={item.id}>
                                    <div className="flex justify-between items-start">
                                        {/* Hình ảnh món ăn */}
                                        <img
                                            src={`${food1}`}
                                            alt="food"
                                            className="w-20 h-15 rounded"
                                        />

                                        {/* Nội dung món ăn */}
                                        <div className="w-[250px] text-white">
                                            <h3 className="text-sm m-0">{item.name}</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    className="w-10 h-7 bg-transparent border-none text-white focus:outline-none"
                                                    readOnly
                                                />
                                                <span className="text-white">{item.total}đ</span>
                                            </div>
                                        </div>

                                        {/* Nút Xóa */}
                                        <button
                                            className="text-white px-3 rounded p-2"
                                            style={{
                                                backgroundColor: "var(--primary-color)",
                                                height: "100%",
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className=" text-lg">
                        <p className="total font-bold ">
                            Quantity:{" "}
                            <span className="total font-normal">{cart.totalItems}</span>
                        </p>
                        <p className="total font-bold ">
                            Total:{" "}
                            <span className="total font-normal">{cart.totalPrice} vnđ</span>
                        </p>
                    </div>

                    <div className="text-center mt-6 ">
                        <button
                            onClick={handleCheckOut}
                            disabled={loading || !listItemCart || listItemCart.length === 0}
                            className={`bg-[#dfc094] text-white py-2 px-6 rounded transition hover:scale-105 ${
                                loading || !listItemCart || listItemCart.length === 0 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : ""
                            }`}
                        >
                            {loading ? "Đang xử lý..." : "Thanh toán"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Cảm Ơn */}
            {/* {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 ">
                    <div className="bg-white rounded-lg shadow-lg w-[1000px] h-[710px] p-8 relative animate-fadeIn p-5">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-8 text-xl text-black"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <div className="text-center text-[#C8A97E] text-6xl font-[Great_Vibes,cursive]">
                            Feliciano
                        </div>
                        <p className="mt-8 text-2xl font-[Great_Vibes,cursive]">
                            Kính gửi Quý khách hàng thân mến: <strong>{user.username}</strong>
                        </p>
                        <p className="mt-4 text-xl font-[Great_Vibes,cursive] leading-relaxed">
                            Cảm ơn quý khách đã đặt hàng tại cửa hàng của chúng tôi. Mỗi đơn
                            hàng đều là niềm vinh hạnh và động lực để chúng tôi phục vụ tốt
                            hơn. Rất mong sẽ tiếp tục được đồng hành cùng quý khách trong
                            những lần ghé thăm tiếp theo. <br />
                            Trân trọng!
                        </p>

                        <p className="text-right mt-8 text-xl font-[Great_Vibes,cursive]">
                            Ký Tên
                        </p>
                        <p className="text-right text-xl font-[Great_Vibes,cursive] font-bold">
                            Nguyễn Thành Hoàn
                        </p>
                    </div>
                </div>
            )} */}

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
        </div>
    );
};

export default ConfirmPage;
