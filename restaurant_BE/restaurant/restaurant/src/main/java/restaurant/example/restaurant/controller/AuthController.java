package restaurant.example.restaurant.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import restaurant.example.restaurant.config.JwtConfiguration;
import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.response.ResCreateUserDTO;
import restaurant.example.restaurant.domain.response.ResLoginDTO;
import restaurant.example.restaurant.domain.request.ReqLoginDTO;
import restaurant.example.restaurant.domain.request.ChangePasswordRequest;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.SecurityUtil;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.IdInvalidException;
import restaurant.example.restaurant.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;

import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import restaurant.example.restaurant.domain.response.ResSessionInfoDTO;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityUtil securityUtil;
    private final UserService userService;
    private final JwtConfiguration jwtConfiguration;
    private final PasswordEncoder passwordEncoder;
    @Value("${restaurant.jwt.refresh-token-validity-in-seconds}")
    private long refreshJwtExpiration;
    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @Autowired
    private SessionService sessionService;

    public AuthController(AuthenticationManagerBuilder authenticationManagerBuilder,
            SecurityUtil securityUtil, UserService userService, JwtConfiguration jwtConfiguration,
            PasswordEncoder passwordEncoder) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
        this.userService = userService;
        this.jwtConfiguration = jwtConfiguration;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ResLoginDTO> login(@RequestBody ReqLoginDTO loginDTO, HttpServletRequest request,
            HttpServletResponse response) throws IdInvalidException {
        // Nạp input gồm username/password vào Security
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDTO.getUsername(), loginDTO.getPassword());

        // xác thực người dùng => cần viết hàm loadUserByUsername
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // nạp thông tin (nếu xử lý thành công) vào SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        ResLoginDTO res = new ResLoginDTO();
        User currentUserBD = this.userService.handelGetUserByUsername(loginDTO.getUsername());
        if (currentUserBD != null) {
            ResLoginDTO.UserLogin user = new ResLoginDTO.UserLogin();
            user.setEmail(currentUserBD.getEmail());
            user.setId(currentUserBD.getId());
            user.setName(currentUserBD.getUsername());
            user.setRole(currentUserBD.getRole());
            res.setUser(user);
        }
        String access_token = this.securityUtil.createAccessToken(authentication.getName(), res.getUser());
        res.setAccessToken(access_token);
        String refreshToken = this.securityUtil.createRefreshToken(authentication.getName(), res);
        this.userService.updateUserToken(refreshToken, currentUserBD.getEmail());

        // Tạo sessionId mapping tới userId lưu trên Redis
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        String clientIp = request != null ? request.getRemoteAddr() : null;
        
        // Kiểm tra xem thiết bị có bị chặn không
        if (sessionService.isDeviceBlocked(currentUserBD.getId(), userAgent, clientIp)) {
            throw new IdInvalidException("Thiết bị này đã bị chặn đăng nhập. Vui lòng liên hệ quản trị viên.");
        }
        
        String sessionId = sessionService.createSession(currentUserBD.getId(), userAgent, clientIp);
        Cookie sessionCookie = new Cookie("SESSIONID", sessionId);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(86400); // 1 ngày
        sessionCookie.setSecure(cookieSecure);
        response.addCookie(sessionCookie);

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(refreshJwtExpiration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(res);
    }

    @PostMapping("/auth/register")
    @ApiMessage("Register a new user")
    public ResponseEntity<ResCreateUserDTO> register(@Valid @RequestBody User postManUser)
            throws IdInvalidException {
        boolean isEmailExist = this.userService.isEmailExist(postManUser.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + postManUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }
        String hashPassword = this.passwordEncoder.encode(postManUser.getPassword());
        postManUser.setPassword(hashPassword);
        User ericUser = this.userService.CreateUser(postManUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.userService.convertToResCreateUserDTO(ericUser));
    }

    @GetMapping("/auth/account")
    @ApiMessage("fetch account")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        User currentUserDB = this.userService.handelGetUserByUsername(email);

        // ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin();
        ResLoginDTO.UserGetAccount userGetAccount = new ResLoginDTO.UserGetAccount();
        if (currentUserDB != null) {
            userGetAccount.setId(currentUserDB.getId());
            userGetAccount.setEmail(currentUserDB.getEmail());
            userGetAccount.setUsername(currentUserDB.getUsername());
            userGetAccount.setRole(currentUserDB.getRole().getName());
            userGetAccount.setPhone(currentUserDB.getPhone());
            userGetAccount.setGender(currentUserDB.getGender().name());
            userGetAccount.setAddress(currentUserDB.getAddress());
            userGetAccount.setAddressParts(AddressHelper.split(currentUserDB.getAddress()));
        }

        return ResponseEntity.ok().body(userGetAccount);
    }

    @GetMapping("/auth/refresh")
    @ApiMessage("Get user by refresh token")
    public ResponseEntity<ResLoginDTO> getRefreshToken(
            @CookieValue(name = "refresh_token", defaultValue = "abc") String refresh_token)
            throws IdInvalidException {
        if (refresh_token.equals("abc")) {
            throw new IdInvalidException("Bạn không có refresh token ở cookies");
        }
        // check valid
        Jwt decodeToken = this.securityUtil.checkValidRefreshToken(refresh_token);
        String email = decodeToken.getSubject();

        // check use by token and email
        User currentUser = this.userService.getUserByRefreshTokenAndEmail(refresh_token, email);
        if (currentUser == null) {
            throw new IdInvalidException("refresh token không hợp lệ");
        }
        ResLoginDTO res = new ResLoginDTO();
        User currentUserDB = this.userService.handelGetUserByUsername(email);

        if (currentUserDB != null) {
            ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                    currentUserDB.getId(),
                    currentUserDB.getEmail(),
                    currentUserDB.getUsername(),
                    currentUserDB.getRole());
            res.setUser(userLogin);
        }

        String access_token = this.securityUtil.createAccessToken(email, res.getUser());
        res.setAccessToken(access_token);

        String newRefreshToken = this.securityUtil.createRefreshToken(email, res);

        // update user
        this.userService.updateUserToken(newRefreshToken, email);

        // set cookies
        ResponseCookie responseCookies = ResponseCookie
                .from("refresh_token", newRefreshToken).httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(refreshJwtExpiration)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, responseCookies.toString())
                .body(res);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout user ")
    public ResponseEntity<Void> logout(@CookieValue(name = "SESSIONID", required = false) String sessionId,
            HttpServletResponse response) {
        if (sessionId != null) {
            sessionService.deleteSession(sessionId);

            Cookie sessionCookie = new Cookie("SESSIONID", null);
            sessionCookie.setPath("/");
            sessionCookie.setMaxAge(0);
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(cookieSecure);
            response.addCookie(sessionCookie);
        }
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .build();
    }

    @PostMapping("/auth/logout-all")
    @ApiMessage("Logout all user sessions")
    public ResponseEntity<Void> logoutAllDevices(HttpServletResponse response) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        sessionService.deleteAllSessionsForUser(currentUser.getId());

        Cookie sessionCookie = new Cookie("SESSIONID", null);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(cookieSecure);
        response.addCookie(sessionCookie);

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .build();
    }

    private static final class AddressHelper {
        private AddressHelper() {
        }

        private static java.util.List<String> split(String address) {
            if (address == null || address.isBlank()) {
                return java.util.Collections.emptyList();
            }
            String[] parts = address.split("\\s*,\\s*");
            java.util.List<String> result = new java.util.ArrayList<>();
            for (String part : parts) {
                if (!part.isBlank()) {
                    result.add(part.trim());
                }
            }
            return result;
        }
    }

    @PutMapping("/auth/change-password")
    @ApiMessage("Change password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request)
            throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new IdInvalidException("Mật khẩu hiện tại không chính xác");
        }
        if (request.getNewPassword().length() < 6) {
            throw new IdInvalidException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        this.userService.saveUser(currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/auth/sessions")
    @ApiMessage("Get all sessions for current user")
    public ResponseEntity<List<ResSessionInfoDTO>> getMySessions(
            @CookieValue(name = "SESSIONID", required = false) String currentSessionId) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        
        // User chỉ có thể xem sessions của chính mình
        List<ResSessionInfoDTO> sessions = sessionService.getUserSessions(currentUser.getId(), currentSessionId);
        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/auth/sessions/{sessionId}")
    @ApiMessage("Logout a specific session of current user")
    public ResponseEntity<Void> logoutSession(
            @PathVariable String sessionId) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        
        // User chỉ có thể logout sessions của chính mình
        boolean deleted = sessionService.deleteUserSession(currentUser.getId(), sessionId);
        if (!deleted) {
            throw new IdInvalidException("Session không tồn tại hoặc không thuộc về bạn");
        }
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/sessions/{sessionId}/block")
    @ApiMessage("Block device from this session (current user only)")
    public ResponseEntity<Void> blockMyDevice(
            @PathVariable String sessionId) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        
        // User chỉ có thể block devices của chính mình
        sessionService.blockDeviceBySessionId(sessionId);
        
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/auth/sessions/{sessionId}/block")
    @ApiMessage("Unblock device from this session (current user only)")
    public ResponseEntity<Void> unblockMyDevice(
            @PathVariable String sessionId) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            throw new IdInvalidException("Không xác định được người dùng hiện tại");
        }
        User currentUser = this.userService.handelGetUserByUsername(email);
        if (currentUser == null) {
            throw new IdInvalidException("Tài khoản không tồn tại");
        }
        
        // User chỉ có thể unblock devices của chính mình
        sessionService.unblockDeviceBySessionId(sessionId);
        
        return ResponseEntity.ok().build();
    }
}
