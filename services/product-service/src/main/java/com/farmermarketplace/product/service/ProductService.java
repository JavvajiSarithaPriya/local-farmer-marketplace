package com.farmermarketplace.product.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.farmermarketplace.product.entity.Product;
import com.farmermarketplace.product.dto.FarmerDto;
import com.farmermarketplace.product.repository.ProductRepository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.util.Map;

@Service
@SuppressWarnings("null")
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public FarmerDto fetchFarmer(Long farmerId) {
        if (farmerId == null) return null;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = restTemplate.getForObject(authServiceUrl + "/api/users/" + farmerId, Map.class);
            if (map != null) {
                FarmerDto f = new FarmerDto();
                f.setId(farmerId);
                f.setFullName((String) map.get("fullName"));
                f.setName((String) map.get("name"));
                f.setMobileNumber((String) map.get("mobileNumber"));
                f.setPhone((String) map.get("phone"));
                f.setEmail((String) map.get("email"));
                f.setAddress((String) map.get("address"));
                f.setVillage((String) map.get("village"));
                f.setDistrict((String) map.get("district"));
                f.setState((String) map.get("state"));
                f.setPincode((String) map.get("pincode"));
                return f;
            }
        } catch (Exception ignored) {}
        return new FarmerDto(farmerId, "Farmer #" + farmerId, null, null, null, null, null);
    }

    public Product createProduct(Product product, Long farmerId) {
        product.setFarmerId(farmerId);
        product.setIsActive(true);
        Product saved = productRepository.save(product);
        saved.setFarmer(fetchFarmer(farmerId));
        return saved;
    }

    public List<Product> getProductsByFarmer(Long farmerId) {
        List<Product> list = productRepository.findByFarmerId(farmerId);
        FarmerDto farmer = fetchFarmer(farmerId);
        list.forEach(p -> p.setFarmer(farmer));
        return list;
    }

    public Optional<Product> getProductById(Long productId) {
        Optional<Product> opt = productRepository.findById(productId);
        opt.ifPresent(p -> p.setFarmer(fetchFarmer(p.getFarmerId())));
        return opt;
    }

    public Product updateProduct(Long productId, Product updatedProduct, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getFarmerId().equals(farmerId)) {
            throw new RuntimeException("You don't have permission to update this product");
        }

        if (updatedProduct.getName() != null) product.setName(updatedProduct.getName());
        if (updatedProduct.getPrice() != null) product.setPrice(updatedProduct.getPrice());
        if (updatedProduct.getQuantity() != null) product.setQuantity(updatedProduct.getQuantity());
        if (updatedProduct.getDescription() != null) product.setDescription(updatedProduct.getDescription());
        if (updatedProduct.getCategory() != null) product.setCategory(updatedProduct.getCategory());
        if (updatedProduct.getUnit() != null) product.setUnit(updatedProduct.getUnit());
        if (updatedProduct.getImageUrl() != null) product.setImageUrl(updatedProduct.getImageUrl());
        if (updatedProduct.getIsActive() != null) product.setIsActive(updatedProduct.getIsActive());

        Product saved = productRepository.save(product);
        saved.setFarmer(fetchFarmer(farmerId));
        return saved;
    }

    public void deleteProduct(Long productId, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getFarmerId().equals(farmerId)) {
            throw new RuntimeException("You don't have permission to delete this product");
        }

        product.setIsActive(false);
        productRepository.save(product);
    }

    public List<Product> getAllActiveProducts() {
        List<Product> list = productRepository.findByIsActiveTrue();
        list.forEach(p -> p.setFarmer(fetchFarmer(p.getFarmerId())));
        return list;
    }

    public List<Product> getAllProducts() {
        List<Product> list = productRepository.findAll();
        list.forEach(p -> p.setFarmer(fetchFarmer(p.getFarmerId())));
        return list;
    }

    public List<Product> searchAndFilterProducts(String searchTerm, String category,
                                                BigDecimal minPrice, BigDecimal maxPrice,
                                                String sortBy, String sortOrder) {
        List<Product> products = productRepository.searchAndFilterProducts(searchTerm, category, minPrice, maxPrice);
        products.forEach(p -> p.setFarmer(fetchFarmer(p.getFarmerId())));

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

    public List<String> getAllCategories() {
        return productRepository.findDistinctCategories();
    }

    public synchronized Product deductStock(Long productId, Integer quantity) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        int current = p.getQuantity() != null ? p.getQuantity() : 0;
        if (current < quantity) {
            throw new RuntimeException("Insufficient stock");
        }
        int newQty = current - quantity;
        p.setQuantity(newQty);
        if (newQty == 0) {
            p.setIsActive(false);
        }
        return productRepository.save(p);
    }

    public synchronized Product restoreStock(Long productId, Integer quantity) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        int current = p.getQuantity() != null ? p.getQuantity() : 0;
        p.setQuantity(current + quantity);
        p.setIsActive(true);
        return productRepository.save(p);
    }

    public void deactivateProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setIsActive(false);
        productRepository.save(p);
    }

    public void activateProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setIsActive(true);
        productRepository.save(p);
    }

    public long getTotalProducts() { return productRepository.count(); }
    public long getActiveProducts() { return productRepository.countByIsActive(true); }
    public long getInactiveProducts() { return productRepository.countByIsActive(false); }
}
