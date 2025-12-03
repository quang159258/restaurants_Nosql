# Redis Data Structure Documentation

## Tổng quan

Tài liệu này mô tả cách lưu trữ dữ liệu trong Redis cho hệ thống Restaurant, bao gồm các key patterns, cấu trúc dữ liệu, và mối quan hệ giữa các entities dựa trên implementation thực tế.

### Danh sách Models trong hệ thống

Hệ thống sử dụng **9 models chính** được lưu trữ trong Redis:

1. **User** - Người dùng hệ thống
2. **Role** - Vai trò người dùng (ADMIN, USER, etc.)
3. **Permission** - Quyền truy cập API
4. **Category** - Danh mục món ăn
5. **Dish** - Món ăn
6. **Cart** - Giỏ hàng
7. **CartDetail** - Chi tiết món trong giỏ hàng
8. **Order** - Đơn hàng
9. **OrderDetail** - Chi tiết món trong đơn hàng

### Tổng quan về Key Patterns

Tất cả keys trong Redis tuân theo pattern nhất quán:
- **Entity keys:** `{entity}:{id}` - Lưu trữ object chính (dùng String value với JSON serialization)
- **List keys:** `{entity}:list` - Set chứa tất cả IDs
- **Counter keys:** `{entity}:counter` - Counter để generate ID tự động (INCR)
- **Index keys:** `{entity}:index:{field}:{value}` - Index để tìm nhanh
- **Relation keys:** `{entity}:{id}:{relation}` - Set chứa IDs của quan hệ

## 1. Key Naming Convention

### 1.1. Quy tắc đặt tên key

Redis keys trong hệ thống tuân theo pattern: `{entity}:{identifier}` hoặc `{entity}:{identifier}:{sub-entity}`

**Format chung:**
```
{entity}:{id}
```

**Ví dụ:**
- `cart:{cartId}` - Giỏ hàng
- `cartDetail:{cartDetailId}` - Chi tiết món trong giỏ hàng
- `order:{orderId}` - Đơn hàng
- `user:{userId}` - Thông tin user

### 1.2. Key Patterns chi tiết

| Entity | Key Pattern | Ví dụ | Mô tả |
|--------|-------------|-------|-------|
| User | `user:{userId}` | `user:123` | Thông tin user |
| Role | `role:{roleId}` | `role:1` | Vai trò người dùng |
| Permission | `permission:{permissionId}` | `permission:1` | Quyền truy cập |
| Category | `category:{categoryId}` | `category:1` | Danh mục món ăn |
| Dish | `dish:{dishId}` | `dish:789` | Món ăn |
| Cart | `cart:{cartId}` | `cart:123` | Giỏ hàng |
| CartDetail | `cartDetail:{cartDetailId}` | `cartDetail:456` | Chi tiết món trong giỏ hàng |
| Order | `order:{orderId}` | `order:789` | Đơn hàng |
| OrderDetail | `orderDetail:{orderDetailId}` | `orderDetail:101` | Chi tiết món trong đơn hàng |

### 1.3. Index và List Keys

| Mục đích | Key Pattern | Ví dụ | Mô tả |
|----------|-------------|-------|-------|
| List tất cả IDs | `{entity}:list` | `user:list`, `dish:list` | Set chứa tất cả IDs của entity |
| Counter (auto-increment) | `{entity}:counter` | `user:counter`, `dish:counter` | Counter để generate ID (INCR) |
| Index theo field | `{entity}:index:{field}:{value}` | `user:index:email:abc@xyz.com` | Index để tìm nhanh theo field |
| **Cart Index** | `cart:index:user:{userId}` | `cart:index:user:123` | Tìm cartId theo userId (String value) |
| **Cart User Index** | `user:{userId}:cart` | `user:123:cart` | Tìm cartId theo userId (String value) |
| **Cart Items Index** | `cart:{cartId}:items` | `cart:123:items` | Set chứa cartDetailIds của cart |
| **CartDetail Index** | `cartDetail:index:cart:{cartId}` | `cartDetail:index:cart:123` | Set chứa cartDetailIds của cart |
| **Order User Index** | `order:index:user:{userId}` | `order:index:user:123` | Set chứa orderIds của user |
| **User Orders Index** | `user:{userId}:orders` | `user:123:orders` | Set chứa orderIds của user |
| **Order Payment Ref Index** | `order:index:paymentRef:{paymentRef}` | `order:index:paymentRef:VNPAY123` | Tìm orderId theo paymentRef |
| **Order Details Index** | `order:{orderId}:details` | `order:789:details` | Set chứa orderDetailIds của order |
| **OrderDetail Index** | `orderDetail:index:order:{orderId}` | `orderDetail:index:order:789` | Set chứa orderDetailIds của order |
| Quan hệ Role-Permission | `role:{roleId}:permissions` | `role:1:permissions` | Set chứa permissionIds của role |
| Quan hệ Category-Dish | `category:{categoryId}:dishes` | `category:1:dishes` | Set chứa dishIds của category |
| Index Dish theo Category | `dish:index:category:{categoryId}` | `dish:index:category:1` | Set chứa dishIds của category |

