package restaurant.example.restaurant.redis.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Dish implements Serializable {
    private String id;  // Changed from Long to String
    
    private String name;
    private String description;
    private Double price;
    private String imageUrl;
    
    private String categoryId;
    
    @JsonProperty("category")
    private transient Map<String, Object> category;
    
    public void setCategory(Map<String, Object> category) {
        this.category = category;
        if (category != null && category.containsKey("id")) {
            Object categoryIdObj = category.get("id");
            if (categoryIdObj != null) {
                this.categoryId = String.valueOf(categoryIdObj);
            }
        }
    }
    
    private Boolean available = true;
    private Integer stock = 0;
    private Integer soldToday = 0;
    
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}

