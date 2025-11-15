package restaurant.example.restaurant.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import restaurant.example.restaurant.domain.OrderDetail;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    List<OrderDetail> findAllById(Long id);

    List<OrderDetail> findByOrderId(Long orderId);

    @Query("""
            SELECT od.dish.name, SUM(od.quantity), SUM(od.price * od.quantity)
            FROM OrderDetail od
            JOIN od.order o
            WHERE o.createdAt BETWEEN :start AND :end
            GROUP BY od.dish.id, od.dish.name
            ORDER BY SUM(od.quantity) DESC
            """)
    List<Object[]> findTopSellingDishes(Instant start, Instant end, Pageable pageable);
}
