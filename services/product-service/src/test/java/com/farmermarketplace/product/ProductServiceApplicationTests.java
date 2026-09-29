package com.farmermarketplace.product;

import com.farmermarketplace.product.config.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class ProductServiceApplicationTests {

    @Autowired
    private TokenService tokenService;

    @Test
    void contextLoads() {
        assertNotNull(tokenService);
    }

    @Test
    void testTokenValidation() {
        String token = tokenService.validateAndGetRole("invalid.token");
        assertEquals(null, token);
    }
}
