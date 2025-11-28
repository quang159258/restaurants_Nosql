package restaurant.example.restaurant.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.time.Duration;
import org.springframework.stereotype.Service;
import restaurant.example.restaurant.domain.Cart;
import restaurant.example.restaurant.domain.CartDetail;
import restaurant.example.restaurant.domain.Dish;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.domain.response.ResCartItem;
import restaurant.example.restaurant.repository.CartDetailRepository;
import restaurant.example.restaurant.repository.CartRepository;
import restaurant.example.restaurant.repository.DishRepository;
import restaurant.example.restaurant.repository.UserRepository;
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
    private RedisTemplate<String, Object> redisTemplate;
    private static final String CART_PREFIX = "cart:";
    private static final long CART_SESSION_DURATION = 86400; // 1 ngày (giây)

    public CartService(CartRepository cartRepository, UserService userService, UserRepository userRepository,
            CartDetailRepository cartDetailRepository, DishRepository dishRepository) {
        this.cartRepository = cartRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.cartDetailRepository = cartDetailRepository;
        this.dishRepository = dishRepository;
    }

    private String buildCartKey(Long userId) {
        return CART_PREFIX + userId;
    }

    public Cart getCartByUserId(Long userId) {
        String redisKey = buildCartKey(userId);
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            Object obj = ops.get(redisKey);
            if (obj instanceof Cart) {
                return (Cart) obj;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable, falling back to database for cart: {}", userId, e);
        }
        
        // Fallback to database
        Cart cart = this.cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            User user = this.userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            newCart.setUser(user);
            return this.cartRepository.save(newCart);
        });
        
        // Try to cache, but don't fail if Redis is down
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            ops.set(redisKey, cart, Duration.ofSeconds(CART_SESSION_DURATION));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping cache for cart: {}", userId, e);
        }
        
        return cart;
    }

    public void evictCartCache(Long userId) {
        try {
            redisTemplate.delete(buildCartKey(userId));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping cache eviction for cart: {}", userId, e);
        }
    }

    public ResCartItem addToCart(CartDetail request, String email) {
        // 1. Tìm user
        User user = this.userRepository.findByEmail(email);

        // 2. Tìm hoặc tạo cart
        Cart cart = cartRepository.findByUserId(user.getId()).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });

        // ⚠️ 3. Lấy Dish từ database theo ID
        Long dishId = request.getDish().getId();
        Dish dish = this.dishRepository.findById(dishId)
                .orElseThrow(() -> new RuntimeException("Dish not found with id: " + dishId));

        double unitPrice = dish.getPrice();

        // 4. Kiểm tra món đã có trong giỏ chưa
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
            detail.setCart(cart);
            detail.setDish(dish); // gán dish đã load đầy đủ
            detail.setQuantity(request.getQuantity());
            detail.setPrice(unitPrice);
            detail.setTotal(unitPrice * request.getQuantity());
        }
        cartDetailRepository.save(detail);
        ResCartItem res = new ResCartItem();
        res.setId(detail.getId());
        res.setQuantity(detail.getQuantity());
        res.setPrice(detail.getPrice());
        res.setTotal(detail.getTotal());
        res.setName(detail.getDish().getName());
        res.setImageUrl(ImageUtils.extractPrimaryImage(detail.getDish().getImageUrl()));
        res.setCategoryName(detail.getDish().getCategory().getName());
        // Sau khi cập nhật cart => đẩy vào Redis
        try {
            ValueOperations<String, Object> ops = redisTemplate.opsForValue();
            ops.set(buildCartKey(user.getId()), cart, Duration.ofSeconds(CART_SESSION_DURATION));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping cache for cart: {}", user.getId(), e);
        }
        return res;

    }

    public List<ResCartItem> getCartItemsByUserEmail(String email) {
        // 1. Lấy user theo email
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        // 2. Lấy cart theo userId
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isEmpty()) {
            throw new RuntimeException("Cart not found for user: " + user.getEmail());
        }

        // 3. Lấy các CartDetail theo cartId
        List<CartDetail> lst = cartDetailRepository.findAllByCartId(cartOpt.get().getId());
        List<ResCartItem> lstRes = new ArrayList<>();
        for (CartDetail item : lst) {
            ResCartItem res = new ResCartItem();
            res.setId(item.getId());
            res.setQuantity(item.getQuantity());
            res.setPrice(item.getPrice());
            res.setTotal(item.getTotal());
            res.setName(item.getDish().getName());
            res.setImageUrl(ImageUtils.extractPrimaryImage(item.getDish().getImageUrl()));
            res.setCategoryName(item.getDish().getCategory().getName());
            lstRes.add(res);
        }

        return lstRes;
    }

    /** Cập nhật số lượng món trong giỏ hàng */
    public ResCartItem updateQuantity(Long cartItemId, long quantity) {
        CartDetail detail = cartDetailRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with ID: " + cartItemId));

        detail.setQuantity(quantity);

        // Cập nhật lại total = price * quantity
        detail.setTotal(detail.getPrice() * quantity);
        cartDetailRepository.save(detail);
        ResCartItem res = new ResCartItem();
        res.setId(detail.getId());
        res.setQuantity(detail.getQuantity());
        res.setPrice(detail.getPrice());
        res.setTotal(detail.getTotal());
        res.setName(detail.getDish().getName());
        res.setImageUrl(detail.getDish().getImageUrl());
        res.setCategoryName(detail.getDish().getCategory().getName());
        return res;
    }

    /**
     * Xóa một món khỏi giỏ hàng
     * 
     * @throws CartException
     */
    public void removeItem(Long cartItemId) throws CartException {
        if (!cartDetailRepository.existsById(cartItemId)) {
            throw new CartException("Cart item not found with ID: " + cartItemId);
        }
        cartDetailRepository.deleteById(cartItemId);
    }

    public void save(Cart cart) {
        this.cartRepository.save(cart);
    }
}
