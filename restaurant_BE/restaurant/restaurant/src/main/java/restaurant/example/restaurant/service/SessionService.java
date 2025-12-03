package restaurant.example.restaurant.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.Set;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.BoundListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import restaurant.example.restaurant.service.dto.UserSessionData;
import restaurant.example.restaurant.domain.response.ResSessionInfoDTO;

import java.util.ArrayList;

@Service
public class SessionService {
    private static final Logger log = LoggerFactory.getLogger(SessionService.class);
    private static final String SESSION_PREFIX = "session:";
    private static final String USER_SESSION_PREFIX = "user-sessions:";
    private static final String BLOCKED_DEVICES_PREFIX = "blocked-devices:";
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

    /**
     * Kiểm tra xem thiết bị có bị chặn không
     */
    public boolean isDeviceBlocked(String userId, String userAgent, String clientIp) {
        try {
            String deviceFingerprint = generateDeviceFingerprint(userAgent, clientIp);
            String blockedDevicesKey = blockedDevicesKey(userId);
            SetOperations<String, String> setOps = stringRedisTemplate.opsForSet();
            return Boolean.TRUE.equals(setOps.isMember(blockedDevicesKey, deviceFingerprint));
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot check blocked device for user: {}", userId, e);
            return false; // Fail safe: allow access when Redis is down
        }
    }

    /**
     * Chặn một thiết bị của user
     */
    public void blockDevice(String userId, String userAgent, String clientIp) {
        try {
            String deviceFingerprint = generateDeviceFingerprint(userAgent, clientIp);
            String blockedDevicesKey = blockedDevicesKey(userId);
            SetOperations<String, String> setOps = stringRedisTemplate.opsForSet();
            setOps.add(blockedDevicesKey, deviceFingerprint);
            
            // Xóa tất cả sessions của thiết bị bị chặn
            deleteSessionsForDevice(userId, deviceFingerprint);
            
            log.info("Device blocked for user {}: {}", userId, deviceFingerprint);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot block device for user: {}", userId, e);
        }
    }

