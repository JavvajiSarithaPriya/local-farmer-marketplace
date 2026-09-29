package com.farmermarketplace.product.repository;

import com.farmermarketplace.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByFarmerId(Long farmerId);

    List<Product> findByIsActiveTrue();

    long countByIsActive(Boolean isActive);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.isActive = true")
    List<String> findDistinctCategories();

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:searchTerm IS NULL OR :searchTerm = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:category IS NULL OR :category = '' OR LOWER(p.category) = LOWER(:category)) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    List<Product> searchAndFilterProducts(
            @Param("searchTerm") String searchTerm,
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice
    );
}
