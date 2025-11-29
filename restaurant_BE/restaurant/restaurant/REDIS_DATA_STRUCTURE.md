# Redis Data Structure Documentation

## Tổng quan

Tài liệu này mô tả cách lưu trữ dữ liệu trong Redis cho hệ thống Restaurant, bao gồm các key patterns, cấu trúc dữ liệu, và mối quan hệ giữa các entities.

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
- **Entity keys:** `{entity}:{id}` - Lưu trữ object chính
- **List keys:** `{entity}:list` - Set chứa tất cả IDs
- **Counter keys:** `{entity}:counter` - Counter để generate ID tự động
- **Index keys:** `{entity}:index:{field}:{value}` - Index để tìm nhanh
- **Relation keys:** `{entity}:{id}:{relation}` - Set chứa IDs của quan hệ

## 1. Key Naming Convention

### 1.1. Quy tắc đặt tên key

Redis keys trong hệ thống tuân theo pattern: `{entity}:{identifier}` hoặc `{entity}:{identifier}:{sub-entity}`

**Format chung:**
```
{namespace}:{entity}:{id}
```

**Ví dụ:**
- `cart:user:{userId}` - Giỏ hàng của user
- `cart:detail:{cartDetailId}` - Chi tiết món trong giỏ hàng
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
| Cart | `cart:user:{userId}` | `cart:user:123` | Giỏ hàng của user có ID = 123 |
| CartDetail | `cart:detail:{cartDetailId}` | `cart:detail:456` | Chi tiết món trong giỏ hàng |
| Order | `order:{orderId}` | `order:789` | Đơn hàng |
| OrderDetail | `order:detail:{orderDetailId}` | `order:detail:101` | Chi tiết món trong đơn hàng |
| Cache Cart | `cache:cart:{userId}` | `cache:cart:123` | Cache giỏ hàng (nếu có) |

### 1.3. Index và List Keys

| Mục đích | Key Pattern | Ví dụ | Mô tả |
|----------|-------------|-------|-------|
| List tất cả IDs | `{entity}:list` | `user:list`, `dish:list` | Set chứa tất cả IDs của entity |
| Counter (auto-increment) | `{entity}:counter` | `user:counter`, `dish:counter` | Counter để generate ID |
| Index theo field | `{entity}:index:{field}:{value}` | `user:index:email:abc@xyz.com` | Index để tìm nhanh theo field |
| Quan hệ Role-Permission | `role:{roleId}:permissions` | `role:1:permissions` | Set chứa permissionIds của role |
| Quan hệ Category-Dish | `category:{categoryId}:dishes` | `category:1:dishes` | Set chứa dishIds của category |
| Quan hệ User-Order | `order:byUser:{userId}` | `order:byUser:123` | Set chứa orderIds của user |
| Index Dish theo Category | `dish:index:category:{categoryId}` | `dish:index:category:1` | Set chứa dishIds của category |
| Index Permission theo API | `permission:index:api:{apiPath}:{method}` | `permission:index:api:/api/users:GET` | Index để tìm permission theo API |

## 2. Cấu trúc dữ liệu

### 2.1. Cart (Giỏ hàng)

**Key:** `cart:user:{userId}`

**Data Type:** Hash hoặc JSON (tùy vào implementation)

**Cấu trúc:**
```json
{
  "id": "cart_123",
  "userId": "user_123",
  "items": [
    {
      "id": "cart_detail_456",
      "dishId": "dish_789",
      "quantity": 2,
      "price": 50000,
      "total": 100000
    }
  ],
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:30:00"
}
```

**Redis Hash Structure:**
```
cart:user:123
  - id: "cart_123"
  - userId: "user_123"
  - createdAt: "2024-01-01T10:00:00"
  - updatedAt: "2024-01-01T10:30:00"
```

**Quan hệ:**
- Một User có một Cart (1:1)
- Một Cart có nhiều CartDetail (1:N)

### 2.2. CartDetail (Chi tiết giỏ hàng)

**Key:** `cart:detail:{cartDetailId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "cart_detail_456",
  "cartId": "cart_123",
  "dishId": "dish_789",
  "dishName": "Phở Bò",
  "quantity": 2,
  "price": 50000,
  "total": 100000,
  "createdAt": "2024-01-01T10:00:00"
}
```

