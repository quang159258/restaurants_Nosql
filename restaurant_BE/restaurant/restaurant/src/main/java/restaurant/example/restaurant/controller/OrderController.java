package restaurant.example.restaurant.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import restaurant.example.restaurant.util.SecurityUtil;

import jakarta.validation.Valid;
import restaurant.example.restaurant.domain.request.AdminCreateOrderRequest;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.service.OrderService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.OrderException;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** ✅ 1. Hiển thị toàn bộ đơn hàng (admin/employee) */
    @GetMapping("/all")
    public ResponseEntity<ResultPaginationDataDTO> getAllOrders(Pageable pageable) {
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    /**
     * ✅ 2. Hiển thị đơn hàng của người dùng hiện tại
     */
    @GetMapping("/my")
    public ResponseEntity<ResultPaginationDataDTO> getUserOrders(Pageable pageable) throws OrderException {
        String email = SecurityUtil.getAuthenticatedEmail();
        return ResponseEntity.ok(orderService.getOrdersByUser(email, pageable));
    }

    /**
     * ✅ 3. Lấy đơn hàng theo ID
     **/
    @GetMapping("/{id}")
    public ResponseEntity<ResOrder> getOrderById(@PathVariable String id) throws OrderException {
        ResOrder res = orderService.getOrderById(id);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/ListDish/{id}")
    public String getMethodName(@PathVariable Long id) {
        return new String();
    }

    /**
     * ✅ 4. Cập nhật trạng thái đơn hàng
     **/
    @PutMapping("/status/{id}")
    public ResponseEntity<ResOrder> updateOrderStatus(
            @PathVariable String id,
            @RequestParam("status") String status) throws OrderException {
        ResOrder updatedOrder = orderService.updateOrderStatus(id, status);
        if (updatedOrder == null) {
            throw new OrderException("Not found order");
        }
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * ✅ 5. Xóa đơn hàng
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) throws OrderException {
        orderService.deleteOrderById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin")
    @ApiMessage("Admin create order")
    public ResponseEntity<ResOrder> createOrderForAdmin(@Valid @RequestBody AdminCreateOrderRequest request)
            throws OrderException {
        ResOrder res = orderService.createOrderForAdmin(request);
        return ResponseEntity.status(201).body(res);
    }
}
