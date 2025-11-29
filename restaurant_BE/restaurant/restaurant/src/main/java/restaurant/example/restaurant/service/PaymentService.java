package restaurant.example.restaurant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.redis.repository.OrderRepository;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.constant.PaymentStatus;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    public Map<String, Object> confirmCashPayment(String orderId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                result.put("status", "error");
                result.put("message", "Order not found");
                return result;
            }
            
            Order order = orderOpt.get();
            
            if (!PaymentMethod.CASH.equals(order.getPaymentMethod())) {
                result.put("status", "error");
                result.put("message", "This order is not cash payment");
                return result;
            }
            
            if (PaymentStatus.PAID.equals(order.getPaymentStatus())) {
                result.put("status", "error");
                result.put("message", "This order is already paid");
                return result;
            }
            
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
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
    
    public Map<String, Object> getOrderInfo(String orderId) {
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
            result.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null);
            result.put("paymentStatus", order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
            result.put("paymentRef", order.getPaymentRef());
            result.put("orderStatus", order.getStatus() != null ? order.getStatus().name() : null);
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Error getting order info: " + e.getMessage());
        }
        
        return result;
    }
}