**Redis Hash Structure:**
```
cart:detail:456
  - id: "cart_detail_456"
  - cartId: "cart_123"
  - dishId: "dish_789"
  - dishName: "Phở Bò"
  - quantity: "2"
  - price: "50000"
  - total: "100000"
  - createdAt: "2024-01-01T10:00:00"
```

**Quan hệ:**
- Một CartDetail thuộc về một Cart (N:1)
- Một CartDetail tham chiếu đến một Dish (N:1)

**Index Pattern:**
- `cart:detail:byCart:{cartId}` - Set chứa các cartDetailId của một cart
- `cart:detail:byDish:{dishId}` - Set chứa các cartDetailId chứa dish này

### 2.3. Order (Đơn hàng)

**Key:** `order:{orderId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "order_789",
  "userId": "user_123",
  "receiverName": "Nguyễn Văn A",
  "receiverPhone": "0123456789",
  "receiverAddress": "123 Đường ABC",
  "receiverEmail": "user@example.com",
  "items": [
    {
      "dishId": "dish_789",
      "dishName": "Phở Bò",
      "quantity": 2,
      "price": 50000,
      "total": 100000
    }
  ],
  "totalAmount": 100000,
  "status": "PENDING",
  "paymentMethod": "CASH",
  "paymentRef": null,
  "createdAt": "2024-01-01T11:00:00",
  "updatedAt": "2024-01-01T11:00:00"
}
```

**Redis Hash Structure:**
```
order:789
  - id: "order_789"
  - userId: "user_123"
  - receiverName: "Nguyễn Văn A"
  - receiverPhone: "0123456789"
  - receiverAddress: "123 Đường ABC"
  - receiverEmail: "user@example.com"
  - totalAmount: "100000"
  - status: "PENDING"
  - paymentMethod: "CASH"
  - paymentRef: null
  - createdAt: "2024-01-01T11:00:00"
  - updatedAt: "2024-01-01T11:00:00"
```

**Quan hệ:**
- Một Order thuộc về một User (N:1)
- Một Order được tạo từ một Cart (1:1)
- Một Order có nhiều OrderItem (1:N) - có thể lưu trong cùng hash hoặc separate keys

**Index Patterns:**
- `order:byUser:{userId}` - Set chứa các orderId của user
- `order:byStatus:{status}` - Set chứa các orderId theo trạng thái
- `order:byDate:{date}` - Set chứa các orderId theo ngày (format: YYYY-MM-DD)

### 2.4. User (Người dùng)

**Key:** `user:{userId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "user_123",
  "username": "user@example.com",
  "password": "hashed_password",
  "email": "user@example.com",
  "phone": "0123456789",
  "address": "123 Đường ABC",
  "refreshToken": null,
  "gender": "MALE",
  "roleId": "role_1",
  "createdAt": "2024-01-01T09:00:00",
  "updatedAt": "2024-01-01T09:00:00",
  "createdBy": null,
  "updatedBy": null
}
```

**Redis Hash Structure:**
```
user:123
  - id: "user_123"
  - username: "user@example.com"
  - password: "hashed_password"
  - email: "user@example.com"
  - phone: "0123456789"
  - address: "123 Đường ABC"
  - refreshToken: null
  - gender: "MALE"
  - roleId: "role_1"
  - createdAt: "2024-01-01T09:00:00"
  - updatedAt: "2024-01-01T09:00:00"
```

**Index Patterns:**
- `user:index:email:{email}` - Index email → userId
- `user:index:username:{username}` - Index username → userId
- `user:list` - Set chứa tất cả userIds

**Quan hệ:**
- Một User có một Role (N:1) - lưu qua `roleId`
- Một User có một Cart (1:1)
- Một User có nhiều Order (1:N)

### 2.5. Role (Vai trò)

**Key:** `role:{roleId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "role_1",
  "name": "ADMIN",
  "description": "Quản trị viên hệ thống",
  "createdAt": "2024-01-01T08:00:00",
  "updatedAt": "2024-01-01T08:00:00",
  "createdBy": null,
  "updatedBy": null
}
```

**Redis Hash Structure:**
```
role:1
  - id: "role_1"
  - name: "ADMIN"
  - description: "Quản trị viên hệ thống"
  - createdAt: "2024-01-01T08:00:00"
  - updatedAt: "2024-01-01T08:00:00"
```

