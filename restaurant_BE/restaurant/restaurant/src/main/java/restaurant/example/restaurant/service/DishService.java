package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Category;
import restaurant.example.restaurant.domain.Dish;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.repository.CategoryRepository;
import restaurant.example.restaurant.repository.DishRepository;
import restaurant.example.restaurant.service.notification.NotificationAudience;
import restaurant.example.restaurant.service.notification.NotificationMessage;
import restaurant.example.restaurant.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class DishService {
    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    
    @Autowired
    private CacheService cacheService;

    public DishService(DishRepository dishRepository, CategoryRepository categoryRepository,
            NotificationService notificationService) {
        this.dishRepository = dishRepository;
        this.categoryRepository = categoryRepository;
        this.notificationService = notificationService;
    }

    public Dish handleCreatedDish(Dish dish) {
        if (dish.getCategory() != null && dish.getCategory().getId() != null) {
            // Lấy Category từ DB theo ID
            Category category = categoryRepository.findById(dish.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy category với id = " + dish.getCategory().getId()));

            // Gán lại Category đã load đầy đủ vào dish
            dish.setCategory(category);
        } else {
            throw new RuntimeException("Category không hợp lệ");
        }

        Dish savedDish = dishRepository.save(dish);
        
        // Cache the saved dish
        cacheService.cacheDish(savedDish.getId(), savedDish);
        
        // Kiểm tra tồn kho thấp và gửi thông báo
        checkLowStockAndNotify(savedDish);
        
        return savedDish;
    }
    
    /**
     * Kiểm tra tồn kho thấp và gửi thông báo cho admin
     */
    private void checkLowStockAndNotify(Dish dish) {
        if (dish.getStock() != null && dish.getStock() <= 10) {
            notificationService.enqueue(NotificationMessage.builder()
                    .audience(NotificationAudience.SUPER_ADMIN)
                    .put("type", "low_stock")
                    .put("dishName", dish.getName())
                    .put("currentStock", dish.getStock())
                    .put("message", "Tồn kho thấp: " + dish.getName())
                    .build());
        }
    }

    public Optional<Dish> handleGetDishById(Long id) {
        // Try to get from cache first
        Object cachedDish = cacheService.getCachedDish(id);
        if (cachedDish instanceof Dish) {
            return Optional.of((Dish) cachedDish);
        }
        
        // If not in cache, get from database and cache it
        Optional<Dish> dish = this.dishRepository.findById(id);
        if (dish.isPresent()) {
            cacheService.cacheDish(id, dish.get());
        }
        return dish;
    }

    public ResultPaginationDataDTO handleGetAllDish(Specification<Dish> spec, Pageable pageable) {
        Page<Dish> pageUser = this.dishRepository.findAll(spec, pageable);
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta meta = new ResultPaginationDataDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());

        meta.setPages(pageUser.getTotalPages());
        meta.setTotal(pageUser.getTotalElements());
        rs.setMeta(meta);
        rs.setResult(pageUser.getContent());
        return rs;
    }

    public Dish handleUpdateDish(Dish dish) {
        // Ensure Category is properly loaded from database to avoid TransientObjectException
        if (dish.getCategory() != null && dish.getCategory().getId() != null) {
            // Load Category from database to ensure it's in managed state
            Category category = categoryRepository.findById(dish.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy category với id = " + dish.getCategory().getId()));
            
            // Set the managed Category to the dish
            dish.setCategory(category);
        } else {
            throw new RuntimeException("Category không hợp lệ");
        }
        
        Dish updatedDish = this.dishRepository.save(dish);
        
        // Update cache
        cacheService.cacheDish(updatedDish.getId(), updatedDish);
        
        return updatedDish;
    }

    public void handleDeleteDishById(Long id) {
        this.dishRepository.deleteById(id);
        
        // Remove from cache
        cacheService.deleteCachedDish(id);
    }
}
