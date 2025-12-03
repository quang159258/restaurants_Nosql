package restaurant.example.restaurant.redis.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Instant;
import java.util.Map;

public abstract class BaseRedisRepository {
    
    @Autowired
    protected RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    protected ObjectMapper objectMapper;
    
    protected <T> T convertToModel(Object value, Class<T> clazz) {
        if (value == null) {
            return null;
        }
        if (clazz.isInstance(value)) {
            return clazz.cast(value);
        }
        if (value instanceof Map) {
            try {
                return objectMapper.convertValue(value, clazz);
            } catch (Exception e) {
                return convertMapToModel((Map<String, Object>) value, clazz);
            }
        }
        return null;
    }
    
    @SuppressWarnings("unchecked")
    private <T> T convertMapToModel(Map<String, Object> map, Class<T> clazz) {
        try {
            T instance = clazz.getDeclaredConstructor().newInstance();
            
            java.lang.reflect.Field[] fields = clazz.getDeclaredFields();
            for (java.lang.reflect.Field field : fields) {
                field.setAccessible(true);
                Object value = map.get(field.getName());
                if (value != null) {
                    Class<?> fieldType = field.getType();
                    if (fieldType == Instant.class) {
                        if (value instanceof String) {
                            field.set(instance, Instant.parse(value.toString()));
                        } else if (value instanceof Number) {
                            field.set(instance, Instant.ofEpochMilli(((Number) value).longValue()));
                        }
                    } else if (fieldType == String.class) {
                        field.set(instance, value.toString());
                    } else if (fieldType.isEnum()) {
                        field.set(instance, Enum.valueOf((Class<Enum>) fieldType, value.toString()));
                    } else if (Number.class.isAssignableFrom(fieldType)) {
                        if (fieldType == Long.class || fieldType == long.class) {
                            field.set(instance, Long.valueOf(value.toString()));
                        } else if (fieldType == Integer.class || fieldType == int.class) {
                            field.set(instance, Integer.valueOf(value.toString()));
                        } else if (fieldType == Double.class || fieldType == double.class) {
                            field.set(instance, Double.valueOf(value.toString()));
                        }
                    } else {
                        field.set(instance, value);
                    }
                }
            }
            return instance;
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert Map to " + clazz.getSimpleName(), e);
        }
    }
}

