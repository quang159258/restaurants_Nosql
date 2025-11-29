package restaurant.example.restaurant.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.redis.model.Category;
import restaurant.example.restaurant.redis.model.Dish;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.redis.repository.CategoryRepository;
import restaurant.example.restaurant.redis.repository.DishRepository;
import restaurant.example.restaurant.service.notification.NotificationAudience;
import restaurant.example.restaurant.service.notification.NotificationMessage;
import restaurant.example.restaurant.service.notification.NotificationService;

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
        if ((dish.getCategoryId() == null || dish.getCategoryId().isEmpty()) && dish.getCategory() != null) {
            Map<String, Object> categoryMap = dish.getCategory();
            if (categoryMap != null && !categoryMap.isEmpty() && categoryMap.containsKey("id")) {
                Object categoryIdObj = categoryMap.get("id");
                if (categoryIdObj != null) {
                    dish.setCategoryId(String.valueOf(categoryIdObj));
                }
            }
        }
        
        if (dish.getCategoryId() == null || dish.getCategoryId().isEmpty()) {
            throw new RuntimeException("Category không hợp lệ");
        }
        
        Category category = categoryRepository.findById(dish.getCategoryId())
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy category với id = " + dish.getCategoryId()));

        Dish savedDish = dishRepository.save(dish);
        cacheService.cacheDish(Long.parseLong(savedDish.getId()), savedDish);
        checkLowStockAndNotify(savedDish);
        
        return enrichDishWithCategory(savedDish);
    }
    
    private Dish enrichDishWithCategory(Dish dish) {
        if (dish == null || dish.getCategoryId() == null || dish.getCategoryId().isEmpty()) {
            return dish;
        }
        
        try {
            Optional<Category> categoryOpt = categoryRepository.findById(dish.getCategoryId());
            if (categoryOpt.isPresent()) {
                Category category = categoryOpt.get();
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("id", category.getId());
                categoryMap.put("name", category.getName());
                dish.setCategory(categoryMap);
            }
        } catch (Exception e) {
        }
        
        return dish;
    }
    
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

    public Optional<Dish> handleGetDishById(String id) {
        Object cachedDish = cacheService.getCachedDish(Long.parseLong(id));
        if (cachedDish instanceof Dish) {
            return Optional.of(enrichDishWithCategory((Dish) cachedDish));
        }
        
        Optional<Dish> dish = this.dishRepository.findById(id);
        if (dish.isPresent()) {
            Dish enrichedDish = enrichDishWithCategory(dish.get());
            cacheService.cacheDish(Long.parseLong(id), enrichedDish);
            return Optional.of(enrichedDish);
        }
        return Optional.empty();
    }

    public ResultPaginationDataDTO handleGetAllDish(Pageable pageable) {
        Page<Dish> pageDish = this.dishRepository.findAll(pageable);
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta meta = new ResultPaginationDataDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());

        meta.setPages(pageDish.getTotalPages());
        meta.setTotal(pageDish.getTotalElements());
        rs.setMeta(meta);
        
        List<Dish> enrichedDishes = pageDish.getContent().stream()
                .map(this::enrichDishWithCategory)
                .collect(Collectors.toList());
        rs.setResult(enrichedDishes);
        return rs;
    }
    
    public ResultPaginationDataDTO handleGetDishesByCategory(String categoryId, Pageable pageable) {
        List<Dish> allCategoryDishes = this.dishRepository.findByCategoryId(categoryId);
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        
        List<Dish> pageContent = allCategoryDishes.stream()
                .skip(start)
                .limit(size)
                .collect(Collectors.toList());
        
        // Calculate total pages
        int totalPages = (int) Math.ceil((double) allCategoryDishes.size() / size);
        
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta meta = new ResultPaginationDataDTO.Meta();
        meta.setPage(page + 1);
        meta.setPageSize(size);
        meta.setPages(totalPages);
        meta.setTotal(allCategoryDishes.size());
        rs.setMeta(meta);
        
        List<Dish> enrichedDishes = pageContent.stream()
                .map(this::enrichDishWithCategory)
                .collect(Collectors.toList());
        rs.setResult(enrichedDishes);
        return rs;
    }

    public Dish handleUpdateDish(Dish dish) {
        if ((dish.getCategoryId() == null || dish.getCategoryId().isEmpty()) && dish.getCategory() != null) {
            Map<String, Object> categoryMap = dish.getCategory();
            if (categoryMap != null && !categoryMap.isEmpty() && categoryMap.containsKey("id")) {
                Object categoryIdObj = categoryMap.get("id");
                if (categoryIdObj != null) {
                    dish.setCategoryId(String.valueOf(categoryIdObj));
                }
            }
        }
        
        if (dish.getCategoryId() == null || dish.getCategoryId().isEmpty()) {
            if (dish.getId() == null || dish.getId().isEmpty()) {
                throw new RuntimeException("Dish ID không hợp lệ");
            }
            
            Optional<Dish> existingDishOpt = this.dishRepository.findById(dish.getId());
            if (existingDishOpt.isPresent()) {
                Dish existingDish = existingDishOpt.get();
                dish.setCategoryId(existingDish.getCategoryId());
            } else {
                throw new RuntimeException("Không tìm thấy dish với id = " + dish.getId());
            }
        }
        
        Category category = categoryRepository.findById(dish.getCategoryId())
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy category với id = " + dish.getCategoryId()));
        
        Dish updatedDish = this.dishRepository.save(dish);
        cacheService.cacheDish(Long.parseLong(updatedDish.getId()), updatedDish);
        
        return enrichDishWithCategory(updatedDish);
    }

    public void handleDeleteDishById(String id) {
        this.dishRepository.deleteById(id);
        cacheService.deleteCachedDish(Long.parseLong(id));
    }
}
