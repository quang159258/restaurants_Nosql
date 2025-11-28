import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.topicRegistry = new Map(); // topic -> { callbacks: Set<fn>, subscription }
        this._connecting = false;
    }

    connect() {
        if (this.connected || this._connecting) return;
        this._connecting = true;
        const socket = new SockJS('http://localhost:8081/ws');
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = () => {
            this.connected = true;
            this._connecting = false;
            this.topicRegistry.forEach((_, topic) => this.ensureSubscription(topic));
        };

        this.stompClient.onStompError = (error) => {
            console.error('WebSocket error', error);
            this.connected = false;
            this.resetSubscriptions();
        };

        this.stompClient.onWebSocketClose = () => {
            this.connected = false;
            this.resetSubscriptions();
        };

        this.stompClient.activate();
    }

    resetSubscriptions() {
        this.topicRegistry.forEach((entry) => {
            if (entry.subscription) {
                entry.subscription.unsubscribe();
                entry.subscription = null;
            }
        });
    }

    subscribe(topic, callback) {
        if (!topic || typeof callback !== 'function') {
            return () => {};
        }
        if (!this.topicRegistry.has(topic)) {
            this.topicRegistry.set(topic, { callbacks: new Set(), subscription: null });
        }
        const entry = this.topicRegistry.get(topic);
        entry.callbacks.add(callback);
        if (this.connected) {
            this.ensureSubscription(topic);
        } else {
            this.connect();
        }
        return () => this.unsubscribe(topic, callback);
    }

    ensureSubscription(topic) {
        const entry = this.topicRegistry.get(topic);
        if (!entry || !this.stompClient || entry.subscription) {
            return;
        }
        entry.subscription = this.stompClient.subscribe(topic, (message) => {
            let payload = null;
            try {
                payload = JSON.parse(message.body);
            } catch (error) {
                payload = message.body;
            }
            entry.callbacks.forEach((cb) => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error('WebSocket callback error', err);
                }
            });
        });
    }

    unsubscribe(topic, callback) {
        const entry = this.topicRegistry.get(topic);
        if (!entry) return;
        if (callback) {
            entry.callbacks.delete(callback);
        } else {
            entry.callbacks.clear();
        }
        if (entry.callbacks.size === 0) {
            if (entry.subscription) {
                entry.subscription.unsubscribe();
            }
            this.topicRegistry.delete(topic);
        }
    }

    sendMessage(destination, message) {
        if (this.connected && this.stompClient) {
            this.stompClient.send(destination, {}, JSON.stringify(message));
        }
    }
}

const singletonService = new WebSocketService();

export const useWebSocket = (userRole = null, userId = null) => {
    const [notifications, setNotifications] = useState([]);
    const subscriptionsRef = useRef([]);

    const appendNotification = (notification) => {
        setNotifications((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                ...notification,
                timestamp: new Date().toLocaleTimeString(),
            },
        ]);
    };

    useEffect(() => {
        singletonService.connect();
        const unsubscribeGeneral = singletonService.subscribe('/topic/notifications', (notification) => {
            appendNotification(notification);
        });
        subscriptionsRef.current.push(unsubscribeGeneral);

        if (userRole === 'SUPER_ADMIN') {
            subscriptionsRef.current.push(
                singletonService.subscribe('/topic/admin/notifications', (notification) => {
                    appendNotification(notification);
                })
            );
        }

        if (userRole === 'STAFF' || userRole === 'SUPER_ADMIN') {
            subscriptionsRef.current.push(
                singletonService.subscribe('/topic/staff/notifications', (notification) => {
                    appendNotification(notification);
                })
            );
        }

        if (userId) {
            subscriptionsRef.current.push(
                singletonService.subscribe(`/topic/users/${userId}`, (notification) => {
                    appendNotification(notification);
                })
            );
        }

        return () => {
            subscriptionsRef.current.forEach((unsub) => unsub && unsub());
            subscriptionsRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, userId]);

    const sendChatMessage = (message, user) => {
        singletonService.sendMessage('/app/chat', { message, user });
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return {
        connected: singletonService.connected,
        notifications,
        sendChatMessage,
        clearNotifications,
    };
};

export default singletonService;