## 2. Cấu trúc dữ liệu

### 2.1. Cart (Giỏ hàng)

**Key:** `cart:{cartId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Cart {
    private String id;
    private String userId;
    private List<CartDetail> items;  // Transient - loaded separately
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}
```

**Redis Storage:**
- Entity: `cart:{cartId}` → JSON serialized Cart object
- Index: `cart:index:user:{userId}` → cartId (String value)
- Index: `user:{userId}:cart` → cartId (String value)
- Counter: `cart:counter` → Auto-increment ID

**Quan hệ:**
- Một User có một Cart (1:1) - tìm qua `cart:index:user:{userId}`
- Một Cart có nhiều CartDetail (1:N) - tìm qua `cart:{cartId}:items` (Set)

**Operations:**
```redis
# Tạo Cart
SET cart:123 '{"id":"123","userId":"user_456",...}'
SET cart:index:user:user_456 "123"
SET user:user_456:cart "123"

# Lấy Cart theo userId
GET cart:index:user:user_456  # → "123"
GET cart:123  # → Cart object

# Lấy items của Cart
SMEMBERS cart:123:items  # → Set of cartDetailIds
```

### 2.2. CartDetail (Chi tiết giỏ hàng)

**Key:** `cartDetail:{cartDetailId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class CartDetail {
    private String id;
    private String cartId;
    private String dishId;
    private long quantity;
    private double price;
    private double total;
}
```

**Redis Storage:**
- Entity: `cartDetail:{cartDetailId}` → JSON serialized CartDetail object
- Index: `cart:{cartId}:items` → Set chứa cartDetailIds
- Index: `cartDetail:index:cart:{cartId}` → Set chứa cartDetailIds (duplicate)
- List: `cartDetail:list` → Set chứa tất cả cartDetailIds
- Counter: `cartDetail:counter` → Auto-increment ID

**Quan hệ:**
- Một CartDetail thuộc về một Cart (N:1) - lưu qua `cartId`
- Một CartDetail tham chiếu đến một Dish (N:1) - lưu qua `dishId`

**Operations:**
```redis
# Tạo CartDetail
SET cartDetail:456 '{"id":"456","cartId":"123","dishId":"dish_789",...}'
SADD cart:123:items "456"
SADD cartDetail:index:cart:123 "456"
SADD cartDetail:list "456"

# Lấy tất cả CartDetails của Cart
SMEMBERS cart:123:items  # → ["456", "457", ...]
GET cartDetail:456  # → CartDetail object
GET cartDetail:457  # → CartDetail object
```

### 2.3. Order (Đơn hàng)

**Key:** `order:{orderId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Order {
    private String id;
    private String userId;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String receiverEmail;
    private double totalPrice;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentRef;
    private Instant createdAt;
    private Instant updatedAt;
    // Transient fields (not stored in Redis)
    private transient User user;
    private transient List<OrderDetail> orderItems;
}
```

**Redis Storage:**
- Entity: `order:{orderId}` → JSON serialized Order object
- Index: `order:index:user:{userId}` → Set chứa orderIds
- Index: `user:{userId}:orders` → Set chứa orderIds (duplicate)
- Index: `order:index:paymentRef:{paymentRef}` → orderId (String value)
- List: `order:list` → Set chứa tất cả orderIds
- Counter: `order:counter` → Auto-increment ID

**Quan hệ:**
- Một Order thuộc về một User (N:1) - lưu qua `userId`
- Một Order có nhiều OrderDetail (1:N) - tìm qua `order:{orderId}:details` (Set)

**Operations:**
```redis
# Tạo Order
SET order:789 '{"id":"789","userId":"user_123","status":"PENDING",...}'
SADD order:index:user:user_123 "789"
SADD user:user_123:orders "789"
SADD order:list "789"

# Lấy Orders của User
SMEMBERS user:user_123:orders  # → ["789", "790", ...]
GET order:789  # → Order object

# Tìm Order theo paymentRef (VNPay)
SET order:index:paymentRef:VNPAY123 "789"
GET order:index:paymentRef:VNPAY123  # → "789"
GET order:789  # → Order object
```

### 2.4. OrderDetail (Chi tiết đơn hàng)

**Key:** `orderDetail:{orderDetailId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class OrderDetail {
    private String id;
    private String orderId;
    private String dishId;
    private long quantity;
    private double price;
    // Transient fields (not stored in Redis)
    private transient String dishName;
}
```

