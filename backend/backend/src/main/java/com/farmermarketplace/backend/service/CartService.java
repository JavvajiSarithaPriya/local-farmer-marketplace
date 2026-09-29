package com.farmermarketplace.backend.service;

import com.farmermarketplace.backend.entity.Cart;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.CartRepository;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    public Cart addToCart(Long buyerId, Long productId, Integer requestedQuantity) {
        validateBuyer(buyerId);
        validateQuantity(requestedQuantity);

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        if (!"BUYER".equalsIgnoreCase(buyer.getRole())) {
            throw new RuntimeException("Only buyers can access cart");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new RuntimeException("Product is not available");
        }

        int availableQuantity = product.getQuantity() == null ? 0 : product.getQuantity();
        if (availableQuantity <= 0) {
            throw new RuntimeException("Product is out of stock");
        }

        Optional<Cart> existingCartItem = cartRepository.findByBuyerIdAndProductId(buyerId, productId);
        if (existingCartItem.isPresent()) {
            Cart existing = existingCartItem.get();
            int updatedQuantity = existing.getQuantity() + requestedQuantity;
            if (updatedQuantity > availableQuantity) {
                throw new RuntimeException("Requested quantity exceeds available stock");
            }
            existing.setQuantity(updatedQuantity);
            return cartRepository.save(existing);
        }

        if (requestedQuantity > availableQuantity) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        Cart cartItem = new Cart();
        cartItem.setBuyer(buyer);
        cartItem.setProduct(product);
        cartItem.setQuantity(requestedQuantity);
        return cartRepository.save(cartItem);
    }

    public List<Cart> getBuyerCart(Long buyerId) {
        validateBuyer(buyerId);
        return cartRepository.findByBuyerId(buyerId);
    }

    public Cart updateCartQuantity(Long buyerId, Long cartItemId, Integer requestedQuantity) {
        validateBuyer(buyerId);
        validateQuantity(requestedQuantity);

        Cart cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (!cartItem.getBuyer().getId().equals(buyerId)) {
            throw new RuntimeException("You cannot access another buyer's cart");
        }

        Product product = cartItem.getProduct();
        int availableQuantity = product.getQuantity() == null ? 0 : product.getQuantity();
        if (requestedQuantity > availableQuantity) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        cartItem.setQuantity(requestedQuantity);
        return cartRepository.save(cartItem);
    }

    @Transactional
    public void removeCartItem(Long buyerId, Long cartItemId) {
        validateBuyer(buyerId);
        Cart cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (!cartItem.getBuyer().getId().equals(buyerId)) {
            throw new RuntimeException("You cannot access another buyer's cart");
        }
        cartRepository.delete(cartItem);
    }

    @Transactional
    public void clearCart(Long buyerId) {
        validateBuyer(buyerId);
        cartRepository.deleteByBuyerId(buyerId);
    }

    public BigDecimal calculateSubtotal(Long buyerId) {
        return getBuyerCart(buyerId).stream()
                .map(Cart::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateTotal(Long buyerId) {
        return calculateSubtotal(buyerId);
    }

    private void validateBuyer(Long buyerId) {
        if (buyerId == null) {
            throw new RuntimeException("Buyer ID is required");
        }
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        if (!"BUYER".equalsIgnoreCase(buyer.getRole())) {
            throw new RuntimeException("Only buyers can access cart");
        }
    }

    private void validateQuantity(Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
    }
}
