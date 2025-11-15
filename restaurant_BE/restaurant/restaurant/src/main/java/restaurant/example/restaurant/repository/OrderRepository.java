package restaurant.example.restaurant.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;

import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.User;
import restaurant.example.restaurant.util.constant.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUserId(Long userId);

    List<Order> findByUser(User user);

    Page<Order> findByUser(User user, Specification spec, Pageable pageable);

    Optional<Order> findByPaymentRef(String paymentRef);

    List<Order> findAllByCreatedAtBetween(Instant start, Instant end);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(o.totalPrice),0) FROM Order o WHERE o.createdAt BETWEEN :start AND :end AND o.status <> :excludedStatus")
    Double sumRevenueBetween(Instant start, Instant end, OrderStatus excludedStatus);
}
