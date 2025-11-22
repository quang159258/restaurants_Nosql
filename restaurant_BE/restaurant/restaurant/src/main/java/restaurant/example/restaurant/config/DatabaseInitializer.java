package restaurant.example.restaurant.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Permission;
import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.repository.PermissionRepository;
import restaurant.example.restaurant.repository.RoleRepository;
import restaurant.example.restaurant.repository.UserRepository;
import restaurant.example.restaurant.util.constant.GenderEnum;

@Service
public class DatabaseInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT DATABASE");

        long countPermissions = this.permissionRepository.count();
        long countRoles = this.roleRepository.count();
        long countUsers = this.userRepository.count();

        if (countPermissions == 0) {
            List<Permission> permissions = new ArrayList<>();

            // CATEGORY
            permissions.add(new Permission("Create a category", "/category", "POST", "CATEGORY"));
            permissions.add(new Permission("Update a category", "/category", "PUT", "CATEGORY"));
            permissions.add(new Permission("Delete a category", "/category/{id}", "DELETE", "CATEGORY"));
            permissions.add(new Permission("Get a category by id", "/category/{id}", "GET", "CATEGORY"));
            permissions.add(new Permission("Get category with pagination", "/category", "GET", "CATEGORY"));

            // DISH
            permissions.add(new Permission("Create a dish", "/dish", "POST", "DISH"));
            permissions.add(new Permission("Update a dish", "/dish", "PUT", "DISH"));
            permissions.add(new Permission("Delete a dish", "/dish/{id}", "DELETE", "DISH"));
            permissions.add(new Permission("Get a dish by id", "/dish/{id}", "GET", "DISH"));
            permissions.add(new Permission("Get dish with pagination", "/dish", "GET", "DISH"));

            // PERMISSIONS
            permissions.add(new Permission("Create a permission", "/permissions", "POST", "PERMISSIONS"));
            permissions.add(new Permission("Update a permission", "/permissions", "PUT", "PERMISSIONS"));
            permissions.add(new Permission("Delete a permission", "/permissions/{id}", "DELETE", "PERMISSIONS"));
            permissions.add(new Permission("Get a permission by id", "/permissions/{id}", "GET", "PERMISSIONS"));
            permissions.add(new Permission("Get permissions with pagination", "/permissions", "GET", "PERMISSIONS"));

            // ROLES
            permissions.add(new Permission("Create a role", "/roles", "POST", "ROLES"));
            permissions.add(new Permission("Update a role", "/roles", "PUT", "ROLES"));
            permissions.add(new Permission("Delete a role", "/roles/{id}", "DELETE", "ROLES"));
            permissions.add(new Permission("Get a role by id", "/roles/{id}", "GET", "ROLES"));
            permissions.add(new Permission("Get roles with pagination", "/roles", "GET", "ROLES"));

            // USERS
            permissions.add(new Permission("Create a user", "/users", "POST", "USERS"));
            permissions.add(new Permission("Update a user", "/users", "PUT", "USERS"));
            permissions.add(new Permission("Delete a user", "/users/{id}", "DELETE", "USERS"));
            permissions.add(new Permission("Get a user by id", "/users/{id}", "GET", "USERS"));
            permissions.add(new Permission("Get users with pagination", "/users", "GET", "USERS"));

            // CART - chú ý sửa đường dẫn theo base path /cart
            permissions.add(new Permission("Get cart user", "/cart", "GET", "CART"));
            permissions.add(new Permission("Delete cart user", "/cart", "DELETE", "CART"));
            permissions.add(new Permission("Add dish to cart", "/cart/add-dish", "POST", "CART_ITEM"));
            permissions.add(new Permission("Get all dishes in cart", "/cart/get-all-dish", "GET", "CART_ITEM"));
            permissions.add(new Permission("Update dish quantity in cart", "/cart/update-dish", "PUT", "CART_ITEM"));
            permissions.add(new Permission("Delete dish from cart", "/cart/delete-dish/{id}", "DELETE", "CART_ITEM"));
            permissions.add(new Permission("Check out cart", "/cart/checkout", "POST", "CART_ITEM"));
            // FILES
            permissions.add(new Permission("Download a file", "/files", "POST", "FILES"));
            permissions.add(new Permission("Upload a file", "/files", "GET", "FILES"));

            // ORDER - sửa đường dẫn cho phù hợp controller
            permissions.add(new Permission("Get orders of current user", "/orders/my", "GET", "ORDER"));
            permissions.add(new Permission("Get all orders", "/orders/all", "GET", "ORDER"));
            permissions.add(new Permission("Get order by id", "/orders/{id}", "GET", "ORDER"));
            permissions.add(new Permission("Update order status", "/orders/status/{id}", "PUT", "ORDER"));
            permissions.add(new Permission("Delete order", "/orders/{id}", "DELETE", "ORDER"));

            // PAYMENT
            permissions.add(new Permission("Confirm cash payment", "/api/payment/cash/confirm/{orderId}", "POST", "PAYMENT"));
            permissions.add(new Permission("Get order payment info", "/api/payment/order/{orderId}", "GET", "PAYMENT"));
            permissions.add(new Permission("Create VNPay payment link", "/api/payment/vnpay/order/{orderId}", "POST", "PAYMENT"));
            permissions.add(new Permission("Get VNPay config", "/api/payment/vnpay/config", "GET", "PAYMENT"));

            // ANALYTICS
            permissions.add(new Permission("Analytics overview", "/api/v1/analytics/overview", "GET", "ANALYTICS"));

            // INVENTORY MANAGEMENT
            permissions.add(new Permission("Get inventory stock", "/api/v1/inventory/stock/{dishId}", "GET", "INVENTORY"));
            permissions.add(new Permission("Update inventory stock", "/api/v1/inventory/stock/{dishId}", "PUT", "INVENTORY"));
            permissions.add(new Permission("Import inventory stock", "/api/v1/inventory/import/{dishId}", "POST", "INVENTORY"));
            permissions.add(new Permission("Get inventory info", "/api/v1/inventory/stock/{dishId}", "GET", "INVENTORY"));

            // SESSION MANAGEMENT
            permissions.add(new Permission("Get own sessions", "/api/v1/auth/sessions", "GET", "SESSION"));
            permissions.add(new Permission("Logout own session", "/api/v1/auth/sessions/{sessionId}", "DELETE", "SESSION"));
            
            // ADMIN SESSION MANAGEMENT
            permissions.add(new Permission("Get user sessions (Admin)", "/admin/users/{userId}/sessions", "GET", "SESSION"));
            permissions.add(new Permission("Logout user session (Admin)", "/admin/users/{userId}/sessions/{sessionId}", "DELETE", "SESSION"));
            permissions.add(new Permission("Logout all user sessions (Admin)", "/admin/users/{userId}/sessions", "DELETE", "SESSION"));
            
            this.permissionRepository.saveAll(permissions);
        } else {
            // Nếu đã có permissions, chỉ thêm các permissions mới cho admin sessions
            List<Permission> newAdminSessionPermissions = new ArrayList<>();
            newAdminSessionPermissions.add(new Permission("Get user sessions (Admin)", "/admin/users/{userId}/sessions", "GET", "SESSION"));
            newAdminSessionPermissions.add(new Permission("Logout user session (Admin)", "/admin/users/{userId}/sessions/{sessionId}", "DELETE", "SESSION"));
            newAdminSessionPermissions.add(new Permission("Logout all user sessions (Admin)", "/admin/users/{userId}/sessions", "DELETE", "SESSION"));
            
            for (Permission perm : newAdminSessionPermissions) {
                Permission existing = permissionRepository.findByApiPathAndMethod(perm.getApiPath(), perm.getMethod());
                if (existing == null) {
                    permissionRepository.save(perm);
                    System.out.println(">>> Added new permission: " + perm.getApiPath() + " " + perm.getMethod());
                }
            }
        }

        if (countRoles == 0) {
            List<Permission> allPermissions = this.permissionRepository.findAll();

            // SUPER_ADMIN: full quyền (bao gồm tất cả inventory management)
            // - Tất cả quyền quản lý: CRUD món ăn, danh mục, user, đơn hàng
            // - Inventory management: nhập kho, cập nhật tồn kho, xem thông tin
            // - POST /api/v1/inventory/import/{dishId} (nhập kho)
            // - PUT /api/v1/inventory/stock/{dishId} (cập nhật tồn kho)
            // - GET /api/v1/inventory/stock/{dishId} (xem thông tin)
            Role adminRole = new Role();
            adminRole.setName("SUPER_ADMIN");
            adminRole.setDescription("Admin có toàn quyền - quản lý tất cả tính năng");
            adminRole.setPermissions(allPermissions);
            this.roleRepository.save(adminRole);

            // USER: chỉ mua hàng, xem đơn hàng của mình, thao tác giỏ hàng (KHÔNG có quyền inventory)
            List<Permission> userPermissions = allPermissions.stream()
                    .filter(p -> (p.getApiPath().equals("/orders/my") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/{id}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().startsWith("/cart")) ||
                            (p.getApiPath().equals("/api/payment/order/{orderId}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/order/{orderId}") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/config") && p.getMethod().equals("GET")))
                    .toList();

            Role userRole = new Role();
            userRole.setName("USER");
            userRole.setDescription("User bình thường - mua hàng và theo dõi đơn hàng của mình");
            userRole.setPermissions(userPermissions);
            this.roleRepository.save(userRole);

            // STAFF: quản lý đơn hàng + nhập kho (chỉ nhập, KHÔNG được sửa/xóa món ăn)
            // - Xem tất cả đơn hàng, cập nhật trạng thái đơn hàng
            // - Nhập kho: POST /api/v1/inventory/import/{dishId}
            // - Xem thông tin tồn kho: GET /api/v1/inventory/stock/{dishId}
            // - Xem danh sách món ăn: GET /dish
            // - KHÔNG có quyền: PUT /api/v1/inventory/stock/{dishId} (cập nhật tồn kho)
            List<Permission> staffPermissions = allPermissions.stream()
                    .filter(p -> (p.getApiPath().equals("/orders/all") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/{id}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/status/{id}") && p.getMethod().equals("PUT")) ||
                            (p.getApiPath().startsWith("/api/v1/inventory/import") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().startsWith("/api/v1/inventory/stock") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().startsWith("/dish") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/cash/confirm/{orderId}") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().equals("/api/payment/order/{orderId}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/order/{orderId}") && p.getMethod().equals("POST")))
                    .toList();

            Role staffRole = new Role();
            staffRole.setName("STAFF");
            staffRole.setDescription("Nhân viên quản lý đơn hàng và nhập kho");
            staffRole.setPermissions(staffPermissions);
            this.roleRepository.save(staffRole);
        } else {
            // Cập nhật SUPER_ADMIN role với tất cả permissions (bao gồm permissions mới)
            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            if (adminRole != null) {
                List<Permission> allPermissions = this.permissionRepository.findAll();
                adminRole.setPermissions(allPermissions);
                this.roleRepository.save(adminRole);
                System.out.println(">>> Updated SUPER_ADMIN role with all permissions (including new admin session permissions)");
            }
        }

        if (countUsers == 0) {
            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            Role userRole = this.roleRepository.findByName("USER");
            Role staffRole = this.roleRepository.findByName("STAFF");

            // SUPER ADMIN
            User adminUser = new User();
            adminUser.setEmail("admin@gmail.com");
            adminUser.setAddress("HCM");
            adminUser.setGender(GenderEnum.MALE);
            adminUser.setUsername("I'm super admin");
            adminUser.setPassword(this.passwordEncoder.encode("123456"));
            adminUser.setRole(adminRole);
            this.userRepository.save(adminUser);

            // NORMAL USER
            User normalUser = new User();
            normalUser.setEmail("user@gmail.com");
            normalUser.setAddress("Hanoi");
            normalUser.setGender(GenderEnum.FEMALE);
            normalUser.setUsername("Normal User");
            normalUser.setPassword(this.passwordEncoder.encode("123456"));
            normalUser.setRole(userRole);
            this.userRepository.save(normalUser);

            // STAFF
            User staffUser = new User();
            staffUser.setEmail("staff@gmail.com");
            staffUser.setAddress("Da Nang");
            staffUser.setGender(GenderEnum.MALE);
            staffUser.setUsername("Order Manager");
            staffUser.setPassword(this.passwordEncoder.encode("123456"));
            staffUser.setRole(staffRole);
            this.userRepository.save(staffUser);
        }

        if (countPermissions > 0 && countRoles > 0 && countUsers > 0) {
            System.out.println(">>> SKIP INIT DATABASE ~ ALREADY HAVE DATA...");
        } else {
            System.out.println(">>> END INIT DATABASE");
        }
    }
}
