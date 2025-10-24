package restaurant.example.restaurant.util.error;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import restaurant.example.restaurant.domain.response.RestResponse;

// quản lý exception toàn bộ controller và trả về định dạng
@RestControllerAdvice
public class GlobalException {
    @ExceptionHandler(value = {
            BadCredentialsException.class,
            IdInvalidException.class,

    })
    public ResponseEntity<RestResponse<Object>> handleIdException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError(ex.getMessage());
        res.setMessage("Exception occurs...");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            UsernameNotFoundException.class,

    })
    public ResponseEntity<RestResponse<Object>> handleUsernameNotFoundException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError(ex.getMessage());
        res.setMessage("Error find user");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            NoResourceFoundException.class,
    })
    public ResponseEntity<RestResponse<Object>> handleNotFoundException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.NOT_FOUND.value());
        res.setError(ex.getMessage());
        res.setMessage("404 Not Found. URL may not exist...");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            StorageException.class,

    })
    public ResponseEntity<RestResponse<Object>> handleFileUploadException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError(ex.getMessage());
        res.setMessage("Exception upload file");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            PermissionException.class,
    })
    public ResponseEntity<RestResponse<Object>> handlePermissionException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage("Forbidden");
        res.setError(ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }

    @ExceptionHandler(value = {
            CartException.class,
    })
    public ResponseEntity<RestResponse<Object>> handleCartException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage("Not found item");
        res.setError(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            OrderException.class,
    })
    public ResponseEntity<RestResponse<Object>> handleOrderException(Exception ex) {
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage("Not found item");
        res.setError(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }
}
