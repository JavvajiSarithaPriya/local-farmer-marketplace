package com.farmermarketplace.auth.controller;

import com.farmermarketplace.auth.entity.User;
import com.farmermarketplace.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8080"})
@SuppressWarnings("null")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            User u = user.get();
            u.setPassword(null);
            u.setPin(null);
            return ResponseEntity.ok(u);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> {
            u.setPassword(null);
            u.setPin(null);
        });
        return ResponseEntity.ok(users);
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<User>> getFarmers() {
        List<User> farmers = userRepository.findByRole("FARMER");
        farmers.forEach(u -> {
            u.setPassword(null);
            u.setPin(null);
        });
        return ResponseEntity.ok(farmers);
    }

    @GetMapping("/buyers")
    public ResponseEntity<List<User>> getBuyers() {
        List<User> buyers = userRepository.findByRole("BUYER");
        buyers.forEach(u -> {
            u.setPassword(null);
            u.setPin(null);
        });
        return ResponseEntity.ok(buyers);
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        User user = opt.get();
        user.setIsActive(true);
        userRepository.save(user);
        return ResponseEntity.ok("User activated successfully");
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id, @RequestParam(required = false) Long requestingAdminId) {
        if (requestingAdminId != null && id.equals(requestingAdminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You cannot deactivate your own administrator account");
        }
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        User user = opt.get();
        user.setIsActive(false);
        userRepository.save(user);
        return ResponseEntity.ok("User deactivated successfully");
    }

    @GetMapping("/count")
    public ResponseEntity<?> getCounts() {
        long total = userRepository.count();
        long farmers = userRepository.countByRole("FARMER");
        long buyers = userRepository.countByRole("BUYER");
        return ResponseEntity.ok(java.util.Map.of("total", total, "farmers", farmers, "buyers", buyers));
    }
}
