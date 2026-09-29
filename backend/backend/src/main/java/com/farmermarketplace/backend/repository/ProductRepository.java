package com.farmermarketplace.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import java.util.List;
import java.math.BigDecimal;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByFarmer(User farmer);
    List<Product> findByFarmerId(Long farmerId);
    List<Product> findByIsActiveTrue();
    List<Product> findByFarmerAndIsActiveTrue(User farmer);
    long countByIsActive(boolean isActive);

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:searchTerm IS NULL OR :searchTerm = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:category IS NULL OR :category = '' OR p.category = :category) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    List<Product> searchAndFilterProducts(@Param("searchTerm") String searchTerm,
                                         @Param("category") String category,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.isActive = true ORDER BY p.category")
    List<String> findDistinctCategories();
}
