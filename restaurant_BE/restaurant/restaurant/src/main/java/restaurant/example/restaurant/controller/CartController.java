package restaurant.example.restaurant.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import restaurant.example.restaurant.util.SecurityUtil;

import restaurant.example.restaurant.redis.model.Cart;
import restaurant.example.restaurant.redis.model.CartDetail;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.domain.request.CartItemUpdate;
import restaurant.example.restaurant.domain.request.CheckoutRequest;
import restaurant.example.restaurant.domain.response.ResCartItem;
import restaurant.example.restaurant.domain.response.CheckoutResponse;
import restaurant.example.restaurant.domain.response.ResCartDTO;
import jakarta.servlet.http.HttpServletRequest;
import restaurant.example.restaurant.service.CartDetailService;
import restaurant.example.restaurant.service.CartService;
import restaurant.example.restaurant.service.OrderService;
import restaurant.example.restaurant.service.VnpayService;
import restaurant.example.restaurant.service.VnpayService.PaymentUrlResponse;
import restaurant.example.restaurant.redis.repository.OrderRepository;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.error.CartException;

@RestController
@RequestMapping("/cart")
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

    @GetMapping
    @ApiMessage("Get cart")
    public ResponseEntity<ResCartDTO> getCart() throws CartException {
        String username = SecurityUtil.getAuthenticatedEmail();
        User currentUser = userService.handelGetUserByUsername(username);
        ResCartDTO resCartDTO = cartService.getCartWithItems(currentUser.getId());
        return ResponseEntity.ok(resCartDTO);
    }

    @DeleteMapping
    @ApiMessage("Delete cart")
    public ResponseEntity<ResCartDTO> clearCart() throws CartException {
        String username = SecurityUtil.getAuthenticatedEmail();
        User currentUser = userService.handelGetUserByUsername(username);
        Cart cart = cartService.getCartByUserId(currentUser.getId());
        List<CartDetail> lst = cart.getItems();
        if (lst != null) {
            for (CartDetail cartDetail : lst) {
                this.cartDetailService.handleDeleteByID(cartDetail.getId());
            }
        }
        cartService.evictCartCache(currentUser.getId());

        ResCartDTO resCartDTO = new ResCartDTO();
        resCartDTO.setTotalItems(0);
        resCartDTO.setTotalPrice(java.math.BigDecimal.ZERO);
        resCartDTO.setId(cart.getId());
        return ResponseEntity.ok(resCartDTO);
    }

    @PostMapping("/add-dish")
    @ApiMessage("add item in cart")
    public ResponseEntity<ResCartItem> addToCart(@RequestBody CartDetail request) throws CartException {
        String email = SecurityUtil.getAuthenticatedEmail();
        ResCartItem item = cartService.addToCart(request, email);
        if (item == null) {
            throw new CartException("error add item");
        }
        return ResponseEntity.ok(item);
    }

    @GetMapping("/get-all-dish")
    @ApiMessage("get all item")
    public ResponseEntity<List<ResCartItem>> getCartItems() throws CartException {
        String email = SecurityUtil.getAuthenticatedEmail();
        List<ResCartItem> lstRes = cartService.getCartItemsByUserEmail(email);
        return ResponseEntity.ok(lstRes);
    }

    @PutMapping("/update-dish")
    @ApiMessage("update quantity")
    public ResponseEntity<ResCartItem> updateQuantity(@RequestBody CartItemUpdate dto) throws CartException {
        String cartItemId = dto.getCartItemId();
        if (cartItemId == null || cartItemId.isEmpty()) {
            if (dto.getDishId() != null && !dto.getDishId().isEmpty()) {
                String email = SecurityUtil.getAuthenticatedEmail();
                User user = userService.handelGetUserByUsername(email);
                Cart cart = cartService.getCartByUserId(user.getId());
                if (cart != null && cart.getItems() != null) {
                    for (CartDetail item : cart.getItems()) {
                        if (dto.getDishId().equals(item.getDishId())) {
                            cartItemId = item.getId();
                            break;
                        }
                    }
                }
            }
        }
        if (cartItemId == null || cartItemId.isEmpty()) {
            throw new CartException("Cart item ID is required");
        }
        ResCartItem updated = cartService.updateQuantity(cartItemId, dto.getQuantity());
        if (updated == null) {
            throw new CartException("Update fall");
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete-dish/{id}")
    @ApiMessage("delete item")
    public ResponseEntity<Void> deleteCartItem(@PathVariable("id") String cartItemId) throws CartException {
        cartService.removeItem(cartItemId);
        return ResponseEntity.ok(null);
    }

    @PostMapping(value = "/checkout", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ApiMessage("Checkout cart")
    public ResponseEntity<CheckoutResponse> checkoutCart(@RequestBody CheckoutRequest request,
            HttpServletRequest servletRequest) throws CartException {
        String username = SecurityUtil.getAuthenticatedEmail();
        User user = userService.handelGetUserByUsername(username);
        Cart cart = cartService.getCartByUserId(user.getId());

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
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

        Order order = orderService.createOrderFromCart(cart,
                request.getReceiverName(),
                request.getReceiverPhone(),
                request.getReceiverAddress(),
                request.getReceiverEmail(),
                paymentMethod);
        if (cart.getItems() != null) {
            for (CartDetail detail : cart.getItems()) {
                cartDetailService.handleDeleteByID(detail.getId());
            }
        }
        cartService.evictCartCache(user.getId());

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
