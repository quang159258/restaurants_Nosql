package restaurant.example.restaurant.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

import restaurant.example.restaurant.util.SecurityUtil;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.annotation.security.PermitAll;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.redis.repository.OrderRepository;
import restaurant.example.restaurant.redis.repository.RoleRepository;
import restaurant.example.restaurant.service.PaymentService;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.service.VnpayService;
import restaurant.example.restaurant.service.VnpayService.PaymentUrlResponse;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.constant.PaymentStatus;
import restaurant.example.restaurant.util.error.CartException;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    private final PaymentService paymentService;
    private final VnpayService vnpayService;
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;

    public PaymentController(PaymentService paymentService, VnpayService vnpayService,
            OrderRepository orderRepository, UserService userService, RoleRepository roleRepository) {
        this.paymentService = paymentService;
        this.vnpayService = vnpayService;
        this.orderRepository = orderRepository;
        this.userService = userService;
        this.roleRepository = roleRepository;
    }
    
    /**
     * Xác nhận thanh toán tiền mặt (dành cho staff/admin)
     */
    @PostMapping("/cash/confirm/{orderId}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> confirmCashPayment(@PathVariable String orderId) {
        Map<String, Object> result = paymentService.confirmCashPayment(orderId);
        
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
    public ResponseEntity<Map<String, Object>> getOrderInfo(@PathVariable String orderId) {
        Map<String, Object> result = paymentService.getOrderInfo(orderId);
        
        if ("success".equals(result.get("status"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PermitAll
    @GetMapping("/vnpay/config")
    public ResponseEntity<Map<String, Object>> getVnpayConfig() {
        Map<String, Object> result = new HashMap<>();
        result.put("enabled", vnpayService.isConfigured());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/vnpay/order/{orderId}")
    public ResponseEntity<Map<String, Object>> createVnpayPayment(@PathVariable String orderId,
            HttpServletRequest request) throws CartException {
        if (!vnpayService.isConfigured()) {
            throw new CartException("VNPay chưa được cấu hình.");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CartException("Không tìm thấy đơn hàng"));

        String email = SecurityUtil.getAuthenticatedEmail();
        User currentUser = userService.handelGetUserByUsername(email);
        boolean isOwner = order.getUserId() != null && currentUser != null && order.getUserId().equals(currentUser.getId());
        boolean isPrivileged = false;
        if (currentUser != null && currentUser.getRoleId() != null) {
            restaurant.example.restaurant.redis.model.Role role = roleRepository.findById(currentUser.getRoleId()).orElse(null);
            if (role != null) {
                String roleName = role.getName();
                isPrivileged = "ADMIN".equalsIgnoreCase(roleName)
                        || "SUPER_ADMIN".equalsIgnoreCase(roleName)
                        || "STAFF".equalsIgnoreCase(roleName);
            }
        }

        if (!isOwner && !isPrivileged) {
            throw new CartException("Bạn không thể thanh toán đơn hàng này.");
        }
        if (!PaymentMethod.VNPAY.equals(order.getPaymentMethod())) {
            throw new CartException("Đơn hàng này không hỗ trợ thanh toán VNPay.");
        }
        if (PaymentStatus.PAID.equals(order.getPaymentStatus())) {
            throw new CartException("Đơn hàng đã được thanh toán.");
        }

        PaymentUrlResponse paymentResponse = vnpayService.createPayment(order,
                request != null ? request.getRemoteAddr() : "127.0.0.1");
        order.setPaymentRef(paymentResponse.getTxnRef());
        orderRepository.save(order);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("paymentUrl", paymentResponse.getPaymentUrl());
        response.put("orderId", order.getId());
        return ResponseEntity.ok(response);
    }
}