**Redis Storage:**
- Entity: `orderDetail:{orderDetailId}` → JSON serialized OrderDetail object
- Index: `order:{orderId}:details` → Set chứa orderDetailIds
- Index: `orderDetail:index:order:{orderId}` → Set chứa orderDetailIds (duplicate)
- List: `orderDetail:list` → Set chứa tất cả orderDetailIds
- Counter: `orderDetail:counter` → Auto-increment ID

**Quan hệ:**
- Một OrderDetail thuộc về một Order (N:1) - lưu qua `orderId`
- Một OrderDetail tham chiếu đến một Dish (N:1) - lưu qua `dishId`

**Operations:**
```redis
# Tạo OrderDetail
SET orderDetail:101 '{"id":"101","orderId":"789","dishId":"dish_789",...}'
SADD order:789:details "101"
SADD orderDetail:index:order:789 "101"
SADD orderDetail:list "101"

# Lấy tất cả OrderDetails của Order
SMEMBERS order:789:details  # → ["101", "102", ...]
GET orderDetail:101  # → OrderDetail object
GET orderDetail:102  # → OrderDetail object
```

### 2.5. User (Người dùng)

**Key:** `user:{userId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class User {
    private String id;
    private String username;
    private String email;
    private String password;  // Hashed
    private String phone;
    private String address;
    private String refreshToken;  // For JWT refresh
    private GenderEnum gender;  // MALE, FEMALE, OTHER
    private String roleId;  // Reference to Role
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    // Transient field (not stored in Redis)
    private transient Role role;
}
```

**Redis Storage:**
- Entity: `user:{userId}` → JSON serialized User object
- Index: `user:index:email:{email}` → userId (String value)
- List: `user:list` → Set chứa tất cả userIds
- Counter: `user:counter` → Auto-increment ID

**Quan hệ:**
- Một User có một Role (N:1) - lưu qua `roleId`, load từ `RoleRepository.findById()`
- Một User có một Cart (1:1) - tìm qua `cart:index:user:{userId}`
- Một User có nhiều Order (1:N) - tìm qua `user:{userId}:orders` (Set)

**Operations:**
```redis
# Tạo User
INCR user:counter  # → 123
SET user:123 '{"id":"123","username":"user@example.com","email":"user@example.com",...}'
SET user:index:email:user@example.com "123"
SADD user:list "123"

# Tìm User theo email
GET user:index:email:user@example.com  # → "123"
GET user:123  # → User object

# Lấy Role của User
GET user:123  # → lấy roleId = "role_1"
GET role:role_1  # → Role object
```

### 2.6. Dish (Món ăn)

**Key:** `dish:{dishId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Dish {
    private String id;
    private String name;
    private String description;
    private double price;
    private String imageUrl;
    private String categoryId;  // Reference to Category
    private Integer stock;
    private Integer soldToday;
    private Boolean available;
    private Instant createdAt;
    private Instant updatedAt;
}
```

**Redis Storage:**
- Entity: `dish:{dishId}` → JSON serialized Dish object
- Index: `dish:index:category:{categoryId}` → Set chứa dishIds
- Index: `category:{categoryId}:dishes` → Set chứa dishIds (duplicate)
- List: `dish:list` → Set chứa tất cả dishIds
- Counter: `dish:counter` → Auto-increment ID

**Quan hệ:**
- Một Dish thuộc về một Category (N:1) - lưu qua `categoryId`
- Một Dish có trong nhiều CartDetail (1:N) - tham chiếu ngược
- Một Dish có trong nhiều OrderDetail (1:N) - tham chiếu ngược

### 2.7. Category (Danh mục)

**Key:** `category:{categoryId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Category {
    private String id;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}
```

**Redis Storage:**
- Entity: `category:{categoryId}` → JSON serialized Category object
- List: `category:list` → Set chứa tất cả categoryIds
- Counter: `category:counter` → Auto-increment ID

**Quan hệ:**
- Một Category có nhiều Dish (1:N) - tìm qua `category:{categoryId}:dishes` (Set) hoặc `dish:index:category:{categoryId}` (Set)

**Operations:**
```redis
# Tạo Category
INCR category:counter  # → 1
SET category:1 '{"id":"1","name":"Món Chính",...}'
SADD category:list "1"

# Lấy Dishes của Category
SMEMBERS category:1:dishes  # → ["dish_789", "dish_790"]
MGET dish:dish_789 dish:dish_790  # → Dish objects
```

### 2.8. Role (Vai trò)

**Key:** `role:{roleId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Role {
    private String id;
    private String name;  // ADMIN, USER, STAFF, etc.
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    // Transient fields (not stored in Redis)
    private transient List<String> permissionIds;
    private transient List<Permission> permissions;
}
```

