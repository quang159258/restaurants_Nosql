package restaurant.example.restaurant.controller;

import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import restaurant.example.restaurant.domain.response.ResultPaginationDataDTO;
import restaurant.example.restaurant.redis.model.Dish;
import restaurant.example.restaurant.service.DishService;
@RestController
public class DishController {
    private final DishService dishService;

    public DishController(DishService dishService) {
        this.dishService = dishService;
    }

    @PostMapping("/dish")
    public ResponseEntity<Dish> createDish(@Valid @RequestBody Dish dish) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.dishService.handleCreatedDish(dish));
    }

    @GetMapping("/dish/{id}")
    public ResponseEntity<Dish> getDishById(@PathVariable("id") String id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(this.dishService.handleGetDishById(id).orElse(null));
    }

    @GetMapping("/dish")
    public ResponseEntity<ResultPaginationDataDTO> getAllDish(
            Pageable pageable,
            @RequestParam(required = false) String categoryId) {
        if (categoryId != null && !categoryId.isEmpty() && !"all".equals(categoryId)) {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(this.dishService.handleGetDishesByCategory(categoryId, pageable));
        }
        return ResponseEntity.status(HttpStatus.OK).body(this.dishService.handleGetAllDish(pageable));
    }

    @PutMapping("/dish")
    public ResponseEntity<Dish> updateDish(@Valid @RequestBody Dish dish) {
        return ResponseEntity.status(HttpStatus.OK).body(this.dishService.handleUpdateDish(dish));
    }

    @DeleteMapping("/dish/{id}")
    public ResponseEntity<Void> deleteDishById(@PathVariable("id") String id) {
        this.dishService.handleDeleteDishById(id);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

}
