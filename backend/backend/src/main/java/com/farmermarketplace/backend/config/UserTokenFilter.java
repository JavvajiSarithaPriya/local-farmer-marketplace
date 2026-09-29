package com.farmermarketplace.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class UserTokenFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        return !requiresAuthentication(path, method);
    }

    private boolean requiresAuthentication(String path, String method) {
        if (path.startsWith("/api/cart/") || "/api/cart".equals(path)) return true;
        if (path.startsWith("/api/orders/") || "/api/orders".equals(path)) return true;
        if (("/api/products".equals(path) || "/api/products/upload-image".equals(path)) && "POST".equalsIgnoreCase(method)) return true;
        if (path.matches("/api/products/\\d+") && ("PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))) return true;
        return "/api/auth/profile".equals(path);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: No token provided");
            return;
        }

        String token = authorization.substring(7);
        if (tokenService.validateAndGetRole(token) == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Invalid or expired token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}