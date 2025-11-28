package restaurant.example.restaurant.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Xử lý tin nhắn từ client
     */
    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public Map<String, Object> handleMessage(Map<String, Object> message) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "chat");
        response.put("message", message.get("message"));
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        response.put("user", message.get("user"));
        return response;
    }

    /**
     * Gửi thông báo đơn hàng mới
     */
    public void sendOrderNotification(Long orderId, String customerName, Double totalAmount) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "order");
        notification.put("orderId", orderId);
        notification.put("customerName", customerName);
        notification.put("totalAmount", totalAmount);
        notification.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        notification.put("message", "Đơn hàng mới #" + orderId + " từ " + customerName);
        
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Gửi thông báo tồn kho thấp - CHỈ GỬI CHO ADMIN
     */
    public void sendLowStockNotification(String dishName, Integer currentStock) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "low_stock");
        notification.put("dishName", dishName);
        notification.put("currentStock", currentStock);
        notification.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        notification.put("message", "Cảnh báo: " + dishName + " chỉ còn " + currentStock + " sản phẩm");
        notification.put("target", "admin"); // Chỉ gửi cho admin
        
        // Gửi đến topic riêng cho admin
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
    }

    /**
     * Gửi thông báo cập nhật tồn kho - CHỈ GỬI CHO ADMIN
     */
    public void sendStockUpdateNotification(String dishName, Integer oldStock, Integer newStock) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "stock_update");
        notification.put("dishName", dishName);
        notification.put("oldStock", oldStock);
        notification.put("newStock", newStock);
        notification.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        notification.put("message", "Tồn kho " + dishName + " đã được cập nhật từ " + oldStock + " lên " + newStock);
        notification.put("target", "admin"); // Chỉ gửi cho admin
        
        // Gửi đến topic riêng cho admin
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
    }

    /**
     * Gửi thông báo chung
     */
    public void sendGeneralNotification(String title, String message, String type) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("title", title);
        notification.put("message", message);
        notification.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
