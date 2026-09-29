package com.farmermarketplace.order.repository;

import com.farmermarketplace.order.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByOrderId(Long orderId);
    List<Feedback> findByBuyerId(Long buyerId);
    boolean existsByOrderId(Long orderId);
}
