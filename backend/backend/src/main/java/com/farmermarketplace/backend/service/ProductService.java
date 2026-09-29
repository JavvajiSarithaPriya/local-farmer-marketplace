package com.farmermarketplace.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

@Service
@SuppressWarnings("null")
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new product
     */
    public Product createProduct(Product product, Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        
        // Validate that the user is a farmer
        if (!farmer.getRole().equals("FARMER")) {
            throw new RuntimeException("Only farmers can add products");
        }
        
        product.setFarmer(farmer);
        product.setIsActive(true);
        return productRepository.save(product);
    }

    /**
     * Get all products for a specific farmer (all statuses)
     */
    public List<Product> getProductsByFarmer(Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return productRepository.findByFarmer(farmer);
    }

    /**
     * Get a specific product by ID
     */
    public Optional<Product> getProductById(Long productId) {
        return productRepository.findById(productId);
    }

    /**
     * Update an existing product
     */
    public Product updateProduct(Long productId, Product updatedProduct, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Verify the farmer owns this product
        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("You don't have permission to update this product");
        }
        
        if (updatedProduct.getName() != null) {
            product.setName(updatedProduct.getName());
        }
        if (updatedProduct.getPrice() != null) {
            product.setPrice(updatedProduct.getPrice());
        }
        if (updatedProduct.getQuantity() != null) {
            product.setQuantity(updatedProduct.getQuantity());
        }
        if (updatedProduct.getDescription() != null) {
            product.setDescription(updatedProduct.getDescription());
        }
        if (updatedProduct.getCategory() != null) {
            product.setCategory(updatedProduct.getCategory());
        }
        if (updatedProduct.getUnit() != null) {
            product.setUnit(updatedProduct.getUnit());
        }
        if (updatedProduct.getImageUrl() != null) {
            product.setImageUrl(updatedProduct.getImageUrl());
        }
        if (updatedProduct.getIsActive() != null) {
            product.setIsActive(updatedProduct.getIsActive());
        }
        
        return productRepository.save(product);
    }

    /**
     * Delete a product (soft delete - mark as inactive)
     */
    public void deleteProduct(Long productId, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Verify the farmer owns this product
        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("You don't have permission to delete this product");
        }
        
        product.setIsActive(false);
        productRepository.save(product);
    }

    /**
     * Get all active products (for buyers)
     */
    public List<Product> getAllActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    /**
     * Search and filter products
     */
    public List<Product> searchAndFilterProducts(String searchTerm, String category,
                                                BigDecimal minPrice, BigDecimal maxPrice,
                                                String sortBy, String sortOrder) {
        List<Product> products = productRepository.searchAndFilterProducts(searchTerm, category, minPrice, maxPrice);

        // Handle sorting in service layer
        if (sortBy != null && !sortBy.isEmpty()) {
            boolean ascending = "asc".equalsIgnoreCase(sortOrder);
            products.sort((p1, p2) -> {
                int result = 0;
                switch (sortBy.toLowerCase()) {
                    case "price":
                        result = p1.getPrice().compareTo(p2.getPrice());
                        break;
                    case "name":
                        result = p1.getName().compareToIgnoreCase(p2.getName());
                        break;
                    case "createdat":
                    default:
                        result = p1.getCreatedAt().compareTo(p2.getCreatedAt());
                        break;
                }
                return ascending ? result : -result;
            });
        }

        return products;
    }

    /**
     * Get all unique categories
     */
    public List<String> getAllCategories() {
        return productRepository.findDistinctCategories();
    }
}
