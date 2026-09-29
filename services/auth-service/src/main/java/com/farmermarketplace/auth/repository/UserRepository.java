package com.farmermarketplace.auth.repository;

import com.farmermarketplace.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByMobileNumber(String mobileNumber);
    User findByEmail(String email);
    List<User> findByRole(String role);
    long countByRole(String role);
}