**Redis Storage:**
- Entity: `role:{roleId}` → JSON serialized Role object
- Index: `role:index:name:{name}` → roleId (String value)
- Index: `role:{roleId}:permissions` → Set chứa permissionIds
- List: `role:list` → Set chứa tất cả roleIds
- Counter: `role:counter` → Auto-increment ID

**Quan hệ:**
- Một Role có nhiều Permission (M:N) - lưu qua Set `role:{roleId}:permissions`
- Một Role có nhiều User (1:N) - tham chiếu ngược qua `user.roleId`

**Operations:**
```redis
# Tạo Role
INCR role:counter  # → 1
SET role:1 '{"id":"1","name":"ADMIN",...}'
SET role:index:name:ADMIN "1"
SADD role:list "1"

# Gán Permissions cho Role
SADD role:1:permissions "permission_1" "permission_2" "permission_3"

# Lấy Permissions của Role
SMEMBERS role:1:permissions  # → ["permission_1", "permission_2", "permission_3"]
MGET permission:permission_1 permission:permission_2  # → Permission objects
```

### 2.9. Permission (Quyền)

**Key:** `permission:{permissionId}`

**Data Type:** String (JSON serialized object)

**Cấu trúc Model:**
```java
public class Permission {
    private String id;
    private String name;  // "View Users", "Create Order", etc.
    private String apiPath;  // "/api/users", "/cart/checkout", etc.
    private String method;  // GET, POST, PUT, DELETE
    private String module;  // USER, ORDER, CART, etc.
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}
```

**Redis Storage:**
- Entity: `permission:{permissionId}` → JSON serialized Permission object
- List: `permission:list` → Set chứa tất cả permissionIds
- Counter: `permission:counter` → Auto-increment ID

**Quan hệ:**
- Một Permission thuộc về nhiều Role (M:N) - tham chiếu ngược qua `role:{roleId}:permissions`

**Operations:**
```redis
# Tạo Permission
INCR permission:counter  # → 1
SET permission:1 '{"id":"1","name":"View Users","apiPath":"/api/users","method":"GET",...}'
SADD permission:list "1"

# Tìm Roles có Permission này (query ngược)
# Cần scan tất cả roles và check SMEMBERS role:{roleId}:permissions
```

## 3. Mối quan hệ giữa các entities

### 3.1. Sơ đồ quan hệ tổng thể

```
                    Role (1) ──────< (N) User
                      │
                      │ (M:N)
                      │
                      ▼
                Permission (M)

User (1) ──────< (1) Cart
                      │
                      │ (1:N)
                      │
                      ▼
                CartDetail (N) ────> (N:1) Dish ────> (N:1) Category
                      │
                      │ (Khi checkout)
                      │
                      ▼
                Order (1) ──────< (N) User
                      │
                      │ (1:N)
                      │
                      ▼
                OrderDetail (N) ────> (N:1) Dish
```

### 3.2. Cách lưu trữ quan hệ trong Redis

#### Quan hệ 1:1 (User - Cart)
- **User → Cart:** 
  - Index: `cart:index:user:{userId}` → cartId (String)
  - Index: `user:{userId}:cart` → cartId (String)
- **Cart → User:** Lưu `userId` trong Cart object

**Redis Operations:**
```redis
# Lưu Cart với userId
SET cart:123 '{"id":"123","userId":"user_456",...}'
SET cart:index:user:user_456 "123"
SET user:user_456:cart "123"

# Lấy Cart của User
GET cart:index:user:user_456  # → "123"
GET cart:123  # → Cart object
```

#### Quan hệ 1:N (Cart - CartDetail)
- **Cart → CartDetail:** 
  - Set: `cart:{cartId}:items` → Set chứa cartDetailIds
  - Set: `cartDetail:index:cart:{cartId}` → Set chứa cartDetailIds (duplicate)
- **CartDetail → Cart:** Lưu `cartId` trong CartDetail object

**Redis Operations:**
```redis
# Lưu CartDetail
SET cartDetail:456 '{"id":"456","cartId":"123","dishId":"dish_789",...}'
SADD cart:123:items "456"
SADD cartDetail:index:cart:123 "456"

# Lấy CartDetails của Cart
SMEMBERS cart:123:items  # → ["456", "457"]
MGET cartDetail:456 cartDetail:457  # → CartDetail objects
```

#### Quan hệ 1:N (User - Order)
- **User → Order:** 
  - Set: `order:index:user:{userId}` → Set chứa orderIds
  - Set: `user:{userId}:orders` → Set chứa orderIds (duplicate)
- **Order → User:** Lưu `userId` trong Order object

