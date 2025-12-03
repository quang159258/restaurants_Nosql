package restaurant.example.restaurant.service.dto;

import java.io.Serializable;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionData implements Serializable {
    private String userId;
    private Instant createdAt;
    private Instant lastAccessAt;
    private String userAgent;
    private String clientIp;
}

