package restaurant.example.restaurant.domain.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestResponse<T> {
    private String status;
    private String message;
    private T data;
    private Integer statusCode;
    private String error;
    
    public static <T> RestResponse<T> success(T data) {
        RestResponse<T> response = new RestResponse<>("success", null, data, 200, null);
        return response;
    }
    
    public static <T> RestResponse<T> error(String message) {
        return new RestResponse<>("error", message, null, 500, message);
    }
    
    public void setStatusCode(int code) {
        this.statusCode = code;
    }
    
    public void setError(String error) {
        this.error = error;
    }
}
