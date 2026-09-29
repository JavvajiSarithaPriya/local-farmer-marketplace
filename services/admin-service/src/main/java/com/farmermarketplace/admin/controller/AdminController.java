package com.farmermarketplace.admin.controller;

import com.farmermarketplace.admin.config.TokenService;
import com.farmermarketplace.admin.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8080"})
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private TokenService tokenService;

    private Long getRequestingAdminId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) return null;
        return tokenService.validateAndGetUserId(auth.substring(7));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = adminService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching statistics: " + e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(adminService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching users: " + e.getMessage());
        }
    }

    @GetMapping("/users/farmers")
    public ResponseEntity<?> getFarmers() {
        try {
            return ResponseEntity.ok(adminService.getFarmers());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching farmers: " + e.getMessage());
        }
    }

    @GetMapping("/users/buyers")
    public ResponseEntity<?> getBuyers() {
        try {
            return ResponseEntity.ok(adminService.getBuyers());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching buyers: " + e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId, HttpServletRequest request) {
        try {
            Long adminId = getRequestingAdminId(request);
            adminService.deactivateUser(userId, adminId);
            return ResponseEntity.ok("User deactivated successfully");
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("cannot deactivate your own")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error deactivating user: " + e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        try {
            adminService.activateUser(userId);
            return ResponseEntity.ok("User activated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error activating user: " + e.getMessage());
        }
    }

    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        try {
            return ResponseEntity.ok(adminService.getAllProducts());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching products: " + e.getMessage());
        }
    }

    @PutMapping("/products/{productId}/deactivate")
    public ResponseEntity<?> deactivateProduct(@PathVariable Long productId) {
        try {
            adminService.deactivateProduct(productId);
            return ResponseEntity.ok("Product deactivated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error deactivating product: " + e.getMessage());
        }
    }

    @PutMapping("/products/{productId}/activate")
    public ResponseEntity<?> activateProduct(@PathVariable Long productId) {
        try {
            adminService.activateProduct(productId);
            return ResponseEntity.ok("Product activated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error activating product: " + e.getMessage());
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        try {
            return ResponseEntity.ok(adminService.getAllOrders());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching orders: " + e.getMessage());
        }
    }
}
