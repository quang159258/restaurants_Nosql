package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResUserDTO {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String name;
    private String gender;
    private String address;
}
