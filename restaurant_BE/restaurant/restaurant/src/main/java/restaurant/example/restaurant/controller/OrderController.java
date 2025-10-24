package restaurant.example.restaurant.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.turkraft.springfilter.boot.Filter;

import restaurant.example.restaurant.domain.Dish;
import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.response.ResOrder;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.service.OrderService;
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
    public ResponseEntity<ResultPaginationDataDTO> getAllOrders(@Filter Specification<Order> spec,
            Pageable pageable) {

        return ResponseEntity.ok(orderService.getAllOrders(spec, pageable));
    }

    /**
     * ✅ 2. Hiển thị đơn hàng của người dùng hiện tại
     */
    @GetMapping("/my")
    public ResponseEntity<ResultPaginationDataDTO> getUserOrders(
            @Filter Specification<Order> spec,
            Pageable pageable) throws OrderException {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(orderService.getOrdersByUser(email, spec, pageable));
    }

    /**
     * ✅ 3. Lấy đơn hàng theo ID
     **/
    @GetMapping("/{id}")
    public ResponseEntity<ResOrder> getOrderById(@PathVariable Long id) throws OrderException {
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
            @PathVariable Long id,
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
}
