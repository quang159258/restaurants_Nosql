# Hướng dẫn Migration từ MySQL sang Redis làm Database chính

## Tổng quan

Tài liệu này hướng dẫn cách chuyển đổi hệ thống từ MySQL (JPA/Hibernate) sang Redis làm database chính. Redis là NoSQL in-memory database, không có quan hệ (relationships) như SQL, nên cần thiết kế lại cấu trúc dữ liệu.

---

## 1. Domain Entities - Chuyển đổi từ JPA sang Redis Models

### 1.1. Nguyên tắc chuyển đổi

**JPA Entity → Redis Model:**
- ❌ Bỏ `@Entity`, `@Table`, `@Id`, `@GeneratedValue`
- ❌ Bỏ `@OneToMany`, `@ManyToOne`, `@ManyToMany` (không có foreign keys)
- ✅ Giữ lại các field dữ liệu
- ✅ Thêm `@RedisHash` hoặc dùng String keys với prefix
- ✅ Tự quản lý ID (UUID hoặc tự tăng)
- ✅ Lưu quan hệ bằng cách lưu ID thay vì object reference

### 1.2. Cấu trúc Key trong Redis

**Pattern chung:**
```
{entity}:{id}                    // Single entity
{entity}:list                    // List all IDs
{entity}:index:{field}:{value}   // Index for search
{entity}:{id}:{relation}         // Relations
```

**Ví dụ:**
```
user:1                           // User với ID = 1
user:list                        // Set chứa tất cả user IDs
user:index:email:admin@mail.com // Index email → user ID
user:1:orders                    // List order IDs của user 1
dish:5                           // Dish với ID = 5
category:2:dishes                // List dish IDs của category 2
```

### 1.3. Ví dụ chuyển đổi Domain

#### **User.java**

**Trước (JPA):**
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
    
    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}
```

**Sau (Redis):**
```java
// Bỏ @Entity, @Table
// Không cần @RedisHash nếu dùng RedisTemplate
public class User implements Serializable {
    private String id;  // Đổi sang String, tự generate UUID
    
    private String roleId;  // Lưu ID thay vì object
    
    // Không có List<Order>, lưu riêng trong user:{id}:orders
    // private List<Order> orders; ❌
}
```

**Key structure:**
```
user:{userId}                    // User object
user:index:email:{email}         // Email → userId mapping
user:{userId}:orders             // Set/List order IDs
user:{userId}:cart               // Cart ID
```

#### **Dish.java**

**Trước (JPA):**
```java
@Entity
@Table(name = "dishes")
public class Dish {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
}
```

**Sau (Redis):**
```java
public class Dish implements Serializable {
    private String id;  // UUID hoặc tự tăng
    
    private String categoryId;  // Lưu ID thay vì object
}
```

**Key structure:**
```
dish:{dishId}                    // Dish object
dish:list                        // Set tất cả dish IDs
dish:index:category:{categoryId} // Index theo category
category:{categoryId}:dishes     // Set dish IDs của category
```

#### **Order.java**

**Trước (JPA):**
```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "order")
    private List<OrderDetail> orderDetails;
}
```

**Sau (Redis):**
```java
public class Order implements Serializable {
    private String id;
    
    private String userId;  // Lưu ID thay vì object
    
    // Không có List<OrderDetail>, lưu riêng
    // private List<OrderDetail> orderDetails; ❌
}
```

**Key structure:**
```
order:{orderId}                  // Order object
order:list                       // Set tất cả order IDs
order:index:user:{userId}        // Index theo user
order:{orderId}:details          // List OrderDetail IDs
user:{userId}:orders             // Set order IDs của user
```

#### **Cart.java**

**Trước (JPA):**
```java
@Entity
@Table(name = "carts")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "cart")
    private List<CartDetail> cartDetails;
}
```

**Sau (Redis):**
```java
public class Cart implements Serializable {
    private String id;
    
    private String userId;  // Lưu ID thay vì object
    
