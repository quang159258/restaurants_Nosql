package restaurant.example.restaurant.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import restaurant.example.restaurant.domain.Cart;
import restaurant.example.restaurant.domain.CartDetail;
import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.request.CartItemUpdate;
import restaurant.example.restaurant.domain.request.CheckoutRequest;
import restaurant.example.restaurant.domain.response.ResCartItem;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.CheckoutResponse;
import restaurant.example.restaurant.domain.response.ResCartDTO;
import jakarta.servlet.http.HttpServletRequest;
import restaurant.example.restaurant.service.CartDetailService;
import restaurant.example.restaurant.service.CartService;
import restaurant.example.restaurant.service.OrderService;
import restaurant.example.restaurant.service.VnpayService;
import restaurant.example.restaurant.service.VnpayService.PaymentUrlResponse;
import restaurant.example.restaurant.repository.OrderRepository;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.error.CartException;

@RestController
@RequestMapping("/cart") // Base path cho tất cả API giỏ hàng
public class CartController {

    private final UserService userService;
    private final CartService cartService;
    private final CartDetailService cartDetailService;
    private final OrderService orderService;
    private final VnpayService vnpayService;
    private final OrderRepository orderRepository;

    public CartController(UserService userService, CartService cartService, CartDetailService cartDetailService,
            OrderService orderService, VnpayService vnpayService, OrderRepository orderRepository) {
        this.userService = userService;
        this.cartService = cartService;
        this.cartDetailService = cartDetailService;
        this.orderService = orderService;
        this.vnpayService = vnpayService;
        this.orderRepository = orderRepository;
    }

    /**
     * Lấy giỏ hàng của người dùng hiện tại
     * 
     * 
     */
    @GetMapping
    @ApiMessage("Get cart")
    public ResponseEntity<ResCartDTO> getCart() throws CartException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.handelGetUserByUsername(username);

        Cart cart = cartService.getCartByUserId(currentUser.getId());
        ResCartDTO resCartDTO = new ResCartDTO();
        int totalItems = cart.getCartDetails() != null ? cart.getCartDetails().size() : 0;
        resCartDTO.setTotalItems(totalItems);
        double totalPrice = cart.getCartDetails() != null
                ? cart.getCartDetails().stream()
                .mapToDouble(CartDetail::getTotal)
                        .sum()
                : 0;
        resCartDTO.setId(cart.getId());
        resCartDTO.setTotalPrice(totalPrice);
        return ResponseEntity.ok(resCartDTO);
    }

    /**
     * Xóa toàn bộ giỏ hàng
     * 
     * 
     */
    @DeleteMapping
    @ApiMessage("Delete cart")
    public ResponseEntity<ResCartDTO> clearCart() throws CartException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.handelGetUserByUsername(username);
        Cart cart = cartService.getCartByUserId(currentUser.getId());
        List<CartDetail> lst = cart.getCartDetails();
        if (lst != null) {
            for (CartDetail cartDetail : lst) {
                this.cartDetailService.handleDeleteByID(cartDetail.getId());
            }
        }
        cartService.evictCartCache(currentUser.getId());

        ResCartDTO resCartDTO = new ResCartDTO();
        resCartDTO.setTotalItems(0);
        resCartDTO.setTotalPrice(0);
        resCartDTO.setId(cart.getId());
        return ResponseEntity.ok(resCartDTO);
    }

    /**
     * Thêm món vào giỏ hàng
     * 
     * 
     */
    @PostMapping("/add-dish")
    @ApiMessage("add item in cart")
    public ResponseEntity<ResCartItem> addToCart(@RequestBody CartDetail request) throws CartException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResCartItem item = cartService.addToCart(request, email);
        if (item == null) {
            throw new CartException("error add item");
        }
        return ResponseEntity.ok(item);
    }

    /**
     * Lấy tất cả món trong giỏ hàng của user hiện tại
     * 
     * 
     */
    @GetMapping("/get-all-dish")
    @ApiMessage("get all item")
    public ResponseEntity<List<ResCartItem>> getCartItems() throws CartException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ResCartItem> lstRes = cartService.getCartItemsByUserEmail(email);
        return ResponseEntity.ok(lstRes);
    }

    /**
     * Cập nhật số lượng món trong giỏ hàng
     * 
     * 
     */
    @PutMapping("/update-dish")
    @ApiMessage("update quantity")
    public ResponseEntity<ResCartItem> updateQuantity(@RequestBody CartItemUpdate dto) throws CartException {
        ResCartItem updated = cartService.updateQuantity(dto.getId(), dto.getQuantity());
        if (updated == null) {
            throw new CartException("Update fall");
        }
        return ResponseEntity.ok(updated);
    }

    /**
     * Xóa một món khỏi giỏ hàng
     * 
     * 
     */
    @DeleteMapping("/delete-dish/{id}")
    @ApiMessage("delete item")
    public ResponseEntity<Void> deleteCartItem(@PathVariable("id") Long cartItemId) throws CartException {
        cartService.removeItem(cartItemId);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/checkout")
    @ApiMessage("Checkout cart")
    public ResponseEntity<CheckoutResponse> checkoutCart(@RequestBody CheckoutRequest request,
            HttpServletRequest servletRequest) throws CartException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.handelGetUserByUsername(username);
        Cart cart = cartService.getCartByUserId(user.getId());

        if (cart.getCartDetails() == null || cart.getCartDetails().isEmpty()) {
            throw new CartException("Giỏ hàng trống, không thể tạo đơn hàng.");
        }

        PaymentMethod paymentMethod = PaymentMethod.CASH;
        String paymentMethodRaw = request.getPaymentMethod();
        if (paymentMethodRaw != null && !paymentMethodRaw.isBlank()) {
            try {
                paymentMethod = PaymentMethod.valueOf(paymentMethodRaw.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new CartException("Unsupported payment method. Only CASH is available.");
            }
        }
        if (!PaymentMethod.CASH.equals(paymentMethod) && !PaymentMethod.VNPAY.equals(paymentMethod)) {
            throw new CartException("Unsupported payment method.");
        }

        // Tạo order
        Order order = orderService.createOrderFromCart(cart,
                request.getReceiverName(),
                request.getReceiverPhone(),
                request.getReceiverAddress(),
                request.getReceiverEmail(),
                paymentMethod);
        // Xoá cart detail
        if (cart.getCartDetails() != null) {
            for (CartDetail detail : cart.getCartDetails()) {
                cartDetailService.handleDeleteByID(detail.getId());
            }
        }
        cartService.evictCartCache(user.getId());

        // Chuẩn bị response
        CheckoutResponse res = new CheckoutResponse();
        res.setOrderId(order.getId());
        res.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        res.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null);

        if (PaymentMethod.VNPAY.equals(paymentMethod)) {
            try {
                PaymentUrlResponse paymentResponse = vnpayService.createPayment(order,
                        servletRequest != null ? servletRequest.getRemoteAddr() : "127.0.0.1");
                order.setPaymentRef(paymentResponse.getTxnRef());
                orderRepository.save(order);
                res.setPaymentUrl(paymentResponse.getPaymentUrl());
            } catch (IllegalStateException ex) {
                throw new CartException("VNPay chưa được cấu hình, vui lòng chọn phương thức khác.");
            }
        }

        this.orderService.sendEmail(order.getId());
        return ResponseEntity.ok(res);
    }

}
