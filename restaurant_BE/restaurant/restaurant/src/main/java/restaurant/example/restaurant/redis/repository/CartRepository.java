package restaurant.example.restaurant.redis.repository;

import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Cart;

import java.util.Optional;

@Repository
public class CartRepository extends BaseRedisRepository {
    
    private static final String CART_PREFIX = "cart:";
    private static final String CART_INDEX_USER = "cart:index:user:";
    private static final String CART_COUNTER = "cart:counter";
    private static final String USER_CART = "user:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(CART_COUNTER);
        return String.valueOf(id);
    }
    
    public Cart save(Cart cart) {
        if (cart.getId() == null || cart.getId().isEmpty()) {
            cart.setId(generateId());
        }
        
        String key = CART_PREFIX + cart.getId();
        redisTemplate.opsForValue().set(key, cart);
        
        // Update user index
        if (cart.getUserId() != null) {
            redisTemplate.opsForValue().set(
                CART_INDEX_USER + cart.getUserId(),
                cart.getId()
            );
            redisTemplate.opsForValue().set(
                USER_CART + cart.getUserId() + ":cart",
                cart.getId()
            );
        }
        
        return cart;
    }
    
    public Optional<Cart> findById(String id) {
        String key = CART_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Cart cart = convertToModel(value, Cart.class);
        return Optional.ofNullable(cart);
    }
    
    public Optional<Cart> findByUserId(String userId) {
        String cartIdKey = CART_INDEX_USER + userId;
        String cartId = (String) redisTemplate.opsForValue().get(cartIdKey);
        if (cartId == null) return Optional.empty();
        return findById(cartId);
    }
    
    public void deleteById(String id) {
        Cart cart = findById(id).orElse(null);
        if (cart != null) {
            // Remove from user index
            if (cart.getUserId() != null) {
                redisTemplate.delete(CART_INDEX_USER + cart.getUserId());
                redisTemplate.delete(USER_CART + cart.getUserId() + ":cart");
            }
            // Delete entity
            redisTemplate.delete(CART_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(CART_PREFIX + id);
    }
}

