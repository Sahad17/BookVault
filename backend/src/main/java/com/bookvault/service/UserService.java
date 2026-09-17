package com.bookvault.service;

import com.bookvault.dto.AuthResponse;
import com.bookvault.dto.LoginRequest;
import com.bookvault.dto.RegisterRequest;
import com.bookvault.exception.EmailAlreadyExistsException;
import com.bookvault.exception.InvalidCredentialsException;
import com.bookvault.model.Role;
import com.bookvault.model.User;
import com.bookvault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

/**
 * UserService
 * 
 * OOP Principles Demonstrated:
 * 1. Separation of Responsibilities (Single Responsibility Principle):
 *    Encapsulates all business logic and authentication workflows, keeping
 *    controllers thin and models pure.
 * 2. Encapsulation & Access Modifiers:
 *    Internal helper methods are private; only public API operations (register, login)
 *    are exposed.
 * 3. Security:
 *    Never stores raw passwords. Uses BCrypt salted one-way hashing.
 * 4. Business Rule Enforcement:
 *    New public registrations are ALWAYS assigned Role.STUDENT by default.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");

    @Autowired
    public UserService(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.auditLogService = auditLogService;
    }

    /**
     * Registers a new user as a STUDENT.
     * Validates input, prevents duplicate emails, hashes password, and persists user.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validation: Non-empty check
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full Name cannot be empty.");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email address cannot be empty.");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty.");
        }

        String sanitizedEmail = request.getEmail().trim().toLowerCase();

        // 2. Validation: Email Format
        if (!EMAIL_PATTERN.matcher(sanitizedEmail).matches()) {
            throw new IllegalArgumentException("Invalid email format provided.");
        }

        // 3. Validation: Password Match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match. Please verify.");
        }

        // 4. Validation: Password Strength
        if (request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        // 5. Validation: Unique Email check
        if (userRepository.existsByEmail(sanitizedEmail)) {
            throw new EmailAlreadyExistsException("An account with email '" + sanitizedEmail + "' already exists.");
        }

        // 6. Security: Password Hashing with BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 7. Domain Model Creation: Default role is strictly STUDENT
        User newUser = new User(
            request.getName().trim(),
            sanitizedEmail,
            hashedPassword,
            Role.STUDENT
        );

        User savedUser = userRepository.save(newUser);

        // Audit Logging: Record successful user registration
        auditLogService.log(
            savedUser,
            "REGISTER",
            "New student account registered: " + savedUser.getName() + " (" + savedUser.getEmail() + ")"
        );

        return new AuthResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            "Registration successful. Welcome to BookVault!"
        );
    }

    /**
     * Authenticates existing user by email and password.
     */
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty.");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty.");
        }

        String sanitizedEmail = request.getEmail().trim().toLowerCase();

        // Find user by unique email
        User user = userRepository.findByEmail(sanitizedEmail)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        // Verify password hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        // Audit Logging: Record successful user login
        auditLogService.log(
            user,
            "LOGIN",
            user.getName() + " (" + user.getRole() + ") logged into the system"
        );

        return new AuthResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            "Login successful."
        );
    }

    /**
     * Records user logout audit event.
     */
    public void logout(Long userId) {
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                auditLogService.log(
                    user,
                    "LOGOUT",
                    user.getName() + " logged out of the system"
                );
            });
        }
    }

    /**
     * Check if email is already taken
     */
    public boolean isEmailRegistered(String email) {
        if (email == null) return false;
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }
}
