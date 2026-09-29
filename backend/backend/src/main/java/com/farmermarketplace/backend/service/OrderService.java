package com.farmermarketplace.backend.service;

import com.farmermarketplace.backend.entity.Order;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.OrderRepository;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@SuppressWarnings("null")
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Buyer places an order for a product.
     */
    public Order placeOrder(Long buyerId, Long productId, Integer quantity) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        if (!"BUYER".equals(buyer.getRole())) {
            throw new RuntimeException("Only buyers can place orders");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (!product.getIsActive()) {
            throw new RuntimeException("Product is not available");
        }

        // optionally check stock
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
        // the stock quantity field is "quantity" on the entity
        if (product.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        BigDecimal total = product.getPrice().multiply(new BigDecimal(quantity));

        Order order = new Order();
        order.setBuyer(buyer);
        order.setProduct(product);
        order.setQuantity(quantity);
        order.setTotalPrice(total);
        order.setTotalAmount(total);       // satisfies NOT NULL total_amount column
        order.setCustomerId(buyerId);      // satisfies NOT NULL customer_id column
        order.setStatus("PENDING");
        order.setOrderDate(java.time.LocalDateTime.now());

        return orderRepository.save(order);
    }

    public List<Order> getOrdersByBuyer(Long buyerId) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        return orderRepository.findByBuyer(buyer);
    }

    public List<Order> getOrdersByFarmer(Long farmerId) {
        // verify farmer exists (throws if missing)
        userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return orderRepository.findByFarmerId(farmerId);
    }

    public Order updateOrderStatus(Long orderId, String status, Long farmerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // verify farmer owns the product
        if (!order.getProduct().getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("You don't have permission to update this order");
        }

        String current = order.getStatus();
        validateStatusTransition(current, status);

        order.setStatus(status);

        // reduce stock when farmer accepts the order
        if ("ACCEPTED".equals(status)) {
            Product p = order.getProduct();
            int newQty = p.getQuantity() - order.getQuantity();
            if (newQty < 0) {
                throw new RuntimeException("Insufficient stock to accept this order");
            }
            p.setQuantity(newQty);
            if (newQty == 0) {
                p.setIsActive(false);
            }
            productRepository.save(p);
        }

        return orderRepository.save(order);
    }

    /**
     * Buyer cancels their own order while it is still PENDING.
     */
    public Order cancelOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new RuntimeException("You do not have permission to cancel this order");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be cancelled");
        }

        order.setStatus("CANCELLED");
        return orderRepository.save(order);
    }

    private void validateStatusTransition(String current, String next) {
        java.util.Map<String, java.util.List<String>> allowed = new java.util.HashMap<>();
        allowed.put("PENDING",   java.util.Arrays.asList("ACCEPTED", "REJECTED"));
        allowed.put("ACCEPTED",  java.util.Arrays.asList("PACKED"));
        allowed.put("PACKED",    java.util.Arrays.asList("SHIPPED"));
        allowed.put("SHIPPED",   java.util.Arrays.asList("DELIVERED"));
        allowed.put("REJECTED",  java.util.Collections.emptyList());
        allowed.put("DELIVERED", java.util.Collections.emptyList());
        allowed.put("CANCELLED", java.util.Collections.emptyList());

        java.util.List<String> validNext = allowed.getOrDefault(current, java.util.Collections.emptyList());
        if (!validNext.contains(next)) {
            throw new RuntimeException("Invalid status transition: " + current + " → " + next);
        }
    }
}
