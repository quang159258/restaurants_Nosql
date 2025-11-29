package restaurant.example.restaurant.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.redis.model.Permission;
import restaurant.example.restaurant.redis.model.Role;
import restaurant.example.restaurant.domain.request.ReqRoleDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.redis.repository.PermissionRepository;
import restaurant.example.restaurant.redis.repository.RoleRepository;

@Service
public class RoleService {
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;

    public boolean existByName(String name) {
        return this.roleRepository.existsByName(name);
    }

    public Role create(Role r) {
        if (r.getPermissionIds() == null) {
            r.setPermissionIds(new ArrayList<>());
        }
        if (r.getPermissions() != null && !r.getPermissions().isEmpty()) {
            List<String> permissionIds = r.getPermissions().stream()
                    .map(Permission::getId)
                    .collect(Collectors.toList());
            r.setPermissionIds(permissionIds);
        }
        return this.roleRepository.save(r);
    }

    public Role fetchById(String id) {
        Optional<Role> roleOptional = this.roleRepository.findById(id);
        if (roleOptional.isPresent()) {
            Role role = roleOptional.get();
            
            List<String> permissionIds = roleRepository.findPermissionIdsByRoleId(role.getId());
            role.setPermissionIds(permissionIds);
            
            if (permissionIds != null && !permissionIds.isEmpty()) {
                List<Permission> permissions = permissionRepository.findByIdIn(permissionIds);
                role.setPermissions(permissions);
            } else {
                role.setPermissions(new ArrayList<>());
            }
            
            return role;
        }
        return null;
    }

    public Role update(Role r) {
        Role roleDB = this.fetchById(r.getId());
        if (roleDB == null) {
            throw new RuntimeException("Role not found with id: " + r.getId());
        }
        
        roleDB.setName(r.getName());
        roleDB.setDescription(r.getDescription());
        
        if (r.getPermissionIds() != null) {
            roleDB.setPermissionIds(r.getPermissionIds());
        } else if (r.getPermissions() != null) {
            List<String> permissionIds = r.getPermissions().stream()
                    .map(Permission::getId)
                    .collect(Collectors.toList());
            roleDB.setPermissionIds(permissionIds);
        } else {
            roleDB.setPermissionIds(new ArrayList<>());
        }
        
        roleDB = this.roleRepository.save(roleDB);
        return roleDB;
    }

    public void delete(String id) {
        this.roleRepository.deleteById(id);
    }

    public ResultPaginationDataDTO getRoles(Pageable pageable) {
        Page<Role> pRole = this.roleRepository.findAll(pageable);
        
        List<Role> rolesWithPermissions = pRole.getContent().stream()
                .map(role -> {
                    List<String> permissionIds = roleRepository.findPermissionIdsByRoleId(role.getId());
                    role.setPermissionIds(permissionIds);
                    
                    if (permissionIds != null && !permissionIds.isEmpty()) {
                        List<Permission> permissions = permissionRepository.findByIdIn(permissionIds);
                        role.setPermissions(permissions);
                    } else {
                        role.setPermissions(new ArrayList<>());
                    }
                    
                    return role;
                })
                .collect(Collectors.toList());
        
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta mt = new ResultPaginationDataDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pRole.getTotalPages());
        mt.setTotal(pRole.getTotalElements());
        rs.setMeta(mt);
        rs.setResult(rolesWithPermissions);
        return rs;
    }

    public Role createFromDTO(ReqRoleDTO reqRole) {
        Role role = new Role();
        role.setName(reqRole.getName());
        role.setDescription(reqRole.getDescription());
        
        role = this.roleRepository.save(role);
        
        List<String> permissionIds = new ArrayList<>();
        if (reqRole.getPermissionIds() != null && !reqRole.getPermissionIds().isEmpty()) {
            permissionIds = reqRole.getPermissionIds().stream()
                    .map(String::valueOf)
                    .collect(Collectors.toList());
        }
        role.setPermissionIds(permissionIds);
        
        if (!permissionIds.isEmpty()) {
            this.roleRepository.addPermissionsToRole(role.getId(), permissionIds);
        }
        
        return role;
    }

    public Role updateFromDTO(ReqRoleDTO reqRole) {
        Role roleDB = this.fetchById(String.valueOf(reqRole.getId()));
        if (roleDB == null) {
            return null;
        }
        
        roleDB.setName(reqRole.getName());
        roleDB.setDescription(reqRole.getDescription());
        
        roleDB = this.roleRepository.save(roleDB);
        
        List<String> permissionIds = new ArrayList<>();
        if (reqRole.getPermissionIds() != null) {
            permissionIds = reqRole.getPermissionIds().stream()
                    .map(String::valueOf)
                    .collect(Collectors.toList());
        }
        roleDB.setPermissionIds(permissionIds);
        
        this.roleRepository.updatePermissionsForRole(roleDB.getId(), permissionIds);
        
        return roleDB;
    }
}
