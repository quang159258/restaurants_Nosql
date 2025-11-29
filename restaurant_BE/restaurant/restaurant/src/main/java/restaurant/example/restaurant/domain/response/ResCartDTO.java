package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ResCartDTO {
    private String id;
    private String userId;
    private List<ResCartItem> items;
    private int totalItems;
    private BigDecimal totalPrice;
    private String status;
}
