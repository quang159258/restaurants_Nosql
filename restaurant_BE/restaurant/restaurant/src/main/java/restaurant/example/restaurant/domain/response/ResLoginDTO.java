package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.util.List;

@Data
public class ResLoginDTO {
    private String accessToken;
    private String refreshToken;
    private UserLogin user;
    
    @Data
    public static class UserLogin {
        private String id;
        private String username;
        private String email;
        private String role;
        private String name;
        
        public UserLogin() {}
        
        public UserLogin(String id, String username, String email, String role) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.name = username;
        }
    }
    
    @Data
    public static class UserGetAccount {
        private String id;
        private String username;
        private String email;
        private String role;
        private String fullName;
        private String phone;
        private String gender;
        private String address;
        private List<String> addressParts;
    }
}
