package restaurant.example.restaurant.domain.response;

import lombok.Data;

@Data
public class CheckoutResponse {
    private String orderId;
    private String status;
    private String paymentUrl;
    private String message;
    private String paymentMethod;
}
