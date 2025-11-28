package restaurant.example.restaurant.util.error;

// khai báo  exception 
public class StorageException extends Exception {
    // Constructor that accepts a message
    public StorageException(String message) {
        super(message);
    }
}
