# Hướng dẫn Docker cho Frontend Restaurant Management System

## 🐳 Docker Setup cho Frontend

### **📋 Yêu cầu:**
- Docker Desktop đã cài đặt
- Port 5173 available

### **🚀 Cách chạy:**

#### **1. Build và chạy với Docker Compose (Khuyến nghị):**
```bash
# Vào thư mục frontend
cd restaurant2_FE

# Build và chạy
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

#### **2. Build và chạy thủ công:**
```bash
# Build image
docker build -t restaurant-frontend .

# Chạy container
docker run -d -p 5173:5173 --name restaurant-frontend restaurant-frontend

# Xem logs
docker logs -f restaurant-frontend

# Dừng và xóa
docker stop restaurant-frontend
docker rm restaurant-frontend
```

### **🔧 Cấu hình:**

#### **Dockerfile:**
- **Base:** `node:18-alpine` (build stage)
- **Production:** `nginx:alpine` (runtime)
- **Port:** 5173
- **Build:** Multi-stage build để tối ưu kích thước

#### **Nginx Config:**
- **Port:** 5173
- **Gzip:** Enabled
- **Cache:** Static assets cached 1 year
- **Security:** Headers được thêm
- **Routing:** Client-side routing support
- **Proxy:** API và WebSocket proxy (nếu cần)

### **📱 Truy cập:**
- **Frontend:** http://localhost:5173
- **Health Check:** http://localhost:5173 (tự động)

### **🛠️ Commands hữu ích:**

```bash
# Xem container đang chạy
docker ps

# Xem logs real-time
docker-compose logs -f frontend

# Restart container
docker-compose restart frontend

# Rebuild và restart
docker-compose up -d --build --force-recreate

# Xem resource usage
docker stats restaurant-frontend

# Vào container
docker exec -it restaurant-frontend sh
```

### **🔍 Troubleshooting:**

#### **Lỗi Port đã được sử dụng:**
```bash
# Tìm process sử dụng port 5173
netstat -ano | findstr :5173

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Linux/Mac)
kill -9 <PID>
```

#### **Lỗi Build:**
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### **Lỗi Permission:**
```bash
# Linux/Mac
sudo chown -R $USER:$USER .
```

### **📊 Monitoring:**

```bash
# Xem resource usage
docker stats

# Xem logs
docker-compose logs -f

# Health check
curl http://localhost:5173
```

### **🎯 Kết quả mong đợi:**

- ✅ **Container chạy** trên port 5173
- ✅ **Nginx serving** static files
- ✅ **Gzip compression** enabled
- ✅ **Security headers** được thêm
- ✅ **Client-side routing** hoạt động
- ✅ **Health check** pass

### **💡 Tips:**

1. **Development:** Sử dụng `npm run dev` thay vì Docker
2. **Production:** Sử dụng Docker với nginx
3. **Hot reload:** Không có trong Docker production
4. **Environment:** Tạo `.env` file cho config
5. **Logs:** Luôn check logs khi có vấn đề

### **🔄 Workflow:**

```bash
# 1. Development
npm run dev

# 2. Build for production
npm run build

# 3. Test Docker build
docker build -t restaurant-frontend .

# 4. Run production
docker-compose up -d

# 5. Deploy
docker-compose up -d --build
```

---

**🎉 Frontend Docker setup hoàn tất!** 

Truy cập http://localhost:5173 để xem kết quả.
