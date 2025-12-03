package restaurant.example.restaurant.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.redis.repository.OrderRepository;
import restaurant.example.restaurant.service.VnpayService;
import restaurant.example.restaurant.service.VnpayService.ValidationResult;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentStatus;

@RestController
@RequestMapping("/api/v1/payment/vnpay")
public class PaymentGatewayController {

    private final VnpayService vnpayService;
    private final OrderRepository orderRepository;

    public PaymentGatewayController(VnpayService vnpayService, OrderRepository orderRepository) {
        this.vnpayService = vnpayService;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/return")
    public ResponseEntity<Void> callback(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        Map<String, String> readableParams = new HashMap<>();
        parameterMap.forEach((key, value) -> readableParams.put(key, value != null && value.length > 0 ? value[0] : ""));

        ValidationResult result = vnpayService.validateRequest(readableParams);
        String txnRef = readableParams.get("vnp_TxnRef");
        String responseCode = readableParams.get("vnp_ResponseCode");
        String transactionStatus = readableParams.get("vnp_TransactionStatus");
        
        Order order = orderRepository.findByPaymentRef(txnRef).orElse(null);
        boolean success = result.isValid() && "00".equals(responseCode) && "00".equals(transactionStatus);
        
        // Cập nhật order status nếu thanh toán thành công
        if (order != null) {
            if (success) {
                if (!PaymentStatus.PAID.equals(order.getPaymentStatus())) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                    order.setStatus(OrderStatus.CONFIRMED);
                    orderRepository.save(order);
                }
            } else {
                if (!PaymentStatus.PAID.equals(order.getPaymentStatus())) {
                    order.setPaymentStatus(PaymentStatus.FAILED);
                    orderRepository.save(order);
                }
            }
        }
        
        // Redirect về frontend payment result page
        String redirect = vnpayService.buildFrontendRedirect(success,
                success ? "Thanh toán thành công" : "Thanh toán thất bại", order);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirect)).build();
    }
}