    /**
     * Chặn thiết bị theo sessionId
     */
    public void blockDeviceBySessionId(String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null && data.getUserId() != null) {
                blockDevice(data.getUserId(), data.getUserAgent(), data.getClientIp());
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot block device by sessionId: {}", sessionId, e);
        }
    }

    /**
     * Bỏ chặn một thiết bị của user
     */
    public void unblockDevice(String userId, String userAgent, String clientIp) {
        try {
            String deviceFingerprint = generateDeviceFingerprint(userAgent, clientIp);
            String blockedDevicesKey = blockedDevicesKey(userId);
            SetOperations<String, String> setOps = stringRedisTemplate.opsForSet();
            setOps.remove(blockedDevicesKey, deviceFingerprint);
            
            log.info("Device unblocked for user {}: {}", userId, deviceFingerprint);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot unblock device for user: {}", userId, e);
        }
    }

    /**
     * Bỏ chặn thiết bị theo sessionId
     */
    public void unblockDeviceBySessionId(String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null && data.getUserId() != null) {
                unblockDevice(data.getUserId(), data.getUserAgent(), data.getClientIp());
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot unblock device by sessionId: {}", sessionId, e);
        }
    }

    /**
     * Lấy danh sách các thiết bị bị chặn của user
     */
    public Set<String> getBlockedDevices(String userId) {
        try {
            String blockedDevicesKey = blockedDevicesKey(userId);
            SetOperations<String, String> setOps = stringRedisTemplate.opsForSet();
            return setOps.members(blockedDevicesKey);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get blocked devices for user: {}", userId, e);
            return Set.of();
        }
    }

    /**
     * Xóa tất cả thiết bị bị chặn của user
     */
    public void unblockAllDevices(String userId) {
        try {
            String blockedDevicesKey = blockedDevicesKey(userId);
            stringRedisTemplate.delete(blockedDevicesKey);
            log.info("All devices unblocked for user: {}", userId);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot unblock all devices for user: {}", userId, e);
        }
    }

    /**
     * Tạo device fingerprint từ userAgent và IP
     */
    private String generateDeviceFingerprint(String userAgent, String clientIp) {
        try {
            String combined = (userAgent != null ? userAgent : "") + "|" + (clientIp != null ? clientIp : "");
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(combined.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error generating device fingerprint", e);
            // Fallback to simple hash
            return String.valueOf((userAgent != null ? userAgent : "").hashCode() + 
                                 (clientIp != null ? clientIp : "").hashCode());
        }
    }

    /**
     * Xóa tất cả sessions của một thiết bị cụ thể
     */
    private void deleteSessionsForDevice(String userId, String deviceFingerprint) {
        try {
            String key = userSessionsKey(userId);
            List<String> sessionIds = stringRedisTemplate.opsForList().range(key, 0, -1);
            if (!CollectionUtils.isEmpty(sessionIds)) {
                for (String sessionId : sessionIds) {
                    UserSessionData data = getSessionData(sessionId);
                    if (data != null) {
                        String sessionFingerprint = generateDeviceFingerprint(data.getUserAgent(), data.getClientIp());
                        if (deviceFingerprint.equals(sessionFingerprint)) {
                            deleteSessionInternal(sessionId, true);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete sessions for device: {}", deviceFingerprint, e);
        }
    }

    public String createSession(String userId, String userAgent, String clientIp) {
        // Tạm thời bỏ qua device blocking check
        // if (isDeviceBlocked(userId, userAgent, clientIp)) {
        //     log.warn("Login attempt blocked for user {} from blocked device", userId);
        //     throw new SecurityException("Thiết bị này đã bị chặn đăng nhập");
        // }
        
        String sessionId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        UserSessionData data = new UserSessionData(userId, now, now, userAgent, clientIp);
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            // Bỏ TTL - lưu vĩnh viễn
            ops.set(sessionKey(sessionId), data);
            registerSessionForUser(userId, sessionId);
        } catch (Exception e) {
            log.warn("Redis unavailable, session created without cache: {}", sessionId, e);
        }
        return sessionId;
    }

    public String getUserIdFromSession(String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null) {
                refreshSession(sessionId, data);
                return data.getUserId();
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get session: {}", sessionId, e);
        }
        return null;
    }

    public void refreshSession(String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null) {
                refreshSession(sessionId, data);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot refresh session: {}", sessionId, e);
        }
    }

    public void deleteSession(String sessionId) {
        try {
            deleteSessionInternal(sessionId, true);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete session: {}", sessionId, e);
        }
    }

    public void deleteAllSessionsForUser(String userId) {
        try {
            String key = userSessionsKey(userId);
            List<String> sessionIds = stringRedisTemplate.opsForList().range(key, 0, -1);
            if (!CollectionUtils.isEmpty(sessionIds)) {
                for (String sessionId : sessionIds) {
                    redisTemplate.delete(sessionKey(sessionId));
                }
            }
            stringRedisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete sessions for user: {}", userId, e);
        }
    }

    public boolean isSessionValidForUser(Long userId, String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            return data != null && userId != null && userId.equals(data.getUserId());
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot validate session: {}", sessionId, e);
            return false; // Fail safe: deny access when Redis is down
        }
    }

    
    public List<ResSessionInfoDTO> getUserSessions(String userId, String currentSessionId) {
        List<ResSessionInfoDTO> sessions = new ArrayList<>();
        try {
            String key = userSessionsKey(userId);
            List<String> sessionIds = stringRedisTemplate.opsForList().range(key, 0, -1);
            
            if (CollectionUtils.isEmpty(sessionIds)) {
                return sessions;
            }
            
            Instant now = Instant.now();
            // Thời gian inactive threshold: 30 phút
            long inactiveThresholdSeconds = 30 * 60;
            
            for (String sessionId : sessionIds) {
                UserSessionData data = getSessionData(sessionId);
                if (data != null && data.getUserId() != null && data.getUserId().equals(userId)) {
                    ResSessionInfoDTO sessionInfo = new ResSessionInfoDTO();
                    sessionInfo.setSessionId(sessionId);
                    sessionInfo.setClientIp(data.getClientIp());
                    sessionInfo.setUserAgent(data.getUserAgent());
                    sessionInfo.setDeviceInfo(parseUserAgent(data.getUserAgent()));
                    sessionInfo.setLocation("Unknown"); // Có thể tích hợp IP geolocation service
                    
                    // Set datetime - đảm bảo không null
                    Instant createdAt = data.getCreatedAt() != null ? data.getCreatedAt() : Instant.now();
                    Instant lastAccessAt = data.getLastAccessAt() != null ? data.getLastAccessAt() : Instant.now();
                    
                    sessionInfo.setCreatedAt(createdAt);
                    sessionInfo.setLastAccessAt(lastAccessAt);
                    
                    // Xác định state: active nếu lastAccessAt trong vòng 30 phút, hoặc là current session
                    boolean isCurrent = sessionId.equals(currentSessionId);
                    boolean isActive = isCurrent || (lastAccessAt != null && 
                        (now.getEpochSecond() - lastAccessAt.getEpochSecond()) < inactiveThresholdSeconds);
                    
                    sessionInfo.setCurrent(isCurrent);
                    // Note: isCurrentSession field is deprecated, use 'current' instead
                    sessionInfo.setActive(isActive);
                    
                    sessions.add(sessionInfo);
                }
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get user sessions: {}", userId, e);
        }
        return sessions;
    }

    public boolean deleteUserSession(String userId, String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null && data.getUserId().equals(userId)) {
                deleteSessionInternal(sessionId, true);
                return true;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete user session: {}", sessionId, e);
        }
        return false;
    }

    /**
     * Delete session by sessionId (for admin use - no userId check)
     * @param sessionId The session ID to delete
     * @return true if session was deleted, false if session doesn't exist
     */
    public boolean deleteSessionByAdmin(String sessionId) {
        try {
            UserSessionData data = getSessionData(sessionId);
            if (data != null) {
                deleteSessionInternal(sessionId, true);
                return true;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete session by admin: {}", sessionId, e);
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

    private void registerSessionForUser(String userId, String sessionId) {
        try {
            BoundListOperations<String, String> listOps = stringRedisTemplate.boundListOps(userSessionsKey(userId));
            listOps.leftPush(sessionId);
            Long size = listOps.size();
            if (size != null && size > maxSessionsPerUser) {
                String sessionToEvict = listOps.rightPop();
                if (sessionToEvict != null) {
                    deleteSessionInternal(sessionToEvict, false);
                }
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot register session for user: {}", userId, e);
        }
    }

    private void deleteSessionInternal(String sessionId, boolean removeFromUserList) {
        try {
            UserSessionData data = getSessionData(sessionId);
            redisTemplate.delete(sessionKey(sessionId));
            if (removeFromUserList && data != null && data.getUserId() != null) {
                stringRedisTemplate.opsForList()
                        .remove(userSessionsKey(data.getUserId()), 0, sessionId);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot delete session internally: {}", sessionId, e);
        }
    }

    private void refreshSession(String sessionId, UserSessionData data) {
        try {
            data.setLastAccessAt(Instant.now());
            // Bỏ TTL - lưu vĩnh viễn
            redisTemplate.opsForValue().set(sessionKey(sessionId), data);
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot refresh session: {}", sessionId, e);
        }
    }

    private UserSessionData getSessionData(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            Object value = ops.get(sessionKey(sessionId));
            UserSessionData data = convertToSessionData(value);
            if (data != null) {
                return data;
            }
            if (value instanceof Number) {
                Number number = (Number) value;
                UserSessionData legacy = new UserSessionData(String.valueOf(number.longValue()), Instant.now(), Instant.now(), null, null);
                // Bỏ TTL - lưu vĩnh viễn
                ops.set(sessionKey(sessionId), legacy);
                return legacy;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, cannot get session data: {}", sessionId, e);
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
            String userId = userIdObj != null ? userIdObj.toString() : null;
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

    private String userSessionsKey(String userId) {
        return USER_SESSION_PREFIX + userId;
    }

    private String blockedDevicesKey(String userId) {
        return BLOCKED_DEVICES_PREFIX + userId;
    }
}
