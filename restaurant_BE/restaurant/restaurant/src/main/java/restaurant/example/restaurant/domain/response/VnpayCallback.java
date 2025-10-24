package restaurant.example.restaurant.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class VnpayCallback {
    // Chỉ lưu thông tin cần thiết cho callback
    private String vnp_ResponseCode; // "00" = thành công, khác = thất bại
    private String vnp_TxnRef; // Mã thanh toán để tìm order
    private String vnp_Amount; // Số tiền thanh toán
}
