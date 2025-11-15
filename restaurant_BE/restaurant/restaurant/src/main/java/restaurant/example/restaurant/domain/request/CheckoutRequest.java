package restaurant.example.restaurant.domain.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String receiverEmail;
    private String paymentMethod;
}