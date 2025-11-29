package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class UserRepository extends BaseRedisRepository {
    
    private static final String USER_PREFIX = "user:";
    private static final String USER_LIST = "user:list";
    private static final String USER_INDEX_EMAIL = "user:index:email:";
    private static final String USER_COUNTER = "user:counter";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(USER_COUNTER);
        return String.valueOf(id);
    }
    
    public User save(User user) {
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(generateId());
        }
        
        String key = USER_PREFIX + user.getId();
        redisTemplate.opsForValue().set(key, user);
        
        // Update indexes
        if (user.getEmail() != null) {
            redisTemplate.opsForValue().set(
                USER_INDEX_EMAIL + user.getEmail(), 
                user.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(USER_LIST, user.getId());
        
        return user;
    }
    
    public Optional<User> findById(String id) {
        String key = USER_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        User user = convertToModel(value, User.class);
        return Optional.ofNullable(user);
    }
    
    public User findByEmail(String email) {
        String userIdKey = USER_INDEX_EMAIL + email;
        String userId = (String) redisTemplate.opsForValue().get(userIdKey);
        if (userId == null) return null;
        return findById(userId).orElse(null);
    }
    
    public Boolean existsByEmail(String email) {
        String userIdKey = USER_INDEX_EMAIL + email;
        return redisTemplate.hasKey(userIdKey);
    }
    
    public User findByRefreshTokenAndEmail(String token, String email) {
        User user = findByEmail(email);
        if (user != null && token != null && token.equals(user.getRefreshToken())) {
            return user;
        }
        return null;
    }
    
    public List<User> findAll() {
        Set<Object> userIds = redisTemplate.opsForSet().members(USER_LIST);
        if (userIds == null) return new ArrayList<>();
        
        List<User> users = new ArrayList<>();
        for (Object id : userIds) {
            findById((String) id).ifPresent(users::add);
        }
        return users;
    }
    
    public Page<User> findAll(Pageable pageable) {
        List<User> allUsers = findAll();
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        int end = Math.min(start + size, allUsers.size());
        
        List<User> pageContent = allUsers.stream()
            .skip(start)
            .limit(size)
            .collect(Collectors.toList());
        
        return new PageImpl<>(pageContent, pageable, allUsers.size());
    }
    
    public long count() {
        Set<Object> userIds = redisTemplate.opsForSet().members(USER_LIST);
        return userIds != null ? userIds.size() : 0;
    }
    
    public long countByCreatedAtBetween(Instant start, Instant end) {
        List<User> allUsers = findAll();
        return allUsers.stream()
            .filter(user -> {
                Instant createdAt = user.getCreatedAt();
                return createdAt != null && 
                       !createdAt.isBefore(start) && 
                       !createdAt.isAfter(end);
            })
            .count();
    }
    
    public void deleteById(String id) {
        User user = findById(id).orElse(null);
        if (user != null) {
            // Delete indexes
            if (user.getEmail() != null) {
                redisTemplate.delete(USER_INDEX_EMAIL + user.getEmail());
            }
            // Delete from list
            redisTemplate.opsForSet().remove(USER_LIST, id);
            // Delete entity
            redisTemplate.delete(USER_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(USER_PREFIX + id);
    }
}

