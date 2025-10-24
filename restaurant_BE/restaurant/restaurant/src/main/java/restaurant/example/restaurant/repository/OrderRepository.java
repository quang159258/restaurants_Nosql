package restaurant.example.restaurant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.User;
import org.springframework.data.domain.Page;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUserId(Long userId);

    List<Order> findByUser(User user);

    Page<Order> findByUser(User user, Specification spec, Pageable pageable);

    Optional<Order> findByPaymentRef(String paymentRef);
}
