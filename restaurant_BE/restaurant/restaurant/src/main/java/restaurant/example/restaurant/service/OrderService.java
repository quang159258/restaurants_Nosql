package restaurant.example.restaurant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.redis.model.*;
import restaurant.example.restaurant.domain.request.AdminCreateOrderRequest;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.ResOrderItem;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.redis.repository.*;
import restaurant.example.restaurant.service.notification.NotificationAudience;
import restaurant.example.restaurant.service.notification.NotificationMessage;
import restaurant.example.restaurant.service.notification.NotificationService;
import restaurant.example.restaurant.util.ImageUtils;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.constant.PaymentStatus;
import restaurant.example.restaurant.util.error.OrderException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderDetailRepository orderDetailRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private DishRepository dishRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private CacheService cacheService;
    
    @Autowired
    private CartDetailRepository cartDetailRepository;
    
    public Order createOrderFromCart(Cart cart, String receiverName, String receiverPhone, String receiverAddress,
            String receiverEmail, PaymentMethod paymentMethod) {
        // Get user for order
        User user = userRepository.findById(cart.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + cart.getUserId()));
        
        Order order = new Order();
        order.setUserId(cart.getUserId());
        order.setReceiverName(defaultIfBlank(receiverName, user.getUsername()));
        order.setReceiverPhone(defaultIfBlank(receiverPhone, user.getPhone()));
        order.setReceiverAddress(defaultIfBlank(receiverAddress, user.getAddress()));
        order.setReceiverEmail(defaultIfBlank(receiverEmail, user.getEmail()));
        order.setStatus(OrderStatus.PENDING);

        order.setPaymentMethod(paymentMethod != null ? paymentMethod : PaymentMethod.CASH);
        order.setPaymentStatus(PaymentStatus.PAYMENT_UNPAID);
        order.setPaymentRef(null);

        double total = 0;
        List<CartDetail> cartDetails = cart.getItems() != null ? cart.getItems() : 
            cartDetailRepository.findAllByCartId(cart.getId());
        for (CartDetail item : cartDetails) {
            total = total + item.getTotal();
        }
        order.setTotalPrice(total);
        order = orderRepository.save(order);
        
        // Cache the order
        cacheService.cacheOrder(order.getId(), order);
        // Invalidate list cache
        cacheService.deleteAllOrderListCache();

        for (CartDetail cartDetail : cartDetails) {
            OrderDetail detail = new OrderDetail();
            detail.setOrderId(order.getId());
            detail.setDishId(cartDetail.getDishId());
            detail.setPrice(cartDetail.getPrice());
            detail.setQuantity(cartDetail.getQuantity());
            orderDetailRepository.save(detail);
            
            // ==== Cập nhật tồn kho và số lượng bán/ngày ====
            Dish dish = dishRepository.findById(cartDetail.getDishId()).orElse(null);
            if (dish != null) {
                Integer curStock = dish.getStock() == null ? 0 : dish.getStock();
                Integer curSold = dish.getSoldToday() == null ? 0 : dish.getSoldToday();
                int sold = (int)cartDetail.getQuantity();
                dish.setStock(curStock - sold);
                dish.setSoldToday(curSold + sold);
                // Lưu lại thay đổi
                dishRepository.save(dish);
                
                // Invalidate dish cache
                cacheService.deleteCachedDish(Long.parseLong(dish.getId()));
                
                // Kiểm tra tồn kho thấp sau khi bán hàng
                if (dish.getStock() <= 10) {
                    notificationService.enqueue(NotificationMessage.builder()
                            .audience(NotificationAudience.SUPER_ADMIN)
                            .put("type", "low_stock")
                            .put("dishName", dish.getName())
                            .put("currentStock", dish.getStock())
                            .put("message", "Tồn kho thấp: " + dish.getName())
                            .build());
                }
            }
        }
        sendOrderCreatedNotifications(order.getId(), receiverName, order.getTotalPrice());
        
        return order;
    }

    public ResOrder createOrderForAdmin(AdminCreateOrderRequest request) throws OrderException {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new OrderException("Danh sách món ăn không được để trống");
        }

        User targetUser = null;
        if (request.getUserId() != null) {
            targetUser = userRepository.findById(String.valueOf(request.getUserId()))
                    .orElseThrow(() -> new OrderException("Không tìm thấy người dùng với id = " + request.getUserId()));
        } else if (request.getReceiverEmail() != null) {
            targetUser = userRepository.findByEmail(request.getReceiverEmail());
        }

        Order order = new Order();
        order.setUserId(targetUser != null ? targetUser.getId() : null);
        order.setReceiverName(defaultIfBlank(request.getReceiverName(), targetUser != null ? targetUser.getUsername() : null));
        order.setReceiverPhone(defaultIfBlank(request.getReceiverPhone(), targetUser != null ? targetUser.getPhone() : null));
        order.setReceiverAddress(defaultIfBlank(request.getReceiverAddress(), targetUser != null ? targetUser.getAddress() : null));
        order.setReceiverEmail(defaultIfBlank(request.getReceiverEmail(), targetUser != null ? targetUser.getEmail() : null));
        order.setStatus(OrderStatus.PENDING);
        try {
            PaymentMethod method = request.getPaymentMethod() != null
                    ? PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
                    : PaymentMethod.CASH;
            order.setPaymentMethod(method);
        } catch (IllegalArgumentException ex) {
            throw new OrderException("Phương thức thanh toán không hợp lệ");
        }
        order.setPaymentStatus(PaymentStatus.PAYMENT_UNPAID);
        order.setPaymentRef(null);
        order = orderRepository.save(order);

        double total = 0;
        for (AdminCreateOrderRequest.OrderItemRequest item : request.getItems()) {
            Dish dish = dishRepository.findById(String.valueOf(item.getDishId()))
                    .orElseThrow(() -> new OrderException("Không tìm thấy món ăn với id = " + item.getDishId()));
            if (dish.getStock() != null && dish.getStock() < item.getQuantity()) {
                throw new OrderException("Món " + dish.getName() + " không đủ tồn kho");
            }
            OrderDetail detail = new OrderDetail();
            detail.setOrderId(order.getId());
            detail.setDishId(dish.getId());
            detail.setQuantity(item.getQuantity());
            detail.setPrice(dish.getPrice());
            orderDetailRepository.save(detail);

            int currentStock = dish.getStock() == null ? 0 : dish.getStock();
            dish.setStock(currentStock - item.getQuantity());
            int soldCount = dish.getSoldToday() == null ? 0 : dish.getSoldToday();
            dish.setSoldToday(soldCount + item.getQuantity());
            dishRepository.save(dish);

            total += dish.getPrice() * item.getQuantity();
        }
        order.setTotalPrice(total);
        orderRepository.save(order);
        
        // Cache the order
        cacheService.cacheOrder(order.getId(), order);
        // Invalidate list cache
        cacheService.deleteAllOrderListCache();

        sendOrderCreatedNotifications(order.getId(), order.getReceiverName(), order.getTotalPrice());

        ResOrder res = new ResOrder();
        res.setId(order.getId());
        res.setReceiverAddress(order.getReceiverAddress());
        res.setReceiverName(order.getReceiverName());
        res.setReceiverPhone(order.getReceiverPhone());
        res.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        res.setTotalPrice(order.getTotalPrice());
        res.setDate(order.getCreatedAt());
        res.setListOrderItem(ListOrderItem(order.getId()));
        return res;
    }

    public List<ResOrderItem> ListOrderItem(String orderId) {
        // Lấy danh sách OrderDetail theo orderId
        List<OrderDetail> orderDetails = orderDetailRepository.findByOrderId(orderId);
        List<ResOrderItem> resList = new ArrayList<>();
        for (OrderDetail detail : orderDetails) {
            // Get dish for detail
            Dish dish = dishRepository.findById(detail.getDishId()).orElse(null);
            
            ResOrderItem res = new ResOrderItem();
            res.setId(detail.getId());
            res.setOrderId(detail.getOrderId());
            res.setDishId(detail.getDishId());
            res.setQuantity((int) detail.getQuantity());
            res.setUnitPrice(java.math.BigDecimal.valueOf(detail.getPrice()));
            res.setTotalPrice(java.math.BigDecimal.valueOf(detail.getPrice() * detail.getQuantity()));
            res.setPrice(detail.getPrice());
            res.setTotal(detail.getPrice() * detail.getQuantity());
            if (dish != null) {
                res.setName(dish.getName());
                res.setImageUrl(ImageUtils.extractPrimaryImage(dish.getImageUrl()));
            }
            resList.add(res);
        }
        return resList;
    }

    /** ✅ Lấy tất cả đơn hàng */
    public ResultPaginationDataDTO getAllOrders(Pageable pageable) {
        // Generate cache key
        String cacheKey = cacheService.generatePaginationKey(
            pageable.getPageNumber(), 
            pageable.getPageSize(),
            null
        );
        
        // Try to get from cache first
        Object cachedResult = cacheService.getCachedOrderList(cacheKey);
        if (cachedResult instanceof ResultPaginationDataDTO) {
            return (ResultPaginationDataDTO) cachedResult;
        }
        
        Page<Order> pageOrder = this.orderRepository.findAll(pageable);
        List<ResOrder> lstRes = new ArrayList<>();
        List<Order> lst = pageOrder.getContent();

        for (Order item : lst) {
            ResOrder res = new ResOrder();
            res.setId(item.getId());
            res.setReceiverAddress(item.getReceiverAddress());
            res.setReceiverName(item.getReceiverName());
            res.setReceiverPhone(item.getReceiverPhone());
            res.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
            res.setTotalPrice(item.getTotalPrice());
            res.setDate(item.getCreatedAt());
            res.setPaymentMethod(item.getPaymentMethod() != null ? item.getPaymentMethod().name() : null);
            res.setPaymentStatus(item.getPaymentStatus() != null ? item.getPaymentStatus().name() : null);
            res.setListOrderItem(ListOrderItem(item.getId()));
            lstRes.add(res);
        }
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta meta = new ResultPaginationDataDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());

        meta.setPages(pageOrder.getTotalPages());
        meta.setTotal(pageOrder.getTotalElements());
        rs.setMeta(meta);
        rs.setResult(lstRes);
        
        // Cache the result
        cacheService.cacheOrderList(cacheKey, rs);
        
        return rs;

    }

    /** ✅ Lấy đơn hàng theo người dùng */
    public ResultPaginationDataDTO getOrdersByUser(String email, Pageable pageable)
            throws OrderException {
        // Lấy thông tin user
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new OrderException("User not found");
        }

        // Generate cache key
        String cacheKey = cacheService.generatePaginationKey(
            pageable.getPageNumber(), 
            pageable.getPageSize(),
            "user:" + user.getId()
        );
        
        // Try to get from cache first
        Object cachedResult = cacheService.getCachedOrderList(cacheKey);
        if (cachedResult instanceof ResultPaginationDataDTO) {
            return (ResultPaginationDataDTO) cachedResult;
        }

        // Get orders by userId - need to implement pagination manually
        List<Order> allOrders = orderRepository.findByUserId(user.getId());
        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allOrders.size());
        List<Order> pagedOrders = allOrders.subList(start, end);
        
        // Create a Page object manually
        Page<Order> pageOrder = new org.springframework.data.domain.PageImpl<>(pagedOrders, pageable, allOrders.size());

        if (pageOrder.isEmpty()) {
            throw new OrderException("No orders found for this user");
        }

        // Chuyển sang DTO
        List<ResOrder> lstRes = new ArrayList<>();
        for (Order item : pageOrder.getContent()) {
            ResOrder res = new ResOrder();
            res.setId(item.getId());
            res.setReceiverAddress(item.getReceiverAddress());
            res.setReceiverName(item.getReceiverName());
            res.setReceiverPhone(item.getReceiverPhone());
            res.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
            res.setTotalPrice(item.getTotalPrice());
            res.setDate(item.getCreatedAt());
            res.setPaymentMethod(item.getPaymentMethod() != null ? item.getPaymentMethod().name() : null);
            res.setPaymentStatus(item.getPaymentStatus() != null ? item.getPaymentStatus().name() : null);
            res.setListOrderItem(ListOrderItem(item.getId()));
            lstRes.add(res);
        }

        // Gói dữ liệu phân trang
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta meta = new ResultPaginationDataDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(pageOrder.getTotalPages());
        meta.setTotal(pageOrder.getTotalElements());

        rs.setMeta(meta);
        rs.setResult(lstRes);
        
        // Cache the result
        cacheService.cacheOrderList(cacheKey, rs);
        
        return rs;
    }

    /**
     * ✅ Lấy đơn hàng theo ID
     **/
    public ResOrder getOrderById(String id) throws OrderException {
        // Try to get from cache first
        Object cachedOrder = cacheService.getCachedOrder(id);
        if (cachedOrder instanceof Order) {
            Order order = (Order) cachedOrder;
            ResOrder res = new ResOrder();
            res.setId(order.getId());
            res.setReceiverAddress(order.getReceiverAddress());
            res.setReceiverName(order.getReceiverName());
            res.setReceiverPhone(order.getReceiverPhone());
            res.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
            res.setTotalPrice(order.getTotalPrice());
            res.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null);
            res.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
            res.setListOrderItem(ListOrderItem(id));
            return res;
        }
        
        Optional<Order> item = orderRepository.findById(id);
        Order order;
        if (item.isPresent()) {
            order = item.get();
            // Cache the order
            cacheService.cacheOrder(id, order);
        } else {
            throw new OrderException("Not found order");
        }
        ResOrder res = new ResOrder();
        res.setId(order.getId());
        res.setReceiverAddress(order.getReceiverAddress());
        res.setReceiverName(order.getReceiverName());
        res.setReceiverPhone(order.getReceiverPhone());
        res.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        res.setTotalPrice(order.getTotalPrice());
        res.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null);
        res.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
        res.setListOrderItem(ListOrderItem(id));
        return res;
    }

    /**
     * ✅ Cập nhật trạng thái đơn hàng
     * 
     * @throws OrderException
     */
    public ResOrder updateOrderStatus(String id, String status) throws OrderException {
        Optional<Order> item = this.orderRepository.findById(id);
        if (!item.isPresent()) {
            throw new OrderException("Not found order");
        }
        Order order = item.get();
        if (status != null) {
            try {
                OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
                order.setStatus(newStatus);
                
                // Nếu là COD (CASH) và đơn hàng được xác nhận, tự động đánh dấu đã thanh toán
                if (PaymentMethod.CASH.equals(order.getPaymentMethod()) 
                    && OrderStatus.CONFIRMED.equals(newStatus)
                    && PaymentStatus.PAYMENT_UNPAID.equals(order.getPaymentStatus())) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                }
            } catch (IllegalArgumentException ex) {
                throw new OrderException("Invalid order status: " + status);
            }
        }
        orderRepository.save(order);
        
        // Update cache
        cacheService.cacheOrder(order.getId(), order);
        // Invalidate list cache
        cacheService.deleteAllOrderListCache();
        
        ResOrder res = new ResOrder();
        res.setId(order.getId());
        res.setReceiverAddress(order.getReceiverAddress());
        res.setReceiverName(order.getReceiverName());
        res.setReceiverPhone(order.getReceiverPhone());
        res.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        res.setTotalPrice(order.getTotalPrice());
        res.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null);
        res.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
        return res;
    }

    /**
     * ✅ Xóa đơn hàng
     */
    public void deleteOrderById(Long id) throws OrderException {
        if (!orderRepository.existsById(String.valueOf(id))) {
            throw new OrderException("Order not found");
        }
        orderRepository.deleteById(String.valueOf(id));
        
        // Remove from cache
        cacheService.deleteCachedOrder(id);
        // Invalidate list cache
        cacheService.deleteAllOrderListCache();
    }

    public void sendEmail(String idOrder) {
        Optional<Order> option = this.orderRepository.findById(idOrder);

        if (option.isPresent()) {
            Order order = option.get();
            List<ResOrderItem> lst = ListOrderItem(idOrder);
            this.emailService.sendEmailFromTemplateSync(order.getReceiverEmail(), "Restaurant", "restaurant",
                    order, lst);
        }
    }

    private void sendOrderCreatedNotifications(String orderId, String receiverName, Double totalPrice) {
        NotificationMessage payload = NotificationMessage.builder()
                .put("type", "order")
                .put("orderId", orderId)
                .put("customerName", receiverName)
                .put("totalAmount", totalPrice)
                .put("message", "Đơn hàng mới #" + orderId + " từ " + receiverName)
                .build();
        notificationService.enqueue(payload);
        notificationService.enqueue(NotificationMessage.builder()
                .audience(NotificationAudience.SUPER_ADMIN)
                .payload(payload.getPayload())
                .build());
        notificationService.enqueue(NotificationMessage.builder()
                .audience(NotificationAudience.STAFF)
                .payload(payload.getPayload())
                .build());
    }

    private String defaultIfBlank(String candidate, String fallback) {
        if (candidate != null && !candidate.trim().isEmpty()) {
            return candidate.trim();
        }
        return fallback;
    }
}
