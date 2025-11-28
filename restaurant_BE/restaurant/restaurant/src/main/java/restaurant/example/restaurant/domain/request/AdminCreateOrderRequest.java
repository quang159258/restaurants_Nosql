package restaurant.example.restaurant.domain.request;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AdminCreateOrderRequest {
    private Long userId;
    @NotEmpty
    private String receiverName;
    @NotEmpty
    private String receiverPhone;
    @NotEmpty
    private String receiverAddress;
    private String receiverEmail;
    private String paymentMethod;
    @NotNull
    @NotEmpty
    private List<OrderItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class OrderItemRequest {
        @NotNull
        private Long dishId;
        @Min(1)
        private int quantity;
    }
}

