package restaurant.example.restaurant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class SessionService {
    private static final String SESSION_PREFIX = "session:";
    private static final long SESSION_DURATION = 86400; // 1 ngày

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public String createSession(Long userId) {
        String sessionId = UUID.randomUUID().toString();
        ValueOperations<String, Object> ops = redisTemplate.opsForValue();
        ops.set(SESSION_PREFIX + sessionId, userId, Duration.ofSeconds(SESSION_DURATION));
        return sessionId;
    }

    public Long getUserIdFromSession(String sessionId) {
        ValueOperations<String, Object> ops = redisTemplate.opsForValue();
        Object value = ops.get(SESSION_PREFIX + sessionId);
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        return null;
    }

    public void deleteSession(String sessionId) {
        redisTemplate.delete(SESSION_PREFIX + sessionId);
    }
}
