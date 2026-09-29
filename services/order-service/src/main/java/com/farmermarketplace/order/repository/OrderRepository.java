package com.farmermarketplace.order.repository;

import com.farmermarketplace.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findByFarmerId(Long farmerId);
    List<Order> findByProductId(Long productId);
    long countByStatus(String status);
}
