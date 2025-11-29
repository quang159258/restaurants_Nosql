package restaurant.example.restaurant.redis.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetail implements Serializable {
    private String id;  // Changed from long to String
    
    private long quantity;
    private double price;
    
    // Store IDs instead of objects
    private String orderId;
    private String dishId;
    
    // Transient fields for convenience (not stored in Redis)
    private transient String dishName;
    
    // Helper methods
    public String getDishName() {
        return dishName;
    }
    
    public int getQuantity() {
        return (int) quantity;
    }
}

