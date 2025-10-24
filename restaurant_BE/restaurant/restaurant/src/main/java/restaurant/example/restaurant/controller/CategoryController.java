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
import restaurant.example.restaurant.domain.Category;
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
    public ResponseEntity<Category> getCategoryById(@PathVariable("id") Long id) {
        Category category = this.categoryService.handleGetByIdCategory(id).isPresent()
                ? this.categoryService.handleGetByIdCategory(id).get()
                : null;
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
    public ResponseEntity<Category> updateCategory(@PathVariable("id") Long id, @RequestBody Category category) {
        category.setId(id);
        return ResponseEntity.ok().body(this.categoryService.handleUpdateCategory(category));
    }

    // delete by id
    @DeleteMapping("/category/{id}")
    public ResponseEntity<Void> deleteCategoryById(@PathVariable("id") Long id) {
        this.categoryService.handleDeleteCategory(id);
        return ResponseEntity.ok().body(null);
    }

}
