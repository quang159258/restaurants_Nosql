package restaurant.example.restaurant.redis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import restaurant.example.restaurant.redis.model.Role;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class RoleRepository extends BaseRedisRepository {
    
    private static final String ROLE_PREFIX = "role:";
    private static final String ROLE_LIST = "role:list";
    private static final String ROLE_INDEX_NAME = "role:index:name:";
    private static final String ROLE_COUNTER = "role:counter";
    private static final String ROLE_PERMISSIONS = "role:";
    
    public String generateId() {
        Long id = redisTemplate.opsForValue().increment(ROLE_COUNTER);
        return String.valueOf(id);
    }
    
    public Role save(Role role) {
        if (role.getId() == null || role.getId().isEmpty()) {
            role.setId(generateId());
        }
        
        String key = ROLE_PREFIX + role.getId();
        redisTemplate.opsForValue().set(key, role);
        
        // Update name index
        if (role.getName() != null) {
            redisTemplate.opsForValue().set(
                ROLE_INDEX_NAME + role.getName(),
                role.getId()
            );
        }
        
        // Add to list
        redisTemplate.opsForSet().add(ROLE_LIST, role.getId());
        
        return role;
    }
    
    public Optional<Role> findById(String id) {
        String key = ROLE_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        Role role = convertToModel(value, Role.class);
        return Optional.ofNullable(role);
    }
    
    public Role findByName(String name) {
        String roleIdKey = ROLE_INDEX_NAME + name;
        String roleId = (String) redisTemplate.opsForValue().get(roleIdKey);
        if (roleId == null) return null;
        return findById(roleId).orElse(null);
    }
    
    public boolean existsByName(String name) {
        String roleIdKey = ROLE_INDEX_NAME + name;
        return redisTemplate.hasKey(roleIdKey);
    }
    
    public List<Role> findAll() {
        Set<Object> roleIds = redisTemplate.opsForSet().members(ROLE_LIST);
        if (roleIds == null) return new ArrayList<>();
        
        List<Role> roles = new ArrayList<>();
        for (Object id : roleIds) {
            findById((String) id).ifPresent(roles::add);
        }
        return roles;
    }
    
    public Page<Role> findAll(Pageable pageable) {
        List<Role> allRoles = findAll();
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        
        List<Role> pageContent = allRoles.stream()
            .skip(start)
            .limit(size)
            .collect(Collectors.toList());
        
        return new PageImpl<>(pageContent, pageable, allRoles.size());
    }
    
    public void addPermissionsToRole(String roleId, List<String> permissionIds) {
        String key = ROLE_PERMISSIONS + roleId + ":permissions";
        for (String permissionId : permissionIds) {
            redisTemplate.opsForSet().add(key, permissionId);
        }
    }
    
    public void updatePermissionsForRole(String roleId, List<String> permissionIds) {
        String key = ROLE_PERMISSIONS + roleId + ":permissions";
        // Delete existing permissions
        redisTemplate.delete(key);
        // Add new permissions
        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (String permissionId : permissionIds) {
                redisTemplate.opsForSet().add(key, permissionId);
            }
        }
    }
    
    public List<String> findPermissionIdsByRoleId(String roleId) {
        Set<Object> permissionIds = redisTemplate.opsForSet().members(
            ROLE_PERMISSIONS + roleId + ":permissions"
        );
        if (permissionIds == null) return new ArrayList<>();
        
        return permissionIds.stream()
            .map(String::valueOf)
            .collect(Collectors.toList());
    }
    
    public void deleteById(String id) {
        Role role = findById(id).orElse(null);
        if (role != null) {
            // Remove from name index
            if (role.getName() != null) {
                redisTemplate.delete(ROLE_INDEX_NAME + role.getName());
            }
            // Remove permissions relation
            redisTemplate.delete(ROLE_PERMISSIONS + id + ":permissions");
            // Remove from list
            redisTemplate.opsForSet().remove(ROLE_LIST, id);
            // Delete entity
            redisTemplate.delete(ROLE_PREFIX + id);
        }
    }
    
    public boolean existsById(String id) {
        return redisTemplate.hasKey(ROLE_PREFIX + id);
    }
}