**Index Patterns:**
- `role:index:name:{name}` - Index name → roleId
- `role:{roleId}:permissions` - Set chứa permissionIds của role
- `role:list` - Set chứa tất cả roleIds

**Quan hệ:**
- Một Role có nhiều Permission (N:M) - lưu qua Set `role:{roleId}:permissions`
- Một Role có nhiều User (1:N) - tham chiếu ngược qua `user.roleId`

### 2.6. Permission (Quyền)

**Key:** `permission:{permissionId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "permission_1",
  "name": "View Users",
  "apiPath": "/api/users",
  "method": "GET",
  "module": "USER",
  "createdAt": "2024-01-01T08:00:00",
  "updatedAt": "2024-01-01T08:00:00",
  "createdBy": null,
  "updatedBy": null
}
```

**Redis Hash Structure:**
```
permission:1
  - id: "permission_1"
  - name: "View Users"
  - apiPath: "/api/users"
  - method: "GET"
  - module: "USER"
  - createdAt: "2024-01-01T08:00:00"
  - updatedAt: "2024-01-01T08:00:00"
```

**Index Patterns:**
- `permission:index:module:{module}:{apiPath}:{method}` - Index để tìm permission theo module+api+method
- `permission:index:api:{apiPath}:{method}` - Index để tìm permission theo api+method
- `permission:list` - Set chứa tất cả permissionIds

**Quan hệ:**
- Một Permission thuộc về nhiều Role (M:N) - tham chiếu ngược qua `role:{roleId}:permissions`

### 2.7. Category (Danh mục)

**Key:** `category:{categoryId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "category_1",
  "name": "Món Chính",
  "description": "Các món ăn chính",
  "createdAt": "2024-01-01T08:00:00",
  "updatedAt": "2024-01-01T08:00:00",
  "createdBy": null,
  "updatedBy": null
}
```

**Redis Hash Structure:**
```
category:1
  - id: "category_1"
  - name: "Món Chính"
  - description: "Các món ăn chính"
  - createdAt: "2024-01-01T08:00:00"
  - updatedAt: "2024-01-01T08:00:00"
```

**Index Patterns:**
- `category:{categoryId}:dishes` - Set chứa dishIds của category
- `category:list` - Set chứa tất cả categoryIds

**Quan hệ:**
- Một Category có nhiều Dish (1:N) - lưu qua Set `category:{categoryId}:dishes` và `dish.categoryId`

### 2.8. Dish (Món ăn)

**Key:** `dish:{dishId}`

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "dish_789",
  "name": "Phở Bò",
  "description": "Phở bò truyền thống",
  "price": 50000.0,
  "imageUrl": "https://example.com/pho-bo.jpg",
  "categoryId": "category_1",
  "available": true,
  "stock": 100,
  "soldToday": 25,
  "createdAt": "2024-01-01T09:00:00",
  "updatedAt": "2024-01-01T10:00:00",
  "createdBy": null,
  "updatedBy": null
}
```

**Redis Hash Structure:**
```
dish:789
  - id: "dish_789"
  - name: "Phở Bò"
  - description: "Phở bò truyền thống"
  - price: "50000.0"
  - imageUrl: "https://example.com/pho-bo.jpg"
  - categoryId: "category_1"
  - available: "true"
  - stock: "100"
  - soldToday: "25"
  - createdAt: "2024-01-01T09:00:00"
  - updatedAt: "2024-01-01T10:00:00"
```

**Index Patterns:**
- `dish:index:category:{categoryId}` - Set chứa dishIds của category
- `category:{categoryId}:dishes` - Set chứa dishIds của category (duplicate index)
- `dish:list` - Set chứa tất cả dishIds

**Quan hệ:**
- Một Dish thuộc về một Category (N:1) - lưu qua `categoryId`
- Một Dish có trong nhiều CartDetail (1:N) - tham chiếu ngược qua `cartDetail.dishId`
- Một Dish có trong nhiều OrderDetail (1:N) - tham chiếu ngược qua `orderDetail.dishId`

### 2.9. OrderDetail (Chi tiết đơn hàng)

**Key:** `order:detail:{orderDetailId}` hoặc lưu trong Order

**Data Type:** Hash hoặc JSON

**Cấu trúc:**
```json
{
  "id": "order_detail_101",
  "orderId": "order_789",
  "dishId": "dish_789",
  "quantity": 2,
  "price": 50000.0,
  "dishName": "Phở Bò"
}
```

**Redis Hash Structure:**
```
order:detail:101
  - id: "order_detail_101"
  - orderId: "order_789"
  - dishId: "dish_789"
  - quantity: "2"
  - price: "50000.0"
