import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    PhoneOutlined,
    MailOutlined,
    ShoppingCartOutlined,
    MenuOutlined,
    SmileOutlined,
} from '@ant-design/icons';
import { AuthContext } from '../context/auth.context';
import { Drawer, Dropdown, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { buildImageUrl, deleteDishInCart, getAllDishInCart, getCart, logoutAPI, logoutAllSessionsAPI, updateQuantity } from '../../services/api.service';
import Notification from '../noti/Notification';
import NotificationCenter from '../noti/NotificationCenter';
import food1 from '../../assets/img/food-1.webp';

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, setUser, cart, setCart, setAccessToken, resetAuthState } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [listItemCart, setListItemCart] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [cartCount, setCartCount] = useState(cart?.totalItems || 0);
    const navigate = useNavigate(); // thêm
    const addNotification = (messageText, description, type) => {
        const id = Date.now();
        const newNotif = { id, message: messageText, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };
    const handleLogout = async () => {
        try {
            await logoutAPI();
            message.success("Đăng xuất thành công.");
            addNotification("Logout success", "Đăng xuất thành công", "success");
        } catch (error) {
            message.warning("Không thể gọi API logout, đã xoá phiên cục bộ.");
        } finally {
            resetAuthState();
            setAccessToken("");
            setCartCount(0);
            setListItemCart([]);
            navigate("/login");
        }
    };
    const handleLogoutAll = async () => {
        try {
            await logoutAllSessionsAPI();
            message.success("Đã đăng xuất khỏi tất cả thiết bị.");
        } catch (error) {
            message.warning("Không thể gọi API logout all, đã xoá phiên cục bộ.");
        } finally {
            resetAuthState();
            setAccessToken("");
            setCartCount(0);
            setListItemCart([]);
            navigate("/login");
        }
    };
    const items = [
        {
            key: '1',
            label: (
                <NavLink to="/info" style={{ textDecoration: "none" }} >
                    info
                </NavLink>
            ),
        },
        {
            key: '3',
            label: (
                <NavLink to="/order" style={{ textDecoration: "none" }} >
                    Order
                </NavLink>
            ),
        },
        {
            key: '2',
            danger: true,
            label: <span onClick={() => { handleLogout() }}>Logout</span>,
        },
        {
            key: '4',
            label: <span onClick={() => { handleLogoutAll() }}>Logout all devices</span>,
        },

    ];

    const fetchCart = useCallback(async () => {
        if (!user?.id) {
            setListItemCart([]);
            setCart({ id: 0, totalItems: 0, totalPrice: 0 });
            setCartCount(0);
            return false;
        }
        try {
            const [itemsRes, summaryRes] = await Promise.all([getAllDishInCart(), getCart()]);
            const items = Array.isArray(itemsRes?.data ?? itemsRes) ? (itemsRes?.data ?? itemsRes) : [];
            setListItemCart(items);
            const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            setCartCount(totalQuantity);

            const cartData = summaryRes?.data ?? summaryRes;
            if (cartData) {
                setCart({
                    id: cartData.id ?? 0,
                    totalItems: cartData.totalItems ?? totalQuantity,
                    totalPrice: cartData.totalPrice ?? 0
                });
            } else {
                setCart({ id: 0, totalItems: totalQuantity, totalPrice: 0 });
            }
            return true;
        } catch (error) {
            setListItemCart([]);
            setCart({ id: 0, totalItems: 0, totalPrice: 0 });
            setCartCount(0);
            return false;
        }
    }, [user?.id, setCart]);

    useEffect(() => {
        if (user?.id) {
            fetchCart();
        } else {
            setListItemCart([]);
            setCartCount(0);
        }
    }, [user?.id, fetchCart]);

    const openCart = async () => {
        if (!user?.id) {
            message.warning("Vui lòng đăng nhập để xem giỏ hàng.");
            navigate("/login");
            return;
        }
        await fetchCart();
        setOpen(true);
    };
    const handleQuantityChange = async (id, newQuantity) => {
        try {
            await updateQuantity(id, newQuantity);
            setListItemCart((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? { ...item, quantity: Number(newQuantity) } : item
                )
            );
            fetchCart();
        } catch (error) {
            message.error("Cập nhật số lượng thất bại. Vui lòng thử lại.");
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            const res = await deleteDishInCart(id);
            const isSuccess = (res && res.status && res.status >= 200 && res.status < 300) || res?.data;
            if (isSuccess) {
                fetchCart();
            }
        } catch (error) {
            message.error("Xóa món thất bại. Vui lòng thử lại.");
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    }

    const closeDropdown = () => {
        setDropdownOpen(false);
    }

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdownEl = window.userDropdownRef;
            if (dropdownOpen && dropdownEl && !dropdownEl.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    return (
        <>
            {/* Top header */}
            <div className="top">
                <div className="container ">
                    <div className="row g-3 px-md-0 align-items-center">
                        <div className="col-md">
                            <div className="fz-14 d-flex align-items-center gap-2">
                                <PhoneOutlined />
                                <span style={{ color: '#A0A09F' }}>0397125044</span>
                            </div>
                        </div>
                        <div className="col-md text-center fz-14">
                            <div className="d-flex justify-content-center align-items-center gap-2">
                                <MailOutlined />
                                <span style={{ color: '#A0A09F' }}>quang159258@gmail.com</span>
                            </div>
                        </div>
                        <div className="col-md-5 text-end fz-14">
                            <span>Open hours: Monday - Sunday 8:00AM - 9:00PM</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navbar */}
            <nav className=" nav border-bottom border-white border-opacity-25 py-2" style={{ marginTop: "35px" }}>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-2">
                            <Link to="/" className="nav__brand text-white fw-bold fs-5 text-decoration-none">
                                Feliciano
                            </Link>
                        </div>

                        <div className="col-10 d-flex justify-content-end align-items-center " >
                            {/* Desktop menu */}
                            <div className="d-none d-md-block">
                                <ul className="d-flex mb-0 gap-3">
                                    <li className=" px-2 flex items-center justify-center">
                                        <NavLink className=" nav_link text-white text-decoration-none px-2 " to="/"

                                        >Home
                                        </NavLink></li>
                                    <li className=" px-2 flex items-center justify-center">
                                        <NavLink className="nav_link text-white text-decoration-none px-2 " to="/about"
                                        >
                                            About
                                        </NavLink ></li>
                                    <li className=" px-2 flex items-center justify-center">
                                        <NavLink className="nav_link text-white text-decoration-none px-2" to="/dish"

                                        >Dish
                                        </NavLink ></li>
                                    <li className=" px-2 flex items-center justify-center"><NavLink className="   btn btn-outline-light btn-sm px-2" to="/book" style={{

                                    }} >Book a table  </NavLink ></li>
                                    {
                                        user.id
                                            ? <li className="position-relative">
                                                <div className="dropdown" ref={(ref) => (window.userDropdownRef = ref)}>
                                                    <button
                                                        className="dropdown-toggle"
                                                        type="button"
                                                        onClick={toggleDropdown}
                                                        aria-expanded={dropdownOpen}
                                                        style={{
                                                            border: "1px solid white",
                                                            padding: "6px 12px",
                                                            borderRadius: "6px",
                                                            color: "white",
                                                            display: "inline-block",
                                                            textDecoration: "none",

                                                        }}
                                                    >
                                                        {user.fullName || user.username || 'User'}
                                                    </button>
                                                    <ul
                                                        className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}
                                                        style={{
                                                            position: 'absolute',
                                                            top: "50px",
                                                            left: '0',
                                                            zIndex: 1000,
                                                            minWidth: '100%',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '4px',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        }}
                                                    >
                                                        <li className="hover:bg-gray-200 hover:text-blue-600 transition-colors duration-200">
                                                            <NavLink
                                                                onClick={() => { closeDropdown(); }}
                                                                to="/info"
                                                                className="block px-4 py-1 text-gray-800 "
                                                                style={{
                                                                    textDecoration: "none",
                                                                    color: "#C8A97E",

                                                                }}
                                                            >
                                                                Info
                                                            </NavLink>
                                                        </li>
                                                        <li className="hover:bg-gray-200 hover:text-blue-600 transition-colors duration-200">
                                                            <NavLink
                                                                onClick={() => { closeDropdown(); }}
                                                                to="/order"
                                                                className="block px-4 py-1 text-gray-800"
                                                                style={{
                                                                    textDecoration: "none",
                                                                    color: "#C8A97E"
                                                                }}
                                                            >
                                                                Order
                                                            </NavLink>
                                                        </li>
                                                        <li
                                                            onClick={() => {
                                                                handleLogout();
                                                                closeDropdown();
                                                            }}

                                                            className="hover:bg-red-100 hover:text-red-600 transition-colors duration-200 cursor-pointer px-4 py-1 text-red-500"
                                                        >
                                                            Logout
                                                        </li>

                                                    </ul>
                                                </div>
                                            </li>

                                            : <li className=" px-2 flex items-center justify-center "><NavLink className="nav_link text-white text-decoration-none px-2" to="/login">Login</NavLink ></li>
                                    }

                                    <li className="position-relative flex items-center justify-center">
                                        <ShoppingCartOutlined style={{ fontSize: 30, color: 'white' }} onClick={() => { openCart() }} />
                                        <span className="position-absolute top-2 start-100 translate-middle badge rounded-pill icon_cart">
                                            {cartCount}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

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


            <Drawer
                placement="right"
                closable={false}
                onClose={() => setOpen(false)}
                open={open}
                getContainer={false}
                width={450} // hoặc "450px"
                bodyStyle={{
                    padding: 20,
                }}
                className="shopping__cart"
            >
                <h1
                    style={{
                        fontFamily: "Great Vibes, cursive",
                        color: "#C8A97E",
                        fontSize: "60px",
                        textAlign: "center",
                    }}
                >
                    Feliciano
                </h1>

                <ul className="shopping__list">
                    {/* item in cart */}

                    {listItemCart.map((item) => (
                        <div className="cart_item" key={item.id}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <img
                                    className="shopping__item__img"
                                    src={buildImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    style={{ width: '80px', height: '60px', borderRadius: '6px' }}
                                />

                                <div className="shopping__item__content" style={{ width: '250px', padding: '0 12px' }}>
                                    <span className="shopping__item__name" style={{ display: 'block' }}>
                                        <h3 style={{ fontSize: '15px', margin: 0, color: '#fff' }}>{item.name}</h3>
                                    </span>

                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <input
                                            className="shopping__item__input"
                                            type="number"
                                            value={item.quantity}
                                            min={1}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            style={{
                                                width: '40px',
                                                height: '28px',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                color: '#fff',
                                            }}
                                        />
                                        <span className="shopping__item__price" style={{ color: '#fff' }}>
                                            {(item.quantity * item.price).toLocaleString()}đ
                                        </span>
                                    </div>
                                </div>

                                <button className="delete" onClick={() => handleDeleteItem(item.id)}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}

                </ul>

                <div style={{ color: "#fff", fontSize: "22px" }}>
                    <span>Total dish : </span>{" "}
                    <span className="shopping__cart__total">{cart?.totalItems ?? 0} </span>
                </div>
                <div style={{ color: "#fff", fontSize: "22px" }}>
                    <span>Total price: </span>{" "}
                    <span className="shopping__cart__total">{cart?.totalPrice ?? 0} đ</span>
                </div>

                <Link to="/confirm" className="comfim">
                    <button
                        className="modal__order"
                        style={{ width: "100%", padding: "10px 0", color: "#fff" }}
                    >
                        Order
                    </button>
                </Link>

                <div className="shopping__close">
                    <i className="fa-solid fa-xmark"></i>
                </div>
            </Drawer >

            {/* WebSocket Notification Center */}
            <NotificationCenter userRole={user?.role?.name} userId={user?.id} />

        </>
    );
};

export default Navbar;
