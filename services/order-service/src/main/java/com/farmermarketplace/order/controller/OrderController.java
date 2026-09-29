package com.farmermarketplace.order.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.farmermarketplace.order.config.TokenService;
import com.farmermarketplace.order.entity.Order;
import com.farmermarketplace.order.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8080"})
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private TokenService tokenService;

    private Long currentUserId(HttpServletRequest request, String requiredRole) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        return requiredRole.equals(tokenService.validateAndGetRole(token))
                ? tokenService.validateAndGetUserId(token) : null;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            Long buyerId = Long.valueOf(body.get("buyerId").toString());
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null || !authenticatedBuyerId.equals(buyerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            }
            Long productId = Long.valueOf(body.get("productId").toString());
            Integer quantity = Integer.valueOf(body.get("quantity").toString());

            Order order = orderService.placeOrder(buyerId, productId, quantity);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error placing order: " + e.getMessage());
        }
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<?> getOrdersByBuyer(@PathVariable Long buyerId, HttpServletRequest request) {
        try {
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null || !authenticatedBuyerId.equals(buyerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            }
            List<Order> orders = orderService.getOrdersByBuyer(authenticatedBuyerId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error fetching buyer orders: " + e.getMessage());
        }
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<?> getOrdersByFarmer(@PathVariable Long farmerId, HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            List<Order> orders = orderService.getOrdersByFarmer(authenticatedFarmerId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error fetching farmer orders: " + e.getMessage());
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId,
                                               @RequestParam Long farmerId,
                                               @RequestParam String status,
                                               HttpServletRequest request) {
        try {
            Long authenticatedFarmerId = currentUserId(request, "FARMER");
            if (authenticatedFarmerId == null || !authenticatedFarmerId.equals(farmerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated farmer access required");
            }
            Order updated = orderService.updateOrderStatus(orderId, status, authenticatedFarmerId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error updating order: " + e.getMessage());
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId,
                                         @RequestParam Long buyerId,
                                         HttpServletRequest request) {
        try {
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null || !authenticatedBuyerId.equals(buyerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            }
            Order cancelled = orderService.cancelOrder(orderId, authenticatedBuyerId);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error cancelling order: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error cancelling order: " + e.getMessage());
        }
    }

    // ── Internal / Admin Endpoints ──

    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getOrderStats() {
        return ResponseEntity.ok(Map.of(
            "total", orderService.getTotalOrders(),
            "pending", orderService.getPendingOrders(),
            "accepted", orderService.getAcceptedOrders(),
            "delivered", orderService.getDeliveredOrders(),
            "rejected", orderService.getRejectedOrders(),
            "cancelled", orderService.getCancelledOrders()
        ));
    }
}