    // Có thể lưu trực tiếp List<CartDetail> trong Cart object
    // hoặc lưu riêng trong cart:{cartId}:items
    private List<CartDetail> items;  // ✅ Nếu lưu nested
}
```

**Key structure:**
```
cart:{cartId}                    // Cart object (có thể chứa items)
cart:index:user:{userId}          // User → Cart ID mapping
user:{userId}:cart                // Cart ID của user
```

---

## 2. Repository Layer - Chuyển đổi từ JPA Repository sang Redis

### 2.1. Nguyên tắc

**JPA Repository:**
```java
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    List<User> findByRoleId(Long roleId);
}
```

**Redis Repository (dùng RedisTemplate):**
```java
@Repository
public class UserRepository {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String USER_PREFIX = "user:";
    private static final String USER_INDEX_EMAIL = "user:index:email:";
    
    // Save
    public void save(User user) {
        String key = USER_PREFIX + user.getId();
        redisTemplate.opsForValue().set(key, user);
        
        // Update indexes
        if (user.getEmail() != null) {
            redisTemplate.opsForValue().set(
                USER_INDEX_EMAIL + user.getEmail(), 
                user.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add("user:list", user.getId());
    }
    
    // Find by ID
    public Optional<User> findById(String id) {
        String key = USER_PREFIX + id;
        User user = (User) redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(user);
    }
    
    // Find by Email
    public User findByEmail(String email) {
        String userIdKey = USER_INDEX_EMAIL + email;
        String userId = (String) redisTemplate.opsForValue().get(userIdKey);
        if (userId == null) return null;
        return findById(userId).orElse(null);
    }
    
    // Find all
    public List<User> findAll() {
        Set<Object> userIds = redisTemplate.opsForSet().members("user:list");
        List<User> users = new ArrayList<>();
        for (Object id : userIds) {
            findById((String) id).ifPresent(users::add);
        }
        return users;
    }
    
    // Delete
    public void deleteById(String id) {
        User user = findById(id).orElse(null);
        if (user != null) {
            // Delete indexes
            if (user.getEmail() != null) {
                redisTemplate.delete(USER_INDEX_EMAIL + user.getEmail());
            }
            // Delete from list
            redisTemplate.opsForSet().remove("user:list", id);
            // Delete entity
            redisTemplate.delete(USER_PREFIX + id);
        }
    }
}
```

### 2.2. ID Generation

**Tự tăng ID:**
```java
private String generateId(String entityType) {
    String counterKey = entityType + ":counter";
    Long id = redisTemplate.opsForValue().increment(counterKey);
    return String.valueOf(id);
}

// Hoặc dùng UUID
private String generateId() {
    return UUID.randomUUID().toString();
}
```

### 2.3. Quan hệ (Relationships)

**One-to-Many: User → Orders**
```java
// Lưu order IDs vào user
public void addOrderToUser(String userId, String orderId) {
    String key = "user:" + userId + ":orders";
    redisTemplate.opsForSet().add(key, orderId);
}

// Lấy orders của user
public List<Order> findOrdersByUserId(String userId) {
    String key = "user:" + userId + ":orders";
    Set<Object> orderIds = redisTemplate.opsForSet().members(key);
    List<Order> orders = new ArrayList<>();
    for (Object id : orderIds) {
        orderRepository.findById((String) id).ifPresent(orders::add);
    }
    return orders;
}
```

**Many-to-Many: Role → Permissions**
```java
// Lưu permission IDs vào role
public void addPermissionToRole(String roleId, String permissionId) {
    String key = "role:" + roleId + ":permissions";
    redisTemplate.opsForSet().add(key, permissionId);
}

// Lấy permissions của role
public List<Permission> findPermissionsByRoleId(String roleId) {
    String key = "role:" + roleId + ":permissions";
    Set<Object> permissionIds = redisTemplate.opsForSet().members(key);
    // ... tương tự
}
```

### 2.4. Pagination

**JPA Pagination:**
```java
Page<User> findAll(Pageable pageable);
```

**Redis Pagination:**
```java
public List<User> findAll(Pageable pageable) {
    Set<Object> userIds = redisTemplate.opsForSet().members("user:list");
    List<String> sortedIds = userIds.stream()
        .map(String::valueOf)
        .sorted()
        .collect(Collectors.toList());
    
    int page = pageable.getPageNumber();
    int size = pageable.getPageSize();
    int start = page * size;
    int end = Math.min(start + size, sortedIds.size());
    
    List<User> users = new ArrayList<>();
    for (int i = start; i < end; i++) {
        findById(sortedIds.get(i)).ifPresent(users::add);
    }
    return users;
}
```

### 2.5. Search/Filter

**JPA Specification:**
```java
Specification<User> spec = (root, query, cb) -> 
    cb.equal(root.get("email"), email);
```

**Redis Search:**
```java
// Dùng indexes
public List<User> findByEmail(String email) {
    String userId = (String) redisTemplate.opsForValue()
        .get("user:index:email:" + email);
    if (userId == null) return Collections.emptyList();
    return findById(userId).map(Collections::singletonList)
        .orElse(Collections.emptyList());
}

// Hoặc scan keys (chậm hơn)
public List<User> findByEmailPattern(String pattern) {
    Set<String> keys = redisTemplate.keys("user:*");
    List<User> users = new ArrayList<>();
    for (String key : keys) {
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null && user.getEmail().contains(pattern)) {
            users.add(user);
        }
    }
    return users;
}
```

---

## 3. Configuration - Redis Config

### 3.1. Cập nhật RedisConfig

**File: `RedisConfig.java`**
```java
@Configuration
public class RedisConfig {
    
    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;
    
