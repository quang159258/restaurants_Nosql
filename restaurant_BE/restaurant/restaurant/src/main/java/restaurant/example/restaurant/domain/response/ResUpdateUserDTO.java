package restaurant.example.restaurant.domain.response;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;
import restaurant.example.restaurant.util.constant.GenderEnum;

@Getter
@Setter
public class ResUpdateUserDTO {
    private long id;
    private String username;
    private GenderEnum gender;
    private String address;
    private String phone;
    private Instant updatedAt;
}