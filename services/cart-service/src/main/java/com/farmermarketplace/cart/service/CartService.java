package com.farmermarketplace.cart.service;

import com.farmermarketplace.cart.dto.ProductDto;
import com.farmermarketplace.cart.dto.UserDto;
import com.farmermarketplace.cart.entity.Cart;
import com.farmermarketplace.cart.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${product.service.url:http://localhost:8082}")
    private String productServiceUrl;

    private UserDto fetchBuyer(Long buyerId) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/api/users/" + buyerId, UserDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Buyer not found");
        }
    }

    private ProductDto fetchProduct(Long productId) {
        try {
            return restTemplate.getForObject(productServiceUrl + "/api/products/" + productId, ProductDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Product not found");
        }
    }

    private void validateBuyer(Long buyerId) {
        if (buyerId == null) {
            throw new RuntimeException("Buyer ID is required");
        }
        UserDto buyer = fetchBuyer(buyerId);
        if (buyer == null) {
            throw new RuntimeException("Buyer not found");
        }
        if (!"BUYER".equalsIgnoreCase(buyer.getRole())) {
            throw new RuntimeException("Only buyers can access cart");
        }
    }

    private void validateQuantity(Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
    }

    public Cart addToCart(Long buyerId, Long productId, Integer requestedQuantity) {
        validateBuyer(buyerId);
        validateQuantity(requestedQuantity);

        ProductDto product = fetchProduct(productId);
        if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
            throw new RuntimeException("Product is not available");
        }

        int availableQuantity = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
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
            Cart saved = cartRepository.save(existing);
            saved.setProduct(product);
            return saved;
        }

        if (requestedQuantity > availableQuantity) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        Cart cartItem = new Cart();
        cartItem.setBuyerId(buyerId);
        cartItem.setProductId(productId);
        cartItem.setQuantity(requestedQuantity);
        Cart saved = cartRepository.save(cartItem);
        saved.setProduct(product);
        return saved;
    }

    public List<Cart> getBuyerCart(Long buyerId) {
        validateBuyer(buyerId);
        List<Cart> items = cartRepository.findByBuyerId(buyerId);
        items.forEach(item -> {
            try {
                item.setProduct(fetchProduct(item.getProductId()));
            } catch (Exception ignored) {}
        });
        return items;
    }

    public Cart updateCartQuantity(Long buyerId, Long cartItemId, Integer requestedQuantity) {
        validateBuyer(buyerId);
        validateQuantity(requestedQuantity);

        Cart cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (!cartItem.getBuyerId().equals(buyerId)) {
            throw new RuntimeException("You cannot access another buyer's cart");
        }

        ProductDto product = fetchProduct(cartItem.getProductId());
        int availableQuantity = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
        if (requestedQuantity > availableQuantity) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        cartItem.setQuantity(requestedQuantity);
        Cart saved = cartRepository.save(cartItem);
        saved.setProduct(product);
        return saved;
    }

    @Transactional
    public void removeCartItem(Long buyerId, Long cartItemId) {
        validateBuyer(buyerId);
        Cart cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (!cartItem.getBuyerId().equals(buyerId)) {
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
}
