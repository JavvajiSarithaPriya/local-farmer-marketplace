package com.farmermarketplace.order.controller;

import com.farmermarketplace.order.config.TokenService;
import com.farmermarketplace.order.entity.Feedback;
import com.farmermarketplace.order.service.FeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8080"})
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

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
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Authenticated buyer access required"));
            }

            if (body.get("orderId") == null || body.get("rating") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Order ID and rating are required"));
            }

            Long orderId = Long.valueOf(body.get("orderId").toString());
            Integer rating = Integer.valueOf(body.get("rating").toString());
            String comment = body.get("comment") != null ? body.get("comment").toString() : "";

            Feedback feedback = feedbackService.submitFeedback(authenticatedBuyerId, orderId, rating, comment);
            return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Error submitting feedback: " + e.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getFeedbackByOrder(@PathVariable Long orderId, HttpServletRequest request) {
        try {
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Authenticated buyer access required"));
            }

            Optional<Feedback> feedback = feedbackService.getFeedbackByOrderId(orderId);
            if (feedback.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No feedback found for this order"));
            }

            if (!feedback.get().getBuyerId().equals(authenticatedBuyerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You do not have permission to view feedback for this order"));
            }

            return ResponseEntity.ok(feedback.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Error fetching feedback: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyFeedback(HttpServletRequest request) {
        try {
            Long authenticatedBuyerId = currentUserId(request, "BUYER");
            if (authenticatedBuyerId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Authenticated buyer access required"));
            }
            List<Feedback> feedbacks = feedbackService.getMyFeedback(authenticatedBuyerId);
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Error fetching feedbacks: " + e.getMessage()));
        }
    }
}
