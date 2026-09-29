package com.farmermarketplace.backend.service;

import com.farmermarketplace.backend.entity.Order;
import com.farmermarketplace.backend.entity.Product;
import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.OrderRepository;
import com.farmermarketplace.backend.repository.ProductRepository;
import com.farmermarketplace.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void placeOrder_shouldSetOrderDateBeforeSaving() {
        User buyer = new User();
        buyer.setId(1L);
        buyer.setRole("BUYER");

        Product product = new Product();
        product.setId(10L);
        product.setPrice(new BigDecimal("15.50"));
        product.setQuantity(5);
        product.setIsActive(true);

        Order savedOrder = new Order();
        savedOrder.setId(99L);
        savedOrder.setBuyer(buyer);
        savedOrder.setProduct(product);
        savedOrder.setQuantity(2);
        savedOrder.setTotalPrice(new BigDecimal("31.00"));
        savedOrder.setStatus("PENDING");

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            assertNotNull(order.getOrderDate());
            return savedOrder;
        });

        Order result = orderService.placeOrder(1L, 10L, 2);

        assertNotNull(result);
    }
}
