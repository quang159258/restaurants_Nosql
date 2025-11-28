package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Role;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.response.ResCreateUserDTO;
import restaurant.example.restaurant.domain.response.ResUpdateUserDTO;
import restaurant.example.restaurant.domain.response.ResUserDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.repository.RoleRepository;
import restaurant.example.restaurant.repository.UserRepository;
import restaurant.example.restaurant.util.constant.GenderEnum;

import org.springframework.data.domain.Page;

@Service
public class UserService {
    UserRepository userRepository;
    private final RoleService roleService;
    private final RoleRepository roleRepository;
    private final CacheService cacheService;

    public UserService(UserRepository userRepository,
            RoleService roleService,
            RoleRepository roleRepository,
            CacheService cacheService) {
        this.userRepository = userRepository;
        this.roleService = roleService;
        this.roleRepository = roleRepository;
        this.cacheService = cacheService;
    }

    public User CreateUser(User newUser) {
        Role userRole = this.roleRepository.findByName("USER");
        if (userRole == null) {
            userRole = this.roleRepository.findByName("SUPER_ADMIN");
        }
        newUser.setRole(userRole);
        if (newUser.getGender() == null) {
            newUser.setGender(GenderEnum.MALE);
        }
        if (newUser.getAddress() != null) {
            newUser.setAddress(newUser.getAddress().trim());
        }
        User savedUser = this.userRepository.save(newUser);
        // Cache the saved user
        cacheService.cacheUser(savedUser.getId(), savedUser);
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
        return savedUser;
    }

    public User handelGetUser(Long id) {
        // Try to get from cache first
        Object cachedUser = cacheService.getCachedUser(id);
        if (cachedUser instanceof User) {
            return (User) cachedUser;
        }
        
        // If not in cache, get from database and cache it
        Optional<User> user = this.userRepository.findById(id);
        if (user.isPresent()) {
            cacheService.cacheUser(id, user.get());
            return user.get();
        }
        return null;
    }

    public void handelDeleteUser(Long id) {
        this.userRepository.deleteById(id);
        // Remove from cache
        cacheService.deleteCachedUser(id);
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
    }

    public User handelUpdateUser(User updateUser) {

        Optional<User> optionalUser = this.userRepository.findById(updateUser.getId());
        User user = new User();
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        }
        if (updateUser.getAddress() != null && !updateUser.getAddress().isBlank()) {
            user.setAddress(updateUser.getAddress().trim());
        }
        if (updateUser.getGender() != null) {
            user.setGender(updateUser.getGender());
        }
        if (updateUser.getPhone() != null) {
            user.setPhone(updateUser.getPhone());
        }
        if (updateUser.getUsername() != null) {
            user.setUsername(updateUser.getUsername());
        }

        User updatedUser = this.userRepository.save(user);
        // Update cache
        cacheService.cacheUser(updatedUser.getId(), updatedUser);
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
        return updatedUser;
    }

    public User saveUser(User user) {
        return this.userRepository.save(user);
    }

    public ResultPaginationDataDTO handelGetAllUser(Specification<User> spec, Pageable pageable) {
        // Generate cache key
        String cacheKey = cacheService.generatePaginationKey(
            pageable.getPageNumber(), 
            pageable.getPageSize(),
            spec != null ? spec.toString() : null
        );
        
        // Try to get from cache first
        Object cachedResult = cacheService.getCachedUserList(cacheKey);
        if (cachedResult instanceof ResultPaginationDataDTO) {
            return (ResultPaginationDataDTO) cachedResult;
        }

        Page<User> pageUser = this.userRepository.findAll(spec, pageable);
        ResultPaginationDataDTO rs = new ResultPaginationDataDTO();
        ResultPaginationDataDTO.Meta mt = new ResultPaginationDataDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);
        // remove sensitive data
        List<ResUserDTO> listUser = pageUser.getContent()
                .stream().map(item -> this.convertToResUserDTO(item))
                .collect(Collectors.toList());
        rs.setResult(listUser);

        // Cache the result
        cacheService.cacheUserList(cacheKey, rs);
        
        return rs;
    }

    public User handelGetUserByUsername(String email) {
        return this.userRepository.findByEmail(email);
    }

    public boolean isEmailExit(String email) {
        return this.userRepository.existsByEmail(email);
    }

    public ResCreateUserDTO convertToResCreateUserDTO(User user) {
        ResCreateUserDTO res = new ResCreateUserDTO();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setName(user.getUsername());
        res.setPhone(user.getPhone());
        res.setCreatedAt(user.getCreatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        return res;
    }

    public ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO res = new ResUserDTO();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setName(user.getUsername());
        res.setPhone(user.getPhone());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setCreatedAt(user.getCreatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        res.setRole(user.getRole().getName());
        return res;
    }

    public ResUpdateUserDTO convertToResUpdateUserDTO(User user) {
        ResUpdateUserDTO res = new ResUpdateUserDTO();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setPhone(user.getPhone());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        return res;
    }

    public void updateUserToken(String token, String email) {
        User currentUser = this.handelGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            User savedUser = this.userRepository.save(currentUser);
            // Update cache
            cacheService.cacheUser(savedUser.getId(), savedUser);
        }
    }

    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userRepository.findByRefreshTokenAndEmail(token, email);
    }

    public boolean isEmailExist(String email) {
        return this.userRepository.existsByEmail(email);
    }

    public User handleGetUserByUsername(String name) {
        return this.userRepository.findByEmail(name);
    }
}
