package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Dish;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class DishRepository extends BaseRedisRepository {
    
    private static final String DISH_PREFIX = "dish:";
    private static final String DISH_LIST = "dish:list";
    private static final String DISH_INDEX_CATEGORY = "dish:index:category:";
    private static final String DISH_COUNTER = "dish:counter";
    private static final String CATEGORY_DISHES = "category:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(DISH_COUNTER);
        return String.valueOf(id);
    }
    
    public Dish save(Dish dish) {
        if (dish.getId() == null || dish.getId().isEmpty()) {
            dish.setId(generateId());
        }
        
        String key = DISH_PREFIX + dish.getId();
        redisTemplate.opsForValue().set(key, dish);
        
        // Update category index
        if (dish.getCategoryId() != null) {
            redisTemplate.opsForSet().add(
                DISH_INDEX_CATEGORY + dish.getCategoryId(), 
                dish.getId()
            );
            redisTemplate.opsForSet().add(
                CATEGORY_DISHES + dish.getCategoryId() + ":dishes",
                dish.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(DISH_LIST, dish.getId());
        
        return dish;
    }
    
    public Optional<Dish> findById(String id) {
        String key = DISH_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Dish dish = convertToModel(value, Dish.class);
        return Optional.ofNullable(dish);
    }
    
    public List<Dish> findAll() {
        Set<Object> dishIds = redisTemplate.opsForSet().members(DISH_LIST);
        if (dishIds == null) return new ArrayList<>();
        
        List<Dish> dishes = new ArrayList<>();
        for (Object id : dishIds) {
            findById((String) id).ifPresent(dishes::add);
        }
        return dishes;
    }
    
    public Page<Dish> findAll(Pageable pageable) {
        List<Dish> allDishes = findAll();
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        
        List<Dish> pageContent = allDishes.stream()
            .skip(start)
            .limit(size)
            .collect(Collectors.toList());
        
        return new PageImpl<>(pageContent, pageable, allDishes.size());
    }
    
    public List<Dish> findByCategoryId(String categoryId) {
        Set<Object> dishIds = redisTemplate.opsForSet().members(
            CATEGORY_DISHES + categoryId + ":dishes"
        );
        if (dishIds == null) return new ArrayList<>();
        
        List<Dish> dishes = new ArrayList<>();
        for (Object id : dishIds) {
            findById((String) id).ifPresent(dishes::add);
        }
        return dishes;
    }
    
    public void deleteById(String id) {
        Dish dish = findById(id).orElse(null);
        if (dish != null) {
            // Remove from category index
            if (dish.getCategoryId() != null) {
                redisTemplate.opsForSet().remove(
                    DISH_INDEX_CATEGORY + dish.getCategoryId(),
                    id
                );
                redisTemplate.opsForSet().remove(
                    CATEGORY_DISHES + dish.getCategoryId() + ":dishes",
                    id
                );
            }
            // Remove from list
            redisTemplate.opsForSet().remove(DISH_LIST, id);
            // Delete entity
            redisTemplate.delete(DISH_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(DISH_PREFIX + id);
    }
    
    public int resetDailySoldCount() {
        List<Dish> allDishes = findAll();
        int count = 0;
        for (Dish dish : allDishes) {
            dish.setSoldToday(0);
            save(dish);
            count++;
        }
        return count;
    }
}

