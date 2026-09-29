package com.farmermarketplace.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class TokenServiceTest {

    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService();
    }

    @Test
    void validateSecret_throwsIllegalStateExceptionWhenSecretIsNull() {
        ReflectionTestUtils.setField(tokenService, "secret", null);
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> tokenService.validateSecret());
        assertTrue(ex.getMessage().contains("CRITICAL SECURITY CONFIGURATION ERROR"));
    }

    @Test
    void validateSecret_throwsIllegalStateExceptionWhenSecretIsEmpty() {
        ReflectionTestUtils.setField(tokenService, "secret", "");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> tokenService.validateSecret());
        assertTrue(ex.getMessage().contains("CRITICAL SECURITY CONFIGURATION ERROR"));
    }

    @Test
    void validateSecret_throwsIllegalStateExceptionWhenSecretIsBlank() {
        ReflectionTestUtils.setField(tokenService, "secret", "   ");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> tokenService.validateSecret());
        assertTrue(ex.getMessage().contains("CRITICAL SECURITY CONFIGURATION ERROR"));
    }

    @Test
    void validateSecret_passesWhenSecretIsProvided() {
        ReflectionTestUtils.setField(tokenService, "secret", "ValidSecureSecretKey_2026_Testing");
        assertDoesNotThrow(() -> tokenService.validateSecret());
    }

    @Test
    void generateAndValidateToken_success() {
        ReflectionTestUtils.setField(tokenService, "secret", "ValidSecureSecretKey_2026_Testing");
        tokenService.validateSecret();

        String token = tokenService.generateToken(42L, "FARMER");
        assertNotNull(token);
        assertTrue(token.contains("."));

        assertEquals("FARMER", tokenService.validateAndGetRole(token));
        assertEquals(42L, tokenService.validateAndGetUserId(token));
    }

    @Test
    void validateToken_failsWithTamperedSignature() {
        ReflectionTestUtils.setField(tokenService, "secret", "ValidSecureSecretKey_2026_Testing");
        tokenService.validateSecret();

        String token = tokenService.generateToken(42L, "ADMIN");
        String tampered = token.substring(0, token.length() - 2) + "ab";

        assertNull(tokenService.validateAndGetRole(tampered));
        assertNull(tokenService.validateAndGetUserId(tampered));
    }
}
