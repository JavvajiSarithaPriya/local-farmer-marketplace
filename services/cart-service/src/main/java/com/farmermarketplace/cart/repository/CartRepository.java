package com.farmermarketplace.cart.repository;

import com.farmermarketplace.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findByBuyerId(Long buyerId);
    Optional<Cart> findByBuyerIdAndProductId(Long buyerId, Long productId);
    void deleteByBuyerId(Long buyerId);
}
