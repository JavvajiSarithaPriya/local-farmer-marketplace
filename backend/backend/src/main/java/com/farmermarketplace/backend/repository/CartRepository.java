package com.farmermarketplace.backend.repository;

import com.farmermarketplace.backend.entity.Cart;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    List<Cart> findByBuyer(User buyer);

    List<Cart> findByBuyerId(Long buyerId);

    Optional<Cart> findByBuyerIdAndProductId(Long buyerId, Long productId);

    void deleteByBuyer(User buyer);

    void deleteByBuyerId(Long buyerId);

    boolean existsByBuyerAndProduct(User buyer, Product product);
}
