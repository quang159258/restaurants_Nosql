package restaurant.example.restaurant.repository;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import restaurant.example.restaurant.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    public User findByEmail(String email);

    // public Optional<User> findByEmail(String email);

    public Boolean existsByEmail(String email);

    public User findByRefreshTokenAndEmail(String token, String email);

}
