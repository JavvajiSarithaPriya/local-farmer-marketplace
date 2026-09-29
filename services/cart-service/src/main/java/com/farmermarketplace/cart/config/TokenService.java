package com.farmermarketplace.cart.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class TokenService {

    @Value("${app.token.secret:marketplace_secret_key_2026}")
    private String secret;

    private static final long TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000L;

    @PostConstruct
    public void validateSecret() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL: secret missing");
        }
    }

    public String validateAndGetRole(String token) {
        if (token == null || !token.contains(".")) return null;
        int dot = token.lastIndexOf('.');
        String payloadB64 = token.substring(0, dot);
        String sig = token.substring(dot + 1);

        if (!hmac(payloadB64).equals(sig)) return null;

        String payload;
        try {
            payload = new String(Base64.getDecoder().decode(payloadB64), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }

        String[] parts = payload.split(":");
        if (parts.length != 3) return null;

        long expiry;
        try {
            expiry = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            return null;
        }

        if (System.currentTimeMillis() > expiry) return null;

        return parts[1];
    }

    public Long validateAndGetUserId(String token) {
        if (token == null || !token.contains(".")) return null;
        int dot = token.lastIndexOf('.');
        String payloadB64 = token.substring(0, dot);
        String sig = token.substring(dot + 1);
        if (!hmac(payloadB64).equals(sig)) return null;
        try {
            String payload = new String(Base64.getDecoder().decode(payloadB64), StandardCharsets.UTF_8);
            String[] parts = payload.split(":");
            if (parts.length != 3) return null;
            long expiry = Long.parseLong(parts[2]);
            if (System.currentTimeMillis() > expiry) return null;
            return Long.parseLong(parts[0]);
        } catch (Exception e) {
            return null;
        }
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(raw);
        } catch (Exception e) {
            throw new RuntimeException("HMAC error", e);
        }
    }
}
