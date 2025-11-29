package restaurant.example.restaurant.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import restaurant.example.restaurant.redis.model.Permission;
import restaurant.example.restaurant.redis.model.Role;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.redis.repository.PermissionRepository;
import restaurant.example.restaurant.redis.repository.RoleRepository;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.SecurityUtil;
import restaurant.example.restaurant.util.error.PermissionException;

public class PermissionInterceptor implements HandlerInterceptor {
    @Autowired
    UserService userService;
    
    @Autowired
    RoleRepository roleRepository;
    
    @Autowired
    PermissionRepository permissionRepository;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response, Object handler)
            throws Exception {
        String path = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String requestURI = request.getRequestURI();
        String httpMethod = request.getMethod();
        System.out.println(">>> RUN preHandle");
        System.out.println(">>> path= " + path);
        System.out.println(">>> httpMethod= " + httpMethod);
        System.out.println(">>> requestURI= " + requestURI);

        String pathToMatchTemp = (path != null && !path.isEmpty()) ? path : requestURI;
        
        final String pathToMatch;
        if (pathToMatchTemp.contains("?")) {
            pathToMatch = pathToMatchTemp.substring(0, pathToMatchTemp.indexOf("?"));
        } else {
            pathToMatch = pathToMatchTemp;
        }

        String email = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        if (email != null && !email.isEmpty()) {
            User user = userService.handleGetUserByUsername(email);
            if (user != null && user.getRoleId() != null) {
                Role role = roleRepository.findById(user.getRoleId()).orElse(null);
                if (role != null) {
                    List<Permission> permissions = new java.util.ArrayList<>();
                    List<String> permissionIds = roleRepository.findPermissionIdsByRoleId(role.getId());
                    if (permissionIds != null && !permissionIds.isEmpty()) {
                        permissions = permissionRepository.findByIdIn(permissionIds);
                    }
                    System.out.println(">>> User's permissions:");
                    permissions.forEach(p -> {
                        System.out.println(p.getMethod() + " " + p.getApiPath());
                    });

                    boolean isAllow = permissions.stream()
                            .anyMatch(item -> {
                                String apiPath = item.getApiPath();
                                String method = item.getMethod();
                                
                                if (!method.equals(httpMethod)) {
                                    return false;
                                }
                                
                                if (apiPath.equals(pathToMatch)) {
                                    return true;
                                }
                                
                                if (pathToMatch.startsWith(apiPath)) {
                                    if (pathToMatch.length() == apiPath.length() || 
                                        pathToMatch.charAt(apiPath.length()) == '/') {
                                        return true;
                                    }
                                }
                                
                                return false;
                            });
                    
                    System.out.println(">>> Checking permission for: " + httpMethod + " " + pathToMatch);
                    System.out.println(">>> Permission check result: " + isAllow);
                    
                    if (isAllow == false) {
                        throw new PermissionException("Bạn không có quyền truy cập endpoint này.");
                    }
                } else {
                    throw new PermissionException("Bạn không có quyền truy cập endpoint này.");
                }
            }
        }
        return true;
    }
}