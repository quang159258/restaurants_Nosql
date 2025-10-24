package restaurant.example.restaurant.service;

import org.springframework.boot.autoconfigure.batch.BatchProperties.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import java.util.Objects;
import java.util.Comparator;

import restaurant.example.restaurant.controller.FileController;
import restaurant.example.restaurant.controller.WebSocketController;
import restaurant.example.restaurant.domain.*;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.ResOrderItem;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.repository.*;
import restaurant.example.restaurant.util.error.OrderException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Flow.Subscriber;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final WebSocketController webSocketController;
    private final DishRepository dishRepository;

    private final StorageService storageService;

    public OrderService(OrderRepository orderRepository,
            OrderDetailRepository orderDetailRepository,
            UserRepository userRepository, EmailService emailService, 
            WebSocketController webSocketController, DishRepository dishRepository,
            StorageService storageService) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.webSocketController = webSocketController;
        this.dishRepository = dishRepository;
        this.storageService = storageService;
    }
    public Order createOrderFromCart(Cart cart, String receiverName, String receiverPhone, String receiverAddress,
            String receiverEmail, String paymentMethod, String uuid) {
        Order order = new Order();
        order.setUser(cart.getUser());
        order.setReceiverName(receiverName);
        order.setReceiverPhone(receiverPhone);
        order.setReceiverAddress(receiverAddress);
        order.setReceiverEmail(receiverEmail);
        order.setStatus("PENDING");

        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("PAYMENT_UNPAID");
        order.setPaymentRef(paymentMethod.equals("COD") ? "UNKNOWN" : uuid);

        double total = 0;
        for (CartDetail item : cart.getCartDetails()) {
            total = total + item.getTotal();
        }
        order.setTotalPrice(total);
        order = orderRepository.save(order);

        for (CartDetail cartDetail : cart.getCartDetails()) {
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setDish(cartDetail.getDish());
            detail.setPrice(cartDetail.getPrice());
            detail.setQuantity(cartDetail.getQuantity());
            orderDetailRepository.save(detail);
            // ==== Cập nhật tồn kho và số lượng bán/ngày ====
            Dish dish = cartDetail.getDish();
            if (dish != null) {
                Integer curStock = dish.getStock() == null ? 0 : dish.getStock();
                Integer curSold = dish.getSoldToday() == null ? 0 : dish.getSoldToday();
                int sold = (int)cartDetail.getQuantity();
                dish.setStock(curStock - sold);
                dish.setSoldToday(curSold + sold);
                // Lưu lại thay đổi
                dishRepository.save(dish);
                
                // Kiểm tra tồn kho thấp sau khi bán hàng
                if (dish.getStock() <= 10) {
                    try {
                        webSocketController.sendLowStockNotification(dish.getName(), dish.getStock());
                    } catch (Exception e) {
                        System.err.println("Lỗi khi gửi thông báo tồn kho thấp: " + e.getMessage());
                    }
                }
            }
        }
        
        // Gửi thông báo WebSocket về đơn hàng mới
        try {
            webSocketController.sendOrderNotification(
                order.getId(), 
                receiverName, 
                order.getTotalPrice()
            );
        } catch (Exception e) {
            System.err.println("Lỗi khi gửi thông báo WebSocket: " + e.getMessage());
        }
        
        return order;
    }

    public List<ResOrderItem> ListOrderItem(Long orderId) {
        // Lấy danh sách OrderDetail theo orderId
        System.out.println("check order id" + orderId);

        List<OrderDetail> orderDetails = orderDetailRepository.findByOrderId(orderId); // sửa lại tên method nếu cần
        System.out.println("check count" + orderDetails.size());
        List<ResOrderItem> resList = new ArrayList<>();
        for (OrderDetail detail : orderDetails) {
            ResOrderItem res = new ResOrderItem();
            res.setId(detail.getId());
            res.setQuantity(detail.getQuantity());
            res.setPrice(detail.getPrice());
            res.setTotal(detail.getPrice() * detail.getQuantity());
            if (detail.getDish() != null) {
                res.setName(detail.getDish().getName());
                res.setImageUrl(detail.getDish().getImageUrl());
            }
            resList.add(res);
        }
        System.out.println("check count 2" + resList.size());
        return resList;
    }

    /** ✅ Lấy tất cả đơn hàng */
    public ResultPaginationDataDTO getAllOrders(Specification<Order> spec, Pageable pageable) {
        Page<Order> pageOrder = this.orderRepository.findAll(spec, pageable);
        List<ResOrder> lstRes = new ArrayList<>();
        List<Order> lst = pageOrder.getContent();
        // lst.sort(Comparator.comparing(Order::getCreatedAt,
        // Comparator.nullsLast(Comparator.naturalOrder())));

        for (Order item : lst) {
            ResOrder res = new ResOrder();
            res.setId(item.getId());
            res.setReceiverAddress(item.getReceiverAddress());
            res.setReceiverName(item.getReceiverName());
            res.setReceiverPhone(item.getReceiverPhone());
            res.setStatus(item.getStatus());
            res.setTotalPrice(item.getTotalPrice());
            res.setDate(item.getCreatedAt());
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
        return rs;

    }

    /** ✅ Lấy đơn hàng theo người dùng */
    public ResultPaginationDataDTO getOrdersByUser(String email, Specification<Order> spec, Pageable pageable)
            throws OrderException {
        // Lấy thông tin user
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new OrderException("User not found");
        }

        // Gộp Specification với điều kiện user
        Specification<Order> userSpec = (root, query, cb) -> cb.equal(root.get("user").get("id"), user.getId());
        Specification<Order> finalSpec = (spec == null) ? userSpec : spec.and(userSpec);

        // Truy vấn phân trang
        Page<Order> pageOrder = orderRepository.findAll(finalSpec, pageable);

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
            res.setStatus(item.getStatus());
            res.setTotalPrice(item.getTotalPrice());
            res.setDate(item.getCreatedAt());
            res.setListOrderItem(ListOrderItem(item.getId())); // bạn giữ nguyên phần này
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
        return rs;
    }

    /**
     * ✅ Lấy đơn hàng theo ID
     **/
    public ResOrder getOrderById(Long id) throws OrderException {
        Optional<Order> item = orderRepository.findById(id);
        Order order = new Order();
        if (item.isPresent()) {
            order = item.get();
        } else {
            throw new OrderException("Not found order");
        }
        ResOrder res = new ResOrder();
        res.setId(order.getId());
        res.setReceiverAddress(order.getReceiverAddress());
        res.setReceiverName(order.getReceiverName());
        res.setReceiverPhone(order.getReceiverPhone());
        res.setStatus(order.getStatus());
        res.setTotalPrice(order.getTotalPrice());
        return res;
    }

    /**
     * ✅ Cập nhật trạng thái đơn hàng
     * 
     * @throws OrderException
     */
    public ResOrder updateOrderStatus(Long id, String status) throws OrderException {
        Optional<Order> item = this.orderRepository.findById(id);
        if (!item.isPresent()) {
            throw new OrderException("Not found order");
        }
        Order order = new Order();
        order = item.get();
        order.setStatus(status);
        orderRepository.save(order);
        ResOrder res = new ResOrder();
        res.setId(order.getId());
        res.setReceiverAddress(order.getReceiverAddress());
        res.setReceiverName(order.getReceiverName());
        res.setReceiverPhone(order.getReceiverPhone());
        res.setStatus(order.getStatus());
        res.setTotalPrice(order.getTotalPrice());
        return res;
    }

    /**
     * ✅ Xóa đơn hàng
     */
    public void deleteOrderById(Long id) throws OrderException {
        if (!orderRepository.existsById(id)) {
            throw new OrderException("Order not found");
        }
        orderRepository.deleteById(id);
    }

    public void updatePaymentStatus(String paymentRef, String paymentStatus) {
        Optional<Order> orderOptional = this.orderRepository.findByPaymentRef(paymentRef);
        if (orderOptional.isPresent()) {
            // update
            Order order = orderOptional.get();
            order.setPaymentStatus(paymentStatus);
            this.orderRepository.save(order);
        }
    }

    public void sendEmail(Long idOrder) {
        Optional<Order> option = this.orderRepository.findById(idOrder);

        if (option.isPresent()) {
            Order order = option.get();
            List<ResOrderItem> lst = ListOrderItem(idOrder);
            System.out.println("check lst order" + lst);
            this.emailService.sendEmailFromTemplateSync(order.getReceiverEmail(), "Restaurant", "restaurant",
                    order, lst);
        }
    }
}