**Redis Operations:**
```redis
# Lưu Order với userId
SET order:789 '{"id":"789","userId":"user_123",...}'
SADD order:index:user:user_123 "789"
SADD user:user_123:orders "789"

# Lấy orders của User
SMEMBERS user:user_123:orders  # → ["789", "790"]
MGET order:789 order:790  # → Order objects
```

#### Quan hệ 1:N (Order - OrderDetail)
- **Order → OrderDetail:** 
  - Set: `order:{orderId}:details` → Set chứa orderDetailIds
  - Set: `orderDetail:index:order:{orderId}` → Set chứa orderDetailIds (duplicate)
- **OrderDetail → Order:** Lưu `orderId` trong OrderDetail object

**Redis Operations:**
```redis
# Lưu OrderDetail
SET orderDetail:101 '{"id":"101","orderId":"789","dishId":"dish_789",...}'
SADD order:789:details "101"
SADD orderDetail:index:order:789 "101"

# Lấy OrderDetails của Order
SMEMBERS order:789:details  # → ["101", "102"]
MGET orderDetail:101 orderDetail:102  # → OrderDetail objects
```

#### Quan hệ N:1 (User - Role)
- **User → Role:** Lưu `roleId` trong User object
- **Role → User:** Tham chiếu ngược qua query `user.roleId = {roleId}`

**Redis Operations:**
```redis
# Lưu User với roleId
SET user:123 '{"id":"123","roleId":"role_1",...}'

# Lấy Role của User
GET user:123  # → lấy roleId = "role_1"
GET role:role_1  # → Role object

# Lấy Permissions của User (qua Role)
SMEMBERS role:role_1:permissions  # → permissionIds
MGET permission:permission_1 permission:permission_2  # → Permission objects
```

#### Quan hệ M:N (Role - Permission)
- **Role → Permission:** 
  - Set: `role:{roleId}:permissions` → Set chứa permissionIds
- **Permission → Role:** Tham chiếu ngược qua query (scan tất cả roles)

**Redis Operations:**
```redis
# Gán Permissions cho Role
SADD role:1:permissions "permission_1" "permission_2" "permission_3"

# Lấy Permissions của Role
SMEMBERS role:1:permissions  # → ["permission_1", "permission_2", "permission_3"]
MGET permission:permission_1 permission:permission_2 permission:permission_3

# Kiểm tra Role có Permission không
SISMEMBER role:1:permissions "permission_1"  # → 1 (true) hoặc 0 (false)
```

#### Quan hệ N:1 (Dish - Category)
- **Dish → Category:** Lưu `categoryId` trong Dish object
- **Category → Dish:** 
  - Set: `category:{categoryId}:dishes` → Set chứa dishIds
  - Set: `dish:index:category:{categoryId}` → Set chứa dishIds (duplicate)

**Redis Operations:**
```redis
# Lưu Dish với categoryId
SET dish:789 '{"id":"dish_789","categoryId":"category_1",...}'
SADD category:category_1:dishes "dish_789"
SADD dish:index:category:category_1 "dish_789"

# Lấy Category từ Dish
GET dish:dish_789  # → lấy categoryId = "category_1"
GET category:category_1  # → Category object

# Lấy Dishes của Category
SMEMBERS category:category_1:dishes  # → ["dish_789", "dish_790"]
MGET dish:dish_789 dish:dish_790  # → Dish objects
```

#### Quan hệ N:1 (CartDetail - Dish, OrderDetail - Dish)
- **CartDetail → Dish:** Lưu `dishId` trong CartDetail object
- **OrderDetail → Dish:** Lưu `dishId` trong OrderDetail object
- **Dish → CartDetail/OrderDetail:** Tham chiếu ngược qua query (nếu cần)

**Redis Operations:**
```redis
# Lưu CartDetail với dishId
SET cartDetail:456 '{"id":"456","dishId":"dish_789",...}'

# Lấy Dish từ CartDetail
GET cartDetail:456  # → lấy dishId = "dish_789"
GET dish:dish_789  # → Dish object
```

## 4. Serialization và Data Format

### 4.1. Serialization Strategy

Hệ thống sử dụng **Jackson JSON serialization** với `GenericJackson2JsonRedisSerializer`:

```java
// RedisConfig.java
@Bean
public RedisTemplate<String, Object> redisTemplate(...) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setValueSerializer(redisSerializer);  // GenericJackson2JsonRedisSerializer
    template.setKeySerializer(new StringRedisSerializer());
    // ...
}
```

**Đặc điểm:**
- Keys: Serialized as String
- Values: Serialized as JSON string
- Supports Java types: String, Number, Boolean, Instant, Enum, Collections
- Transient fields: Không được lưu vào Redis

### 4.2. Data Type trong Redis

