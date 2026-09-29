package com.farmermarketplace.auth;

import com.farmermarketplace.auth.config.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthServiceApplicationTests {

    @Autowired
    private TokenService tokenService;

    @Test
    void contextLoads() {
        assertNotNull(tokenService);
    }

    @Test
    void testTokenGenerationAndValidation() {
        String token = tokenService.generateToken(1L, "BUYER");
        assertNotNull(token);
        assertEquals("BUYER", tokenService.validateAndGetRole(token));
        assertEquals(1L, tokenService.validateAndGetUserId(token));
    }
}
