package restaurant.example.restaurant.domain.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminCreateOrderRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Customer name is required")
    private String customerName;
    
    @NotNull(message = "Customer email is required")
    @Email(message = "Email should be valid")
    private String customerEmail;
    
    private String customerPhone;
    
    @NotEmpty(message = "Order items cannot be empty")
    private List<@Valid OrderItemRequest> items;
    
    private String deliveryAddress;
    private String paymentMethod;
    private String note;
    private String status;
    
    // Aliases for backward compatibility
    public String getReceiverName() {
        return customerName;
    }
    
    public String getReceiverPhone() {
        return customerPhone;
    }
    
    public String getReceiverAddress() {
        return deliveryAddress;
    }
    
    public String getReceiverEmail() {
        return customerEmail;
    }
    
    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Dish ID is required")
        private Long dishId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        
        private String specialRequest;
    }
}
