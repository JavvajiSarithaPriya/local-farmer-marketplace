package com.farmermarketplace.backend.repository;

import com.farmermarketplace.backend.entity.Order;
import com.farmermarketplace.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyer(User buyer);
    long countByStatus(String status);

    @Query("SELECT o FROM Order o WHERE o.product.farmer.id = :farmerId")
    List<Order> findByFarmerId(Long farmerId);
}
