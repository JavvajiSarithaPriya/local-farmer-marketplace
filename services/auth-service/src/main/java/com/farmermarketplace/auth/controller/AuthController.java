package com.farmermarketplace.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.farmermarketplace.auth.config.TokenService;
import com.farmermarketplace.auth.entity.User;
import com.farmermarketplace.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8080"})
@SuppressWarnings("null")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (user == null || user.getFullName() == null || user.getFullName().isEmpty()) {
                return ResponseEntity.badRequest().body("Full name is required");
            }
            if (user.getMobileNumber() == null || user.getMobileNumber().isEmpty()) {
                return ResponseEntity.badRequest().body("Mobile number is required");
            }
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }
            if (user.getPin() == null || user.getPin().isEmpty()) {
                return ResponseEntity.badRequest().body("PIN is required");
            }
            if (user.getRole() == null || user.getRole().isEmpty()) {
                return ResponseEntity.badRequest().body("Role is required");
            }

            // Block ADMIN registration through public endpoint
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Admin accounts cannot be created through registration");
            }

            // Only allow FARMER or BUYER
            if (!"FARMER".equalsIgnoreCase(user.getRole()) && !"BUYER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body("Role must be FARMER or BUYER");
            }

            User existingUser = userRepository.findByMobileNumber(user.getMobileNumber());
            if (existingUser != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("User with this mobile number already exists");
            }
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                User existingEmail = userRepository.findByEmail(user.getEmail());
                if (existingEmail != null) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body("User with this email already exists");
                }
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setPin(passwordEncoder.encode(user.getPin()));
            if (user.getIsActive() == null) user.setIsActive(true);
            if (user.getIsMobileVerified() == null) user.setIsMobileVerified(false);
            if (user.getPreferredLanguage() == null) user.setPreferredLanguage("ENGLISH");

            if (user.getEmail() != null && user.getEmail().isEmpty()) user.setEmail(null);
            if (user.getName() != null && user.getName().isEmpty()) user.setName(null);
            if (user.getPhone() != null && user.getPhone().isEmpty()) user.setPhone(null);
            if (user.getAddress() != null && user.getAddress().isEmpty()) user.setAddress(null);
            if (user.getVillage() != null && user.getVillage().isEmpty()) user.setVillage(null);
            if (user.getDistrict() != null && user.getDistrict().isEmpty()) user.setDistrict(null);
            if (user.getState() != null && user.getState().isEmpty()) user.setState(null);
            if (user.getPincode() != null && user.getPincode().isEmpty()) user.setPincode(null);

            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);
            savedUser.setPin(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        try {
            if (loginRequest == null || loginRequest.getMobileNumber() == null || loginRequest.getMobileNumber().isEmpty()) {
                return ResponseEntity.badRequest().body("Mobile number is required");
            }
            if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            User user = userRepository.findByMobileNumber(loginRequest.getMobileNumber());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid mobile number or password");
            }
            if (Boolean.FALSE.equals(user.getIsActive())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is inactive");
            }
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid mobile number or password");
            }

            String token = tokenService.generateToken(user.getId(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("fullName", user.getFullName());
            response.put("mobileNumber", user.getMobileNumber());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("isActive", user.getIsActive());
            response.put("preferredLanguage", user.getPreferredLanguage());
            response.put("token", token);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }

    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, Object> payload) {
        try {
            String mobileNumber = String.valueOf(payload.getOrDefault("mobileNumber", ""));
            String pin = String.valueOf(payload.getOrDefault("pin", ""));
            String newPassword = String.valueOf(payload.getOrDefault("newPassword", ""));

            if (mobileNumber.isBlank() || pin.isBlank() || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body("Mobile number, PIN, and new password are required");
            }

            User user = userRepository.findByMobileNumber(mobileNumber);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            String storedPin = user.getPin();
            boolean pinMatches = false;
            if (storedPin != null) {
                if (storedPin.startsWith("$2a$") || storedPin.startsWith("$2b$") || storedPin.startsWith("$2y$")) {
                    pinMatches = passwordEncoder.matches(pin, storedPin);
                } else {
                    pinMatches = pin.equals(storedPin);
                    if (pinMatches) {
                        user.setPin(passwordEncoder.encode(pin));
                    }
                }
            }

            if (!pinMatches) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("PIN is incorrect");
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Password reset failed: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            Long userId = Long.valueOf(String.valueOf(payload.getOrDefault("userId", "0")));
            String fullName = String.valueOf(payload.getOrDefault("fullName", ""));
            String email = String.valueOf(payload.getOrDefault("email", ""));
            String address = String.valueOf(payload.getOrDefault("address", ""));

            if (userId <= 0) {
                return ResponseEntity.badRequest().body("Valid user ID is required");
            }

            String header = request.getHeader("Authorization");
            Long authenticatedUserId = header != null && header.startsWith("Bearer ")
                    ? tokenService.validateAndGetUserId(header.substring(7)) : null;
            if (authenticatedUserId == null || !authenticatedUserId.equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authenticated user access required");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!fullName.isBlank()) user.setFullName(fullName);
            if (!email.isBlank()) user.setEmail(email);
            if (!address.isBlank()) user.setAddress(address);

            userRepository.save(user);
            user.setPassword(null);
            user.setPin(null);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Profile update failed: " + e.getMessage());
        }
    }
}
