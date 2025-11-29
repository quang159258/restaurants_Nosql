package restaurant.example.restaurant.domain.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemUpdate {
    // Support both id (cartItemId) and dishId for backward compatibility
    @JsonProperty("id")
    private String cartItemId;
    
    @JsonProperty("dishId")
    private String dishId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    // Helper method to get cartItemId
    public String getCartItemId() {
        return cartItemId;
    }
}
