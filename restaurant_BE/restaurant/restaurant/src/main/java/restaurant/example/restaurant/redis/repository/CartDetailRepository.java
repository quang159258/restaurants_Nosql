package restaurant.example.restaurant.redis.repository;

import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.CartDetail;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class CartDetailRepository extends BaseRedisRepository {
    
    private static final String CART_DETAIL_PREFIX = "cartDetail:";
    private static final String CART_DETAIL_LIST = "cartDetail:list";
    private static final String CART_DETAIL_INDEX_CART = "cartDetail:index:cart:";
    private static final String CART_DETAIL_COUNTER = "cartDetail:counter";
    private static final String CART_ITEMS = "cart:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(CART_DETAIL_COUNTER);
        return String.valueOf(id);
    }
    
    public CartDetail save(CartDetail cartDetail) {
        if (cartDetail.getId() == null || cartDetail.getId().isEmpty()) {
            cartDetail.setId(generateId());
        }
        
        String key = CART_DETAIL_PREFIX + cartDetail.getId();
        redisTemplate.opsForValue().set(key, cartDetail);
        
        // Update cart index
        if (cartDetail.getCartId() != null) {
            redisTemplate.opsForSet().add(
                CART_DETAIL_INDEX_CART + cartDetail.getCartId(),
                cartDetail.getId()
            );
            redisTemplate.opsForSet().add(
                CART_ITEMS + cartDetail.getCartId() + ":items",
                cartDetail.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(CART_DETAIL_LIST, cartDetail.getId());
        
        return cartDetail;
    }
    
    public Optional<CartDetail> findById(String id) {
        String key = CART_DETAIL_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        CartDetail cartDetail = convertToModel(value, CartDetail.class);
        return Optional.ofNullable(cartDetail);
    }
    
    public List<CartDetail> findAllByCartId(String cartId) {
        Set<Object> itemIds = redisTemplate.opsForSet().members(
            CART_ITEMS + cartId + ":items"
        );
        if (itemIds == null) return new ArrayList<>();
        
        List<CartDetail> items = new ArrayList<>();
        for (Object id : itemIds) {
            findById((String) id).ifPresent(items::add);
        }
        return items;
    }
    
    public Optional<CartDetail> findByCartIdAndDishId(String cartId, String dishId) {
        List<CartDetail> items = findAllByCartId(cartId);
        return items.stream()
            .filter(item -> dishId.equals(item.getDishId()))
            .findFirst();
    }
    
    public void deleteAllByCartId(String cartId) {
        List<CartDetail> items = findAllByCartId(cartId);
        for (CartDetail item : items) {
            deleteById(item.getId());
        }
    }
    
    public void deleteById(String id) {
        CartDetail detail = findById(id).orElse(null);
        if (detail != null) {
            // Remove from cart index
            if (detail.getCartId() != null) {
                redisTemplate.opsForSet().remove(
                    CART_DETAIL_INDEX_CART + detail.getCartId(),
                    id
                );
                redisTemplate.opsForSet().remove(
                    CART_ITEMS + detail.getCartId() + ":items",
                    id
                );
            }
            // Remove from list
            redisTemplate.opsForSet().remove(CART_DETAIL_LIST, id);
            // Delete entity
            redisTemplate.delete(CART_DETAIL_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(CART_DETAIL_PREFIX + id);
    }
}

