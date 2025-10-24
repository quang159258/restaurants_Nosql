package restaurant.example.restaurant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.repository.OrderRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    /**
     * Xác nhận thanh toán tiền mặt (dành cho staff/admin)
     */
    @Transactional
    public Map<String, Object> confirmCashPayment(Long orderId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                result.put("status", "error");
                result.put("message", "Order not found");
                return result;
            }
            
            Order order = orderOpt.get();
            
            // Kiểm tra phương thức thanh toán
            if (!"CASH".equals(order.getPaymentMethod())) {
                result.put("status", "error");
                result.put("message", "This order is not cash payment");
                return result;
            }
            
            // Kiểm tra trạng thái thanh toán
            if ("PAID".equals(order.getPaymentStatus())) {
                result.put("status", "error");
                result.put("message", "This order is already paid");
                return result;
            }
            
            // Cập nhật trạng thái thanh toán và đơn hàng
            order.setPaymentStatus("PAID");
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            
            result.put("status", "success");
            result.put("message", "Cash payment confirmed successfully");
            result.put("orderId", orderId);
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Error confirming cash payment: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Xử lý callback từ VNPay
     */
    @Transactional
    public Map<String, Object> handleVNPayCallback(String paymentRef, String responseCode) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Order> orderOpt = orderRepository.findByPaymentRef(paymentRef);
            if (orderOpt.isEmpty()) {
                result.put("status", "error");
                result.put("message", "Order not found with payment ref: " + paymentRef);
                return result;
            }
            
            Order order = orderOpt.get();
            
            // Kiểm tra phương thức thanh toán
            if (!"VNPAY".equals(order.getPaymentMethod())) {
                result.put("status", "error");
                result.put("message", "This order is not VNPay payment");
                return result;
            }
            
            // Xử lý kết quả thanh toán
            if ("00".equals(responseCode)) {
                // Thanh toán thành công
                order.setPaymentStatus("PAID");
                order.setStatus("CONFIRMED");
                result.put("status", "success");
                result.put("message", "VNPay payment successful");
            } else {
                // Thanh toán thất bại
                order.setPaymentStatus("FAILED");
                order.setStatus("CANCELLED");
                result.put("status", "failed");
                result.put("message", "VNPay payment failed");
            }
            
            orderRepository.save(order);
            result.put("orderId", order.getId());
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Error processing VNPay callback: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Lấy thông tin đơn hàng
     */
    public Map<String, Object> getOrderInfo(Long orderId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                result.put("status", "error");
                result.put("message", "Order not found");
                return result;
            }
            
            Order order = orderOpt.get();
            
            result.put("status", "success");
            result.put("orderId", order.getId());
            result.put("totalPrice", order.getTotalPrice());
            result.put("paymentMethod", order.getPaymentMethod());
            result.put("paymentStatus", order.getPaymentStatus());
            result.put("paymentRef", order.getPaymentRef());
            result.put("status", order.getStatus());
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Error getting order info: " + e.getMessage());
        }
        
        return result;
    }
}
