package restaurant.example.restaurant.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import restaurant.example.restaurant.redis.model.Order;
import restaurant.example.restaurant.redis.repository.OrderRepository;
import restaurant.example.restaurant.redis.repository.UserRepository;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse.DailyRevenuePoint;
import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse.TopDish;
import restaurant.example.restaurant.util.constant.OrderStatus;
import restaurant.example.restaurant.util.constant.PaymentStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AnalyticsService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
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

        List<DailyRevenuePoint> revenueTrend = buildRevenueTrend(orders);
        List<TopDish> topDishes = buildTopDishes(orders, topDishLimit);

        AnalyticsOverviewResponse response = new AnalyticsOverviewResponse();
        response.setTotalRevenue(BigDecimal.valueOf(totalRevenue));
        response.setTotalOrders(totalOrders);
        response.setTotalCustomers(userRepository.countByCreatedAtBetween(start, end));
        response.setTotalDishesSold(orders.stream()
                .mapToInt(Order::getTotalItems)
                .sum());
        response.setRevenueTrend(revenueTrend);
        response.setTopDishes(topDishes);

        return response;
    }

    private List<DailyRevenuePoint> buildRevenueTrend(List<Order> orders) {
        Map<LocalDate, Double> dailyRevenue = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                        Collectors.summingDouble(Order::getTotalPrice)
                ));

        return dailyRevenue.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    DailyRevenuePoint point = new DailyRevenuePoint();
                    point.setDate(entry.getKey());
                    point.setRevenue(BigDecimal.valueOf(entry.getValue()));
                    point.setOrderCount(orders.stream()
                            .filter(o -> o.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(entry.getKey()))
                            .count());
                    return point;
                })
                .collect(Collectors.toList());
    }

    private List<TopDish> buildTopDishes(List<Order> orders, int limit) {
        Map<String, TopDish> dishMap = new HashMap<>();

        orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .flatMap(order -> order.getOrderItems().stream())
                .forEach(item -> {
                    String dishId = item.getDishId();
                    TopDish dish = dishMap.computeIfAbsent(dishId, k -> {
                        TopDish d = new TopDish();
                        d.setDishId(dishId);
                        d.setDishName(item.getDishName());
                        return d;
                    });
                    dish.setQuantitySold(dish.getQuantitySold() + item.getQuantity());
                    BigDecimal revenueToAdd = BigDecimal.valueOf(item.getPrice() * item.getQuantity());
                    dish.setTotalRevenue(dish.getTotalRevenue().add(revenueToAdd));
                });

        return dishMap.values().stream()
                .sorted(Comparator.comparing(TopDish::getTotalRevenue, Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}