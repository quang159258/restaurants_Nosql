package restaurant.example.restaurant.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.domain.Category;
import restaurant.example.restaurant.repository.CategoryRepository;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    
    @Autowired
    private CacheService cacheService;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category handleCreatedCategory(Category category) {
        Category savedCategory = this.categoryRepository.save(category);
        // Cache the saved category
        cacheService.cacheCategory(savedCategory.getId(), savedCategory);
        // Invalidate list cache
        cacheService.deleteAllCategoryListCache();
        return savedCategory;
    }

    public Category handleUpdateCategory(Category category) {
        Category updatedCategory = this.categoryRepository.save(category);
        // Update cache
        cacheService.cacheCategory(updatedCategory.getId(), updatedCategory);
        // Invalidate list cache
        cacheService.deleteAllCategoryListCache();
        return updatedCategory;
    }

    public void handleDeleteCategory(Long id) {
        this.categoryRepository.deleteById(id);
        // Remove from cache
        cacheService.deleteCachedCategory(id);
        // Invalidate list cache
        cacheService.deleteAllCategoryListCache();
    }

    public List<Category> handleGetAllCategory() {
        String cacheKey = "all";
        // Try to get from cache first
        Object cachedList = cacheService.getCachedCategoryList(cacheKey);
        if (cachedList instanceof List) {
            @SuppressWarnings("unchecked")
            List<Category> result = (List<Category>) cachedList;
            return result;
        }
        
        // If not in cache, get from database and cache it
        List<Category> categories = this.categoryRepository.findAll();
        cacheService.cacheCategoryList(cacheKey, categories);
        return categories;
    }

    public Optional<Category> handleGetByIdCategory(Long id) {
        // Try to get from cache first
        Object cachedCategory = cacheService.getCachedCategory(id);
        if (cachedCategory instanceof Category) {
            return Optional.of((Category) cachedCategory);
        }
        
        // If not in cache, get from database and cache it
        Optional<Category> category = this.categoryRepository.findById(id);
        if (category.isPresent()) {
            cacheService.cacheCategory(id, category.get());
        }
        return category;
    }
}
