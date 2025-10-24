package restaurant.example.restaurant.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.util.constant.GenderEnum;

@Getter
@Setter
public class ResLoginDTO {
    @JsonProperty("access_token")
    private String accessToken;

    private UserLogin user;
    private Role role;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserLogin {
        private long id;
        private String email;
        private String name;
        private Role role;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGetAccount {
        private Long id;
        private String username;
        private String email;
        private String phone;
        private String address;
        private String gender;
        private String role;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserInsideToken {
        private long id;
        private String email;
        private String name;
    }
}
