package restaurant.example.restaurant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import restaurant.example.restaurant.domain.response.VnpayCallback;
import restaurant.example.restaurant.service.PaymentService;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    /**
     * Xác nhận thanh toán tiền mặt (dành cho staff/admin)
     */
    @PostMapping("/cash/confirm/{orderId}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> confirmCashPayment(@PathVariable Long orderId) {
        Map<String, Object> result = paymentService.confirmCashPayment(orderId);
        
        if ("success".equals(result.get("status"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * Xử lý callback từ VNPay
     */
    @PostMapping("/vnpay/callback")
    public ResponseEntity<Map<String, Object>> handleVNPayCallback(@RequestBody VnpayCallback callback) {
        String paymentRef = callback.getVnp_TxnRef();
        String responseCode = callback.getVnp_ResponseCode();
        
        Map<String, Object> result = paymentService.handleVNPayCallback(paymentRef, responseCode);
        
        if ("success".equals(result.get("status"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * Lấy thông tin đơn hàng
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderInfo(@PathVariable Long orderId) {
        Map<String, Object> result = paymentService.getOrderInfo(orderId);
        
        if ("success".equals(result.get("status"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
}
