import React, { useEffect, useState } from "react";
import { Table, Space, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { 
  fetchAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "../../../services/api.service";

const TableCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetchAllCategories();
      if (res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      message.error("Failed to delete category");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        message.success("Category updated successfully");
      } else {
        await createCategory(values);
        message.success("Category created successfully");
      }
      
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      message.error(error.response?.data?.message || "Failed to save category");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showModal}
        >
          Add Category
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={categories} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add New Category"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={editingCategory ? "Update" : "Create"}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: "",
            description: "",
          }}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              {
                required: true,
                message: 'Please input the category name!',
              },
              {
                min: 2,
                max: 100,
                message: 'Category name must be between 2 and 100 characters!',
              },
            ]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[
              {
                max: 500,
                message: 'Description must not exceed 500 characters!',
              },
            ]}
          >
            <Input.TextArea 
              placeholder="Enter category description (optional)" 
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TableCategory;
