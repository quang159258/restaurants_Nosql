package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.time.Instant;

@Data
public class ResSessionInfoDTO {
    private String sessionId;
    private String username;
    private String ipAddress;
    private String userAgent;
    private Instant creationTime;
    private Instant lastAccessTime;
    private boolean isCurrentSession;
    private long maxInactiveInterval;
    private String clientIp;
    private String deviceInfo;
    private String location;
    private Instant createdAt;
    private Instant lastAccessAt;
    private boolean current;
}
