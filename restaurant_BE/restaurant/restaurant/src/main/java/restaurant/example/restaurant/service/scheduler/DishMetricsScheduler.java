package restaurant.example.restaurant.service.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import restaurant.example.restaurant.redis.repository.DishRepository;

@Component
public class DishMetricsScheduler {

    private static final Logger log = LoggerFactory.getLogger(DishMetricsScheduler.class);
    private final DishRepository dishRepository;

    public DishMetricsScheduler(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
    }

    /**
     * Reset soldToday counter for every dish at midnight (server time).
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void resetDailySoldTodayCounter() {
        int affected = dishRepository.resetDailySoldCount();
        log.info("Daily dish metrics reset completed. soldToday cleared for {} dishes.", affected);
    }
}

