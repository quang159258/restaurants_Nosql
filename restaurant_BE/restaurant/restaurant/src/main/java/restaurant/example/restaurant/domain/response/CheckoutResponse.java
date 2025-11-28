package restaurant.example.restaurant.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {
    private Long orderId;
    private String status;
    private String paymentMethod;
    private String paymentUrl; // nếu là VNPay thì set, còn COD thì null
}
