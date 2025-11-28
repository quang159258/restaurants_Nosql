package restaurant.example.restaurant.domain.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewResponse {
    private Double totalRevenue;
    private Long totalOrders;
    private Long pendingOrders;
    private Long confirmedOrders;
    private Long deliveringOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;
    private Long unpaidOrders;
    private Double averageOrderValue;
    private Long newCustomers;
    private List<DailyRevenuePoint> revenueTrend;
    private List<TopDish> topDishes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenuePoint {
        private LocalDate date;
        private Double revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopDish {
        private String dishName;
        private Long quantity;
        private Double revenue;
    }
}

