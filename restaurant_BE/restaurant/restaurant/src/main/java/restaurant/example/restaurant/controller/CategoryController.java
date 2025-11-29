package restaurant.example.restaurant.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import restaurant.example.restaurant.redis.model.Category;
import restaurant.example.restaurant.service.CategoryService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;

    }

    // create
    @PostMapping("/category")
    public ResponseEntity<Category> createdCategory(@Valid @RequestBody Category category) {

        return ResponseEntity.status(HttpStatus.CREATED).body(this.categoryService.handleCreatedCategory(category));
    }

    // get by id
    @GetMapping("/category/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable("id") String id) {
        Category category = this.categoryService.handleGetByIdCategory(id).orElse(null);
        return ResponseEntity.ok().body(category);
    }

    // get all
    @GetMapping("/category")
    public ResponseEntity<List<Category>> getAllCategory() {
        List<Category> lstCategory = this.categoryService.handleGetAllCategory();
        return ResponseEntity.ok().body(lstCategory);
    }

    // update by id
    @PutMapping("/category/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable("id") String id, @RequestBody Category category) {
        category.setId(id);
        return ResponseEntity.ok().body(this.categoryService.handleUpdateCategory(category));
    }

    // delete by id
    @DeleteMapping("/category/{id}")
    public ResponseEntity<Void> deleteCategoryById(@PathVariable("id") String id) {
        this.categoryService.handleDeleteCategory(id);
        return ResponseEntity.ok().body(null);
    }

}
