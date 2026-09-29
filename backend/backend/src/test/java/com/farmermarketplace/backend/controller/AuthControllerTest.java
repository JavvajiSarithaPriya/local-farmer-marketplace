package com.farmermarketplace.backend.controller;

import com.farmermarketplace.backend.entity.User;
import com.farmermarketplace.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void register_shouldHashPasswordAndPinAndNotReturnThem() {
        User regRequest = new User();
        regRequest.setFullName("Ramesh Farmer");
        regRequest.setMobileNumber("9876543210");
        regRequest.setPassword("RawPassword123");
        regRequest.setPin("1234");
        regRequest.setRole("FARMER");

        AtomicReference<String> savedPinRef = new AtomicReference<>();
        AtomicReference<String> savedPasswordRef = new AtomicReference<>();

        when(userRepository.findByMobileNumber("9876543210")).thenReturn(null);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            savedPinRef.set(u.getPin());
            savedPasswordRef.set(u.getPassword());
            return u;
        });

        ResponseEntity<?> response = authController.register(regRequest);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof User);
        User returnedUser = (User) response.getBody();

        // Verify that password and PIN are null in the returned response object
        assertNull(returnedUser.getPassword(), "Password must not be returned in registration response");
        assertNull(returnedUser.getPin(), "PIN must not be returned in registration response");

        // Stored password and PIN before response cleansing must be BCrypt hashed
        assertNotNull(savedPinRef.get());
        assertNotNull(savedPasswordRef.get());
        assertNotEquals("RawPassword123", savedPasswordRef.get());
        assertNotEquals("1234", savedPinRef.get());
        assertTrue(savedPinRef.get().startsWith("$2a$") || savedPinRef.get().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches("1234", savedPinRef.get()));
        assertTrue(passwordEncoder.matches("RawPassword123", savedPasswordRef.get()));
    }

    @Test
    void resetPassword_shouldSucceedWithBCryptHashedPin() {
        User user = new User();
        user.setId(7L);
        user.setMobileNumber("9999999999");
        user.setPin(passwordEncoder.encode("4321")); // BCrypt hashed PIN
        user.setPassword(passwordEncoder.encode("old-pass"));

        when(userRepository.findByMobileNumber("9999999999")).thenReturn(user);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = authController.resetPassword(Map.of(
                "mobileNumber", "9999999999",
                "pin", "4321",
                "newPassword", "newSecret123"
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().toString().contains("success"));
        verify(userRepository).save(any(User.class));
        assertTrue(passwordEncoder.matches("newSecret123", user.getPassword()));
    }

    @Test
    void resetPassword_shouldFailWithIncorrectPin() {
        User user = new User();
        user.setId(7L);
        user.setMobileNumber("9999999999");
        user.setPin(passwordEncoder.encode("4321"));
        user.setPassword(passwordEncoder.encode("old-pass"));

        when(userRepository.findByMobileNumber("9999999999")).thenReturn(user);

        ResponseEntity<?> response = authController.resetPassword(Map.of(
                "mobileNumber", "9999999999",
                "pin", "9999", // Wrong PIN
                "newPassword", "newSecret123"
        ));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("PIN is incorrect", response.getBody());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void resetPassword_shouldSucceedAndMigrateLegacyPlaintextPin() {
        User user = new User();
        user.setId(8L);
        user.setMobileNumber("8888888888");
        user.setPin("1234"); // Legacy plaintext PIN
        user.setPassword(passwordEncoder.encode("old-pass"));

        when(userRepository.findByMobileNumber("8888888888")).thenReturn(user);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = authController.resetPassword(Map.of(
                "mobileNumber", "8888888888",
                "pin", "1234",
                "newPassword", "newSecret123"
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository).save(user);

        // Stored PIN should now be upgraded to a BCrypt hash!
        assertNotEquals("1234", user.getPin());
        assertTrue(user.getPin().startsWith("$2a$") || user.getPin().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches("1234", user.getPin()));
        assertTrue(passwordEncoder.matches("newSecret123", user.getPassword()));
    }

    @Test
    void resetPassword_shouldFailIfUserNotFound() {
        when(userRepository.findByMobileNumber("0000000000")).thenReturn(null);

        ResponseEntity<?> response = authController.resetPassword(Map.of(
                "mobileNumber", "0000000000",
                "pin", "1234",
                "newPassword", "newSecret123"
        ));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("User not found", response.getBody());
    }

    @Test
    void resetPassword_shouldFailIfRequiredFieldsMissing() {
        ResponseEntity<?> response = authController.resetPassword(Map.of(
                "mobileNumber", "",
                "pin", "1234",
                "newPassword", "newSecret123"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
