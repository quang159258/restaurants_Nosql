package restaurant.example.restaurant.domain.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class AnalyticsOverviewResponse {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalCustomers;
    private long totalDishesSold;
    private List<DailyRevenuePoint> revenueTrend;
    private List<TopDish> topDishes;

    @Data
    public static class DailyRevenuePoint {
        private LocalDate date;
        private BigDecimal revenue;
        private long orderCount;
    }

    @Data
    public static class TopDish {
        private String dishId;
        private String dishName;
        private long quantitySold;
        private BigDecimal totalRevenue;
    }
}
