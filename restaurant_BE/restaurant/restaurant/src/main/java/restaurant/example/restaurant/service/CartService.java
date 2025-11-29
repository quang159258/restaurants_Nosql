package restaurant.example.restaurant.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import restaurant.example.restaurant.redis.model.Cart;
import restaurant.example.restaurant.redis.model.CartDetail;
import restaurant.example.restaurant.redis.model.Dish;
import restaurant.example.restaurant.redis.model.User;
import restaurant.example.restaurant.domain.response.ResCartItem;
import restaurant.example.restaurant.redis.repository.CartDetailRepository;
import restaurant.example.restaurant.redis.repository.CartRepository;
import restaurant.example.restaurant.redis.repository.CategoryRepository;
import restaurant.example.restaurant.redis.repository.DishRepository;
import restaurant.example.restaurant.redis.repository.UserRepository;
import restaurant.example.restaurant.util.ImageUtils;
import restaurant.example.restaurant.util.error.CartException;

@Service
public class CartService {
    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private final UserService userService;
    private final UserRepository userRepository;
    public final CartRepository cartRepository;
    public final CartDetailRepository cartDetailRepository;
    public final DishRepository dishRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    private static final String CART_PREFIX = "cart:";
    private static final long CART_SESSION_DURATION = 86400;

    public CartService(CartRepository cartRepository, UserService userService, UserRepository userRepository,
            CartDetailRepository cartDetailRepository, DishRepository dishRepository) {
        this.cartRepository = cartRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.cartDetailRepository = cartDetailRepository;
        this.dishRepository = dishRepository;
    }

    private String buildCartKey(String userId) {
        return CART_PREFIX + userId;
    }

    public Cart getCartByUserId(String userId) {
        Cart cart = this.cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            User user = this.userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            newCart.setUserId(user.getId());
            return this.cartRepository.save(newCart);
        });
        
        if (cart.getItems() == null) {
            List<CartDetail> items = cartDetailRepository.findAllByCartId(cart.getId());
            cart.setItems(items);
        }
        
        return cart;
    }

    public void evictCartCache(String userId) {
        try {
            redisTemplate.delete(buildCartKey(userId));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping cache eviction for cart: {}", userId, e);
        }
    }

    public ResCartItem addToCart(CartDetail request, String email) {
        User user = this.userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        Cart cart = cartRepository.findByUserId(user.getId()).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUserId(user.getId());
            return cartRepository.save(newCart);
        });

        String dishId = request.getDishId();
        if (dishId == null) {
            throw new RuntimeException("Dish ID is required");
        }
        
        Dish dish = this.dishRepository.findById(dishId)
                .orElseThrow(() -> new RuntimeException("Dish not found with id: " + dishId));

        double unitPrice = dish.getPrice();

        Optional<CartDetail> existingDetailOpt = cartDetailRepository
                .findByCartIdAndDishId(cart.getId(), dishId);

        CartDetail detail;
        if (existingDetailOpt.isPresent()) {
            detail = existingDetailOpt.get();
            long newQuantity = detail.getQuantity() + request.getQuantity();
            detail.setQuantity(newQuantity);
            detail.setPrice(unitPrice);
            detail.setTotal(unitPrice * newQuantity);
        } else {
            detail = new CartDetail();
            detail.setCartId(cart.getId());
            detail.setDishId(dishId);
            detail.setQuantity(request.getQuantity());
            detail.setPrice(unitPrice);
            detail.setTotal(unitPrice * request.getQuantity());
        }
        cartDetailRepository.save(detail);
        
        return convertCartDetailToResCartItem(detail);
    }

    public List<ResCartItem> getCartItemsByUserEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isEmpty()) {
            throw new RuntimeException("Cart not found for user: " + user.getEmail());
        }

        List<CartDetail> lst = cartDetailRepository.findAllByCartId(cartOpt.get().getId());
        List<ResCartItem> lstRes = new ArrayList<>();
        for (CartDetail item : lst) {
            lstRes.add(convertCartDetailToResCartItem(item));
        }

        return lstRes;
    }

    public ResCartItem updateQuantity(String cartItemId, long quantity) {
        CartDetail detail = cartDetailRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with ID: " + cartItemId));

        detail.setQuantity(quantity);
        detail.setTotal(detail.getPrice() * quantity);
        cartDetailRepository.save(detail);
        
        return convertCartDetailToResCartItem(detail);
    }

    public void removeItem(String cartItemId) throws CartException {
        if (!cartDetailRepository.existsById(cartItemId)) {
            throw new CartException("Cart item not found with ID: " + cartItemId);
        }
        cartDetailRepository.deleteById(cartItemId);
    }

    public void save(Cart cart) {
        this.cartRepository.save(cart);
    }
    
    private ResCartItem convertCartDetailToResCartItem(CartDetail item) {
        Dish dish = dishRepository.findById(item.getDishId()).orElse(null);
        restaurant.example.restaurant.redis.model.Category category = null;
        if (dish != null && dish.getCategoryId() != null) {
            category = categoryRepository.findById(dish.getCategoryId()).orElse(null);
        }
        
        ResCartItem res = new ResCartItem();
        res.setId(item.getId());
        res.setDishId(item.getDishId());
        res.setQuantity((int) item.getQuantity());
        res.setUnitPrice(java.math.BigDecimal.valueOf(item.getPrice()));
        res.setTotalPrice(java.math.BigDecimal.valueOf(item.getTotal()));
        res.setPrice(item.getPrice());
        res.setTotal(item.getTotal());
        
        if (dish != null) {
            res.setName(dish.getName());
            res.setDishName(dish.getName());
            res.setImageUrl(ImageUtils.extractPrimaryImage(dish.getImageUrl()));
            res.setDishImage(ImageUtils.extractPrimaryImage(dish.getImageUrl()));
        }
        res.setCategoryName(category != null ? category.getName() : null);
        
        return res;
    }
    
    public restaurant.example.restaurant.domain.response.ResCartDTO getCartWithItems(String userId) {
        Cart cart = getCartByUserId(userId);
        
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            List<CartDetail> items = cartDetailRepository.findAllByCartId(cart.getId());
            cart.setItems(items);
        }
        
        List<ResCartItem> resItems = new ArrayList<>();
        for (CartDetail item : cart.getItems()) {
            resItems.add(convertCartDetailToResCartItem(item));
        }
        
        double totalPrice = resItems.stream()
            .mapToDouble(item -> item.getTotal())
            .sum();
        
        restaurant.example.restaurant.domain.response.ResCartDTO dto = 
            new restaurant.example.restaurant.domain.response.ResCartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUserId());
        dto.setItems(resItems);
        dto.setTotalItems(resItems.size());
        dto.setTotalPrice(java.math.BigDecimal.valueOf(totalPrice));
        
        return dto;
    }
}
