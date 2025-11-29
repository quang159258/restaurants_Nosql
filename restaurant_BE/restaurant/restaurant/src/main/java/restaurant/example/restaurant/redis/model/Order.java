package restaurant.example.restaurant.redis.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.constant.PaymentStatus;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order implements Serializable {
    private String id;  // Changed from Long to String
    
    private double totalPrice;
    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String receiverEmail;
    
    private OrderStatus status;
    
    // Store user ID instead of User object
    private String userId;
    
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentRef;
    
    // Transient fields for convenience (not stored in Redis)
    private transient restaurant.example.restaurant.redis.model.User user;
    private transient java.util.List<restaurant.example.restaurant.redis.model.OrderDetail> orderItems;
    
    // Helper methods
    public restaurant.example.restaurant.redis.model.User getUser() {
        return user;
    }
    
    public java.util.List<restaurant.example.restaurant.redis.model.OrderDetail> getOrderItems() {
        return orderItems != null ? orderItems : java.util.Collections.emptyList();
    }
    
    public int getTotalItems() {
        if (orderItems == null || orderItems.isEmpty()) {
            return 0;
        }
        return orderItems.stream()
                .mapToInt(item -> (int) item.getQuantity())
                .sum();
    }
}

