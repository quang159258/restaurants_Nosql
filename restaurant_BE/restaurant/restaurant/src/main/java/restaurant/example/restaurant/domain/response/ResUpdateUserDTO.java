package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResUpdateUserDTO {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private LocalDateTime updatedAt;
    private String gender;
    private String address;
}
