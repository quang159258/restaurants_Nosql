package restaurant.example.restaurant.service.notification;

import java.util.HashMap;
import java.util.Map;

public class NotificationMessage {
    private NotificationAudience audience = NotificationAudience.ALL;
    private Long userId;
    private String customDestination;
    private Map<String, Object> payload = new HashMap<>();

    public NotificationMessage() {
    }

    public NotificationMessage(NotificationAudience audience, Long userId, String customDestination,
            Map<String, Object> payload) {
        this.audience = audience;
        this.userId = userId;
        this.customDestination = customDestination;
        if (payload != null) {
            this.payload = payload;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public NotificationAudience getAudience() {
        return audience;
    }

    public Long getUserId() {
        return userId;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public String getDestination() {
        if (customDestination != null && !customDestination.isBlank()) {
            return customDestination;
        }
        String destination;
        switch (audience) {
            case SUPER_ADMIN:
                destination = "/topic/admin/notifications";
                break;
            case STAFF:
                destination = "/topic/staff/notifications";
                break;
            case CUSTOMER:
                destination = (userId != null ? "/topic/users/" + userId : "/topic/notifications");
                break;
            case ALL:
            default:
                destination = "/topic/notifications";
                break;
        }
        return destination;
    }

    public static class Builder {
        private NotificationAudience audience = NotificationAudience.ALL;
        private Long userId;
        private String destination;
        private final Map<String, Object> payload = new HashMap<>();

        public Builder audience(NotificationAudience audience) {
            if (audience != null) {
                this.audience = audience;
            }
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder destination(String destination) {
            this.destination = destination;
            return this;
        }

        public Builder put(String key, Object value) {
            if (key != null && value != null) {
                payload.put(key, value);
            }
            return this;
        }

        public Builder payload(Map<String, Object> payload) {
            if (payload != null) {
                this.payload.putAll(payload);
            }
            return this;
        }

        public NotificationMessage build() {
            return new NotificationMessage(audience, userId, destination, payload);
        }
    }
}

