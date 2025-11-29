package restaurant.example.restaurant.controller;

import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.domain.response.ResCreateUserDTO;
import restaurant.example.restaurant.domain.response.ResUpdateUserDTO;
import restaurant.example.restaurant.domain.response.ResUserDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.service.RoleService;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.IdInvalidException;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import restaurant.example.restaurant.service.SessionService;
import restaurant.example.restaurant.domain.response.ResSessionInfoDTO;
import restaurant.example.restaurant.util.SecurityUtil;
import jakarta.servlet.http.Cookie;
import org.springframework.web.bind.annotation.CookieValue;

@RestController
// @RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private SessionService sessionService;

    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;

    }

    @GetMapping("/")
    public String home() {

        return "check";
    }

    // create user
    @PostMapping("/users")
    @ApiMessage("Create new user")
    public ResponseEntity<ResCreateUserDTO> createNewUser(@Valid @RequestBody User newUser) throws IdInvalidException {
        boolean isEmailExit = this.userService.isEmailExit(newUser.getEmail());
        if (isEmailExit) {
            throw new IdInvalidException(
                    "Email " + newUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }
        String hashWord = this.passwordEncoder.encode(newUser.getPassword());
        newUser.setPassword(hashWord);
        User user = this.userService.CreateUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(user));
    }

    // get user
    @GetMapping("/users/{id}")
    @ApiMessage("Get user by id ")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") Long id) throws IdInvalidException {
        User user = this.userService.handelGetUser(String.valueOf(id));
        if (user == null) {
            throw new IdInvalidException("Id không tồn tại");
        }
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.convertToResUserDTO(user));
    }

    // get user
    @GetMapping("/users")
    @ApiMessage("fetch all users")
    public ResponseEntity<ResultPaginationDataDTO> getAllUser(Pageable pageable) {
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.handelGetAllUser(pageable));
    }

    // delete user
    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete user")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) throws IdInvalidException {
        User currentUser = this.userService.handelGetUser(String.valueOf(id));
        if (currentUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }

        this.userService.handelDeleteUser(currentUser.getId());
        return ResponseEntity.ok(null);
    }

    // update user
    @PutMapping("/users")
    @ApiMessage(" update user")
    public ResponseEntity<ResUpdateUserDTO> updateUser(@RequestBody User updateUser) throws IdInvalidException {
        User user = this.userService.handelUpdateUser(updateUser);
        if (user == null) {
            throw new IdInvalidException("User với id = " + updateUser.getId() + " không tồn tại");
        }
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(user));
    }

    // Admin: Get sessions of a specific user
    @GetMapping("/admin/users/{userId}/sessions")
    @ApiMessage("Get all sessions for a specific user (Admin only)")
    public ResponseEntity<List<ResSessionInfoDTO>> getUserSessions(
            @PathVariable String userId,
            @CookieValue(name = "SESSIONID", required = false) String currentSessionId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể xem sessions của bất kỳ user nào
        List<ResSessionInfoDTO> sessions = sessionService.getUserSessions(targetUser.getId(), currentSessionId);
        return ResponseEntity.ok(sessions);
    }

    // Admin: Logout a specific session of a user
    @DeleteMapping("/admin/users/{userId}/sessions/{sessionId}")
    @ApiMessage("Logout a specific session of a user (Admin only)")
    public ResponseEntity<Void> logoutUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể logout sessions của bất kỳ user nào
        // Kiểm tra session có tồn tại và thuộc về userId không
        boolean deleted = sessionService.deleteUserSession(targetUser.getId(), sessionId);
        if (!deleted) {
            // Nếu không match với userId, admin vẫn có thể xóa (có thể session thuộc user khác)
            deleted = sessionService.deleteSessionByAdmin(sessionId);
            if (!deleted) {
                throw new IdInvalidException("Session không tồn tại");
            }
        }
        
        return ResponseEntity.ok().build();
    }

    // Admin: Logout all sessions of a user
    @DeleteMapping("/admin/users/{userId}/sessions")
    @ApiMessage("Logout all sessions of a user (Admin only)")
    public ResponseEntity<Void> logoutAllUserSessions(
            @PathVariable String userId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể logout tất cả sessions của bất kỳ user nào
        sessionService.deleteAllSessionsForUser(targetUser.getId());
        return ResponseEntity.ok().build();
    }

    // Admin: Block device by sessionId
    @PostMapping("/admin/users/{userId}/sessions/{sessionId}/block")
    @ApiMessage("Block device from a session (Admin only)")
    public ResponseEntity<Void> blockUserDevice(
            @PathVariable String userId,
            @PathVariable String sessionId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể block devices của bất kỳ user nào
        sessionService.blockDeviceBySessionId(sessionId);
        return ResponseEntity.ok().build();
    }

    // Admin: Unblock device by sessionId
    @DeleteMapping("/admin/users/{userId}/sessions/{sessionId}/block")
    @ApiMessage("Unblock device from a session (Admin only)")
    public ResponseEntity<Void> unblockUserDevice(
            @PathVariable String userId,
            @PathVariable String sessionId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể unblock devices của bất kỳ user nào
        sessionService.unblockDeviceBySessionId(sessionId);
        return ResponseEntity.ok().build();
    }

    // Admin: Get blocked devices for a user
    @GetMapping("/admin/users/{userId}/blocked-devices")
    @ApiMessage("Get all blocked devices for a user (Admin only)")
    public ResponseEntity<java.util.Set<String>> getBlockedDevices(
            @PathVariable String userId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể xem blocked devices của bất kỳ user nào
        java.util.Set<String> blockedDevices = sessionService.getBlockedDevices(targetUser.getId());
        return ResponseEntity.ok(blockedDevices);
    }

    // Admin: Unblock all devices for a user
    @DeleteMapping("/admin/users/{userId}/blocked-devices")
    @ApiMessage("Unblock all devices for a user (Admin only)")
    public ResponseEntity<Void> unblockAllDevices(
            @PathVariable String userId) throws IdInvalidException {
        // Check if user exists
        User targetUser = this.userService.handelGetUser(userId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại");
        }
        
        // Admin có thể unblock tất cả devices của bất kỳ user nào
        sessionService.unblockAllDevices(targetUser.getId());
        return ResponseEntity.ok().build();
    }

}
