package restaurant.example.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import restaurant.example.restaurant.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}
