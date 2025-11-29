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
public class CartDetail implements Serializable {
    private String id;  // Changed from long to String
    
    private long quantity;
    private double price;
    private double total;
    
    // Store IDs instead of objects
    private String cartId;
    private String dishId;
}

