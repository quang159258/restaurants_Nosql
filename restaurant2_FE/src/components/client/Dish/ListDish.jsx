import { useContext, useEffect, useState } from 'react';
import { Pagination, Modal } from 'antd';
import { adDishInCart, getCart, getImageUrl } from '../../../services/api.service';
import Notification from '../../noti/Notification';
import { AuthContext } from '../../context/auth.context';

export const ListDish = ({ dishes, total, setPage, page }) => {
    const [dishesWithImage, setDishesWithImage] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const [notifications, setNotifications] = useState([]);
    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);
    };

    const { setCart } = useContext(AuthContext);

    // Hàm chia mảng dishes thành các nhóm nhỏ 2 phần tử (dùng để render 2 cột)
    const chunkArray = (arr, size) => {
        const res = [];
        for (let i = 0; i < arr.length; i += size) {
            res.push(arr.slice(i, i + size));
        }
        return res;
    };



    // Khi chọn món, đặt số lượng = 1 và tổng tiền = giá món
    useEffect(() => {
        if (selectedDish) {
            setQuantity(1);
            setTotalPrice(selectedDish.price || 0);
        }
    }, [selectedDish]);

    // Lấy giỏ hàng mới
    const fetchCart = async () => {
        const res = await getCart();
        if (res.data) {
            setCart(res.data);
        }
    };

    // Hiện modal khi chọn món
    const showModal = (dish) => {
        setSelectedDish(dish);
        setIsModalOpen(true);
    };

    const handleOk = () => setIsModalOpen(false);
    const handleCancel = () => setIsModalOpen(false);

    // Thêm món vào giỏ hàng
    const addDishInCard = async (dishItem) => {
        try {
            const res = await adDishInCart(1, dishItem.price, dishItem.price, dishItem.id);
            if (res.data) {
                addNotification('Add new dish', 'Thêm món ăn vào giỏ hàng thành công', 'success');
                await fetchCart();
            } else {
                addNotification('Error', 'Thêm món ăn vào giỏ hàng thất bại', 'error');
            }
        } catch (error) {
            addNotification('Error', 'Thêm món ăn vào giỏ hàng thất bại', 'error');
        }
    };

    const rows = chunkArray(dishes, 2);

    // Component con hiển thị nội dung món ăn
    const DishContent = ({ dish, onClick }) => (
        <>
            <div className="row g-0 cursor-pointer" onClick={onClick}>
                <div className="col-12">
                    <h3 className="dish__name">{dish.name}</h3>
                </div>
                <div className="col">
                    <span className="dish__price">{dish.price.toLocaleString()}₫</span>
                </div>
            </div>
            <p className="dish__prameter text">{dish.category.name}</p>
            <button className="order" style={{ marginRight: '10px' }}>
                Order now
            </button>
            <button className="add__card" onClick={() => addDishInCard(dish)}>
                Add to cart
            </button>
        </>
    );

    return (
        <section className="container mb-5">
            {rows.map((rowDishes, rowIndex) => (
                <div className="row g-0 menu__item active" key={rowIndex}>
                    {rowDishes.map((dish) => {
                        const isEvenRow = rowIndex % 2 === 0;
                        return (
                            <div className="col-md-6 food__item" key={dish.id}>
                                <div className={`row g-0 dish__item ${!isEvenRow ? 'dish__item--reverse' : ''}`}>
                                    {isEvenRow ? (
                                        <>
                                            <div className="col-md-12 col-lg-6">
                                                <div
                                                    className="dish__img"
                                                    style={{
                                                        backgroundImage: `url(http://localhost:9000/restaurant/${dish.imageUrl || ''})`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="col-md-12 col-lg-6 dish__desc">
                                                <DishContent dish={dish} onClick={() => showModal(dish)} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-md-12 col-lg-6 dish__desc">
                                                <DishContent dish={dish} onClick={() => showModal(dish)} />
                                            </div>
                                            <div className="col-md-12 col-lg-6">
                                                <div
                                                    className="dish__img"
                                                    style={{
                                                        backgroundImage: `url(http://localhost:9000/restaurant/${dish.imageUrl || ''})`,
                                                    }}
                                                ></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            <Pagination
                className="mt-5"
                current={page}
                total={total}
                pageSize={6}
                onChange={(page) => setPage(page)}
                style={{ textAlign: 'center' }}
            />

            {/* Modal hiển thị chi tiết món ăn */}
            <Modal
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
                width={1014}
                style={{ padding: '0', borderRadius: '40px' }}
                getContainer={false}
            >
                <div className="row">
                    <div className="col-md-7">
                        <div
                            className="modal__img"
                            style={{
                                backgroundImage: `url(${selectedDish?.imageUrl || ''})`,
                                width: '100%',
                                height: '100%',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                padding: '0 0',
                            }}
                        ></div>
                    </div>

                    <div className="col-md-5" style={{ paddingRight: '36px', paddingTop: '20px' }}>
                        <div className="row">
                            <div className="col-12">
                                <div className="name mb-2">
                                    <h3 className="modal__dish__name">{selectedDish?.name}</h3>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="modal__desc mb-2" style={{ fontWeight: 600, fontSize: 18 }}>
                                    <span style={{ width: '120px', fontWeight: 600, fontSize: 18, display: 'inline-block' }}>
                                        Category:{' '}
                                    </span>
                                    <span className="text" style={{ fontWeight: 400 }}>
                                        {selectedDish?.category.name}
                                    </span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="modal__desc mb-2" style={{ fontWeight: 600, fontSize: 18 }}>
                                    <span style={{ width: '120px', fontWeight: 600, fontSize: 18, display: 'inline-block' }}>
                                        Description:{' '}
                                    </span>
                                    <span className="modal__dish__prameter text">{selectedDish?.description}</span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="price mb-2 d-flex align-items-center">
                                    <div style={{ width: '120px', fontWeight: 600, fontSize: 18 }}>Price:</div>
                                    <span className="modal__dish__price">{selectedDish?.price?.toLocaleString()}₫</span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="quantity mb-2">
                                    <div style={{ width: '120px', fontWeight: 600, display: 'inline-block', fontSize: 18 }}>Quantity:</div>
                                    <input
                                        className="quantity__input"
                                        type="number"
                                        placeholder="Nhập vào số lượng"
                                        defaultValue={1}
                                        value={quantity}
                                        min={1}
                                        style={{ marginLeft: '10px' }}
                                        onChange={(e) => {
                                            const newQty = parseInt(e.target.value) || 1;
                                            setQuantity(newQty);
                                            setTotalPrice((selectedDish?.price || 0) * newQty);
                                        }}
                                    />
                                    <div className="feedback mt-1">Vui lòng nhập số lượng lớn hơn 0</div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="total mb-2 d-flex align-items-center">
                                    <div style={{ width: '120px', fontWeight: 600, fontSize: 18 }}>Total:</div>
                                    <span className="total__price">{totalPrice.toLocaleString()}₫</span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="note mb-2">
                                    <div style={{ width: '120px', fontWeight: 600, fontSize: 18 }}>Notes:</div>
                                    <textarea
                                        rows="4"
                                        className="message mt-1"
                                        placeholder="Your message"
                                        style={{ width: '100%', border: '1px solid #ccc' }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="col-12 mb-2">
                                <a href="./xacNhan.html" target="_blank" rel="noreferrer">
                                    <button className="modal__order" style={{ width: '100%', padding: '10px 0' }}>
                                        Order
                                    </button>
                                </a>
                            </div>

                            <div className="col-12">
                                <div
                                    style={{
                                        fontFamily: 'Great Vibes, cursive',
                                        color: '#C8A97E',
                                        fontSize: '60px',
                                        textAlign: 'center',
                                    }}
                                >
                                    Feliciano
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                            setNotifications((prev) => prev.filter((item) => item.id !== notif.id));
                        }}
                    />
                ))}
            </div>
        </section>
    );
};
