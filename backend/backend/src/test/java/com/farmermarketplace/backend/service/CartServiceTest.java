package com.farmermarketplace.backend.service;

import com.farmermarketplace.backend.entity.Cart;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.CartRepository;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartService cartService;

    @Test
    void addToCart_shouldMergeExistingItemAndIncreaseQuantity() {
        User buyer = new User();
        buyer.setId(1L);
        buyer.setRole("BUYER");

        Product product = new Product();
        product.setId(10L);
        product.setQuantity(10);
        product.setPrice(new BigDecimal("100"));

        Cart existing = new Cart();
        existing.setId(5L);
        existing.setBuyer(buyer);
        existing.setProduct(product);
        existing.setQuantity(2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.findByBuyerIdAndProductId(1L, 10L)).thenReturn(Optional.of(existing));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cart result = cartService.addToCart(1L, 10L, 3);

        assert result.getQuantity() == 5;
        verify(cartRepository).save(existing);
    }

    @Test
    void addToCart_shouldRejectQuantityGreaterThanStock() {
        User buyer = new User();
        buyer.setId(1L);
        buyer.setRole("BUYER");

        Product product = new Product();
        product.setId(10L);
        product.setQuantity(2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.findByBuyerIdAndProductId(1L, 10L)).thenReturn(null);

        assertThrows(RuntimeException.class, () -> cartService.addToCart(1L, 10L, 3));
    }
}
