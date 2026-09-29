package com.farmermarketplace.admin.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings("unchecked")
public class AdminService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${product.service.url:http://localhost:8082}")
    private String productServiceUrl;

    @Value("${order.service.url:http://localhost:8084}")
    private String orderServiceUrl;

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        try {
            Map<String, Object> uCounts = restTemplate.getForObject(authServiceUrl + "/api/users/count", Map.class);
            if (uCounts != null) {
                stats.put("totalUsers", uCounts.get("total"));
                stats.put("totalFarmers", uCounts.get("farmers"));
                stats.put("totalBuyers", uCounts.get("buyers"));
            }
        } catch (Exception e) {
            stats.put("totalUsers", 0);
            stats.put("totalFarmers", 0);
            stats.put("totalBuyers", 0);
        }

        try {
            Map<String, Object> pCounts = restTemplate.getForObject(productServiceUrl + "/api/products/count", Map.class);
            if (pCounts != null) {
                stats.put("totalProducts", pCounts.get("total"));
                stats.put("activeProducts", pCounts.get("active"));
                stats.put("inactiveProducts", pCounts.get("inactive"));
            }
        } catch (Exception e) {
            stats.put("totalProducts", 0);
            stats.put("activeProducts", 0);
            stats.put("inactiveProducts", 0);
        }

        try {
            Map<String, Object> oStats = restTemplate.getForObject(orderServiceUrl + "/api/orders/stats", Map.class);
            if (oStats != null) {
                stats.put("totalOrders", oStats.get("total"));
                stats.put("pendingOrders", oStats.get("pending"));
                stats.put("acceptedOrders", oStats.get("accepted"));
                stats.put("deliveredOrders", oStats.get("delivered"));
                stats.put("rejectedOrders", oStats.get("rejected"));
                stats.put("cancelledOrders", oStats.get("cancelled"));
            }
        } catch (Exception e) {
            stats.put("totalOrders", 0);
            stats.put("pendingOrders", 0);
            stats.put("acceptedOrders", 0);
            stats.put("deliveredOrders", 0);
            stats.put("rejectedOrders", 0);
            stats.put("cancelledOrders", 0);
        }

        return stats;
    }

    public List<Object> getAllUsers() {
        return restTemplate.getForObject(authServiceUrl + "/api/users", List.class);
    }

    public List<Object> getFarmers() {
        return restTemplate.getForObject(authServiceUrl + "/api/users/farmers", List.class);
    }

    public List<Object> getBuyers() {
        return restTemplate.getForObject(authServiceUrl + "/api/users/buyers", List.class);
    }

    public void deactivateUser(Long userId, Long requestingAdminId) {
        if (requestingAdminId != null && userId.equals(requestingAdminId)) {
            throw new RuntimeException("You cannot deactivate your own administrator account");
        }
        restTemplate.put(authServiceUrl + "/api/users/" + userId + "/deactivate?requestingAdminId=" + (requestingAdminId != null ? requestingAdminId : ""), null);
    }

    public void activateUser(Long userId) {
        restTemplate.put(authServiceUrl + "/api/users/" + userId + "/activate", null);
    }

    public List<Object> getAllProducts() {
        return restTemplate.getForObject(productServiceUrl + "/api/products/all", List.class);
    }

    public void deactivateProduct(Long productId) {
        restTemplate.put(productServiceUrl + "/api/products/" + productId + "/deactivate", null);
    }

    public void activateProduct(Long productId) {
        restTemplate.put(productServiceUrl + "/api/products/" + productId + "/activate", null);
    }

    public List<Object> getAllOrders() {
        return restTemplate.getForObject(orderServiceUrl + "/api/orders/all", List.class);
    }
}
