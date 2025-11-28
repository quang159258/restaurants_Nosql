package restaurant.example.restaurant.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import restaurant.example.restaurant.domain.response.AnalyticsOverviewResponse;
import restaurant.example.restaurant.service.AnalyticsService;
import restaurant.example.restaurant.util.anotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @ApiMessage("Analytics overview")
    public ResponseEntity<AnalyticsOverviewResponse> getOverview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "5") int topLimit) {

        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now();
        LocalDate effectiveStart = startDate != null ? startDate : effectiveEnd.minusDays(30);

        Instant startInstant = effectiveStart.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant endInstant = effectiveEnd.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        AnalyticsOverviewResponse response = analyticsService.buildOverview(startInstant, endInstant, topLimit);
        return ResponseEntity.ok(response);
    }
}

