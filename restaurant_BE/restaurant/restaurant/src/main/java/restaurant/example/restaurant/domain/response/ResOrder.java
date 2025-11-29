package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ResOrder {
    private String id;
    private String orderNumber;
    private String userId;
    private String userFullName;
    private String userEmail;
    private String status;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;
    private List<ResOrderItem> items;
    private String receiverAddress;
    private String receiverName;
    private String receiverPhone;
    private double totalPrice;
    private Instant date;
    private List<ResOrderItem> listOrderItem;
}
