package com.farmermarketplace.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.farmermarketplace.backend.entity.User;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByMobileNumber(String mobileNumber);

    User findByEmail(String email);

    // Legacy method support
    User findByPhone(String phone);

    // Role-based queries for admin management
    List<User> findByRole(String role);

    long countByRole(String role);
}
