package com.farmermarketplace.order.service;

import com.farmermarketplace.order.entity.Feedback;
import com.farmermarketplace.order.entity.Order;
import com.farmermarketplace.order.repository.FeedbackRepository;
import com.farmermarketplace.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Feedback submitFeedback(Long authenticatedBuyerId, Long orderId, Integer rating, String comment) {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID is required");
        }

        // Validate Rating
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Check if Order exists
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // Rule 2: Buyer ownership verification
        if (!order.getBuyerId().equals(authenticatedBuyerId)) {
            throw new SecurityException("You do not have permission to submit feedback for this order");
        }

        // Rule 1: Only DELIVERED orders
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Feedback can only be submitted for delivered orders");
        }

        // Rule 3: One feedback per order
        if (feedbackRepository.existsByOrderId(orderId)) {
            throw new IllegalStateException("Feedback has already been submitted for this order");
        }

        String sanitizedComment = comment != null ? comment.trim() : "";
        if (sanitizedComment.length() > 1000) {
            sanitizedComment = sanitizedComment.substring(0, 1000);
        }

        Feedback feedback = new Feedback(orderId, authenticatedBuyerId, rating, sanitizedComment);
        return feedbackRepository.save(feedback);
    }

    public Optional<Feedback> getFeedbackByOrderId(Long orderId) {
        return feedbackRepository.findByOrderId(orderId);
    }

    public List<Feedback> getMyFeedback(Long authenticatedBuyerId) {
        return feedbackRepository.findByBuyerId(authenticatedBuyerId);
    }
}
