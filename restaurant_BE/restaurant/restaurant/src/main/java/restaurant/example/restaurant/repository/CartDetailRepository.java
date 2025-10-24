package restaurant.example.restaurant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import restaurant.example.restaurant.domain.CartDetail;

public interface CartDetailRepository extends JpaRepository<CartDetail, Long> {
    void deleteAllByCartId(Long cartId);

    Optional<CartDetail> findByCartIdAndDishId(Long cartId, Long dishId);

    List<CartDetail> findAllByCartId(Long cartId);

}
