import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
    }

    connect() {
        if (this.connected) return;

        const socket = new SockJS('http://localhost:8081/ws');
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });
        
        this.stompClient.onConnect = (frame) => {
            console.log('WebSocket Connected: ' + frame);
            this.connected = true;
            this.onConnect();
        };
        
        this.stompClient.onStompError = (error) => {
            console.error('WebSocket Connection Error: ' + error);
            this.connected = false;
            this.onDisconnect();
        };
        
        this.stompClient.activate();
    }

    disconnect() {
        if (this.stompClient && this.connected) {
            this.stompClient.deactivate();
            this.connected = false;
            this.subscriptions.clear();
        }
    }

    subscribe(topic, callback) {
        if (!this.connected || !this.stompClient) {
            console.warn('WebSocket not connected');
            return null;
        }

        const subscription = this.stompClient.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                callback(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });

        this.subscriptions.set(topic, subscription);
        return subscription;
    }

    unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(topic);
        }
    }

    sendMessage(destination, message) {
        if (this.connected && this.stompClient) {
            this.stompClient.send(destination, {}, JSON.stringify(message));
        }
    }

    onConnect() {
        // Override in component
    }

    onDisconnect() {
        // Override in component
    }

    // Subscribe to admin-only notifications
    subscribeAdminNotifications(callback) {
        return this.subscribe('/topic/admin/notifications', callback);
    }
}

// Hook để sử dụng WebSocket trong React components
export const useWebSocket = (userRole = null) => {
    const [wsService] = useState(() => new WebSocketService());
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        wsService.connect();
        
        // Subscribe to general notifications (for all users)
        wsService.subscribe('/topic/notifications', (notification) => {
            setNotifications(prev => [...prev, {
                id: Date.now() + Math.random(),
                ...notification,
                timestamp: new Date().toLocaleTimeString()
            }]);
        });

        // Subscribe to admin-only notifications (only for admin users)
        if (userRole === 'admin' || userRole === 'ADMIN') {
            wsService.subscribeAdminNotifications((notification) => {
                setNotifications(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    ...notification,
                    timestamp: new Date().toLocaleTimeString()
                }]);
            });
        }

        return () => {
            wsService.disconnect();
        };
    }, [userRole]);

    const sendChatMessage = (message, user) => {
        wsService.sendMessage('/app/chat', { message, user });
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return {
        connected: wsService.connected,
        notifications,
        sendChatMessage,
        clearNotifications,
        subscribe: wsService.subscribe.bind(wsService),
        unsubscribe: wsService.unsubscribe.bind(wsService)
    };
};

export default WebSocketService;
