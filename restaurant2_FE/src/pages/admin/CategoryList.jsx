import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { fetchAllCategories, deleteCategory } from '../../services/api.service';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const fetchCategories = async (params = {}) => {
        setLoading(true);
        try {
            const response = await fetchAllCategories();
            setCategories(response.data);
        } catch (error) {
            message.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories({
            pagination,
        });
    }, []);

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this category?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            cancelText: 'No, cancel',
            onOk: async () => {
                try {
                    await deleteCategory(id);
                    message.success('Category deleted successfully');
                    fetchCategories();
                } catch (error) {
                    message.error('Failed to delete category');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || '-',
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Link to={`/admin/categories/edit/${record.id}`}>
                        <Button type="primary" icon={<EditOutlined />} size="small">
                            Edit
                        </Button>
                    </Link>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Link to="/admin/categories/new">
                    <Button type="primary" icon={<PlusOutlined />}>
                        Add Category
                    </Button>
                </Link>
            </div>
            <Table
                columns={columns}
                rowKey="id"
                dataSource={categories}
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total) => `Total ${total} categories`,
                }}
            />
        </div>
    );
};

export default CategoryList;
