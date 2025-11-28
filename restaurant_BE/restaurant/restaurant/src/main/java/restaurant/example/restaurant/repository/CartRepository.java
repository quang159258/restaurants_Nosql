package restaurant.example.restaurant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import restaurant.example.restaurant.domain.Cart;
import restaurant.example.restaurant.domain.CartDetail;
import restaurant.example.restaurant.domain.Category;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    // public Cart findAllBy(String userName);
    // public Cart findByEmail(String email);
    Optional<Cart> findByUserId(Long userId);

}
