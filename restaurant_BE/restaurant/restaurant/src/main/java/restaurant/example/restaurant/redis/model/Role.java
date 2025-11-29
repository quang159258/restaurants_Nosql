package restaurant.example.restaurant.redis.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role implements Serializable {
    private String id;  // Changed from Long to String
    
    private String name;
    private String description;
    
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    
    // Transient fields for convenience (not stored in Redis)
    private transient java.util.List<String> permissionIds;
    private transient java.util.List<restaurant.example.restaurant.redis.model.Permission> permissions;
}

