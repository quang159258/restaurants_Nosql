package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.redis.model.Role;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.domain.response.ResCreateUserDTO;
import restaurant.example.restaurant.domain.response.ResUpdateUserDTO;
import restaurant.example.restaurant.domain.response.ResUserDTO;
import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.redis.repository.RoleRepository;
import restaurant.example.restaurant.redis.repository.UserRepository;
import restaurant.example.restaurant.util.constant.GenderEnum;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleService roleService;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private CacheService cacheService;

    public User CreateUser(User newUser) {
        Role userRole = this.roleRepository.findByName("USER");
        if (userRole == null) {
            userRole = this.roleRepository.findByName("SUPER_ADMIN");
        }
        newUser.setRoleId(userRole != null ? userRole.getId() : null);
        if (newUser.getGender() == null) {
            newUser.setGender(GenderEnum.MALE);
        }
        if (newUser.getAddress() != null) {
            newUser.setAddress(newUser.getAddress().trim());
        }
        User savedUser = this.userRepository.save(newUser);
        // Cache the saved user
        cacheService.cacheUser(Long.parseLong(savedUser.getId()), savedUser);
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
        return savedUser;
    }

    public User handelGetUser(String id) {
        // Try to get from cache first
        Object cachedUser = cacheService.getCachedUser(Long.parseLong(id));
        if (cachedUser instanceof User) {
            return (User) cachedUser;
        }
        
        // If not in cache, get from database and cache it
        Optional<User> user = this.userRepository.findById(id);
        if (user.isPresent()) {
            cacheService.cacheUser(Long.parseLong(id), user.get());
            return user.get();
        }
        return null;
    }

    public void handelDeleteUser(String id) {
        this.userRepository.deleteById(id);
        // Không xóa cache vì Redis là DB chính, không phải cache
        // cacheService.deleteCachedUser(Long.parseLong(id));
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
    }

    public User handelUpdateUser(User updateUser) {
        Optional<User> optionalUser = this.userRepository.findById(updateUser.getId());
        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found with id: " + updateUser.getId());
        }
        
        User user = optionalUser.get();
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
        cacheService.cacheUser(Long.parseLong(updatedUser.getId()), updatedUser);
        // Invalidate list cache
        cacheService.deleteAllUserListCache();
        return updatedUser;
    }

    public User saveUser(User user) {
        return this.userRepository.save(user);
    }

    public ResultPaginationDataDTO handelGetAllUser(Pageable pageable) {
        // Generate cache key
        String cacheKey = cacheService.generatePaginationKey(
            pageable.getPageNumber(), 
            pageable.getPageSize(),
            null
        );
        
        // Try to get from cache first
        Object cachedResult = cacheService.getCachedUserList(cacheKey);
        if (cachedResult instanceof ResultPaginationDataDTO) {
            return (ResultPaginationDataDTO) cachedResult;
        }

        Page<User> pageUser = this.userRepository.findAll(pageable);
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
        res.setCreatedAt(user.getCreatedAt() != null ? 
            user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        res.setGender(user.getGender() != null ? user.getGender().name() : null);
        res.setAddress(user.getAddress());
        return res;
    }

    public ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO res = new ResUserDTO();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setName(user.getUsername());
        res.setPhone(user.getPhone());
        res.setUpdatedAt(user.getUpdatedAt() != null ? 
            user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        res.setCreatedAt(user.getCreatedAt() != null ? 
            user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        res.setGender(user.getGender() != null ? user.getGender().name() : null);
        res.setAddress(user.getAddress());
        
        // Get role name from roleId
        if (user.getRoleId() != null) {
            Role role = roleRepository.findById(user.getRoleId()).orElse(null);
            res.setRole(role != null ? role.getName() : null);
        }
        
        return res;
    }

    public ResUpdateUserDTO convertToResUpdateUserDTO(User user) {
        ResUpdateUserDTO res = new ResUpdateUserDTO();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setPhone(user.getPhone());
        res.setUpdatedAt(user.getUpdatedAt() != null ? 
            user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        res.setGender(user.getGender() != null ? user.getGender().name() : null);
        res.setAddress(user.getAddress());
        return res;
    }

    public void updateUserToken(String token, String email) {
        User currentUser = this.handelGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            User savedUser = this.userRepository.save(currentUser);
            // Update cache
            cacheService.cacheUser(Long.parseLong(savedUser.getId()), savedUser);
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