```

**Index Patterns:**
- `order:{orderId}:details` - Set chứa orderDetailIds của order (nếu lưu riêng)
- Hoặc lưu trực tiếp trong Order như array `orderItems`

**Quan hệ:**
- Một OrderDetail thuộc về một Order (N:1) - lưu qua `orderId`
- Một OrderDetail tham chiếu đến một Dish (N:1) - lưu qua `dishId`

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

#### Quan hệ N:1 (User - Role)
- **User → Role:** Lưu `roleId` trong User hash: `user:{userId}` có field `roleId`
- **Role → User:** Tham chiếu ngược qua index `user:index:role:{roleId}` (nếu cần) hoặc query `user.roleId = {roleId}`

**Redis Operations:**
```redis
# Lưu User với roleId
HSET user:123 roleId "role_1"

# Lấy Role của User
GET user:123 → lấy roleId → GET role:{roleId}
```

#### Quan hệ M:N (Role - Permission)
- **Role → Permission:** Sử dụng Set để lưu danh sách permissionId
  - Key: `role:{roleId}:permissions` → Set chứa các permissionId
  
- **Permission → Role:** Tham chiếu ngược qua query tất cả roles có chứa permissionId này

**Redis Operations:**
```redis
# Thêm permissions vào role
SADD role:1:permissions permission_1 permission_2 permission_3

# Lấy permissions của role
SMEMBERS role:1:permissions

# Lấy Permission objects
MGET permission:1 permission:2 permission:3
```

#### Quan hệ 1:N (Category - Dish)
- **Category → Dish:** Sử dụng Set để lưu danh sách dishId
  - Key: `category:{categoryId}:dishes` → Set chứa các dishId
  - Key: `dish:index:category:{categoryId}` → Set chứa các dishId (duplicate index)
  
- **Dish → Category:** Lưu `categoryId` trong Dish hash

**Redis Operations:**
```redis
# Lưu Dish với categoryId
HSET dish:789 categoryId "category_1"

# Thêm vào index của Category
SADD category:1:dishes dish_789
SADD dish:index:category:1 dish_789

# Lấy dishes của category
SMEMBERS category:1:dishes
```

#### Quan hệ 1:1 (User - Cart)
- **User → Cart:** Key pattern `cart:user:{userId}` - mỗi user có một cart duy nhất
- **Cart → User:** Lưu `userId` trong Cart hash: `cart:user:{userId}` có field `userId`

**Redis Operations:**
```redis
# Lưu Cart với userId
SET cart:user:123 '{"id":"cart_123","userId":"user_123",...}'

# Lấy Cart của User
GET cart:user:123
```

#### Quan hệ 1:N (Cart - CartDetail)
- **Cart → CartDetail:** 
  - Lưu trực tiếp trong Cart JSON như array `items`
  - Hoặc sử dụng Set: `cart:items:{cartId}` → Set chứa các cartDetailId
  
- **CartDetail → Cart:** Lưu `cartId` trong CartDetail hash

**Redis Operations:**
```redis
# Cách 1: Lưu trong Cart JSON
SET cart:user:123 '{"items":[{"id":"cart_detail_456",...}]}'

# Cách 2: Lưu riêng biệt
SADD cart:items:cart_123 cart_detail_456
HSET cart:detail:456 cartId "cart_123" ...
```

#### Quan hệ N:1 (CartDetail - Dish)
- **CartDetail → Dish:** Lưu `dishId` trong CartDetail hash
- **Dish → CartDetail:** Có thể tạo index `cart:detail:byDish:{dishId}` nếu cần query ngược

**Redis Operations:**
```redis
# Lưu CartDetail với dishId
HSET cart:detail:456 dishId "dish_789" ...

# Lấy Dish từ CartDetail
GET cart:detail:456 → lấy dishId → GET dish:{dishId}
```

#### Quan hệ 1:N (User - Order)
- **User → Order:** Sử dụng Set để lưu danh sách orderId
  - Key: `order:byUser:{userId}` → Set chứa các orderId
  
- **Order → User:** Lưu `userId` trong Order hash

**Redis Operations:**
```redis
# Lưu Order với userId
SET order:789 '{"userId":"user_123",...}'

