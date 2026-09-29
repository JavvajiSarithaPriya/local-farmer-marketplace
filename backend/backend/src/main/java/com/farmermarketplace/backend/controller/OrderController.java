package com.farmermarketplace.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.farmermarketplace.backend.config.TokenService;

import com.farmermarketplace.backend.entity.Order;
import com.farmermarketplace.backend.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
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

    /**
     * Place a new order (Buyer only)
     * POST /api/orders
     * body: { buyerId, productId, quantity }
     */
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

    /**
     * Get orders for a buyer
     * GET /api/orders/buyer/{buyerId}
     */
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

    /**
     * Get orders for a farmer (for their products)
     * GET /api/orders/farmer/{farmerId}
     */
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

    /**
     * Update status of an order (Farmer only)
     * PUT /api/orders/{orderId}/status
     * query params: farmerId, status
     */
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

    /**
     * Cancel an order (Buyer only, PENDING status only)
     * PUT /api/orders/{orderId}/cancel
     * query param: buyerId
     */
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
}
