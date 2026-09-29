package com.farmermarketplace.order.service;

import com.farmermarketplace.order.dto.ProductDto;
import com.farmermarketplace.order.dto.UserDto;
import com.farmermarketplace.order.entity.Order;
import com.farmermarketplace.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
@SuppressWarnings("null")
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${product.service.url:http://localhost:8082}")
    private String productServiceUrl;

    private UserDto fetchUser(Long userId) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/api/users/" + userId, UserDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private ProductDto fetchProduct(Long productId) {
        try {
            return restTemplate.getForObject(productServiceUrl + "/api/products/" + productId, ProductDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private void hydrate(Order order) {
        if (order == null) return;
        ProductDto p = fetchProduct(order.getProductId());
        order.setProduct(p);
        if (order.getFarmerId() == null && p != null && p.getFarmerId() != null) {
            order.setFarmerId(p.getFarmerId());
        }
        UserDto b = fetchUser(order.getBuyerId());
        order.setBuyer(b);
    }

    public Order placeOrder(Long buyerId, Long productId, Integer quantity) {
        UserDto buyer = fetchUser(buyerId);
        if (buyer == null) {
            throw new RuntimeException("Buyer not found");
        }
        if (!"BUYER".equalsIgnoreCase(buyer.getRole())) {
            throw new RuntimeException("Only buyers can place orders");
        }

        ProductDto product = fetchProduct(productId);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new RuntimeException("Product is not available");
        }
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
        int stock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
        if (stock < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        BigDecimal total = product.getPrice().multiply(new BigDecimal(quantity));

        Order order = new Order();
        order.setBuyerId(buyerId);
        order.setProductId(productId);
        order.setFarmerId(product.getFarmerId());
        order.setQuantity(quantity);
        order.setTotalPrice(total);
        order.setTotalAmount(total);
        order.setCustomerId(buyerId);
        order.setStatus("PENDING");
        order.setOrderDate(java.time.LocalDateTime.now());

        Order saved = orderRepository.save(order);
        saved.setProduct(product);
        saved.setBuyer(buyer);
        return saved;
    }

    public List<Order> getOrdersByBuyer(Long buyerId) {
        UserDto buyer = fetchUser(buyerId);
        if (buyer == null) {
            throw new RuntimeException("Buyer not found");
        }
        List<Order> orders = orderRepository.findByBuyerId(buyerId);
        orders.forEach(this::hydrate);
        return orders;
    }

    public List<Order> getOrdersByFarmer(Long farmerId) {
        List<Order> orders = orderRepository.findByFarmerId(farmerId);
        if (orders.isEmpty()) {
            List<Order> all = orderRepository.findAll();
            for (Order o : all) {
                hydrate(o);
                if (o.getProduct() != null && farmerId.equals(o.getProduct().getFarmerId())) {
                    o.setFarmerId(farmerId);
                    orderRepository.save(o);
                    orders.add(o);
                }
            }
        } else {
            orders.forEach(this::hydrate);
        }
        return orders;
    }

    public Order updateOrderStatus(Long orderId, String status, Long farmerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        hydrate(order);

        Long productFarmerId = order.getFarmerId();
        if (productFarmerId == null && order.getProduct() != null) {
            productFarmerId = order.getProduct().getFarmerId();
        }

        if (productFarmerId == null || !productFarmerId.equals(farmerId)) {
            throw new RuntimeException("You don't have permission to update this order");
        }

        String current = order.getStatus();
        validateStatusTransition(current, status);

        // Deduct stock when farmer accepts order
        if ("ACCEPTED".equalsIgnoreCase(status)) {
            try {
                restTemplate.postForObject(
                    productServiceUrl + "/api/products/" + order.getProductId() + "/deduct-stock?quantity=" + order.getQuantity(),
                    null,
                    Object.class
                );
            } catch (Exception e) {
                throw new RuntimeException("Insufficient stock to accept this order");
            }
        }

        order.setStatus(status);
        Order saved = orderRepository.save(order);
        hydrate(saved);
        return saved;
    }

    public Order cancelOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new RuntimeException("You do not have permission to cancel this order");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be cancelled");
        }

        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);
        hydrate(saved);
        return saved;
    }

    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        orders.forEach(this::hydrate);
        return orders;
    }

    public long getTotalOrders() { return orderRepository.count(); }
    public long getPendingOrders() { return orderRepository.countByStatus("PENDING"); }
    public long getAcceptedOrders() { return orderRepository.countByStatus("ACCEPTED"); }
    public long getDeliveredOrders() { return orderRepository.countByStatus("DELIVERED"); }
    public long getRejectedOrders() { return orderRepository.countByStatus("REJECTED"); }
    public long getCancelledOrders() { return orderRepository.countByStatus("CANCELLED"); }

    private void validateStatusTransition(String current, String next) {
        Map<String, List<String>> allowed = new HashMap<>();
        allowed.put("PENDING", Arrays.asList("ACCEPTED", "REJECTED"));
        allowed.put("ACCEPTED", Arrays.asList("PACKED"));
        allowed.put("PACKED", Arrays.asList("SHIPPED"));
        allowed.put("SHIPPED", Arrays.asList("DELIVERED"));
        allowed.put("REJECTED", Collections.emptyList());
        allowed.put("DELIVERED", Collections.emptyList());
        allowed.put("CANCELLED", Collections.emptyList());

        List<String> validNext = allowed.getOrDefault(current, Collections.emptyList());
        if (!validNext.contains(next)) {
            throw new RuntimeException("Invalid status transition: " + current + " → " + next);
        }
    }
}
