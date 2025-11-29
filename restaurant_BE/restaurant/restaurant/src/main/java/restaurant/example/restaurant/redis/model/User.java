package restaurant.example.restaurant.redis.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.util.constant.GenderEnum;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User implements Serializable {
    private String id;  // Changed from Long to String
    
    private String username;
    private String password;
    private String email;
    private String phone;
    private String address;
    private String refreshToken;
    private GenderEnum gender;
    
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    
    // Store role ID instead of Role object
    private String roleId;
    
    // Transient field for convenience (not stored in Redis)
    private transient restaurant.example.restaurant.redis.model.Role role;
    
    // Helper method
    public restaurant.example.restaurant.redis.model.Role getRole() {
        return role;
    }
    
    public String getName() {
        return username;
    }
}

