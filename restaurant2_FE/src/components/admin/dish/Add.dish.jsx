import { Button, Form, Input, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { addDish, fetchAllCategories, handleUploadFile } from "../../../services/api.service";
import Notification from "../../noti/Notification";

const AddDish = (props) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const { isCreate, setCreate } = props;

    const [notifications, setNotifications] = useState([]);


    const addNotification = (message, description, type) => {
        const id = Date.now();
        const newNotif = { id, message, description, type };
        setNotifications((prev) => [...prev, newNotif]);


    };
    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await fetchAllCategories();
                const data = res?.data ?? res;
                if (Array.isArray(data)) {
                    setCategories(data);
                } else if (data?.data && Array.isArray(data.data)) {
                    setCategories(data.data);
                } else {
                    setCategories([]);
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách danh mục:", error);
                setCategories([]);
            }
        };
        getCategories();
    }, []);
    // const filteredCategories = categories.filter(cat => cat.name.toLowerCase() !== "all");

    // Hàm xử lý khi chọn và upload hình ảnh
    const handleImageUpload = async (file) => {
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            const uploadResponse = await handleUploadFile(file);
            const fileName = uploadResponse?.data ?? uploadResponse;
            if (!fileName) {
                throw new Error("Không lấy được tên file từ máy chủ");
            }
            form.setFieldsValue({ image: fileName });
        } catch (error) {
            console.error("Lỗi upload ảnh:", error);
            message.error("Upload ảnh thất bại!");
        }
    };

    const handleSave = async () => {
        try {
            const dishValue = form.getFieldsValue();
            console.log("Form values:", dishValue);
            
            // Validate required fields
            if (!dishValue.categoryId) {
                addNotification("Lỗi", "Vui lòng chọn danh mục", "error");
                return;
            }
            if (!dishValue.image) {
                addNotification("Lỗi", "Vui lòng tải lên ảnh món ăn", "error");
                return;
            }
            
            const dishData = {
                name: dishValue.name,
                description: dishValue.description,
                price: dishValue.price,
                stock: dishValue.stock || 0,
                image: dishValue.image,
                categoryId: dishValue.categoryId
            };
            
            console.log("Dish data to submit:", dishData);
            
            const res = await addDish(dishData);
            console.log("Add dish response:", res);
            
            const data = res?.data ?? res;
            if (data) {
                addNotification("Thành công", "Thêm món ăn thành công", "success");
                form.resetFields();
                setPreviewImage(null);
                setCreate(false);
            } else {
                addNotification("Lỗi", "Thêm món ăn thất bại", "error");
            }
        } catch (error) {
            console.error("Error adding dish:", error);
            addNotification("Lỗi", "Có lỗi xảy ra khi thêm món ăn", "error");
        }
    }
    return (
        <>

            <Modal
                open={isCreate}
                onCancel={() => { 
                    setCreate(false);
                    form.resetFields();
                    setPreviewImage(null);
                }}
                footer={null}
                width={1014}
                style={{ padding: "0", borderRadius: "40px" }}
                getContainer={false} // bạn vẫn giữ cái này
            >
                <div className="row">
                    {/* Ảnh xem trước */}
                    <div className="col-md-7">
                        <div
                            className="modal__img"
                            style={{
                                backgroundImage: `url(${previewImage})`,
                                width: "100%",
                                height: "100%",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                padding: "0 0",
                                minHeight: "400px",
                            }}
                        />

                    </div>

                    {/* Form cập nhật thông tin */}
                    <div className="col-md-5" style={{ paddingRight: "36px", paddingTop: "20px" }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSave}
                        >
                            <Form.Item name="image" hidden>
                                <Input />
                            </Form.Item>
                            <div className="row">


                                {/* Tên món */}
                                <div className="col-12">
                                    <Form.Item
                                        name="name"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Tên món</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập tên món!" }]}
                                        initialValue=""
                                    >
                                        <Input style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Danh mục */}

                                <div className="col-12" style={
                                    { marginBottom: "24px" }
                                }>
                                    {/* Trường ẩn để Form ghi nhận giá trị categoryId */}
                                    <Form.Item 
                                        name="categoryId" 
                                        rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                                        initialValue=""
                                        hidden
                                    >
                                        <input type="hidden" />
                                    </Form.Item>


                                    <span style={{ fontWeight: 600, fontSize: 18, paddingBottom: "8px", display: "block" }}>
                                        Loại món ({categories.length} danh mục)
                                    </span>
                                    <select
                                        style={{
                                            width: '100%',
                                            fontSize: 16,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: '1px solid #d9d9d9',
                                        }}
                                        value={form.getFieldValue('categoryId') || ''}
                                        onChange={(e) => {
                                            console.log('Category selected:', e.target.value);
                                            form.setFieldsValue({ categoryId: parseInt(e.target.value) });
                                            form.validateFields(['categoryId']);
                                        }}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>


                                </div>
                                {/* Mô tả */}
                                <div className="col-12">
                                    <Form.Item
                                        name="description"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Mô tả</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                                        initialValue=""
                                    >
                                        <Input.TextArea rows={3} style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Giá */}
                                <div className="col-12">
                                    <Form.Item
                                        name="price"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Giá</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
                                        initialValue={0}
                                    >
                                        <Input type="number" min={0} style={{ fontSize: 16 }} />
                                    </Form.Item>
                                </div>

                                {/* Tồn kho */}
                                <div className="col-12">
                                    <Form.Item
                                        name="stock"
                                        label={<span style={{ fontWeight: 600, fontSize: 18 }}>Tồn kho</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập số lượng tồn kho!" }]}
                                        initialValue={0}
                                    >
                                        <Input type="number" min={0} style={{ fontSize: 16 }} placeholder="Nhập số lượng tồn kho ban đầu" />
                                    </Form.Item>
                                </div>

                                {/* Upload ảnh */}
                                <div className="col-12">
                                    <span style={{ fontWeight: 600, fontSize: 18 }}>Ảnh món ăn</span>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        style={{ marginTop: 8 }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handleImageUpload(file);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Nút cập nhật */}
                                <div className="col-12 mb-2">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ width: "100%", padding: "10px 0", fontSize: 16 }}
                                    >
                                        Add New Dish
                                    </Button>
                                </div>
                            </div>
                        </Form>
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
                            setNotifications((prev) =>
                                prev.filter((item) => item.id !== notif.id)
                            );
                        }}
                    />
                ))}
            </div>
        </>
    );
}

export default AddDish