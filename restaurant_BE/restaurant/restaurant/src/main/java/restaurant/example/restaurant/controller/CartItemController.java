// package restaurant.example.restaurant.controller;

// import java.util.List;

// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.web.bind.annotation.*;

// import restaurant.example.restaurant.domain.CartDetail;
// import restaurant.example.restaurant.service.CartService;
// import restaurant.example.restaurant.service.UserService;
// import restaurant.example.restaurant.util.anotation.ApiMessage;

// @RestController
// @RequestMapping("/cart")
// public class CartItemController {

// private final CartService cartService;
// private final UserService userService;

// public CartItemController(CartService cartService, UserService userService) {
// this.cartService = cartService;
// this.userService = userService;
// }

// /** Thêm món vào giỏ hàng */
// @PostMapping("/add-dish")
// @ApiMessage("add item in cart")
// public ResponseEntity<CartDetail> addToCart(@RequestBody CartDetail request)
// {
// String email =
// SecurityContextHolder.getContext().getAuthentication().getName();
// CartDetail item = cartService.addToCart(request, email);
// return ResponseEntity.ok(item);
// }

// /** Lấy tất cả món trong giỏ hàng của user hiện tại */
// @GetMapping("/get-all-dish")
// @ApiMessage("get all item")
// public ResponseEntity<List<CartDetail>> getCartItems() {
// String email =
// SecurityContextHolder.getContext().getAuthentication().getName();
// List<CartDetail> items = cartService.getCartItemsByUserEmail(email);
// return ResponseEntity.ok(items);
// }

// /** Cập nhật số lượng món trong giỏ hàng */
// @PutMapping("/update-dish")
// @ApiMessage("update quantity ")
// public ResponseEntity<CartDetail> updateQuantity(
// @RequestParam Long cartItemId,
// @RequestParam int quantity) {

// CartDetail updated = cartService.updateQuantity(cartItemId, quantity);
// return ResponseEntity.ok(updated);
// }

// /** Xóa một món khỏi giỏ hàng */
// @DeleteMapping("/delete-dish/{id}")
// @ApiMessage("delete item")
// public ResponseEntity<Void> deleteCartItem(@PathVariable Long cartItemId) {
// cartService.removeItem(cartItemId);
// return ResponseEntity.noContent().build();
// }
// }
