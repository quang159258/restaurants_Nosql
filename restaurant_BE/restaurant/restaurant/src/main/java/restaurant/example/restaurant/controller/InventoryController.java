package restaurant.example.restaurant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant.example.restaurant.domain.Dish;
import restaurant.example.restaurant.service.DishService;
import restaurant.example.restaurant.service.notification.NotificationAudience;
import restaurant.example.restaurant.service.notification.NotificationMessage;
import restaurant.example.restaurant.service.notification.NotificationService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    @Autowired
    private DishService dishService;
    
    @Autowired
    private NotificationService notificationService;

    /**
     * Cập nhật tồn kho cho một sản phẩm
     */
    @PutMapping("/stock/{dishId}")
    public ResponseEntity<?> updateStock(@PathVariable Long dishId, @RequestBody Map<String, Integer> request) {
        try {
            Integer newStock = request.get("stock");
            if (newStock == null || newStock < 0) {
                return ResponseEntity.badRequest().body("Số lượng tồn kho không hợp lệ");
            }

            Optional<Dish> dishOpt = dishService.handleGetDishById(dishId);
            if (!dishOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Dish dish = dishOpt.get();
            Integer oldStock = dish.getStock();
            dish.setStock(newStock);
            dishService.handleUpdateDish(dish);

            notifyStockChange(dish.getName(), oldStock, newStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật tồn kho thành công");
            response.put("data", Map.of(
                "dishId", dishId,
                "dishName", dish.getName(),
                "oldStock", oldStock,
                "newStock", newStock
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi cập nhật tồn kho: " + e.getMessage());
        }
    }

    /**
     * Nhập thêm hàng vào kho
     */
    @PostMapping("/import/{dishId}")
    public ResponseEntity<?> importStock(@PathVariable Long dishId, @RequestBody Map<String, Integer> request) {
        try {
            Integer importQuantity = request.get("quantity");
            if (importQuantity == null || importQuantity <= 0) {
                return ResponseEntity.badRequest().body("Số lượng nhập không hợp lệ");
            }

            Optional<Dish> dishOpt = dishService.handleGetDishById(dishId);
            if (!dishOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Dish dish = dishOpt.get();
            Integer currentStock = dish.getStock() != null ? dish.getStock() : 0;
            dish.setStock(currentStock + importQuantity);
            dishService.handleUpdateDish(dish);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Nhập kho thành công");
            response.put("data", Map.of(
                "dishId", dishId,
                "dishName", dish.getName(),
                "importQuantity", importQuantity,
                "oldStock", currentStock,
                "newStock", dish.getStock()
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi nhập kho: " + e.getMessage());
        }
    }

    /**
     * Lấy thông tin tồn kho của một sản phẩm
     */
    @GetMapping("/stock/{dishId}")
    public ResponseEntity<?> getStock(@PathVariable Long dishId) {
        try {
            Optional<Dish> dishOpt = dishService.handleGetDishById(dishId);
            if (!dishOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Dish dish = dishOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of(
                "dishId", dishId,
                "dishName", dish.getName(),
                "stock", dish.getStock() != null ? dish.getStock() : 0,
                "soldToday", dish.getSoldToday() != null ? dish.getSoldToday() : 0,
                "available", dish.getAvailable()
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi lấy thông tin tồn kho: " + e.getMessage());
        }
    }

    private void notifyStockChange(String dishName, Integer oldStock, Integer newStock) {
        NotificationMessage payload = NotificationMessage.builder()
                .put("type", "stock_update")
                .put("dishName", dishName)
                .put("oldStock", oldStock)
                .put("newStock", newStock)
                .put("message", "Tồn kho " + dishName + " thay đổi từ " + oldStock + " -> " + newStock)
                .build();
        notificationService.enqueue(NotificationMessage.builder()
                .audience(NotificationAudience.SUPER_ADMIN)
                .payload(payload.getPayload())
                .build());
        notificationService.enqueue(NotificationMessage.builder()
                .audience(NotificationAudience.STAFF)
                .payload(payload.getPayload())
                .build());
    }
}
