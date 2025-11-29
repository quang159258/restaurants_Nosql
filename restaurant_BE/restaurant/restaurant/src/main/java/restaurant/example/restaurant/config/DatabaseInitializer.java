package restaurant.example.restaurant.config;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.redis.model.Permission;
import restaurant.example.restaurant.redis.model.Role;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.redis.repository.PermissionRepository;
import restaurant.example.restaurant.redis.repository.RoleRepository;
import restaurant.example.restaurant.redis.repository.UserRepository;
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
        System.out.println(">>> START INIT REDIS DATABASE");

        long countPermissions = this.permissionRepository.findAll().size();
        long countRoles = this.roleRepository.findAll().size();
        long countUsers = this.userRepository.findAll().size();

        if (countPermissions == 0) {
            List<Permission> permissions = new ArrayList<>();

            // CATEGORY
            Permission p1 = new Permission("Create a category", "/category", "POST", "CATEGORY");
            p1.setId(permissionRepository.generateId());
            permissions.add(p1);
            
            Permission p2 = new Permission("Update a category", "/category", "PUT", "CATEGORY");
            p2.setId(permissionRepository.generateId());
            permissions.add(p2);
            
            Permission p3 = new Permission("Delete a category", "/category/{id}", "DELETE", "CATEGORY");
            p3.setId(permissionRepository.generateId());
            permissions.add(p3);
            
            Permission p4 = new Permission("Get a category by id", "/category/{id}", "GET", "CATEGORY");
            p4.setId(permissionRepository.generateId());
            permissions.add(p4);
            
            Permission p5 = new Permission("Get category with pagination", "/category", "GET", "CATEGORY");
            p5.setId(permissionRepository.generateId());
            permissions.add(p5);

            // DISH
            Permission p6 = new Permission("Create a dish", "/dish", "POST", "DISH");
            p6.setId(permissionRepository.generateId());
            permissions.add(p6);
            
            Permission p7 = new Permission("Update a dish", "/dish", "PUT", "DISH");
            p7.setId(permissionRepository.generateId());
            permissions.add(p7);
            
            Permission p8 = new Permission("Delete a dish", "/dish/{id}", "DELETE", "DISH");
            p8.setId(permissionRepository.generateId());
            permissions.add(p8);
            
            Permission p9 = new Permission("Get a dish by id", "/dish/{id}", "GET", "DISH");
            p9.setId(permissionRepository.generateId());
            permissions.add(p9);
            
            Permission p10 = new Permission("Get dish with pagination", "/dish", "GET", "DISH");
            p10.setId(permissionRepository.generateId());
            permissions.add(p10);

            // PERMISSIONS
            Permission p11 = new Permission("Create a permission", "/permissions", "POST", "PERMISSIONS");
            p11.setId(permissionRepository.generateId());
            permissions.add(p11);
            
            Permission p12 = new Permission("Update a permission", "/permissions", "PUT", "PERMISSIONS");
            p12.setId(permissionRepository.generateId());
            permissions.add(p12);
            
            Permission p13 = new Permission("Delete a permission", "/permissions/{id}", "DELETE", "PERMISSIONS");
            p13.setId(permissionRepository.generateId());
            permissions.add(p13);
            
            Permission p14 = new Permission("Get a permission by id", "/permissions/{id}", "GET", "PERMISSIONS");
            p14.setId(permissionRepository.generateId());
            permissions.add(p14);
            
            Permission p15 = new Permission("Get permissions with pagination", "/permissions", "GET", "PERMISSIONS");
            p15.setId(permissionRepository.generateId());
            permissions.add(p15);

            // ROLES
            Permission p16 = new Permission("Create a role", "/roles", "POST", "ROLES");
            p16.setId(permissionRepository.generateId());
            permissions.add(p16);
            
            Permission p17 = new Permission("Update a role", "/roles", "PUT", "ROLES");
            p17.setId(permissionRepository.generateId());
            permissions.add(p17);
            
            Permission p18 = new Permission("Delete a role", "/roles/{id}", "DELETE", "ROLES");
            p18.setId(permissionRepository.generateId());
            permissions.add(p18);
            
            Permission p19 = new Permission("Get a role by id", "/roles/{id}", "GET", "ROLES");
            p19.setId(permissionRepository.generateId());
            permissions.add(p19);
            
            Permission p20 = new Permission("Get roles with pagination", "/roles", "GET", "ROLES");
            p20.setId(permissionRepository.generateId());
            permissions.add(p20);

            // USERS
            Permission p21 = new Permission("Create a user", "/users", "POST", "USERS");
            p21.setId(permissionRepository.generateId());
            permissions.add(p21);
            
            Permission p22 = new Permission("Update a user", "/users", "PUT", "USERS");
            p22.setId(permissionRepository.generateId());
            permissions.add(p22);
            
            Permission p23 = new Permission("Delete a user", "/users/{id}", "DELETE", "USERS");
            p23.setId(permissionRepository.generateId());
            permissions.add(p23);
            
            Permission p24 = new Permission("Get a user by id", "/users/{id}", "GET", "USERS");
            p24.setId(permissionRepository.generateId());
            permissions.add(p24);
            
            Permission p25 = new Permission("Get users with pagination", "/users", "GET", "USERS");
            p25.setId(permissionRepository.generateId());
            permissions.add(p25);

            // CART - chú ý sửa đường dẫn theo base path /cart
            Permission p26 = new Permission("Get cart user", "/cart", "GET", "CART");
            p26.setId(permissionRepository.generateId());
            permissions.add(p26);
            
            Permission p27 = new Permission("Delete cart user", "/cart", "DELETE", "CART");
            p27.setId(permissionRepository.generateId());
            permissions.add(p27);
            
            Permission p28 = new Permission("Add dish to cart", "/cart/add-dish", "POST", "CART_ITEM");
            p28.setId(permissionRepository.generateId());
            permissions.add(p28);
            
            Permission p29 = new Permission("Get all dishes in cart", "/cart/get-all-dish", "GET", "CART_ITEM");
            p29.setId(permissionRepository.generateId());
            permissions.add(p29);
            
            Permission p30 = new Permission("Update dish quantity in cart", "/cart/update-dish", "PUT", "CART_ITEM");
            p30.setId(permissionRepository.generateId());
            permissions.add(p30);
            
            Permission p31 = new Permission("Delete dish from cart", "/cart/delete-dish/{id}", "DELETE", "CART_ITEM");
            p31.setId(permissionRepository.generateId());
            permissions.add(p31);
            
            Permission p32 = new Permission("Check out cart", "/cart/checkout", "POST", "CART_ITEM");
            p32.setId(permissionRepository.generateId());
            permissions.add(p32);
            
            // FILES
            Permission p33 = new Permission("Download a file", "/files", "POST", "FILES");
            p33.setId(permissionRepository.generateId());
            permissions.add(p33);
            
            Permission p34 = new Permission("Upload a file", "/files", "GET", "FILES");
            p34.setId(permissionRepository.generateId());
            permissions.add(p34);

            // ORDER - sửa đường dẫn cho phù hợp controller
            Permission p35 = new Permission("Get orders of current user", "/orders/my", "GET", "ORDER");
            p35.setId(permissionRepository.generateId());
            permissions.add(p35);
            
            Permission p36 = new Permission("Get all orders", "/orders/all", "GET", "ORDER");
            p36.setId(permissionRepository.generateId());
            permissions.add(p36);
            
            Permission p37 = new Permission("Get order by id", "/orders/{id}", "GET", "ORDER");
            p37.setId(permissionRepository.generateId());
            permissions.add(p37);
            
            Permission p38 = new Permission("Update order status", "/orders/status/{id}", "PUT", "ORDER");
            p38.setId(permissionRepository.generateId());
            permissions.add(p38);
            
            Permission p39 = new Permission("Delete order", "/orders/{id}", "DELETE", "ORDER");
            p39.setId(permissionRepository.generateId());
            permissions.add(p39);

            // PAYMENT
            Permission p40 = new Permission("Confirm cash payment", "/api/payment/cash/confirm/{orderId}", "POST", "PAYMENT");
            p40.setId(permissionRepository.generateId());
            permissions.add(p40);
            
            Permission p41 = new Permission("Get order payment info", "/api/payment/order/{orderId}", "GET", "PAYMENT");
            p41.setId(permissionRepository.generateId());
            permissions.add(p41);
            
            Permission p42 = new Permission("Create VNPay payment link", "/api/payment/vnpay/order/{orderId}", "POST", "PAYMENT");
            p42.setId(permissionRepository.generateId());
            permissions.add(p42);
            
            Permission p43 = new Permission("Get VNPay config", "/api/payment/vnpay/config", "GET", "PAYMENT");
            p43.setId(permissionRepository.generateId());
            permissions.add(p43);

            // ANALYTICS
            Permission p44 = new Permission("Analytics overview", "/api/v1/analytics/overview", "GET", "ANALYTICS");
            p44.setId(permissionRepository.generateId());
            permissions.add(p44);

            // INVENTORY MANAGEMENT
            Permission p45 = new Permission("Get inventory stock", "/api/v1/inventory/stock/{dishId}", "GET", "INVENTORY");
            p45.setId(permissionRepository.generateId());
            permissions.add(p45);
            
            Permission p46 = new Permission("Update inventory stock", "/api/v1/inventory/stock/{dishId}", "PUT", "INVENTORY");
            p46.setId(permissionRepository.generateId());
            permissions.add(p46);
            
            Permission p47 = new Permission("Import inventory stock", "/api/v1/inventory/import/{dishId}", "POST", "INVENTORY");
            p47.setId(permissionRepository.generateId());
            permissions.add(p47);
            
            Permission p48 = new Permission("Get inventory info", "/api/v1/inventory/stock/{dishId}", "GET", "INVENTORY");
            p48.setId(permissionRepository.generateId());
            permissions.add(p48);

            // SESSION MANAGEMENT
            Permission p49 = new Permission("Get own sessions", "/api/v1/auth/sessions", "GET", "SESSION");
            p49.setId(permissionRepository.generateId());
            permissions.add(p49);
            
            Permission p50 = new Permission("Logout own session", "/api/v1/auth/sessions/{sessionId}", "DELETE", "SESSION");
            p50.setId(permissionRepository.generateId());
            permissions.add(p50);
            
            // ADMIN SESSION MANAGEMENT
            Permission p51 = new Permission("Get user sessions (Admin)", "/admin/users/{userId}/sessions", "GET", "SESSION");
            p51.setId(permissionRepository.generateId());
            permissions.add(p51);
            
            Permission p52 = new Permission("Logout user session (Admin)", "/admin/users/{userId}/sessions/{sessionId}", "DELETE", "SESSION");
            p52.setId(permissionRepository.generateId());
            permissions.add(p52);
            
            Permission p53 = new Permission("Logout all user sessions (Admin)", "/admin/users/{userId}/sessions", "DELETE", "SESSION");
            p53.setId(permissionRepository.generateId());
            permissions.add(p53);
            
            for (Permission perm : permissions) {
                this.permissionRepository.save(perm);
            }
        } else {
            // Nếu đã có permissions, chỉ thêm các permissions mới cho admin sessions
            List<Permission> newAdminSessionPermissions = new ArrayList<>();
            
            Permission p1 = new Permission("Get user sessions (Admin)", "/admin/users/{userId}/sessions", "GET", "SESSION");
            p1.setId(permissionRepository.generateId());
            newAdminSessionPermissions.add(p1);
            
            Permission p2 = new Permission("Logout user session (Admin)", "/admin/users/{userId}/sessions/{sessionId}", "DELETE", "SESSION");
            p2.setId(permissionRepository.generateId());
            newAdminSessionPermissions.add(p2);
            
            Permission p3 = new Permission("Logout all user sessions (Admin)", "/admin/users/{userId}/sessions", "DELETE", "SESSION");
            p3.setId(permissionRepository.generateId());
            newAdminSessionPermissions.add(p3);
            
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
            List<String> allPermissionIds = allPermissions.stream()
                .map(Permission::getId)
                .collect(Collectors.toList());

            // SUPER_ADMIN: full quyền (bao gồm tất cả inventory management)
            // - Tất cả quyền quản lý: CRUD món ăn, danh mục, user, đơn hàng
            // - Inventory management: nhập kho, cập nhật tồn kho, xem thông tin
            // - POST /api/v1/inventory/import/{dishId} (nhập kho)
            // - PUT /api/v1/inventory/stock/{dishId} (cập nhật tồn kho)
            // - GET /api/v1/inventory/stock/{dishId} (xem thông tin)
            Role adminRole = new Role();
            adminRole.setId(roleRepository.generateId());
            adminRole.setName("SUPER_ADMIN");
            adminRole.setDescription("Admin có toàn quyền - quản lý tất cả tính năng");
            this.roleRepository.save(adminRole);
            this.roleRepository.addPermissionsToRole(adminRole.getId(), allPermissionIds);

            // USER: chỉ mua hàng, xem đơn hàng của mình, thao tác giỏ hàng (KHÔNG có quyền inventory)
            List<String> userPermissionIds = allPermissions.stream()
                    .filter(p -> (p.getApiPath().equals("/orders/my") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/{id}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().startsWith("/cart")) ||
                            (p.getApiPath().equals("/api/payment/order/{orderId}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/order/{orderId}") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/config") && p.getMethod().equals("GET")))
                    .map(Permission::getId)
                    .collect(Collectors.toList());

            Role userRole = new Role();
            userRole.setId(roleRepository.generateId());
            userRole.setName("USER");
            userRole.setDescription("User bình thường - mua hàng và theo dõi đơn hàng của mình");
            this.roleRepository.save(userRole);
            this.roleRepository.addPermissionsToRole(userRole.getId(), userPermissionIds);

            // STAFF: quản lý đơn hàng + nhập kho (chỉ nhập, KHÔNG được sửa/xóa món ăn)
            // - Xem tất cả đơn hàng, cập nhật trạng thái đơn hàng
            // - Nhập kho: POST /api/v1/inventory/import/{dishId}
            // - Xem thông tin tồn kho: GET /api/v1/inventory/stock/{dishId}
            // - Xem danh sách món ăn: GET /dish
            // - KHÔNG có quyền: PUT /api/v1/inventory/stock/{dishId} (cập nhật tồn kho)
            List<String> staffPermissionIds = allPermissions.stream()
                    .filter(p -> (p.getApiPath().equals("/orders/all") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/{id}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/orders/status/{id}") && p.getMethod().equals("PUT")) ||
                            (p.getApiPath().startsWith("/api/v1/inventory/import") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().startsWith("/api/v1/inventory/stock") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().startsWith("/dish") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/cash/confirm/{orderId}") && p.getMethod().equals("POST")) ||
                            (p.getApiPath().equals("/api/payment/order/{orderId}") && p.getMethod().equals("GET")) ||
                            (p.getApiPath().equals("/api/payment/vnpay/order/{orderId}") && p.getMethod().equals("POST")))
                    .map(Permission::getId)
                    .collect(Collectors.toList());

            Role staffRole = new Role();
            staffRole.setId(roleRepository.generateId());
            staffRole.setName("STAFF");
            staffRole.setDescription("Nhân viên quản lý đơn hàng và nhập kho");
            this.roleRepository.save(staffRole);
            this.roleRepository.addPermissionsToRole(staffRole.getId(), staffPermissionIds);
        } else {
            // Cập nhật SUPER_ADMIN role với tất cả permissions (bao gồm permissions mới)
            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            if (adminRole != null) {
                List<Permission> allPermissions = this.permissionRepository.findAll();
                List<String> allPermissionIds = allPermissions.stream()
                    .map(Permission::getId)
                    .collect(Collectors.toList());
                this.roleRepository.addPermissionsToRole(adminRole.getId(), allPermissionIds);
                System.out.println(">>> Updated SUPER_ADMIN role with all permissions (including new admin session permissions)");
            }
        }

        if (countUsers == 0) {
            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            Role userRole = this.roleRepository.findByName("USER");
            Role staffRole = this.roleRepository.findByName("STAFF");

            // SUPER ADMIN
            User adminUser = new User();
            adminUser.setId(userRepository.generateId());
            adminUser.setEmail("admin@gmail.com");
            adminUser.setAddress("HCM");
            adminUser.setGender(GenderEnum.MALE);
            adminUser.setUsername("I'm super admin");
            adminUser.setPassword(this.passwordEncoder.encode("123456"));
            adminUser.setRoleId(adminRole != null ? adminRole.getId() : null);
            this.userRepository.save(adminUser);

            // NORMAL USER
            User normalUser = new User();
            normalUser.setId(userRepository.generateId());
            normalUser.setEmail("user@gmail.com");
            normalUser.setAddress("Hanoi");
            normalUser.setGender(GenderEnum.FEMALE);
            normalUser.setUsername("Normal User");
            normalUser.setPassword(this.passwordEncoder.encode("123456"));
            normalUser.setRoleId(userRole != null ? userRole.getId() : null);
            this.userRepository.save(normalUser);

            // STAFF
            User staffUser = new User();
            staffUser.setId(userRepository.generateId());
            staffUser.setEmail("staff@gmail.com");
            staffUser.setAddress("Da Nang");
            staffUser.setGender(GenderEnum.MALE);
            staffUser.setUsername("Order Manager");
            staffUser.setPassword(this.passwordEncoder.encode("123456"));
            staffUser.setRoleId(staffRole != null ? staffRole.getId() : null);
            this.userRepository.save(staffUser);
        }

        if (countPermissions > 0 && countRoles > 0 && countUsers > 0) {
            System.out.println(">>> SKIP INIT REDIS DATABASE ~ ALREADY HAVE DATA...");
        } else {
            System.out.println(">>> END INIT REDIS DATABASE");
        }
    }
}
