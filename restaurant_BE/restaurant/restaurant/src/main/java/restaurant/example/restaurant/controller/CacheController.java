package restaurant.example.restaurant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import restaurant.example.restaurant.domain.response.RestResponse;
import restaurant.example.restaurant.service.CacheService;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cache")
public class CacheController {
    
    @Autowired
    private CacheService cacheService;
    
    @GetMapping("/stats")
    public ResponseEntity<RestResponse<Object>> getCacheStats() {
        try {
            long cacheSize = cacheService.getCacheSize();
            
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(200);
            response.setMessage("Cache statistics retrieved successfully");
            response.setData(Map.of("cacheSize", cacheSize));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(500);
            response.setMessage("Error retrieving cache statistics");
            response.setError(e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<RestResponse<Object>> clearAllCache() {
        try {
            cacheService.clearAllCache();
            
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(200);
            response.setMessage("All cache cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(500);
            response.setMessage("Error clearing cache");
            response.setError(e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/dish/{id}")
    public ResponseEntity<RestResponse<Object>> clearDishCache(@PathVariable Long id) {
        try {
            cacheService.deleteCachedDish(id);
            
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(200);
            response.setMessage("Dish cache cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(500);
            response.setMessage("Error clearing dish cache");
            response.setError(e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/category/{id}")
    public ResponseEntity<RestResponse<Object>> clearCategoryCache(@PathVariable Long id) {
        try {
            cacheService.deleteCachedCategory(id);
            
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(200);
            response.setMessage("Category cache cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(500);
            response.setMessage("Error clearing category cache");
            response.setError(e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/user/{id}")
    public ResponseEntity<RestResponse<Object>> clearUserCache(@PathVariable Long id) {
        try {
            cacheService.deleteCachedUser(id);
            
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(200);
            response.setMessage("User cache cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RestResponse<Object> response = new RestResponse<>();
            response.setStatusCode(500);
            response.setMessage("Error clearing user cache");
            response.setError(e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
