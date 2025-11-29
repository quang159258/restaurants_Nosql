package restaurant.example.restaurant.domain.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CheckoutRequest {
    private List<CartItemRequest> items;
    
    @NotNull(message = "Customer name is required")
    @JsonProperty("receiverName")
    private String customerName;
    
    @NotNull(message = "Customer email is required")
    @JsonProperty("receiverEmail")
    private String customerEmail;
    
    @JsonProperty("receiverPhone")
    private String customerPhone;
    
    @JsonProperty("receiverAddress")
    private String deliveryAddress;
    
    private String paymentMethod;
    private String note;
    
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
    public static class CartItemRequest {
        @NotNull(message = "Dish ID is required")
        private Long dishId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        
        private String specialRequest;
    }
}
