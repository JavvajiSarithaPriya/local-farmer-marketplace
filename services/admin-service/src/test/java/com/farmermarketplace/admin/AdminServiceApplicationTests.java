package com.farmermarketplace.admin;

import com.farmermarketplace.admin.config.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest
class AdminServiceApplicationTests {

    @Autowired
    private TokenService tokenService;

    @Test
    void contextLoads() {
        assertNotNull(tokenService);
    }

    @Test
    void testInvalidRole() {
        assertNull(tokenService.validateAndGetRole("bad.token"));
    }
}
