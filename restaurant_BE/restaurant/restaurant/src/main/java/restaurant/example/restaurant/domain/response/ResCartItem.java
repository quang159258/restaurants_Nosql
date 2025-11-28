package restaurant.example.restaurant.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResCartItem {
    long id;
    long quantity;
    double price;
    double total;
    String name;
    String imageUrl;
    String categoryName;
}
