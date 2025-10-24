package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Category;
import restaurant.example.restaurant.repository.CategoryRepository;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category handleCreatedCategory(Category category) {
        return this.categoryRepository.save(category);
    }

    public Category handleUpdateCategory(Category category) {
        return this.categoryRepository.save(category);
    }

    public void handleDeleteCategory(Long id) {
        this.categoryRepository.deleteById(id);
    }

    public List<Category> handleGetAllCategory() {
        return this.categoryRepository.findAll();
    }

    public Optional<Category> handleGetByIdCategory(Long id) {
        return this.categoryRepository.findById(id);
    }
}
