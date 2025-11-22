package restaurant.example.restaurant.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.BoundListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import restaurant.example.restaurant.service.dto.UserSessionData;
import restaurant.example.restaurant.domain.response.ResSessionInfoDTO;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private static final String SESSION_PREFIX = "session:";
    private static final String USER_SESSION_PREFIX = "user-sessions:";
    private static final long SESSION_DURATION = 86400; // 1 ngày

    private final RedisTemplate<String, Object> redisTemplate;
    private final StringRedisTemplate stringRedisTemplate;
    private final int maxSessionsPerUser;

    public SessionService(RedisTemplate<String, Object> redisTemplate,
            StringRedisTemplate stringRedisTemplate,
            @Value("${app.security.max-sessions-per-user:3}") int maxSessionsPerUser) {
        this.redisTemplate = redisTemplate;
        this.stringRedisTemplate = stringRedisTemplate;
        this.maxSessionsPerUser = Math.max(1, maxSessionsPerUser);
    }

    public String createSession(Long userId, String userAgent, String clientIp) {
        String sessionId = UUID.randomUUID().toString();
        UserSessionData data = new UserSessionData(userId, Instant.now(), Instant.now(), userAgent, clientIp);
        ValueOperations<String, Object> ops = redisTemplate.opsForValue();
        ops.set(sessionKey(sessionId), data, Duration.ofSeconds(SESSION_DURATION));
        registerSessionForUser(userId, sessionId);
        return sessionId;
    }

    public Long getUserIdFromSession(String sessionId) {
        UserSessionData data = getSessionData(sessionId);
        if (data != null) {
            refreshSession(sessionId, data);
            return data.getUserId();
        }
        return null;
    }

    public void refreshSession(String sessionId) {
        UserSessionData data = getSessionData(sessionId);
        if (data != null) {
            refreshSession(sessionId, data);
        }
    }

    public void deleteSession(String sessionId) {
        deleteSessionInternal(sessionId, true);
    }

    public void deleteAllSessionsForUser(Long userId) {
        String key = userSessionsKey(userId);
        List<String> sessionIds = stringRedisTemplate.opsForList().range(key, 0, -1);
        if (!CollectionUtils.isEmpty(sessionIds)) {
            for (String sessionId : sessionIds) {
                redisTemplate.delete(sessionKey(sessionId));
            }
        }
        stringRedisTemplate.delete(key);
    }

    public boolean isSessionValidForUser(Long userId, String sessionId) {
        UserSessionData data = getSessionData(sessionId);
        return data != null && userId != null && userId.equals(data.getUserId());
    }

    
    public List<ResSessionInfoDTO> getUserSessions(Long userId, String currentSessionId) {
        List<ResSessionInfoDTO> sessions = new ArrayList<>();
        String key = userSessionsKey(userId);
        List<String> sessionIds = stringRedisTemplate.opsForList().range(key, 0, -1);
        
        if (CollectionUtils.isEmpty(sessionIds)) {
            return sessions;
        }
        
        for (String sessionId : sessionIds) {
            UserSessionData data = getSessionData(sessionId);
            if (data != null && data.getUserId().equals(userId)) {
                ResSessionInfoDTO sessionInfo = new ResSessionInfoDTO();
                sessionInfo.setSessionId(sessionId);
                sessionInfo.setClientIp(data.getClientIp());
                sessionInfo.setUserAgent(data.getUserAgent());
                sessionInfo.setDeviceInfo(parseUserAgent(data.getUserAgent()));
                sessionInfo.setLocation("Unknown"); // Có thể tích hợp IP geolocation service
                sessionInfo.setCreatedAt(data.getCreatedAt());
                sessionInfo.setLastAccessAt(data.getLastAccessAt());
                sessionInfo.setCurrent(sessionId.equals(currentSessionId));
                sessions.add(sessionInfo);
            }
        }
        
        return sessions;
    }

    public boolean deleteUserSession(Long userId, String sessionId) {
        UserSessionData data = getSessionData(sessionId);
        if (data != null && data.getUserId().equals(userId)) {
            deleteSessionInternal(sessionId, true);
            return true;
        }
        return false;
    }

    /**
     * Delete session by sessionId (for admin use - no userId check)
     * @param sessionId The session ID to delete
     * @return true if session was deleted, false if session doesn't exist
     */
    public boolean deleteSessionByAdmin(String sessionId) {
        UserSessionData data = getSessionData(sessionId);
        if (data != null) {
            deleteSessionInternal(sessionId, true);
            return true;
        }
        return false;
    }

    /**
     * Parse user agent string để lấy thông tin browser và OS
     */
    private String parseUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown Device";
        }
        
        String browser = "Unknown Browser";
        String os = "Unknown OS";
        
        // Detect Browser
        if (userAgent.contains("Chrome") && !userAgent.contains("Edg")) {
            browser = "Chrome";
        } else if (userAgent.contains("Firefox")) {
            browser = "Firefox";
        } else if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) {
            browser = "Safari";
        } else if (userAgent.contains("Edg")) {
            browser = "Edge";
        } else if (userAgent.contains("Opera") || userAgent.contains("OPR")) {
            browser = "Opera";
        }
        
        // Detect OS
        if (userAgent.contains("Windows")) {
            os = "Windows";
        } else if (userAgent.contains("Mac")) {
            os = "macOS";
        } else if (userAgent.contains("Linux")) {
            os = "Linux";
        } else if (userAgent.contains("Android")) {
            os = "Android";
        } else if (userAgent.contains("iOS") || userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            os = "iOS";
        }
        
        return String.format("%s on %s", browser, os);
    }

    private void registerSessionForUser(Long userId, String sessionId) {
        BoundListOperations<String, String> listOps = stringRedisTemplate.boundListOps(userSessionsKey(userId));
        listOps.leftPush(sessionId);
        Long size = listOps.size();
        if (size != null && size > maxSessionsPerUser) {
            String sessionToEvict = listOps.rightPop();
            if (sessionToEvict != null) {
                deleteSessionInternal(sessionToEvict, false);
            }
        }
    }

    private void deleteSessionInternal(String sessionId, boolean removeFromUserList) {
        UserSessionData data = getSessionData(sessionId);
        redisTemplate.delete(sessionKey(sessionId));
        if (removeFromUserList && data != null && data.getUserId() != null) {
            stringRedisTemplate.opsForList()
                    .remove(userSessionsKey(data.getUserId()), 0, sessionId);
        }
    }

    private void refreshSession(String sessionId, UserSessionData data) {
        data.setLastAccessAt(Instant.now());
        redisTemplate.opsForValue().set(sessionKey(sessionId), data, Duration.ofSeconds(SESSION_DURATION));
    }

    private UserSessionData getSessionData(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        ValueOperations<String, Object> ops = redisTemplate.opsForValue();
        Object value = ops.get(sessionKey(sessionId));
        UserSessionData data = convertToSessionData(value);
        if (data != null) {
            return data;
        }
        if (value instanceof Number number) {
            UserSessionData legacy = new UserSessionData(number.longValue(), Instant.now(), Instant.now(), null, null);
            ops.set(sessionKey(sessionId), legacy, Duration.ofSeconds(SESSION_DURATION));
            return legacy;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private UserSessionData convertToSessionData(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UserSessionData data) {
            return data;
        }
        if (value instanceof Map<?, ?> map) {
            Object userIdObj = map.get("userId");
            Long userId = userIdObj != null ? Long.parseLong(userIdObj.toString()) : null;
            Instant createdAt = parseInstant(map.get("createdAt"));
            Instant lastAccessAt = parseInstant(map.get("lastAccessAt"));
            String userAgent = map.get("userAgent") != null ? map.get("userAgent").toString() : null;
            String clientIp = map.get("clientIp") != null ? map.get("clientIp").toString() : null;
            if (userId != null) {
                return new UserSessionData(userId, createdAt != null ? createdAt : Instant.now(),
                        lastAccessAt != null ? lastAccessAt : Instant.now(), userAgent, clientIp);
            }
        }
        return null;
    }

    private Instant parseInstant(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Instant.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String sessionKey(String sessionId) {
        return SESSION_PREFIX + sessionId;
    }

    private String userSessionsKey(Long userId) {
        return USER_SESSION_PREFIX + userId;
    }
}