| Redis Data Type | Usage | Example |
|----------------|-------|---------|
| **String** | Entity objects (JSON) | `cart:123` → `{"id":"123",...}` |
| **String** | Index values | `cart:index:user:456` → `"123"` |
| **Set** | List of IDs | `cart:123:items` → `{"456", "457"}` |
| **Set** | Index sets | `order:index:user:123` → `{"789", "790"}` |
| **String** | Counter | `cart:counter` → `"123"` (INCR) |

## 5. Operations thường dùng

### 5.1. Thêm món vào giỏ hàng

```redis
# 1. Lấy hoặc tạo Cart
GET cart:index:user:user_123  # → "cart_123" hoặc null
# Nếu null, tạo mới:
INCR cart:counter  # → 123
SET cart:123 '{"id":"123","userId":"user_123",...}'
SET cart:index:user:user_123 "123"

# 2. Tạo CartDetail
INCR cartDetail:counter  # → 456
SET cartDetail:456 '{"id":"456","cartId":"123","dishId":"dish_789","quantity":2,...}'
SADD cart:123:items "456"
SADD cartDetail:index:cart:123 "456"
SADD cartDetail:list "456"

# 3. Invalidate cache (nếu có)
DEL cache:cart:user_123
```

### 5.2. Cập nhật số lượng

```redis
# 1. Lấy CartDetail
GET cartDetail:456  # → CartDetail object

# 2. Cập nhật
SET cartDetail:456 '{"id":"456","quantity":3,"total":150000,...}'

# 3. Invalidate cache
DEL cache:cart:user_123
```

### 5.3. Xóa món khỏi giỏ hàng

```redis
# 1. Xóa khỏi Set items
SREM cart:123:items "456"
SREM cartDetail:index:cart:123 "456"
SREM cartDetail:list "456"

# 2. Xóa CartDetail
DEL cartDetail:456

# 3. Invalidate cache
DEL cache:cart:user_123
```

### 5.4. Checkout (Tạo Order từ Cart)

```redis
# 1. Lấy Cart và CartDetails
GET cart:index:user:user_123  # → "123"
GET cart:123  # → Cart object
SMEMBERS cart:123:items  # → ["456", "457"]
MGET cartDetail:456 cartDetail:457  # → CartDetail objects

# 2. Tạo Order
INCR order:counter  # → 789
SET order:789 '{"id":"789","userId":"user_123","status":"PENDING",...}'
SADD order:index:user:user_123 "789"
SADD user:user_123:orders "789"
SADD order:list "789"

# 3. Tạo OrderDetails
INCR orderDetail:counter  # → 101
SET orderDetail:101 '{"id":"101","orderId":"789","dishId":"dish_789",...}'
SADD order:789:details "101"
SADD orderDetail:index:order:789 "101"
SADD orderDetail:list "101"

# 4. Xóa Cart và CartDetails
DEL cart:123
DEL cart:index:user:user_123
DEL user:user_123:cart
# Xóa từng CartDetail
SREM cart:123:items "456" "457"
SREM cartDetail:index:cart:123 "456" "457"
SREM cartDetail:list "456" "457"
DEL cartDetail:456
DEL cartDetail:457

# 5. Invalidate cache
DEL cache:cart:user_123
```

### 5.5. Query Operations

#### Tìm Cart của User
```redis
GET cart:index:user:user_123  # → "123"
GET cart:123  # → Cart object
SMEMBERS cart:123:items  # → CartDetail IDs
```

#### Tìm Orders của User
```redis
SMEMBERS user:user_123:orders  # → ["789", "790"]
MGET order:789 order:790  # → Order objects
```

#### Tìm OrderDetails của Order
```redis
SMEMBERS order:789:details  # → ["101", "102"]
MGET orderDetail:101 orderDetail:102  # → OrderDetail objects
```

#### Tìm Order theo PaymentRef (VNPay callback)
```redis
GET order:index:paymentRef:VNPAY123  # → "789"
GET order:789  # → Order object
```

## 6. Best Practices

### 6.1. Key Naming
- ✅ Sử dụng namespace rõ ràng: `cart:`, `order:`, `user:`
- ✅ Sử dụng separator nhất quán: dấu `:`
- ✅ Tránh key quá dài
- ✅ Sử dụng ID có ý nghĩa hoặc auto-increment

### 6.2. Data Structure Selection
- **String (JSON):** Cho objects có nhiều fields (Cart, Order, User, Dish)
- **Set:** Cho danh sách IDs, indexes
- **String (Counter):** Cho auto-increment ID (INCR)

### 6.3. Index Management
- **Duplicate indexes:** Một số index được duplicate để query nhanh hơn
  - `cart:index:user:{userId}` và `user:{userId}:cart`
  - `order:index:user:{userId}` và `user:{userId}:orders`
- **Set indexes:** Dùng Set để lưu danh sách IDs cho quan hệ 1:N
- **String indexes:** Dùng String để lưu single value cho quan hệ 1:1

