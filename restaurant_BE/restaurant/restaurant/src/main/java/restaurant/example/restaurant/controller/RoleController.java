package restaurant.example.restaurant.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.domain.request.ReqRoleDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.service.RoleService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;

@RestController
public class RoleController {
    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping("/roles")
    @ApiMessage("Create a role")
    public ResponseEntity<Role> create(@Valid @RequestBody ReqRoleDTO reqRole) throws IdInvalidException {
        // check name
        if (this.roleService.existByName(reqRole.getName())) {
            throw new IdInvalidException("Role với name = " + reqRole.getName() + " đã tồn tại");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.createFromDTO(reqRole));
    }

    @PutMapping("/roles")
    @ApiMessage("Update a role")
    public ResponseEntity<Role> update(@Valid @RequestBody ReqRoleDTO reqRole) throws IdInvalidException {
        // check id
        if (this.roleService.fetchById(reqRole.getId()) == null) {
            throw new IdInvalidException("Role với id = " + reqRole.getId() + " không tồn tại");
        }
        // check name
        // if (this.roleService.existByName(reqRole.getName())) {
        // throw new IdInvalidException("Role với name = " + reqRole.getName() + " đã tồn
        // tại");
        // }
        return ResponseEntity.ok().body(this.roleService.updateFromDTO(reqRole));
    }

    @DeleteMapping("/roles/{id}")
    @ApiMessage("Delete a role")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        // check id
        if (this.roleService.fetchById(id) == null) {
            throw new IdInvalidException("Role với id = " + id + " không tồn tại");
        }
        this.roleService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/roles")
    @ApiMessage("Fetch roles")
    public ResponseEntity<ResultPaginationDataDTO> getPermissions(
            @Filter Specification<Role> spec, Pageable pageable) {
        return ResponseEntity.ok(this.roleService.getRoles(spec, pageable));
    }

    @GetMapping("/roles/{id}")
    @ApiMessage("Fetch role by id")
    public ResponseEntity<Role> getById(@PathVariable("id") long id) throws IdInvalidException {
        Role role = this.roleService.fetchById(id);
        if (role == null) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }
        return ResponseEntity.ok().body(role);
    }

}