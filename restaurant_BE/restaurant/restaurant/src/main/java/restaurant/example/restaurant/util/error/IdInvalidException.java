package restaurant.example.restaurant.util.error;

// khai báo  exception 
public class IdInvalidException extends Exception {
    // Constructor that accepts a message
    public IdInvalidException(String message) {
        super(message);
    }
}