### 6.4. Transaction và Atomicity
- Sử dụng `MULTI/EXEC` cho các operations liên quan
- Sử dụng `WATCH` để đảm bảo consistency
- Đảm bảo tất cả indexes được cập nhật khi save/delete

### 6.5. Memory Management
- Xóa dữ liệu không cần thiết (Cart sau khi checkout)
- Sử dụng TTL cho cache (nếu có)
- Monitor memory usage

### 6.6. Transient Fields
- Fields được đánh dấu `transient` không được lưu vào Redis
- Load lại từ repository khi cần:
  - `Cart.items` → Load từ `CartDetailRepository.findAllByCartId()`
  - `Order.orderItems` → Load từ `OrderDetailRepository.findByOrderId()`

## 7. Flow thực tế

### 7.1. Flow thêm món vào giỏ hàng

```
1. User request: POST /cart/add-dish
   - Input: {dishId, quantity}

2. Backend operations:
   a. Lấy userId từ authentication
   b. Lấy hoặc tạo Cart: 
      - GET cart:index:user:{userId}
      - Nếu null: INCR cart:counter, SET cart:{id}, SET cart:index:user:{userId}
   c. Tạo CartDetail mới:
      - INCR cartDetail:counter
      - SET cartDetail:{id} với cartId, dishId, quantity, price, total
      - SADD cart:{cartId}:items {cartDetailId}
      - SADD cartDetail:index:cart:{cartId} {cartDetailId}
   d. Invalidate cache: DEL cache:cart:{userId}

3. Response: CartDetail đã tạo
```

### 7.2. Flow checkout

```
1. User request: POST /cart/checkout
   - Input: {receiverName, receiverPhone, receiverAddress, receiverEmail, paymentMethod}

2. Backend operations:
   a. Lấy Cart: GET cart:index:user:{userId} → GET cart:{cartId}
   b. Validate Cart có items: SMEMBERS cart:{cartId}:items
   c. Tạo Order mới:
      - INCR order:counter
      - SET order:{orderId} với userId, receiver info, status=PENDING
      - SADD order:index:user:{userId} {orderId}
      - SADD user:{userId}:orders {orderId}
   d. Tạo OrderDetails:
      - Với mỗi CartDetail:
        - INCR orderDetail:counter
        - SET orderDetail:{id} với orderId, dishId, quantity, price
        - SADD order:{orderId}:details {orderDetailId}
   e. Xóa Cart và CartDetails:
      - DEL cart:{cartId}
      - DEL cart:index:user:{userId}
      - SMEMBERS cart:{cartId}:items → DEL từng cartDetail
   f. Invalidate cache: DEL cache:cart:{userId}

3. Response: Order ID và payment URL (nếu VNPay)
```

### 7.3. Flow VNPay Payment Callback

```
1. VNPay callback: POST /payment/vnpay/callback
   - Input: paymentRef từ VNPay

2. Backend operations:
   a. Tìm Order theo paymentRef:
      - GET order:index:paymentRef:{paymentRef} → orderId
      - GET order:{orderId}
   b. Cập nhật Order status và paymentStatus
   c. SET order:{orderId} với status mới

3. Response: Redirect to frontend
```

## 8. Monitoring và Debugging

### 8.1. Kiểm tra keys

```bash
# Tìm tất cả keys của cart
KEYS cart:*

# Tìm cart của user cụ thể
KEYS cart:index:user:*

# Đếm số lượng keys
DBSIZE

# Kiểm tra TTL của key (nếu có)
TTL cart:123
```

### 8.2. Kiểm tra dữ liệu

```bash
# Xem Cart
GET cart:123

# Xem CartDetails của Cart
SMEMBERS cart:123:items
GET cartDetail:456

# Xem Order
GET order:789

# Xem OrderDetails của Order
SMEMBERS order:789:details
GET orderDetail:101

# Xem User và Orders
GET user:user_123
SMEMBERS user:user_123:orders
```

### 8.3. Kiểm tra Indexes

```bash
# Kiểm tra cart index
GET cart:index:user:user_123

# Kiểm tra order indexes
SMEMBERS user:user_123:orders
SMEMBERS order:index:user:user_123

# Kiểm tra payment ref index
GET order:index:paymentRef:VNPAY123
```

## 9. Performance và Optimization

### 9.1. Query Performance

**Tối ưu query:**
- ✅ Sử dụng index thay vì scan: `GET user:index:email:{email}` thay vì scan tất cả users
- ✅ Sử dụng Set cho quan hệ 1:N: `SMEMBERS cart:{cartId}:items` nhanh hơn scan
- ✅ Sử dụng MGET cho batch operations: `MGET dish:789 dish:790 dish:791`
- ❌ Tránh KEYS command trong production (blocking, chậm)
- ❌ Tránh scan tất cả keys để tìm một entity

