package com.farmermarketplace.backend.controller;

import com.farmermarketplace.backend.entity.Cart;
import com.farmermarketplace.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.farmermarketplace.backend.config.TokenService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private TokenService tokenService;

    private boolean ownsBuyer(HttpServletRequest request, Long buyerId) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return false;
        String token = header.substring(7);
        return "BUYER".equals(tokenService.validateAndGetRole(token))
                && buyerId.equals(tokenService.validateAndGetUserId(token));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestParam Long buyerId,
                                       @RequestParam Long productId,
                                       @RequestParam Integer quantity,
                                       HttpServletRequest request) {
        try {
            if (!ownsBuyer(request, buyerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            Cart cartItem = cartService.addToCart(buyerId, productId, quantity);
            return ResponseEntity.status(HttpStatus.CREATED).body(cartItem);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam Long buyerId, HttpServletRequest request) {
        try {
            if (!ownsBuyer(request, buyerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            List<Cart> cartItems = cartService.getBuyerCart(buyerId);
            BigDecimal subtotal = cartService.calculateSubtotal(buyerId);
            BigDecimal total = cartService.calculateTotal(buyerId);

            Map<String, Object> response = new HashMap<>();
            response.put("items", cartItems);
            response.put("subtotal", subtotal);
            response.put("total", total);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PutMapping("/update/{cartItemId}")
    public ResponseEntity<?> updateCartQuantity(@RequestParam Long buyerId,
                                                @PathVariable Long cartItemId,
                                                @RequestParam Integer quantity,
                                                HttpServletRequest request) {
        try {
            if (!ownsBuyer(request, buyerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            Cart updatedItem = cartService.updateCartQuantity(buyerId, cartItemId, quantity);
            return ResponseEntity.ok(updatedItem);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<?> removeCartItem(@RequestParam Long buyerId,
                                            @PathVariable Long cartItemId,
                                            HttpServletRequest request) {
        try {
            if (!ownsBuyer(request, buyerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            cartService.removeCartItem(buyerId, cartItemId);
            return ResponseEntity.ok("Item removed from cart");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@RequestParam Long buyerId, HttpServletRequest request) {
        try {
            if (!ownsBuyer(request, buyerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated buyer access required");
            cartService.clearCart(buyerId);
            return ResponseEntity.ok("Cart cleared");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
