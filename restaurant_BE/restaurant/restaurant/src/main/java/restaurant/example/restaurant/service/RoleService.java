package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Permission;
import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.domain.request.ReqRoleDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.repository.PermissionRepository;
import restaurant.example.restaurant.repository.RoleRepository;

@Service
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleService(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    public boolean existByName(String name) {
        return this.roleRepository.existsByName(name);
    }

    public Role create(Role r) {
        // check permissions
        if (r.getPermissions() != null) {
            List<Long> reqPermissions = r.getPermissions()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            r.setPermissions(dbPermissions);
        }
        return this.roleRepository.save(r);
    }

    public Role fetchById(long id) {
        Optional<Role> roleOptional = this.roleRepository.findById(id);
        if (roleOptional.isPresent())
            return roleOptional.get();
        return null;
    }

    public Role update(Role r) {
        Role roleDB = this.fetchById(r.getId());
        // check permissions
        if (r.getPermissions() != null) {
            List<Long> reqPermissions = r.getPermissions()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            r.setPermissions(dbPermissions);
        }
        roleDB.setName(r.getName());
        roleDB.setDescription(r.getDescription());
        roleDB.setPermissions(r.getPermissions());
        roleDB = this.roleRepository.save(roleDB);
        return roleDB;
    }

    public void delete(long id) {
        this.roleRepository.deleteById(id);
    }

    public ResultPaginationDataDTO getRoles(Specification<Role> spec, Pageable pageable) {
        Page<Role> pRole = this.roleRepository.findAll(spec, pageable);
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta mt = new ResultPaginationDataDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pRole.getTotalPages());
        mt.setTotal(pRole.getTotalElements());
        rs.setMeta(mt);
        rs.setResult(pRole.getContent());
        return rs;
    }

    public Role createFromDTO(ReqRoleDTO reqRole) {
        Role role = new Role();
        role.setName(reqRole.getName());
        role.setDescription(reqRole.getDescription());
        
        // Set permissions from permissionIds
        if (reqRole.getPermissionIds() != null && !reqRole.getPermissionIds().isEmpty()) {
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqRole.getPermissionIds());
            role.setPermissions(dbPermissions);
        }
        
        return this.roleRepository.save(role);
    }

    public Role updateFromDTO(ReqRoleDTO reqRole) {
        Role roleDB = this.fetchById(reqRole.getId());
        if (roleDB == null) {
            return null;
        }
        
        roleDB.setName(reqRole.getName());
        roleDB.setDescription(reqRole.getDescription());
        
        // Update permissions from permissionIds
        if (reqRole.getPermissionIds() != null) {
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqRole.getPermissionIds());
            roleDB.setPermissions(dbPermissions);
        } else {
            roleDB.setPermissions(null);
        }
        
        return this.roleRepository.save(roleDB);
    }
}
