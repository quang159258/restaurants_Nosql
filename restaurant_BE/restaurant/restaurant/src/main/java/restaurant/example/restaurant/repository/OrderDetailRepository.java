package restaurant.example.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import restaurant.example.restaurant.domain.OrderDetail;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    List<OrderDetail> findAllById(Long id);

    List<OrderDetail> findByOrderId(Long orderId);

}