    @Value("${spring.data.redis.port:6379}")
    private int redisPort;
    
    @Value("${spring.data.redis.password:}")
    private String redisPassword;
    
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        if (!redisPassword.isEmpty()) {
            config.setPassword(redisPassword);
        }
        return new LettuceConnectionFactory(config);
    }
    
    @Bean
    public GenericJackson2JsonRedisSerializer redisSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.findAndRegisterModules();
        return new GenericJackson2JsonRedisSerializer(mapper);
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory,
            GenericJackson2JsonRedisSerializer redisSerializer) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(redisSerializer);
        template.setHashValueSerializer(redisSerializer);
        template.setDefaultSerializer(redisSerializer);
        template.afterPropertiesSet();
        return template;
    }
    
    @Bean
    public StringRedisTemplate stringRedisTemplate(
            RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
```

### 3.2. Cập nhật application.properties

**Bỏ MySQL config:**
```properties
# ❌ Bỏ các dòng này
# spring.datasource.url=...
# spring.datasource.username=...
# spring.datasource.password=...
# spring.jpa.hibernate.ddl-auto=...
```

**Giữ Redis config:**
```properties
# ✅ Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
spring.data.redis.timeout=2000ms
spring.data.redis.lettuce.pool.max-active=8
spring.data.redis.lettuce.pool.max-wait=-1ms
spring.data.redis.lettuce.pool.max-idle=8
spring.data.redis.lettuce.pool.min-idle=0

# Bỏ JPA
# spring.jpa.show-sql=false
```

### 3.3. Bỏ JPA Dependencies

**File: `build.gradle.kts`**
```kotlin
dependencies {
    // ❌ Bỏ
    // implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    // runtimeOnly("com.mysql:mysql-connector-j")
    
    // ✅ Giữ
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
}
```

---

## 4. Database Initializer - Chuyển sang Redis

### 4.1. Cập nhật DatabaseInitializer

**File: `DatabaseInitializer.java`**
```java
@Service
public class DatabaseInitializer implements CommandLineRunner {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT REDIS DATABASE");
        
        // Check if data exists
        Long permissionCount = redisTemplate.opsForSet().size("permission:list");
        Long roleCount = redisTemplate.opsForSet().size("role:list");
        Long userCount = redisTemplate.opsForSet().size("user:list");
        
        if (permissionCount == 0) {
            initPermissions();
        }
        
        if (roleCount == 0) {
            initRoles();
        }
        
        if (userCount == 0) {
            initUsers();
        }
        
        System.out.println(">>> END INIT REDIS DATABASE");
    }
    
    private void initPermissions() {
        List<Permission> permissions = new ArrayList<>();
        
        // CATEGORY permissions
        permissions.add(new Permission(
            generateId("permission"),
            "Create a category", "/category", "POST", "CATEGORY"
        ));
        permissions.add(new Permission(
            generateId("permission"),
            "Update a category", "/category", "PUT", "CATEGORY"
        ));
        // ... thêm các permissions khác
        
        for (Permission perm : permissions) {
            permissionRepository.save(perm);
        }
    }
    
    private void initRoles() {
        List<Permission> allPermissions = permissionRepository.findAll();
        List<String> permissionIds = allPermissions.stream()
            .map(Permission::getId)
            .collect(Collectors.toList());
        
        // SUPER_ADMIN
        Role adminRole = new Role();
        adminRole.setId(generateId("role"));
        adminRole.setName("SUPER_ADMIN");
        adminRole.setDescription("Admin có toàn quyền");
        roleRepository.save(adminRole);
        roleRepository.addPermissionsToRole(adminRole.getId(), permissionIds);
        
        // USER
        Role userRole = new Role();
        userRole.setId(generateId("role"));
        userRole.setName("USER");
        userRole.setDescription("User bình thường");
        roleRepository.save(userRole);
        // ... thêm permissions cho USER
        
        // STAFF
        Role staffRole = new Role();
        staffRole.setId(generateId("role"));
        staffRole.setName("STAFF");
        staffRole.setDescription("Nhân viên");
        roleRepository.save(staffRole);
        // ... thêm permissions cho STAFF
    }
    
    private void initUsers() {
        Role adminRole = roleRepository.findByName("SUPER_ADMIN");
        Role userRole = roleRepository.findByName("USER");
        Role staffRole = roleRepository.findByName("STAFF");
        
        // SUPER ADMIN
        User adminUser = new User();
        adminUser.setId(generateId("user"));
        adminUser.setEmail("admin@gmail.com");
        adminUser.setUsername("I'm super admin");
        adminUser.setPassword(passwordEncoder.encode("123456"));
        adminUser.setRoleId(adminRole.getId());
        userRepository.save(adminUser);
        
        // NORMAL USER
        User normalUser = new User();
        normalUser.setId(generateId("user"));
        normalUser.setEmail("user@gmail.com");
        normalUser.setUsername("Normal User");
        normalUser.setPassword(passwordEncoder.encode("123456"));
        normalUser.setRoleId(userRole.getId());
        userRepository.save(normalUser);
        
        // STAFF
        User staffUser = new User();
        staffUser.setId(generateId("user"));
        staffUser.setEmail("staff@gmail.com");
        staffUser.setUsername("Order Manager");
        staffUser.setPassword(passwordEncoder.encode("123456"));
        staffUser.setRoleId(staffRole.getId());
        userRepository.save(staffUser);
    }
    
    private String generateId(String entityType) {
        String counterKey = entityType + ":counter";
        Long id = redisTemplate.opsForValue().increment(counterKey);
        return String.valueOf(id);
    }
}
```

---

## 5. Service Layer - Cập nhật

### 5.1. UserService

**Trước:**
```java
public User handelGetUser(Long id) {
    return userRepository.findById(id).orElse(null);
}
```

**Sau:**
```java
public User handelGetUser(String id) {  // Đổi Long → String
    return userRepository.findById(id).orElse(null);
}
```

### 5.2. OrderService - Xử lý quan hệ

**Trước:**
```java
Order order = new Order();
order.setUser(user);  // Set object
```

**Sau:**
```java
Order order = new Order();
order.setUserId(user.getId());  // Set ID
```

**Lưu quan hệ:**
```java
public Order createOrder(Order order) {
    // Save order
    orderRepository.save(order);
    
    // Lưu quan hệ user → order
    userRepository.addOrderToUser(order.getUserId(), order.getId());
    
    return order;
}
```

---

## 6. Key Naming Convention

### 6.1. Pattern chuẩn

```
{entity}:{id}                    // Entity object
{entity}:list                    // Set/List tất cả IDs
{entity}:counter                 // Counter cho ID generation
{entity}:index:{field}:{value}   // Index cho search
{entity}:{id}:{relation}         // Relations (Set/List IDs)
```

### 6.2. Ví dụ cụ thể

```
# Users
user:1                           // User object
user:list                        // Set user IDs
user:counter                     // Counter
user:index:email:admin@mail.com  // Email index
user:1:orders                    // Set order IDs
user:1:cart                      // Cart ID

