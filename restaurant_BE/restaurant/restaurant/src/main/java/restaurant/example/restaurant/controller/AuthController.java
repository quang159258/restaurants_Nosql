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
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.SecurityUtil;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.IdInvalidException;
import restaurant.example.restaurant.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;

import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

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

    @PostMapping("auth/login")
    public ResponseEntity<ResLoginDTO> login(@RequestBody ReqLoginDTO loginDTO, HttpServletResponse response) throws IdInvalidException {
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

        // Tạo sessionId mapping tới userId lưu trên Redis
        String sessionId = sessionService.createSession(currentUserBD.getId());
        Cookie sessionCookie = new Cookie("SESSIONID", sessionId);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(86400); // 1 ngày
        sessionCookie.setSecure(true);
        response.addCookie(sessionCookie);

        return ResponseEntity.ok().body(res);
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

    @GetMapping("auth/account")
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
        this.userService.updateUserToken(refresh_token, email);

        // set cookies
        ResponseCookie responseCookies = ResponseCookie
                .from("refresh_token", newRefreshToken).httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshJwtExpiration)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, responseCookies.toString())
                .body(res);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout user ")
    public ResponseEntity<Void> logout(@CookieValue(name = "SESSIONID", required = false) String sessionId, HttpServletResponse response) {
        if (sessionId != null) {
            sessionService.deleteSession(sessionId);

            Cookie sessionCookie = new Cookie("SESSIONID", null);
            sessionCookie.setPath("/");
            sessionCookie.setMaxAge(0);
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(true);
            response.addCookie(sessionCookie);
        }
        return ResponseEntity.ok().build();
    }

}
