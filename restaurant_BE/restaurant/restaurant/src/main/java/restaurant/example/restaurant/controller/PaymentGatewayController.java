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

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipn(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        Map<String, String> readableParams = new HashMap<>();
        parameterMap.forEach((key, value) -> readableParams.put(key, value != null && value.length > 0 ? value[0] : ""));

        ValidationResult result = vnpayService.validateRequest(readableParams);
        if (!result.isValid()) {
            return ResponseEntity.ok(response("97", "Invalid signature"));
        }

        SortedMap<String, String> params = result.getParams();
        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");

        Order order = orderRepository.findByPaymentRef(txnRef).orElse(null);
        if (order == null) {
            return ResponseEntity.ok(response("01", "Order not found"));
        }

        long expectedAmount = Math.round(order.getTotalPrice() * 100);
        long receivedAmount = Long.parseLong(params.getOrDefault("vnp_Amount", "0"));
        if (expectedAmount != receivedAmount) {
            return ResponseEntity.ok(response("04", "Amount mismatch"));
        }

        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);
        if (success) {
            if (!PaymentStatus.PAID.equals(order.getPaymentStatus())) {
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
            return ResponseEntity.ok(response("00", "Success"));
        }

        if (!PaymentStatus.PAID.equals(order.getPaymentStatus())) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
        }
        return ResponseEntity.ok(response("99", "Failed"));
    }

    @GetMapping("/return")
    public ResponseEntity<Void> callback(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        Map<String, String> readableParams = new HashMap<>();
        parameterMap.forEach((key, value) -> readableParams.put(key, value != null && value.length > 0 ? value[0] : ""));

        ValidationResult result = vnpayService.validateRequest(readableParams);
        String txnRef = readableParams.get("vnp_TxnRef");
        Order order = orderRepository.findByPaymentRef(txnRef).orElse(null);
        boolean success = result.isValid() && "00".equals(readableParams.get("vnp_ResponseCode"))
                && "00".equals(readableParams.get("vnp_TransactionStatus"));
        String redirect = vnpayService.buildFrontendRedirect(success,
                success ? "Thanh toán thành công" : "Thanh toán thất bại", order);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirect)).build();
    }

    private Map<String, String> response(String code, String message) {
        Map<String, String> data = new HashMap<>();
        data.put("RspCode", code);
        data.put("Message", message);
        return data;
    }
}


