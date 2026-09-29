package com.farmermarketplace.order.service;

import com.farmermarketplace.order.entity.Feedback;
import com.farmermarketplace.order.entity.Order;
import com.farmermarketplace.order.repository.FeedbackRepository;
import com.farmermarketplace.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private FeedbackService feedbackService;

    private Order deliveredOrder;
    private Order pendingOrder;

    @BeforeEach
    void setUp() {
        deliveredOrder = new Order();
        deliveredOrder.setId(101L);
        deliveredOrder.setBuyerId(5L);
        deliveredOrder.setStatus("DELIVERED");

        pendingOrder = new Order();
        pendingOrder.setId(102L);
        pendingOrder.setBuyerId(5L);
        pendingOrder.setStatus("PENDING");
    }

    @Test
    void submitFeedback_Success() {
        when(orderRepository.findById(101L)).thenReturn(Optional.of(deliveredOrder));
        when(feedbackRepository.existsByOrderId(101L)).thenReturn(false);
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(inv -> {
            Feedback f = inv.getArgument(0);
            f.setId(1L);
            return f;
        });

        Feedback result = feedbackService.submitFeedback(5L, 101L, 5, "Great fresh vegetables!");

        assertNotNull(result);
        assertEquals(5L, result.getBuyerId());
        assertEquals(101L, result.getOrderId());
        assertEquals(5, result.getRating());
        assertEquals("Great fresh vegetables!", result.getComment());
        verify(feedbackRepository, times(1)).save(any(Feedback.class));
    }

    @Test
    void submitFeedback_RejectsNonDeliveredOrder() {
        when(orderRepository.findById(102L)).thenReturn(Optional.of(pendingOrder));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                feedbackService.submitFeedback(5L, 102L, 5, "Good")
        );
        assertTrue(ex.getMessage().contains("delivered"));
        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    @Test
    void submitFeedback_RejectsBuyerMismatch() {
        when(orderRepository.findById(101L)).thenReturn(Optional.of(deliveredOrder));

        SecurityException ex = assertThrows(SecurityException.class, () ->
                feedbackService.submitFeedback(99L, 101L, 5, "Good")
        );
        assertTrue(ex.getMessage().contains("permission"));
        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    @Test
    void submitFeedback_RejectsDuplicateSubmission() {
        when(orderRepository.findById(101L)).thenReturn(Optional.of(deliveredOrder));
        when(feedbackRepository.existsByOrderId(101L)).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                feedbackService.submitFeedback(5L, 101L, 4, "Second attempt")
        );
        assertTrue(ex.getMessage().contains("already been submitted"));
        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    @Test
    void submitFeedback_RejectsInvalidRating() {
        assertThrows(IllegalArgumentException.class, () ->
                feedbackService.submitFeedback(5L, 101L, 0, "Too low")
        );
        assertThrows(IllegalArgumentException.class, () ->
                feedbackService.submitFeedback(5L, 101L, 6, "Too high")
        );
        assertThrows(IllegalArgumentException.class, () ->
                feedbackService.submitFeedback(5L, 101L, null, "Null rating")
        );
    }

    @Test
    void getMyFeedback_ReturnsList() {
        Feedback f = new Feedback(101L, 5L, 5, "Great");
        when(feedbackRepository.findByBuyerId(5L)).thenReturn(List.of(f));

        List<Feedback> result = feedbackService.getMyFeedback(5L);
        assertEquals(1, result.size());
        assertEquals(5, result.get(0).getRating());
    }
}
