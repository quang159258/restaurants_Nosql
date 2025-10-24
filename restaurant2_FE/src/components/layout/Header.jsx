import React, { useContext, useState, useEffect } from 'react';
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom';
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
import { deleteDishInCart, getAllDishInCart, getCart, logoutAPI, updateQuantity } from '../../services/api.service';
import Notification from '../noti/Notification';
import NotificationCenter from '../noti/NotificationCenter';
import food1 from '../../assets/img/food-1.webp';

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, setUser, cart, setCart } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [listItemCart, setListItemCart] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate(); // thêm
    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };
    const handleLogout = async () => {
        const res = await logoutAPI();
        if (res.data) {
            //clear data
            localStorage.removeItem("access_token");
            setUser({
                email: "",
                phone: "",
                fullName: "",
                role: "",
                avatar: "",
                id: ""
            })
            setCart([])
            message.success("Logout thành công.");
            addNotification("Logout success", "Đăng xuất thành công", "success");
            //redirect to home
            navigate("/");
        }
    }
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

    ];

    const fetchCart = async () => {
        const res = await getAllDishInCart();
        if (res.data) {

            setListItemCart(res.data);
            console.log(res.data)
        } else {
            setListItemCart([]);
        }
        const res2 = await getCart();
        setCart(res2.data)
    }

    const openCart = async () => {
        const res = await getAllDishInCart();
        if (res.data) {
            setListItemCart(res.data);
            console.log(res.data)
        } else {
            setListItemCart([]);
        }
        setOpen(true)
    }
    const handleQuantityChange = async (id, newQuantity) => {
        const res = await updateQuantity(id, newQuantity);
        setListItemCart((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            )
        );
        fetchCart();
    }

    const handleDeleteItem = async (id) => {
        debugger
        const res = await deleteDishInCart(id);
        if (res.data) {
            fetchCart();
        }
    }

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
                                            {cart.totalItems}
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
                                    src={item.imageUrl}
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
                    <span className="shopping__cart__total">{cart.totalItems} </span>
                </div>
                <div style={{ color: "#fff", fontSize: "22px" }}>
                    <span>Total price: </span>{" "}
                    <span className="shopping__cart__total">{cart.totalPrice} đ</span>
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
            <NotificationCenter />

        </>
    );
};

export default Navbar;
