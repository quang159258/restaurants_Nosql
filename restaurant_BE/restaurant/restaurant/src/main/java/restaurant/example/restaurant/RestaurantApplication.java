package restaurant.example.restaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//disable security
// @SpringBootApplication(exclude = {
// 		org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
// 		org.springframework.boot.actuate.autoconfigure.security.servlet.ManagementWebSecurityAutoConfiguration.class
// })
@SpringBootApplication

public class RestaurantApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaurantApplication.class, args);
	}

}
