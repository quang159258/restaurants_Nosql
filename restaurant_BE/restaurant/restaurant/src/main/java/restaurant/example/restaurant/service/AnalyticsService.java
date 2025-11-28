package restaurant.example.restaurant.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Order;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse.DailyRevenuePoint;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse.TopDish;
import restaurant.example.restaurant.repository.OrderDetailRepository;
import restaurant.example.restaurant.repository.OrderRepository;
import restaurant.example.restaurant.repository.UserRepository;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentStatus;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;

    public AnalyticsService(OrderRepository orderRepository, OrderDetailRepository orderDetailRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.userRepository = userRepository;
    }

    public AnalyticsOverviewResponse buildOverview(Instant start, Instant end, int topDishLimit) {
        List<Order> orders = orderRepository.findAllByCreatedAtBetween(start, end);
        double totalRevenue = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .mapToDouble(Order::getTotalPrice)
                .sum();
        long totalOrders = orders.size();
        long pending = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.PENDING, start, end);
        long confirmed = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CONFIRMED, start, end);
        long delivering = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERING, start, end);
        long delivered = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, start, end);
        long cancelled = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CANCELLED, start, end);
        long unpaid = orders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAYMENT_UNPAID)
                .count();
        double avgOrderValue = totalOrders == 0 ? 0 : totalRevenue / totalOrders;
        long newCustomers = userRepository.countByCreatedAtBetween(start, end);

        List<DailyRevenuePoint> trend = buildRevenueTrend(orders);
        List<TopDish> topDishes = buildTopDishes(start, end, topDishLimit);

        AnalyticsOverviewResponse response = new AnalyticsOverviewResponse();
        response.setTotalRevenue(totalRevenue);
        response.setTotalOrders(totalOrders);
        response.setPendingOrders(pending);
        response.setConfirmedOrders(confirmed);
        response.setDeliveringOrders(delivering);
        response.setDeliveredOrders(delivered);
        response.setCancelledOrders(cancelled);
        response.setUnpaidOrders(unpaid);
        response.setAverageOrderValue(avgOrderValue);
        response.setNewCustomers(newCustomers);
        response.setRevenueTrend(trend);
        response.setTopDishes(topDishes);
        return response;
    }

    private List<DailyRevenuePoint> buildRevenueTrend(List<Order> orders) {
        Map<LocalDate, Double> aggregated = new HashMap<>();
        ZoneId zoneId = ZoneId.systemDefault();
        orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .forEach(order -> {
                    LocalDate date = LocalDate.ofInstant(order.getCreatedAt(), zoneId);
                    aggregated.merge(date, order.getTotalPrice(), Double::sum);
                });
        List<DailyRevenuePoint> points = new ArrayList<>();
        aggregated.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> points.add(new DailyRevenuePoint(entry.getKey(), entry.getValue())));
        return points;
    }

    private List<TopDish> buildTopDishes(Instant start, Instant end, int topDishLimit) {
        List<Object[]> raw = orderDetailRepository.findTopSellingDishes(start, end, PageRequest.of(0, topDishLimit));
        List<TopDish> result = new ArrayList<>();
        for (Object[] record : raw) {
            String name = record[0] != null ? record[0].toString() : "N/A";
            Long quantity = record[1] != null ? ((Number) record[1]).longValue() : 0L;
            Double revenue = record[2] != null ? ((Number) record[2]).doubleValue() : 0D;
            result.add(new TopDish(name, quantity, revenue));
        }
        result.sort(Comparator.comparingLong(TopDish::getQuantity).reversed());
        return result;
    }
}