# Thêm vào index của User
SADD order:byUser:123 order_789

# Lấy orders của User
SMEMBERS order:byUser:123
```

#### Quan hệ 1:N (Order - OrderDetail)
- **Order → OrderDetail:** 
  - Lưu trực tiếp trong Order JSON như array `orderItems` (transient field)
  - Hoặc sử dụng Set: `order:{orderId}:details` → Set chứa các orderDetailId
  
- **OrderDetail → Order:** Lưu `orderId` trong OrderDetail hash

**Redis Operations:**
```redis
# Cách 1: Lưu trong Order JSON (transient, không lưu trong Redis)
# OrderDetail được load riêng khi cần

# Cách 2: Lưu riêng biệt
SADD order:789:details order_detail_101
HSET order:detail:101 orderId "order_789" ...
```

#### Quan hệ N:1 (OrderDetail - Dish)
- **OrderDetail → Dish:** Lưu `dishId` trong OrderDetail hash
- **Dish → OrderDetail:** Tham chiếu ngược qua query (nếu cần)

**Redis Operations:**
```redis
# Lưu OrderDetail với dishId
HSET order:detail:101 dishId "dish_789" ...

# Lấy Dish từ OrderDetail
GET order:detail:101 → lấy dishId → GET dish:{dishId}
```

## 4. Các pattern lưu trữ phổ biến

### 4.1. Lưu trữ nested objects

**Cách 1: JSON String**
```redis
SET cart:user:123 '{"id":"cart_123","userId":"user_123","items":[...]}'
```

**Cách 2: Hash với JSON trong field**
```redis
HSET cart:user:123 id "cart_123" userId "user_123" items '{"items":[...]}'
```

**Cách 3: Separate keys cho nested objects**
```redis
# Cart chính
HSET cart:user:123 id "cart_123" userId "user_123"

# Items riêng biệt
SADD cart:items:cart_123 cart_detail_456 cart_detail_457
HSET cart:detail:456 cartId "cart_123" dishId "dish_789" quantity "2"
HSET cart:detail:457 cartId "cart_123" dishId "dish_790" quantity "1"
```

### 4.2. Indexing và Querying

#### Index cho Cart
```redis
# Tìm cart của user
GET cart:user:{userId}

# Tìm tất cả items trong cart
SMEMBERS cart:items:{cartId}
# Sau đó lấy từng item
HGETALL cart:detail:{cartDetailId}
```

#### Index cho User
```redis
# Tìm user theo email
GET user:index:email:{email}

# Tìm user theo username
GET user:index:username:{username}

# Lấy tất cả users
SMEMBERS user:list
```

#### Index cho Role và Permission
```redis
# Tìm role theo name
GET role:index:name:{name}

# Lấy permissions của role
SMEMBERS role:{roleId}:permissions

# Tìm permission theo API
GET permission:index:api:{apiPath}:{method}

# Tìm permission theo module+api+method
GET permission:index:module:{module}:{apiPath}:{method}
```

#### Index cho Category và Dish
```redis
# Lấy dishes của category
SMEMBERS category:{categoryId}:dishes
# hoặc
SMEMBERS dish:index:category:{categoryId}

# Lấy tất cả categories
SMEMBERS category:list

# Lấy tất cả dishes
SMEMBERS dish:list
```

#### Index cho Order
```redis
# Tìm orders của user
SMEMBERS order:byUser:{userId}

# Tìm orders theo status
SMEMBERS order:byStatus:PENDING

# Tìm orders theo ngày
SMEMBERS order:byDate:2024-01-01

# Lấy order details
SMEMBERS order:{orderId}:details
```

### 4.3. Cache Pattern

**Cache Cart:**
```redis
# Cache key
cache:cart:{userId}

# TTL: 30 phút (1800 giây)
SETEX cache:cart:123 1800 '{"id":"cart_123",...}'

# Invalidate cache khi có thay đổi
DEL cache:cart:{userId}
```

## 5. Operations thường dùng

### 5.1. Quản lý User và Role

#### Tạo User với Role
```redis
# 1. Tạo User
SET user:{userId} '{"id":"user_123","username":"user@example.com","roleId":"role_1",...}'

# 2. Thêm vào list
SADD user:list user_123

