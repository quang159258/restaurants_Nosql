import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCategoryById, createCategory, updateCategory } from '../../services/api.service';

const { TextArea } = Input;

const CategoryForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEditing(true);
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const { data } = await fetchCategoryById(id);
            form.setFieldsValue({
                name: data.name,
                description: data.description,
            });
        } catch (error) {
            message.error('Failed to fetch category');
            navigate('/admin/categories');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            if (isEditing) {
                await updateCategory(id, values);
                message.success('Category updated successfully');
            } else {
                await createCategory(values);
                message.success('Category created successfully');
            }
            navigate('/admin/categories');
        } catch (error) {
            const errorMessage = isEditing ? 'updating' : 'creating';
            message.error(`Error ${errorMessage} category`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={isEditing ? 'Edit Category' : 'Create New Category'}
            style={{ maxWidth: 800, margin: '0 auto' }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the category name!',
                        },
                    ]}
                >
                    <Input placeholder="Enter category name" />
                </Form.Item>

                <Form.Item
                    label="Description"
                    name="description"
                >
                    <TextArea
                        rows={4}
                        placeholder="Enter category description (optional)"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {isEditing ? 'Update' : 'Create'} Category
                    </Button>
                    <Button
                        style={{ marginLeft: 10 }}
                        onClick={() => navigate('/admin/categories')}
                    >
                        Cancel
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default CategoryForm;
