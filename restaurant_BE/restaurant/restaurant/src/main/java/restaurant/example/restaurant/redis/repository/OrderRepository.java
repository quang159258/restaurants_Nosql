package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.util.constant.OrderStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class OrderRepository extends BaseRedisRepository {
    
    private static final String ORDER_PREFIX = "order:";
    private static final String ORDER_LIST = "order:list";
    private static final String ORDER_INDEX_USER = "order:index:user:";
    private static final String ORDER_INDEX_PAYMENT_REF = "order:index:paymentRef:";
    private static final String ORDER_COUNTER = "order:counter";
    private static final String USER_ORDERS = "user:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(ORDER_COUNTER);
        return String.valueOf(id);
    }
    
    public Order save(Order order) {
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId(generateId());
        }
        
        String key = ORDER_PREFIX + order.getId();
        redisTemplate.opsForValue().set(key, order);
        
        // Update indexes
        if (order.getUserId() != null) {
            redisTemplate.opsForSet().add(
                ORDER_INDEX_USER + order.getUserId(),
                order.getId()
            );
            redisTemplate.opsForSet().add(
                USER_ORDERS + order.getUserId() + ":orders",
                order.getId()
            );
        }
        
        if (order.getPaymentRef() != null) {
            redisTemplate.opsForValue().set(
                ORDER_INDEX_PAYMENT_REF + order.getPaymentRef(),
                order.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(ORDER_LIST, order.getId());
        
        return order;
    }
    
    public Optional<Order> findById(String id) {
        String key = ORDER_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Order order = convertToModel(value, Order.class);
        return Optional.ofNullable(order);
    }
    
    public List<Order> findByUserId(String userId) {
        Set<Object> orderIds = redisTemplate.opsForSet().members(
            USER_ORDERS + userId + ":orders"
        );
        if (orderIds == null) return new ArrayList<>();
        
        List<Order> orders = new ArrayList<>();
        for (Object id : orderIds) {
            findById((String) id).ifPresent(orders::add);
        }
        return orders;
    }
    
    public Optional<Order> findByPaymentRef(String paymentRef) {
        String orderIdKey = ORDER_INDEX_PAYMENT_REF + paymentRef;
        String orderId = (String) redisTemplate.opsForValue().get(orderIdKey);
        if (orderId == null) return Optional.empty();
        return findById(orderId);
    }
    
    public List<Order> findAllByCreatedAtBetween(Instant start, Instant end) {
        List<Order> allOrders = findAll();
        return allOrders.stream()
            .filter(order -> {
                Instant createdAt = order.getCreatedAt();
                return createdAt != null && 
                       !createdAt.isBefore(start) && 
                       !createdAt.isAfter(end);
            })
            .collect(Collectors.toList());
    }
    
    public long countByCreatedAtBetween(Instant start, Instant end) {
        return findAllByCreatedAtBetween(start, end).size();
    }
    
    public long countByStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end) {
        return findAllByCreatedAtBetween(start, end).stream()
            .filter(order -> order.getStatus() == status)
            .count();
    }
    
    public Double sumRevenueBetween(Instant start, Instant end, OrderStatus excludedStatus) {
        return findAllByCreatedAtBetween(start, end).stream()
            .filter(order -> order.getStatus() != excludedStatus)
            .mapToDouble(Order::getTotalPrice)
            .sum();
    }
    
    public List<Order> findAll() {
        Set<Object> orderIds = redisTemplate.opsForSet().members(ORDER_LIST);
        if (orderIds == null) return new ArrayList<>();
        
        List<Order> orders = new ArrayList<>();
        for (Object id : orderIds) {
            findById((String) id).ifPresent(orders::add);
        }
        return orders;
    }
    
    public Page<Order> findAll(Pageable pageable) {
        List<Order> allOrders = findAll();
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        
        List<Order> pageContent = allOrders.stream()
            .skip(start)
            .limit(size)
            .collect(Collectors.toList());
        
        return new PageImpl<>(pageContent, pageable, allOrders.size());
    }
    
    public void deleteById(String id) {
        Order order = findById(id).orElse(null);
        if (order != null) {
            // Remove from indexes
            if (order.getUserId() != null) {
                redisTemplate.opsForSet().remove(
                    ORDER_INDEX_USER + order.getUserId(),
                    id
                );
                redisTemplate.opsForSet().remove(
                    USER_ORDERS + order.getUserId() + ":orders",
                    id
                );
            }
            if (order.getPaymentRef() != null) {
                redisTemplate.delete(ORDER_INDEX_PAYMENT_REF + order.getPaymentRef());
            }
            // Remove from list
            redisTemplate.opsForSet().remove(ORDER_LIST, id);
            // Delete entity
            redisTemplate.delete(ORDER_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(ORDER_PREFIX + id);
    }
}

