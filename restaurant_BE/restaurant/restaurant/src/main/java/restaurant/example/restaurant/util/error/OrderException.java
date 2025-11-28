package restaurant.example.restaurant.util.error;

// khai báo  exception 
public class OrderException extends Exception {
    // Constructor that accepts a message
    public OrderException(String message) {
        super(message);
    }
}
