package restaurant.example.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import restaurant.example.restaurant.domain.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long>,
        JpaSpecificationExecutor<Role> {
    boolean existsByName(String name);

    Role findByName(String name);
}