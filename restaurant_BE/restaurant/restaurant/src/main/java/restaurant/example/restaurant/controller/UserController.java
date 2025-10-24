package restaurant.example.restaurant.controller;

import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.response.ResCreateUserDTO;
import restaurant.example.restaurant.domain.response.ResUpdateUserDTO;
import restaurant.example.restaurant.domain.response.ResUserDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.service.RoleService;
import restaurant.example.restaurant.service.UserService;
import restaurant.example.restaurant.util.anotation.ApiMessage;
import restaurant.example.restaurant.util.error.IdInvalidException;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
// @RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;

    }

    @GetMapping("/")
    public String home() {

        return "check";
    }

    // create user
    @PostMapping("/users")
    @ApiMessage("Create new user")
    public ResponseEntity<ResCreateUserDTO> createNewUser(@Valid @RequestBody User newUser) throws IdInvalidException {
        boolean isEmailExit = this.userService.isEmailExit(newUser.getEmail());
        if (isEmailExit) {
            throw new IdInvalidException(
                    "Email " + newUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }
        String hashWord = this.passwordEncoder.encode(newUser.getPassword());
        newUser.setPassword(hashWord);
        User user = this.userService.CreateUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(user));
    }

    // get user
    @GetMapping("/users/{id}")
    @ApiMessage("Get user by id ")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") Long id) throws IdInvalidException {
        User user = this.userService.handelGetUser(id);
        if (user == null) {
            throw new IdInvalidException("Id không tồn tại");
        }
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.convertToResUserDTO(user));
    }

    // get user
    @GetMapping("/users")
    @ApiMessage("fetch all users")
    public ResponseEntity<ResultPaginationDataDTO> getAllUser(@Filter Specification<User> spec,
            Pageable pageable) {
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.handelGetAllUser(spec, pageable));
    }

    // delete user
    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete user")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) throws IdInvalidException {
        User currentUser = this.userService.handelGetUser(id);
        if (currentUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }

        this.userService.handelDeleteUser(currentUser.getId());
        return ResponseEntity.ok(null);
    }

    // update user
    @PutMapping("/users")
    @ApiMessage(" update user")
    public ResponseEntity<ResUpdateUserDTO> updateUser(@RequestBody User updateUser) throws IdInvalidException {
        User user = this.userService.handelUpdateUser(updateUser);
        if (user == null) {
            throw new IdInvalidException("User với id = " + updateUser.getId() + " không tồn tại");
        }
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(user));
    }

}
