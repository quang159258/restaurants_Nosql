package restaurant.example.restaurant.util.error;

// khai báo  exception 
public class CartException extends Exception {
    // Constructor that accepts a message
    public CartException(String message) {
        super(message);
    }
}
