import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Space, Tag } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { useWebSocket } from '../../services/websocket.service';

const { Text } = Typography;

const NotificationCenter = ({ userRole = null, userId = null }) => {
    const { notifications, clearNotifications, connected } = useWebSocket(userRole, userId);
    const [visible, setVisible] = useState(false);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order':
                return '🛒';
            case 'low_stock':
                return '⚠️';
            case 'stock_update':
                return '📦';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'order':
                return 'blue';
            case 'low_stock':
                return 'red';
            case 'stock_update':
                return 'green';
            default:
                return 'default';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const notificationItems = notifications.map((notification, index) => ({
        key: notification.id || index,
        label: (
            <div style={{ padding: '8px 0' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                        <span style={{ fontSize: '16px' }}>
                            {getNotificationIcon(notification.type)}
                        </span>
                        <Text strong style={{ fontSize: '14px' }}>
                            {notification.title || notification.message}
                        </Text>
                        <Tag color={getNotificationColor(notification.type)} size="small">
                            {notification.type?.replace('_', ' ').toUpperCase()}
                        </Tag>
                    </Space>
                    {notification.dishName && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Món: {notification.dishName}
                        </Text>
                    )}
                    {notification.orderId && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Đơn hàng: #{notification.orderId}
                        </Text>
                    )}
                    {notification.customerName && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Khách hàng: {notification.customerName}
                        </Text>
                    )}
                    {notification.totalAmount && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Tổng tiền: {notification.totalAmount.toLocaleString('vi-VN')} VNĐ
                        </Text>
                    )}
                    {notification.currentStock !== undefined && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Tồn kho: {notification.currentStock}
                        </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {formatTime(notification.timestamp)}
                    </Text>
                </Space>
            </div>
        )
    }));

    const dropdownItems = [
        ...notificationItems,
        ...(notifications.length > 0 ? [{
            key: 'clear',
            label: (
                <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />}
                    onClick={clearNotifications}
                    style={{ width: '100%', textAlign: 'center' }}
                >
                    Xóa tất cả
                </Button>
            )
        }] : [])
    ];

    return (
        <Dropdown
            menu={{ items: dropdownItems }}
            trigger={['click']}
            open={visible}
            onOpenChange={setVisible}
            placement="bottomRight"
            overlayStyle={{ maxWidth: '400px' }}
        >
            <Badge 
                count={notifications.length} 
                size="small"
                style={{ 
                    cursor: 'pointer',
                    color: connected ? '#52c41a' : '#ff4d4f'
                }}
            >
                <BellOutlined 
                    style={{ 
                        fontSize: '18px',
                        color: connected ? '#52c41a' : '#ff4d4f'
                    }} 
                />
            </Badge>
        </Dropdown>
    );
};

export default NotificationCenter;