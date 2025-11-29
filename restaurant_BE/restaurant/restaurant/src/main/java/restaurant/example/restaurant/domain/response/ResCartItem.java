package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResCartItem {
    private String id;
    private String dishId;
    private String dishName;
    private String dishImage;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private double price;
    private double total;
    private String name;
    private String imageUrl;
    private String categoryName;
}
