package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResCreateUserDTO {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private LocalDateTime createdAt;
    private String name;
    private String gender;
    private String address;
}
