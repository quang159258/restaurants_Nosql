package restaurant.example.restaurant.redis.repository;

import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Category;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class CategoryRepository extends BaseRedisRepository {
    
    private static final String CATEGORY_PREFIX = "category:";
    private static final String CATEGORY_LIST = "category:list";
    private static final String CATEGORY_COUNTER = "category:counter";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(CATEGORY_COUNTER);
        return String.valueOf(id);
    }
    
    public Category save(Category category) {
        if (category.getId() == null || category.getId().isEmpty()) {
            category.setId(generateId());
        }
        
        String key = CATEGORY_PREFIX + category.getId();
        redisTemplate.opsForValue().set(key, category);
        
        redisTemplate.opsForSet().add(CATEGORY_LIST, category.getId());
        
        return category;
    }
    
    public Optional<Category> findById(String id) {
        String key = CATEGORY_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Category category = convertToModel(value, Category.class);
        return Optional.ofNullable(category);
    }
    
    public List<Category> findAll() {
        Set<Object> categoryIds = redisTemplate.opsForSet().members(CATEGORY_LIST);
        if (categoryIds == null) return new ArrayList<>();
        
        List<Category> categories = new ArrayList<>();
        for (Object id : categoryIds) {
            findById((String) id).ifPresent(categories::add);
        }
        return categories;
    }
    
    public void deleteById(String id) {
        redisTemplate.opsForSet().remove(CATEGORY_LIST, id);
        redisTemplate.delete(CATEGORY_PREFIX + id);
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(CATEGORY_PREFIX + id);
    }
}

