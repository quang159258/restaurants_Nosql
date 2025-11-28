package restaurant.example.restaurant.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResOrderItem {
    long id;
    long quantity;
    double price;
    double total;
    String name;
    String imageUrl;
}
