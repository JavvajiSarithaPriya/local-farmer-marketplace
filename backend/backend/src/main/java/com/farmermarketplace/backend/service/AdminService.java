package com.farmermarketplace.backend.service;

import com.farmermarketplace.backend.entity.Order;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.OrderRepository;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    // ── User management ──────────────────────────────────────────────────────

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    public List<User> getFarmers() {
        List<User> farmers = userRepository.findByRole("FARMER");
        farmers.forEach(u -> u.setPassword(null));
        return farmers;
    }

    public List<User> getBuyers() {
        List<User> buyers = userRepository.findByRole("BUYER");
        buyers.forEach(u -> u.setPassword(null));
        return buyers;
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deactivateUser(Long userId, Long requestingAdminId) {
        if (requestingAdminId != null && userId.equals(requestingAdminId)) {
            throw new RuntimeException("You cannot deactivate your own administrator account");
        }
        User user = getUserById(userId);
        user.setIsActive(false);
        userRepository.save(user);
    }

    public void activateUser(Long userId) {
        User user = getUserById(userId);
        user.setIsActive(true);
        userRepository.save(user);
    }

    // ── Product management ───────────────────────────────────────────────────

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public void deactivateProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }

    public void activateProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsActive(true);
        productRepository.save(product);
    }

    // ── Order management ─────────────────────────────────────────────────────

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // ── Statistics ───────────────────────────────────────────────────────────

    public long getTotalUsers() {
        return userRepository.count();
    }

    public long getTotalFarmers() {
        return userRepository.countByRole("FARMER");
    }

    public long getTotalBuyers() {
        return userRepository.countByRole("BUYER");
    }

    public long getTotalProducts() {
        return productRepository.count();
    }

    public long getActiveProducts() {
        return productRepository.countByIsActive(true);
    }

    public long getInactiveProducts() {
        return productRepository.countByIsActive(false);
    }

    public long getTotalOrders() {
        return orderRepository.count();
    }

    public long getPendingOrders() {
        return orderRepository.countByStatus("PENDING");
    }

    public long getAcceptedOrders() {
        return orderRepository.countByStatus("ACCEPTED");
    }

    public long getDeliveredOrders() {
        return orderRepository.countByStatus("DELIVERED");
    }

    public long getRejectedOrders() {
        return orderRepository.countByStatus("REJECTED");
    }

    public long getCancelledOrders() {
        return orderRepository.countByStatus("CANCELLED");
    }
}
