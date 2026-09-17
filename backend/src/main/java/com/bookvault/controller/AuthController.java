package com.bookvault.controller;

import com.bookvault.dto.AuthResponse;
import com.bookvault.dto.LoginRequest;
import com.bookvault.dto.RegisterRequest;
import com.bookvault.exception.EmailAlreadyExistsException;
import com.bookvault.exception.InvalidCredentialsException;
import com.bookvault.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AuthController
 * 
 * REST Controller handling incoming authentication endpoints:
 * - POST /api/auth/register : Registers a new student account
 * - POST /api/auth/login    : Authenticates user credentials
 * - GET  /api/auth/check-email : Checks email availability
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = userService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (EmailAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(createErrorMap(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("An unexpected error occurred during registration."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorMap(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("An unexpected error occurred during login."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            userService.logout(userId);
        }
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        boolean exists = userService.isEmailRegistered(email);
        Map<String, Object> result = new HashMap<>();
        result.put("email", email);
        result.put("exists", exists);
        return ResponseEntity.ok(result);
    }

    private Map<String, String> createErrorMap(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
