import { useContext, useEffect, useMemo, useState } from 'react';
import { Pagination, Modal, Button, Tag, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { adDishInCart, getCart, getImageUrlFromFileName } from '../../../services/api.service';
import Notification from '../../noti/Notification';
import { AuthContext } from '../../context/auth.context';
import foodPlaceholder from '../../../assets/img/food-1.webp';

export const ListDish = ({ dishes = [], total = 0, setPage, page }) => {
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
                // Refresh cart to update count
                await fetchCart();
            } else {
                addNotification('Error', 'Thêm món ăn vào giỏ hàng thất bại', 'error');
            }
        } catch (error) {
            addNotification('Error', 'Thêm món ăn vào giỏ hàng thất bại', 'error');
        }
    };

    const dishCards = useMemo(() => dishes.map((dish) => {
        const imageSrc = getImageUrlFromFileName(dish.imageUrl) || foodPlaceholder;
        return (
            <div
                key={dish.id}
                className="dish-card"
                onClick={() => showModal(dish)}
                style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 16px 32px -20px rgba(15,23,42,0.18)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 45px -25px rgba(15,23,42,0.25)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 16px 32px -20px rgba(15,23,42,0.18)';
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        paddingBottom: '62%',
                        width: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src={imageSrc}
                        alt={dish.name}
                        onError={(e) => { e.currentTarget.src = foodPlaceholder; }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    <Tag
                        color="gold"
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            borderRadius: 999,
                            padding: '4px 12px',
                            fontWeight: 600,
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {dish.category?.name || 'Danh mục'}
                    </Tag>
                </div>
                <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Typography.Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                        {dish.name}
                    </Typography.Title>
                    <Typography.Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 0, color: '#6b7280', minHeight: 44 }}
                    >
                        {dish.description || 'Delicious dish prepared by our chef.'}
                    </Typography.Paragraph>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography.Title level={4} style={{ margin: 0, color: '#C8A97E' }}>
                            {dish.price?.toLocaleString('vi-VN')}₫
                        </Typography.Title>
                        <Button
                            type="primary"
                            shape="round"
                            icon={<ShoppingCartOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                addDishInCard(dish);
                            }}
                            style={{ background: '#C8A97E', borderColor: '#C8A97E' }}
                        >
                            Thêm vào giỏ
                        </Button>
                    </div>
                </div>
            </div>
        );
    }), [dishes]);

    return (
        <section className="container mb-5">
            <div
                className="dish-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '32px',
                }}
            >
                {dishCards}
            </div>

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
                                width: '100%',
                                height: '100%',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundImage: `url(${getImageUrlFromFileName(selectedDish?.imageUrl) || foodPlaceholder})`,
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
