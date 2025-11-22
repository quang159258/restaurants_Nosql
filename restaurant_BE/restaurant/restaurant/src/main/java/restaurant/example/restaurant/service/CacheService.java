package restaurant.example.restaurant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class CacheService {
    private static final Logger log = LoggerFactory.getLogger(CacheService.class);
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String DISH_CACHE_PREFIX = "dish:";
    private static final String CATEGORY_CACHE_PREFIX = "category:";
    private static final String USER_CACHE_PREFIX = "user:";
    private static final String ORDER_CACHE_PREFIX = "order:";
    private static final String CART_CACHE_PREFIX = "cart:";
    private static final String PERMISSION_CACHE_PREFIX = "permission:";
    private static final String ROLE_CACHE_PREFIX = "role:";
    
    // Default cache duration: 1 hour
    private static final long DEFAULT_CACHE_DURATION = 3600;
    
    // Cache duration for different data types
    private static final long DISH_CACHE_DURATION = 1800; // 30 minutes
    private static final long CATEGORY_CACHE_DURATION = 3600; // 1 hour
    private static final long USER_CACHE_DURATION = 1800; // 30 minutes
    private static final long ORDER_CACHE_DURATION = 900; // 15 minutes
    private static final long CART_CACHE_DURATION = 86400; // 1 day
    private static final long PERMISSION_CACHE_DURATION = 7200; // 2 hours
    private static final long ROLE_CACHE_DURATION = 7200; // 2 hours
    
    /**
     * Cache a single object
     */
    public void cacheObject(String key, Object value, long duration) {
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            ops.set(key, value, Duration.ofSeconds(duration));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping cache for key: {}", key, e);
        }
    }
    
    /**
     * Cache a single object with default duration
     */
    public void cacheObject(String key, Object value) {
        cacheObject(key, value, DEFAULT_CACHE_DURATION);
    }
    
    /**
     * Get cached object
     */
    public Object getCachedObject(String key) {
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            return ops.get(key);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get cache for key: {}", key, e);
            return null;
        }
    }
    
    /**
     * Delete cached object
     */
    public void deleteCachedObject(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete cache for key: {}", key, e);
        }
    }
    
    /**
     * Delete multiple cached objects by pattern
     */
    public void deleteCachedObjectsByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete cache by pattern: {}", pattern, e);
        }
    }
    
    /**
     * Check if key exists in cache
     */
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot check key: {}", key, e);
            return false;
        }
    }
    
    /**
     * Get TTL (Time To Live) of a key
     */
    public long getTTL(String key) {
        try {
            return redisTemplate.getExpire(key, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get TTL for key: {}", key, e);
            return -1;
        }
    }
    
    // Dish cache methods
    public void cacheDish(Long dishId, Object dish) {
        cacheObject(DISH_CACHE_PREFIX + dishId, dish, DISH_CACHE_DURATION);
    }
    
    public Object getCachedDish(Long dishId) {
        return getCachedObject(DISH_CACHE_PREFIX + dishId);
    }
    
    public void deleteCachedDish(Long dishId) {
        deleteCachedObject(DISH_CACHE_PREFIX + dishId);
    }
    
    public void deleteAllDishCache() {
        deleteCachedObjectsByPattern(DISH_CACHE_PREFIX + "*");
    }
    
    // Category cache methods
    public void cacheCategory(Long categoryId, Object category) {
        cacheObject(CATEGORY_CACHE_PREFIX + categoryId, category, CATEGORY_CACHE_DURATION);
    }
    
    public Object getCachedCategory(Long categoryId) {
        return getCachedObject(CATEGORY_CACHE_PREFIX + categoryId);
    }
    
    public void deleteCachedCategory(Long categoryId) {
        deleteCachedObject(CATEGORY_CACHE_PREFIX + categoryId);
    }
    
    public void deleteAllCategoryCache() {
        deleteCachedObjectsByPattern(CATEGORY_CACHE_PREFIX + "*");
    }
    
    // User cache methods
    public void cacheUser(Long userId, Object user) {
        cacheObject(USER_CACHE_PREFIX + userId, user, USER_CACHE_DURATION);
    }
    
    public Object getCachedUser(Long userId) {
        return getCachedObject(USER_CACHE_PREFIX + userId);
    }
    
    public void deleteCachedUser(Long userId) {
        deleteCachedObject(USER_CACHE_PREFIX + userId);
    }
    
    public void deleteAllUserCache() {
        deleteCachedObjectsByPattern(USER_CACHE_PREFIX + "*");
    }
    
    // Order cache methods
    public void cacheOrder(Long orderId, Object order) {
        cacheObject(ORDER_CACHE_PREFIX + orderId, order, ORDER_CACHE_DURATION);
    }
    
    public Object getCachedOrder(Long orderId) {
        return getCachedObject(ORDER_CACHE_PREFIX + orderId);
    }
    
    public void deleteCachedOrder(Long orderId) {
        deleteCachedObject(ORDER_CACHE_PREFIX + orderId);
    }
    
    public void deleteAllOrderCache() {
        deleteCachedObjectsByPattern(ORDER_CACHE_PREFIX + "*");
    }
    
    // Cart cache methods
    public void cacheCart(Long cartId, Object cart) {
        cacheObject(CART_CACHE_PREFIX + cartId, cart, CART_CACHE_DURATION);
    }
    
    public Object getCachedCart(Long cartId) {
        return getCachedObject(CART_CACHE_PREFIX + cartId);
    }
    
    public void deleteCachedCart(Long cartId) {
        deleteCachedObject(CART_CACHE_PREFIX + cartId);
    }
    
    public void deleteAllCartCache() {
        deleteCachedObjectsByPattern(CART_CACHE_PREFIX + "*");
    }
    
    // Permission cache methods
    public void cachePermission(Long permissionId, Object permission) {
        cacheObject(PERMISSION_CACHE_PREFIX + permissionId, permission, PERMISSION_CACHE_DURATION);
    }
    
    public Object getCachedPermission(Long permissionId) {
        return getCachedObject(PERMISSION_CACHE_PREFIX + permissionId);
    }
    
    public void deleteCachedPermission(Long permissionId) {
        deleteCachedObject(PERMISSION_CACHE_PREFIX + permissionId);
    }
    
    public void deleteAllPermissionCache() {
        deleteCachedObjectsByPattern(PERMISSION_CACHE_PREFIX + "*");
    }
    
    // Role cache methods
    public void cacheRole(Long roleId, Object role) {
        cacheObject(ROLE_CACHE_PREFIX + roleId, role, ROLE_CACHE_DURATION);
    }
    
    public Object getCachedRole(Long roleId) {
        return getCachedObject(ROLE_CACHE_PREFIX + roleId);
    }
    
    public void deleteCachedRole(Long roleId) {
        deleteCachedObject(ROLE_CACHE_PREFIX + roleId);
    }
    
    public void deleteAllRoleCache() {
        deleteCachedObjectsByPattern(ROLE_CACHE_PREFIX + "*");
    }
    
    // Clear all cache
    public void clearAllCache() {
        try {
            redisTemplate.getConnectionFactory().getConnection().flushAll();
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot clear cache", e);
        }
    }
    
    // Get cache statistics
    public long getCacheSize() {
        try {
            return redisTemplate.getConnectionFactory().getConnection().dbSize();
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get cache size", e);
            return 0;
        }
    }
}
