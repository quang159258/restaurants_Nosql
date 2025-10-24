package restaurant.example.restaurant.domain.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.util.constant.GenderEnum;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResCreateUserDTO {
    private long id;
    private String name;
    private String email;
    private String phone;
    private GenderEnum gender;
    private String address;
    private Instant createdAt;
}
