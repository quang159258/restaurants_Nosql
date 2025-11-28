package restaurant.example.restaurant.domain.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResSessionInfoDTO {
    private String sessionId;
    private String clientIp;
    private String userAgent;
    private String deviceInfo; // Parsed device info (Browser, OS, etc.)
    private String location; // Optional: IP-based location
    private Instant createdAt;
    private Instant lastAccessAt;
    private boolean isCurrent; // Is this the current session?
}

