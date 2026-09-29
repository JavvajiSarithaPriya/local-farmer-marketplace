package com.farmermarketplace.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;
import java.util.Set;

@RestController
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
public class GatewayProxyController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${services.auth.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.product.url:http://localhost:8082}")
    private String productServiceUrl;

    @Value("${services.cart.url:http://localhost:8083}")
    private String cartServiceUrl;

    @Value("${services.order.url:http://localhost:8084}")
    private String orderServiceUrl;

    @Value("${services.admin.url:http://localhost:8085}")
    private String adminServiceUrl;

    private static final Set<String> RESTRICTED_HEADERS = Set.of(
            "connection", "content-length", "host", "upgrade", "keep-alive",
            "transfer-encoding", "te", "trailer", "proxy-authorization", "proxy-authenticate"
    );

    @RequestMapping(value = {"/api/**", "/uploads/**"}, method = {
            RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
            RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH
    })
    public void proxy(HttpServletRequest request, HttpServletResponse response) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            return;
        }

        String path = request.getRequestURI();
        String query = request.getQueryString();
        String targetBaseUrl;

        if (path.startsWith("/api/auth") || path.startsWith("/api/users")) {
            targetBaseUrl = authServiceUrl;
        } else if (path.startsWith("/api/products") || path.startsWith("/uploads")) {
            targetBaseUrl = productServiceUrl;
        } else if (path.startsWith("/api/cart")) {
            targetBaseUrl = cartServiceUrl;
        } else if (path.startsWith("/api/orders") || path.startsWith("/api/feedback")) {
            targetBaseUrl = orderServiceUrl;
        } else if (path.startsWith("/api/admin")) {
            targetBaseUrl = adminServiceUrl;
        } else {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String targetUrl = targetBaseUrl + path + (query != null ? "?" + query : "");

        try {
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(30));

            // Copy incoming headers
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames != null && headerNames.hasMoreElements()) {
                String name = headerNames.nextElement();
                if (!RESTRICTED_HEADERS.contains(name.toLowerCase())) {
                    Enumeration<String> values = request.getHeaders(name);
                    while (values.hasMoreElements()) {
                        reqBuilder.header(name, values.nextElement());
                    }
                }
            }

            // Body handling
            byte[] bodyBytes = request.getInputStream().readAllBytes();
            HttpRequest.BodyPublisher bodyPublisher = bodyBytes.length > 0
                    ? HttpRequest.BodyPublishers.ofByteArray(bodyBytes)
                    : HttpRequest.BodyPublishers.noBody();

            reqBuilder.method(request.getMethod(), bodyPublisher);

            HttpResponse<InputStream> downstreamResponse = httpClient.send(
                    reqBuilder.build(),
                    HttpResponse.BodyHandlers.ofInputStream()
            );

            response.setStatus(downstreamResponse.statusCode());

            downstreamResponse.headers().map().forEach((headerName, headerValues) -> {
                if (!headerName.equalsIgnoreCase("transfer-encoding") &&
                    !headerName.equalsIgnoreCase("access-control-allow-origin") &&
                    !headerName.equalsIgnoreCase("access-control-allow-credentials")) {
                    for (String headerValue : headerValues) {
                        response.addHeader(headerName, headerValue);
                    }
                }
            });

            response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
            response.setHeader("Access-Control-Allow-Credentials", "true");

            try (InputStream is = downstreamResponse.body()) {
                is.transferTo(response.getOutputStream());
            }

        } catch (Exception e) {
            try {
                response.setStatus(HttpServletResponse.SC_BAD_GATEWAY);
                response.setContentType("application/json");
                response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.getWriter().write("{\"error\": \"Bad Gateway - Downstream service error: " + e.getMessage() + "\"}");
            } catch (Exception ignored) {}
        }
    }
}
