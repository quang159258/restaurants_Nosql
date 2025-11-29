package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Permission;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class PermissionRepository extends BaseRedisRepository {
    
    private static final String PERMISSION_PREFIX = "permission:";
    private static final String PERMISSION_LIST = "permission:list";
    private static final String PERMISSION_INDEX_MODULE_API_METHOD = "permission:index:";
    private static final String PERMISSION_COUNTER = "permission:counter";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(PERMISSION_COUNTER);
        return String.valueOf(id);
    }
    
    public Permission save(Permission permission) {
        if (permission.getId() == null || permission.getId().isEmpty()) {
            permission.setId(generateId());
        }
        
        String key = PERMISSION_PREFIX + permission.getId();
        redisTemplate.opsForValue().set(key, permission);
        
        // Update index for module+apiPath+method
        if (permission.getModule() != null && 
            permission.getApiPath() != null && 
            permission.getMethod() != null) {
            String indexKey = PERMISSION_INDEX_MODULE_API_METHOD + 
                permission.getModule() + ":" + 
                permission.getApiPath() + ":" + 
                permission.getMethod();
            redisTemplate.opsForValue().set(indexKey, permission.getId());
        }
        
        // Index for apiPath+method
        if (permission.getApiPath() != null && permission.getMethod() != null) {
            String apiIndexKey = "permission:index:api:" + 
                permission.getApiPath() + ":" + 
                permission.getMethod();
            redisTemplate.opsForValue().set(apiIndexKey, permission.getId());
        }
        
        // Add to list
        redisTemplate.opsForSet().add(PERMISSION_LIST, permission.getId());
        
        return permission;
    }
    
    public Optional<Permission> findById(String id) {
        String key = PERMISSION_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Permission permission = convertToModel(value, Permission.class);
        return Optional.ofNullable(permission);
    }
    
    public List<Permission> findByIdIn(List<String> ids) {
        List<Permission> permissions = new ArrayList<>();
        for (String id : ids) {
            findById(id).ifPresent(permissions::add);
        }
        return permissions;
    }
    
    public boolean existsByModuleAndApiPathAndMethod(String module, String apiPath, String method) {
        String indexKey = PERMISSION_INDEX_MODULE_API_METHOD + 
            module + ":" + apiPath + ":" + method;
        return redisTemplate.hasKey(indexKey);
    }
    
    public Permission findByApiPathAndMethod(String apiPath, String method) {
        String apiIndexKey = "permission:index:api:" + apiPath + ":" + method;
        String permissionId = (String) redisTemplate.opsForValue().get(apiIndexKey);
        if (permissionId == null) return null;
        return findById(permissionId).orElse(null);
    }
    
    public List<Permission> findAll() {
        Set<Object> permissionIds = redisTemplate.opsForSet().members(PERMISSION_LIST);
        if (permissionIds == null) return new ArrayList<>();
        
        List<Permission> permissions = new ArrayList<>();
        for (Object id : permissionIds) {
            findById((String) id).ifPresent(permissions::add);
        }
        return permissions;
    }
    
    public Page<Permission> findAll(Pageable pageable) {
        List<Permission> allPermissions = findAll();
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        
        List<Permission> pageContent = allPermissions.stream()
            .skip(start)
            .limit(size)
            .collect(Collectors.toList());
        
        return new PageImpl<>(pageContent, pageable, allPermissions.size());
    }
    
    public void deleteById(String id) {
        Permission permission = findById(id).orElse(null);
        if (permission != null) {
            // Remove from indexes
            if (permission.getModule() != null && 
                permission.getApiPath() != null && 
                permission.getMethod() != null) {
                String indexKey = PERMISSION_INDEX_MODULE_API_METHOD + 
                    permission.getModule() + ":" + 
                    permission.getApiPath() + ":" + 
                    permission.getMethod();
                redisTemplate.delete(indexKey);
            }
            if (permission.getApiPath() != null && permission.getMethod() != null) {
                String apiIndexKey = "permission:index:api:" + 
                    permission.getApiPath() + ":" + 
                    permission.getMethod();
                redisTemplate.delete(apiIndexKey);
            }
            // Remove from list
            redisTemplate.opsForSet().remove(PERMISSION_LIST, id);
            // Delete entity
            redisTemplate.delete(PERMISSION_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(PERMISSION_PREFIX + id);
    }
}