# Dishes
dish:5                           // Dish object
dish:list                        // Set dish IDs
dish:index:category:2            // Index by category
category:2:dishes                // Set dish IDs

# Orders
order:10                         // Order object
order:list                       // Set order IDs
order:index:user:1               // Index by user
order:10:details                 // List OrderDetail IDs

# Carts
cart:3                           // Cart object (có thể chứa items)
cart:index:user:1                // User → Cart mapping
```

---

## 7. Migration Strategy

### 7.1. Bước 1: Chuẩn bị

1. Backup MySQL database
2. Setup Redis cluster (nếu production)
3. Tạo Redis models mới
4. Tạo Redis repositories mới

### 7.2. Bước 2: Dual Write (Tạm thời)

```java
@Repository
public class UserRepository {
    private final JpaUserRepository jpaRepo;  // Cũ
    private final RedisUserRepository redisRepo;  // Mới
    
    public void save(User user) {
        // Write to both
        jpaRepo.save(user);  // MySQL
        redisRepo.save(user);  // Redis
    }
}
```

### 7.3. Bước 3: Migrate Data

```java
@Service
public class DataMigrationService {
    public void migrateUsers() {
        List<User> users = jpaUserRepository.findAll();
        for (User user : users) {
            // Convert JPA entity → Redis model
            User redisUser = convertToRedisModel(user);
            redisUserRepository.save(redisUser);
        }
    }
}
```

### 7.4. Bước 4: Switch Read

```java
@Repository
public class UserRepository {
    @Value("${app.use-redis:false}")
    private boolean useRedis;
    