**Ví dụ tối ưu:**
```redis
# ❌ Chậm: Scan tất cả carts
KEYS cart:*  # Blocking, chậm với nhiều keys

# ✅ Nhanh: Dùng index
GET cart:index:user:user_123  # O(1)
```

### 9.2. Memory Optimization

**Giảm memory usage:**
- Xóa dữ liệu không cần thiết (Cart sau checkout)
- Sử dụng TTL cho cache (nếu có)
- Monitor memory với `INFO memory`
- Sử dụng compression cho JSON lớn (nếu cần)

**Memory monitoring:**
```bash
# Kiểm tra memory usage
INFO memory

# Kiểm tra số lượng keys
DBSIZE

# Kiểm tra keys lớn nhất
redis-cli --bigkeys
```

### 9.3. Index Synchronization

**Đảm bảo indexes luôn đồng bộ:**
- ✅ Luôn cập nhật tất cả indexes khi save/delete
- ✅ Sử dụng transaction (MULTI/EXEC) cho operations liên quan
- ✅ Validate indexes trong tests
- ⚠️ Có thể có inconsistency nếu Redis crash giữa chừng

**Best practice:**
```java
// Luôn cập nhật tất cả indexes cùng lúc
public Cart save(Cart cart) {
    // 1. Save entity
    SET cart:{id} ...
    // 2. Update indexes
    SET cart:index:user:{userId} {id}
    SET user:{userId}:cart {id}
    // 3. Update list
    SADD cart:list {id}
}
```

## 10. Error Handling và Resilience

### 10.1. Redis Down Scenario

**Fallback strategies:**
- Application có thể fallback về database khác (nếu có)
- Cache miss: Load từ database và cache lại
- Graceful degradation: Một số features có thể tạm thời không hoạt động

**Code pattern:**
```java
try {
    Cart cart = cartRepository.findByUserId(userId);
} catch (RedisConnectionFailureException e) {
    log.warn("Redis unavailable, using fallback");
    // Fallback logic
}
```

### 10.2. Data Consistency

**Potential issues:**
- Index out of sync với entity (nếu Redis crash)
- Duplicate indexes có thể không đồng bộ
- Transient fields cần load lại mỗi lần

**Mitigation:**
- Regular health checks để validate indexes
- Rebuild indexes từ entities nếu cần
- Use transactions cho critical operations

## 11. Migration và Backup

### 11.1. Backup dữ liệu
- Sử dụng `BGSAVE` hoặc `SAVE` để backup
- Export keys cụ thể: `redis-cli --scan --pattern "cart:*" | xargs redis-cli MGET`
- Scheduled backups với `redis-cli BGSAVE`

### 11.2. Migration
- Export data sang JSON
- Import vào Redis mới
- Verify data integrity
- Rebuild indexes nếu cần

### 11.3. Data Export Example
```bash
# Export tất cả carts
redis-cli --scan --pattern "cart:*" | while read key; do
    redis-cli GET "$key" >> carts_backup.json
done

# Export với format JSON
redis-cli --rdb carts_backup.rdb
```

## 12. Troubleshooting

### 12.1. Common Issues

**Issue: Index không tìm thấy entity**
```bash
# Kiểm tra index
GET cart:index:user:user_123  # → "123"

# Kiểm tra entity
GET cart:123  # → null hoặc object

# Nếu entity null nhưng index có: Index out of sync
# Solution: Rebuild index hoặc delete stale index
```

**Issue: Set index có ID nhưng entity không tồn tại**
```bash
# Kiểm tra Set
SMEMBERS cart:123:items  # → ["456", "457"]

# Kiểm tra entities
GET cartDetail:456  # → null (stale index)

# Solution: Clean up stale indexes
SREM cart:123:items "456"
```

**Issue: Memory usage cao**
```bash
# Kiểm tra memory
INFO memory

# Tìm keys lớn nhất
redis-cli --bigkeys

# Solution: Clean up old data, set TTL
```

### 12.2. Debug Commands

```bash
# Kiểm tra tất cả keys của một entity
KEYS cart:* | head -20

# Kiểm tra type của key
TYPE cart:123  # → string

# Kiểm tra size của value
MEMORY USAGE cart:123

# Kiểm tra TTL
TTL cart:123  # → -1 (no expiration)

# Monitor commands real-time
MONITOR
```

---

**Lưu ý:** Tài liệu này dựa trên implementation thực tế trong codebase. Tất cả các operations đều sử dụng `RedisTemplate<String, Object>` với JSON serialization.

**Cập nhật lần cuối:** Dựa trên codebase hiện tại với 9 models: User, Role, Permission, Category, Dish, Cart, CartDetail, Order, OrderDetail.
