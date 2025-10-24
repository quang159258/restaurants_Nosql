package restaurant.example.restaurant.domain.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResCartDTO {
    private Long id; // ID của giỏ hàng
    private int totalItems; // Tổng số sản phẩm trong giỏ
    private double totalPrice; // Tổng tiền
}