# 3. Tạo index email
SET user:index:email:user@example.com user_123

# 4. Tạo index username
SET user:index:username:user@example.com user_123
```

#### Gán Permissions cho Role
```redis
# 1. Thêm permissions vào role
SADD role:{roleId}:permissions permission_1 permission_2 permission_3

# 2. Lấy permissions của role
SMEMBERS role:{roleId}:permissions

# 3. Lấy Permission objects
MGET permission:1 permission:2 permission:3
```

### 5.2. Quản lý Category và Dish

#### Tạo Dish và gán Category
```redis
# 1. Tạo Dish
SET dish:{dishId} '{"id":"dish_789","name":"Phở Bò","categoryId":"category_1",...}'

# 2. Thêm vào list
SADD dish:list dish_789

# 3. Thêm vào index của Category
SADD category:{categoryId}:dishes dish_789
SADD dish:index:category:{categoryId} dish_789
```

#### Lấy Dishes theo Category
```redis
# 1. Lấy dishIds của category
SMEMBERS category:{categoryId}:dishes

# 2. Lấy Dish objects
MGET dish:789 dish:790 dish:791
```

### 5.3. Thêm món vào giỏ hàng

```redis
# 1. Tạo hoặc cập nhật CartDetail
HSET cart:detail:{cartDetailId} cartId "{cartId}" dishId "{dishId}" quantity "{quantity}" price "{price}" total "{total}"

# 2. Thêm vào Set items của Cart
SADD cart:items:{cartId} {cartDetailId}

# 3. Invalidate cache
DEL cache:cart:{userId}
```

### 5.2. Cập nhật số lượng

```redis
# 1. Cập nhật CartDetail
HSET cart:detail:{cartDetailId} quantity "{newQuantity}" total "{newTotal}"

# 2. Invalidate cache
DEL cache:cart:{userId}
```

### 5.3. Xóa món khỏi giỏ hàng

```redis
# 1. Xóa khỏi Set items
SREM cart:items:{cartId} {cartDetailId}

# 2. Xóa CartDetail
DEL cart:detail:{cartDetailId}

# 3. Invalidate cache
DEL cache:cart:{userId}
```

### 5.4. Checkout (Tạo Order)

```redis
# 1. Tạo Order
SET order:{orderId} '{"id":"order_789","userId":"user_123","status":"PENDING",...}'

# 2. Thêm vào index orders của user
SADD order:byUser:{userId} {orderId}

# 3. Thêm vào index orders theo status
SADD order:byStatus:PENDING {orderId}

# 4. Thêm vào index orders theo ngày
SADD order:byDate:{date} {orderId}

# 5. Tạo OrderDetails
SET order:detail:{orderDetailId1} '{"orderId":"order_789","dishId":"dish_789",...}'
SET order:detail:{orderDetailId2} '{"orderId":"order_789","dishId":"dish_790",...}'

# 6. Thêm vào index details của order
SADD order:{orderId}:details {orderDetailId1} {orderDetailId2}

# 7. Xóa Cart và CartDetails
DEL cart:user:{userId}
DEL cart:items:{cartId}
# Xóa từng CartDetail
DEL cart:detail:{cartDetailId1}
DEL cart:detail:{cartDetailId2}
...

# 8. Invalidate cache
DEL cache:cart:{userId}
```

### 5.5. Query và Search Operations

#### Tìm User theo Email
```redis
# 1. Lấy userId từ index
GET user:index:email:{email}

# 2. Lấy User object
GET user:{userId}
```

#### Kiểm tra Permission của User
```redis
# 1. Lấy User
GET user:{userId} → lấy roleId

# 2. Lấy permissions của role
SMEMBERS role:{roleId}:permissions

# 3. Kiểm tra permission cụ thể
SISMEMBER role:{roleId}:permissions {permissionId}
```

#### Tìm Permission theo API Path
```redis
# 1. Lấy permissionId từ index
GET permission:index:api:{apiPath}:{method}

