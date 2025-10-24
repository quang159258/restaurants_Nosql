package restaurant.example.restaurant.controller;

import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import restaurant.example.restaurant.domain.Cart;
import restaurant.example.restaurant.domain.CartDetail;
import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.request.CartItemUpdate;
import restaurant.example.restaurant.domain.request.CheckoutRequest;
import restaurant.example.restaurant.domain.response.ResCartItem;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.VnpayCallback;
import restaurant.example.restaurant.domain.response.CheckoutResponse;
import restaurant.example.restaurant.domain.response.ResCartDTO;
import restaurant.example.restaurant.service.CartDetailService;
import restaurant.example.restaurant.service.CartService;
import restaurant.example.restaurant.service.OrderService;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.service.VNPayService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.CartException;

@RestController
@RequestMapping("/cart") // Base path cho tất cả API giỏ hàng
public class CartController {

    private final UserService userService;
    private final CartService cartService;
    private final CartDetailService cartDetailService;
    private final OrderService orderService;
    private final VNPayService vnpayService;

    public CartController(UserService userService, CartService cartService, CartDetailService cartDetailService,
            OrderService orderService, VNPayService vnpayService) {
        this.userService = userService;
        this.cartService = cartService;
        this.cartDetailService = cartDetailService;
        this.orderService = orderService;
        this.vnpayService = vnpayService;
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

        Cart cart = cartService.getCartById(currentUser.getId());
        if (cart == null) {
            throw new CartException("Not found cart");
        }
        ResCartDTO resCartDTO = new ResCartDTO();
        resCartDTO.setTotalItems(cart.getCartDetails().size());
        double totalPrice = cart.getCartDetails().stream()
                .mapToDouble(CartDetail::getTotal)
                .sum();
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
        Cart cart = cartService.getCartById(currentUser.getId());
        if (cart == null) {
            throw new CartException("Not found cart");
        }
        List<CartDetail> lst = cart.getCartDetails();
        for (CartDetail cartDetail : lst) {
            this.cartDetailService.handleDeleteByID(cartDetail.getId());
        }

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
        if (lstRes.isEmpty()) {
            throw new CartException("Not item in my cart");
        }
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

    // @PostMapping("/checkout")
    // @ApiMessage("Checkout cart")
    // public ResponseEntity<ResOrder> checkoutCart(@RequestBody CheckoutRequest
    // request, HttpServletRequest req) {
    // String username =
    // SecurityContextHolder.getContext().getAuthentication().getName();
    // User user = userService.handelGetUserByUsername(username);
    // Cart cart = cartService.getCartById(user.getId());

    // System.out.println("Check payment method" + request);
    // // Tạo order từ cart
    // final String uuid = UUID.randomUUID().toString().replace("-", "");

    // Order order = orderService.createOrderFromCart(cart,
    // request.getReceiverName(),
    // request.getReceiverPhone(), request.getReceiverAddress(),
    // request.getReceiverEmail(),
    // request.getPaymentMethod(), uuid);

    // // if (!request.getPaymentMethod().equals("COD")) {
    // // // todo: redirect to VNPAY
    // // String ip = this.vnpayService.getIpAddress(req);
    // // String vnpUrl =
    // this.vnpayService.generateVNPayURL((order.getTotalPrice()),
    // // uuid, ip);

    // // return ResponseEntity.ok(vnpUrl);
    // // return "redirect:" + vnpUrl;
    // // }

    // // Xóa cartDetail sau khi checkout
    // for (CartDetail detail : cart.getCartDetails()) {
    // cartDetailService.handleDeleteByID(detail.getId());
    // }

    // // cart.setCheckedOut(true);
    // // cartService.save(cart); // hoặc cartRepository.save(cart)
    // ResOrder res = new ResOrder();
    // res.setId(order.getId());
    // res.setReceiverAddress(order.getReceiverAddress());
    // res.setReceiverName(order.getReceiverName());
    // res.setReceiverPhone(order.getReceiverPhone());
    // res.setStatus(order.getStatus());
    // res.setTotalPrice(order.getTotalPrice());
    // return ResponseEntity.ok(res);
    // }

    @PostMapping("/checkout")
    @ApiMessage("Checkout cart")
    public ResponseEntity<CheckoutResponse> checkoutCart(@RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest) throws UnsupportedEncodingException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.handelGetUserByUsername(username);
        Cart cart = cartService.getCartById(user.getId());

        // Sinh mã đơn hàng
        final String uuid = UUID.randomUUID().toString().replace("-", "");

        // Tạo order
        Order order = orderService.createOrderFromCart(cart,
                request.getReceiverName(),
                request.getReceiverPhone(),
                request.getReceiverAddress(),
                request.getReceiverEmail(),
                request.getPaymentMethod(),
                uuid);
        // Xoá cart detail
        for (CartDetail detail : cart.getCartDetails()) {
            cartDetailService.handleDeleteByID(detail.getId());
        }

        // Chuẩn bị response
        CheckoutResponse res = new CheckoutResponse();
        res.setOrderId(order.getId());
        res.setStatus(order.getStatus());
        res.setPaymentMethod(order.getPaymentMethod());

        // Nếu là VNPay thì sinh URL để FE redirect
        if ("BANKING".equalsIgnoreCase(request.getPaymentMethod())) {
            String ip = vnpayService.getIpAddress(httpRequest);
            String vnpUrl = vnpayService.generateVNPayURL(order.getTotalPrice(), uuid, ip);
            res.setPaymentUrl(vnpUrl);
        }

        this.orderService.sendEmail(order.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/call-back-vnpay")
    public ResponseEntity<String> thanks(@RequestBody VnpayCallback callback) {
        String vnpResponseCode = callback.getVnp_ResponseCode();
        String vnpTxnRef = callback.getVnp_TxnRef();

        String paymentStatus = vnpResponseCode.equals("00") ? "PAYMENT_SUCCEED" : "PAYMENT_FAILED";
        orderService.updatePaymentStatus(vnpTxnRef, paymentStatus);

        return ResponseEntity.status(HttpStatus.OK).body("Payment status updated");
    }

}
