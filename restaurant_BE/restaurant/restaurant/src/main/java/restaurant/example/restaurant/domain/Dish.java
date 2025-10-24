package restaurant.example.restaurant.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import restaurant.example.restaurant.util.SecurityUtil;

import java.time.Instant;

@Entity
@Table(name = "dishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    private Double price;
    @Column(columnDefinition = "MEDIUMTEXT")
    private String imageUrl;

    @ManyToOne()
    @JoinColumn(name = "category_id")
    private Category category;

    private Boolean available = true;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    private Integer stock = 0; // Số lượng tồn kho
    private Integer soldToday = 0; // Số lượng đã bán hôm nay

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.updatedAt = Instant.now();
    }
}