# 2. Lấy Permission object
GET permission:{permissionId}
```

## 6. Best Practices

### 6.1. Key Naming
- ✅ Sử dụng namespace rõ ràng: `cart:`, `order:`, `user:`
- ✅ Sử dụng separator nhất quán: dấu `:`
- ✅ Tránh key quá dài
- ✅ Sử dụng ID có ý nghĩa hoặc UUID

### 6.2. Data Structure Selection
- **Hash:** Cho objects có nhiều fields (Cart, Order, User)
- **String (JSON):** Cho nested objects phức tạp
- **Set:** Cho danh sách IDs, indexes
- **Sorted Set:** Cho danh sách có thứ tự (orders theo thời gian)

### 6.3. TTL và Expiration
- Đặt TTL cho cache: `SETEX` hoặc `EXPIRE`
- Cart có thể có TTL: 7 ngày không hoạt động
- Cache có TTL ngắn: 30 phút

### 6.4. Transaction và Atomicity
- Sử dụng `MULTI/EXEC` cho các operations liên quan
- Sử dụng `WATCH` để đảm bảo consistency

### 6.5. Memory Management
- Xóa dữ liệu không cần thiết (Cart sau khi checkout)
- Sử dụng compression cho JSON lớn
- Monitor memory usage

## 7. Ví dụ thực tế

### 7.1. Flow thêm món vào giỏ hàng

```
1. User request: POST /cart/add-dish
   - Input: {dishId, quantity}

2. Backend operations:
   a. Lấy userId từ authentication
   b. Lấy hoặc tạo Cart: GET cart:user:{userId}
   c. Tạo CartDetail mới với ID unique
   d. Lưu CartDetail: HSET cart:detail:{newId} ...
   e. Thêm vào Cart items: SADD cart:items:{cartId} {newId}
   f. Invalidate cache: DEL cache:cart:{userId}

3. Response: CartDetail đã tạo
```

### 7.2. Flow checkout

```
1. User request: POST /cart/checkout
   - Input: {receiverName, receiverPhone, receiverAddress, paymentMethod}

2. Backend operations:
   a. Lấy Cart: GET cart:user:{userId}
   b. Validate Cart có items
   c. Tạo Order mới với ID unique
   d. Lưu Order: HSET order:{orderId} ...
   e. Thêm vào indexes:
      - SADD order:byUser:{userId} {orderId}
      - SADD order:byStatus:PENDING {orderId}
      - SADD order:byDate:{today} {orderId}
   f. Xóa Cart và CartDetails
   g. Invalidate cache: DEL cache:cart:{userId}

3. Response: Order ID và payment URL (nếu VNPay)
```

## 8. Monitoring và Debugging

### 8.1. Kiểm tra keys

```bash
# Tìm tất cả keys của cart
KEYS cart:*

# Tìm cart của user cụ thể
KEYS cart:user:*

# Đếm số lượng keys
DBSIZE

# Kiểm tra TTL của key
TTL cart:user:123
```

### 8.2. Kiểm tra dữ liệu

```bash
# Xem User
GET user:123

# Xem Role và Permissions
GET role:1
SMEMBERS role:1:permissions

# Xem Category và Dishes
GET category:1
SMEMBERS category:1:dishes

# Xem Dish
GET dish:789

# Xem toàn bộ Cart
GET cart:user:123

# Xem items trong Cart
SMEMBERS cart:items:cart_123

# Xem CartDetail cụ thể
GET cart:detail:456

# Xem Order
GET order:789

# Xem OrderDetails
SMEMBERS order:789:details
GET order:detail:101
```

### 8.3. Kiểm tra Indexes

```bash
# Kiểm tra user indexes
GET user:index:email:user@example.com
GET user:index:username:user@example.com

# Kiểm tra role indexes
GET role:index:name:ADMIN

# Kiểm tra permission indexes
GET permission:index:api:/api/users:GET

# Kiểm tra dish indexes
SMEMBERS dish:index:category:1
SMEMBERS category:1:dishes

# Kiểm tra order indexes
SMEMBERS order:byUser:123
SMEMBERS order:byStatus:PENDING
SMEMBERS order:byDate:2024-01-01
```

## 9. Migration và Backup

### 9.1. Backup dữ liệu
- Sử dụng `BGSAVE` hoặc `SAVE` để backup
- Export keys cụ thể: `redis-cli --scan --pattern "cart:*" | xargs redis-cli MGET`

### 9.2. Migration
- Export data sang JSON
- Import vào Redis mới
- Verify data integrity

---

**Lưu ý:** Tài liệu này dựa trên phân tích codebase hiện tại. Các implementation cụ thể có thể khác nhau tùy vào cách sử dụng RedisTemplate hoặc Redis client library.