    public User findById(String id) {
        if (useRedis) {
            return redisRepo.findById(id);
        } else {
            return jpaRepo.findById(Long.parseLong(id));
        }
    }
}
```

### 7.5. Bước 5: Full Redis

1. Bỏ JPA repositories
2. Bỏ MySQL dependencies
3. Update all services
4. Test thoroughly

---

## 8. Lưu ý quan trọng

### 8.1. Transactions

Redis không hỗ trợ ACID transactions như SQL. Cần:
- Dùng Redis Transactions (MULTI/EXEC) cho atomic operations
- Hoặc implement compensation logic

### 8.2. Data Persistence

Redis là in-memory, cần config persistence:
```properties
# Redis persistence
save 900 1
save 300 10
save 60 10000
```

### 8.3. Memory Management

- Monitor memory usage
- Set maxmemory policy
- Use Redis eviction policies

### 8.4. Relationships

- Không có foreign key constraints
- Phải tự quản lý referential integrity
- Cần cleanup khi delete (xóa cả relations)

### 8.5. Complex Queries

- Không có JOIN
- Phải fetch multiple keys
- Cân nhắc denormalization

---

## 9. Checklist Migration

- [ ] Tạo Redis models cho tất cả entities
- [ ] Tạo Redis repositories
- [ ] Update RedisConfig
- [ ] Update application.properties
- [ ] Update DatabaseInitializer
- [ ] Update Services (đổi Long → String cho IDs)
- [ ] Migrate data từ MySQL
- [ ] Test tất cả APIs
- [ ] Bỏ JPA dependencies
- [ ] Bỏ MySQL config
- [ ] Deploy và monitor

---

## 10. Tài liệu tham khảo

- [Spring Data Redis](https://spring.io/projects/spring-data-redis)
- [Redis Documentation](https://redis.io/documentation)
- [Redis Data Types](https://redis.io/docs/data-types/)

