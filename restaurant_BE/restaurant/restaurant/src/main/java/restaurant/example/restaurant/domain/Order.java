package restaurant.example.restaurant.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.util.SecurityUtil;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentMethod;
import restaurant.example.restaurant.util.constant.PaymentStatus;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double totalPrice;

    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String receiverEmail;

    // Trạng thái đơn hàng: PENDING, CONFIRMED, CANCELLED
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    // user id
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<OrderDetail> orderDetails;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    // Thông tin thanh toán đơn giản
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod; // CASH

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus; // UNPAID, PAID, FAILED
    private String paymentRef; // Mã thanh toán hoặc ID thanh toán

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.updatedAt = Instant.now();
    }
}
