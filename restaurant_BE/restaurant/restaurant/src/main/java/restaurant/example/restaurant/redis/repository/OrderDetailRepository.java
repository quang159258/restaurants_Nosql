package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.OrderDetail;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class OrderDetailRepository extends BaseRedisRepository {
    
    private static final String ORDER_DETAIL_PREFIX = "orderDetail:";
    private static final String ORDER_DETAIL_LIST = "orderDetail:list";
    private static final String ORDER_DETAIL_INDEX_ORDER = "orderDetail:index:order:";
    private static final String ORDER_DETAIL_COUNTER = "orderDetail:counter";
    private static final String ORDER_DETAILS = "order:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(ORDER_DETAIL_COUNTER);
        return String.valueOf(id);
    }
    
    public OrderDetail save(OrderDetail orderDetail) {
        if (orderDetail.getId() == null || orderDetail.getId().isEmpty()) {
            orderDetail.setId(generateId());
        }
        
        String key = ORDER_DETAIL_PREFIX + orderDetail.getId();
        redisTemplate.opsForValue().set(key, orderDetail);
        
        // Update order index
        if (orderDetail.getOrderId() != null) {
            redisTemplate.opsForSet().add(
                ORDER_DETAIL_INDEX_ORDER + orderDetail.getOrderId(),
                orderDetail.getId()
            );
            redisTemplate.opsForSet().add(
                ORDER_DETAILS + orderDetail.getOrderId() + ":details",
                orderDetail.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(ORDER_DETAIL_LIST, orderDetail.getId());
        
        return orderDetail;
    }
    
    public Optional<OrderDetail> findById(String id) {
        String key = ORDER_DETAIL_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        OrderDetail orderDetail = convertToModel(value, OrderDetail.class);
        return Optional.ofNullable(orderDetail);
    }
    
    public List<OrderDetail> findByOrderId(String orderId) {
        Set<Object> detailIds = redisTemplate.opsForSet().members(
            ORDER_DETAILS + orderId + ":details"
        );
        if (detailIds == null) return new ArrayList<>();
        
        List<OrderDetail> details = new ArrayList<>();
        for (Object id : detailIds) {
            findById((String) id).ifPresent(details::add);
        }
        return details;
    }
    
    public List<OrderDetail> findAllById(String id) {
        return findById(id).map(List::of).orElse(new ArrayList<>());
    }
    
    public List<Object[]> findTopSellingDishes(Instant start, Instant end, Pageable pageable) {
        // This is a complex query - need to aggregate from OrderDetails
        // For now, return simplified version
        // In production, you might want to use Redis Streams or maintain separate aggregates
        List<OrderDetail> allDetails = findAll();
        
        // Filter by date range (would need to join with Order)
        // This is simplified - in production, maintain a separate aggregate
        return new ArrayList<>();
    }
    
    public List<OrderDetail> findAll() {
        Set<Object> detailIds = redisTemplate.opsForSet().members(ORDER_DETAIL_LIST);
        if (detailIds == null) return new ArrayList<>();
        
        List<OrderDetail> details = new ArrayList<>();
        for (Object id : detailIds) {
            findById((String) id).ifPresent(details::add);
        }
        return details;
    }
    
    public void deleteById(String id) {
        OrderDetail detail = findById(id).orElse(null);
        if (detail != null) {
            // Remove from order index
            if (detail.getOrderId() != null) {
                redisTemplate.opsForSet().remove(
                    ORDER_DETAIL_INDEX_ORDER + detail.getOrderId(),
                    id
                );
                redisTemplate.opsForSet().remove(
                    ORDER_DETAILS + detail.getOrderId() + ":details",
                    id
                );
            }
            // Remove from list
            redisTemplate.opsForSet().remove(ORDER_DETAIL_LIST, id);
            // Delete entity
            redisTemplate.delete(ORDER_DETAIL_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(ORDER_DETAIL_PREFIX + id);
    }
}

