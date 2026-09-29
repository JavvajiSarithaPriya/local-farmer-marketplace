package com.farmermarketplace.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import com.farmermarketplace.backend.config.TokenService;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.service.ProductService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private TokenService tokenService;

    private Long currentUserId(HttpServletRequest request, String requiredRole) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        String role = tokenService.validateAndGetRole(token);
        Long userId = tokenService.validateAndGetUserId(token);
        return requiredRole.equals(role) ? userId : null;
    }

    /**
     * Upload a product image (Farmer only)
     * POST /api/products/upload-image
     */
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("farmerId") Long farmerId,
            HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select an image file to upload");
            }

            // Max 5MB
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("Image size exceeds maximum allowed limit of 5MB");
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg") &&
                                        !contentType.equalsIgnoreCase("image/jpg") &&
                                        !contentType.equalsIgnoreCase("image/png") &&
                                        !contentType.equalsIgnoreCase("image/webp"))) {
                return ResponseEntity.badRequest().body("Only JPEG, PNG, and WebP images are supported");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.lastIndexOf('.') != -1) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
                if (!extension.matches("^\\.(jpe?g|png|webp)$")) {
                    return ResponseEntity.badRequest().body("Invalid file extension");
                }
            }

            String newFilename = UUID.randomUUID().toString().replace("-", "") + extension;
            Path uploadDir = Paths.get("uploads", "products");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            Path destination = uploadDir.resolve(newFilename).normalize();
            if (!destination.startsWith(uploadDir)) {
                return ResponseEntity.badRequest().body("Invalid file path");
            }

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/products/" + newFilename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Image upload failed: " + e.getMessage());
        }
    }

    /**
     * Add a new product (Farmer only)
     * POST /api/products
     */
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product, @RequestParam Long farmerId, HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            // Validation
            if (product.getName() == null || product.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("Product name is required");
            }
            if (product.getPrice() == null) {
                return ResponseEntity.badRequest().body("Product price is required");
            }
            if (product.getQuantity() == null) {
                return ResponseEntity.badRequest().body("Product quantity is required");
            }

            Product createdProduct = productService.createProduct(product, authenticatedFarmerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error creating product: " + e.getMessage());
        }
    }

    /**
     * Get all products for a farmer
     * GET /api/products/farmer/{farmerId}
     */
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<?> getProductsByFarmer(@PathVariable Long farmerId, HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            List<Product> products = productService.getProductsByFarmer(authenticatedFarmerId);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error fetching products: " + e.getMessage());
        }
    }

    /**
     * Get all active products (for all buyers)
     * GET /api/products/all/active
     */
    @GetMapping("/all/active")
    public ResponseEntity<?> getAllActiveProducts() {
        try {
            List<Product> products = productService.getAllActiveProducts();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching products: " + e.getMessage());
        }
    }

    /**
     * Get all products (without filter)
     * GET /api/products/all
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllProducts() {
        try {
            // This endpoint requires authentication in production
            List<Product> products = productService.getAllActiveProducts();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching products: " + e.getMessage());
        }
    }

    /**
     * Get a specific product by ID
     * GET /api/products/{productId}
     */
    @GetMapping("/{productId}")
    public ResponseEntity<?> getProductById(@PathVariable Long productId) {
        try {
            var product = productService.getProductById(productId);
            if (product.isPresent() && Boolean.TRUE.equals(product.get().getIsActive())) {
                return ResponseEntity.ok(product.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error fetching product: " + e.getMessage());
        }
    }

    /**
     * Update a product (Farmer only)
     * PUT /api/products/{productId}
     */
    @PutMapping("/{productId}")
    public ResponseEntity<?> updateProduct(@PathVariable Long productId, @RequestBody Product updatedProduct, @RequestParam Long farmerId, HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            Product product = productService.updateProduct(productId, updatedProduct, authenticatedFarmerId);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error updating product: " + e.getMessage());
        }
    }

    /**
     * Delete a product (Farmer only - soft delete)
     * DELETE /api/products/{productId}
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long productId, @RequestParam Long farmerId, HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            productService.deleteProduct(productId, authenticatedFarmerId);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error deleting product: " + e.getMessage());
        }
    }

    /**
     * Search and filter products
     * GET /api/products/search?searchTerm=...&category=...&minPrice=...&maxPrice=...&sortBy=...&sortOrder=...
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchAndFilterProducts(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortOrder) {
        try {
            List<Product> products = productService.searchAndFilterProducts(
                searchTerm, category, minPrice, maxPrice, sortBy, sortOrder);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching products: " + e.getMessage());
        }
    }

    /**
     * Get all available categories
     * GET /api/products/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            List<String> categories = productService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching categories: " + e.getMessage());
        }
    }

}