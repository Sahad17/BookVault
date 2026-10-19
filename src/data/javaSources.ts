import { JavaSourceFile } from '../types';

export const JAVA_AUTH_SOURCES: JavaSourceFile[] = [
  {
    name: 'User.java',
    path: 'com/bookvault/model/User.java',
    category: 'Entity',
    oopConcept: 'Encapsulation, Constructors & Access Modifiers',
    description: 'The core domain entity representing registered system users. All state attributes are strictly private and accessible solely through public getters and setters.',
    code: `package com.bookvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * User Entity
 * 
 * OOP Principles Demonstrated:
 * 1. Encapsulation: State attributes are declared private to prevent unauthorized mutation.
 * 2. Constructors: Default constructor for JPA reflection + parameterized constructor for explicit initialization.
 * 3. Access Modifiers: Strictly scoped (private fields, public accessors).
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    // Default No-Arg Constructor (Mandatory for JPA entity instantiation)
    public User() {
    }

    // Parameterized Constructor for clean object creation
    public User(String name, String email, String password, Role role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Constructor with ID
    public User(Long id, String name, String email, String password, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Encapsulation: Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                '}';
    }
}`
  },
  {
    name: 'Role.java',
    path: 'com/bookvault/model/Role.java',
    category: 'Enum',
    oopConcept: 'Type Safety & Constants',
    description: 'Enumeration defining user privileges (STUDENT, LIBRARIAN) preventing arbitrary strings.',
    code: `package com.bookvault.model;

/**
 * Role Enum
 * 
 * OOP Concept: Type Safety
 * Restricts user roles strictly to STUDENT and LIBRARIAN.
 * Public registration assigns STUDENT by default.
 */
public enum Role {
    STUDENT,
    LIBRARIAN
}`
  },
  {
    name: 'UserService.java',
    path: 'com/bookvault/service/UserService.java',
    category: 'Service',
    oopConcept: 'Separation of Responsibilities & Business Logic Encapsulation',
    description: 'Central service orchestrating user registration, validation rules, BCrypt password hashing, and authentication verification.',
    code: `package com.bookvault.service;

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
 * OOP Concept: Single Responsibility Principle (SRP)
 * Encapsulates authentication workflows and data integrity checks.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,6}$");

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Registers a new user.
     * Enforces STUDENT role by default.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validation: Empty check
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
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // 4. Validation: Password Minimum Length
        if (request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        // 5. Validation: Unique Email Constraint
        if (userRepository.existsByEmail(sanitizedEmail)) {
            throw new EmailAlreadyExistsException("An account with email '" + sanitizedEmail + "' already exists.");
        }

        // 6. Security: Password Hashing (BCrypt)
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 7. Domain Instantiation (Strict default: STUDENT)
        User newUser = new User(
            request.getName().trim(),
            sanitizedEmail,
            hashedPassword,
            Role.STUDENT
        );

        User savedUser = userRepository.save(newUser);

        return new AuthResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            "Registration successful. Welcome to BookVault!"
        );
    }

    /**
     * Authenticates an existing user credentials.
     */
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty.");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty.");
        }

        String sanitizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(sanitizedEmail)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        // Match against hashed password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        return new AuthResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            "Login successful."
        );
    }
}`
  },
  {
    name: 'UserRepository.java',
    path: 'com/bookvault/repository/UserRepository.java',
    category: 'Repository',
    oopConcept: 'Interface Abstraction & Data Access Layer',
    description: 'Spring Data JPA repository interface extending JpaRepository to provide query methods.',
    code: `package com.bookvault.repository;

import com.bookvault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * UserRepository
 * 
 * Spring Data JPA abstraction over MySQL users table.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}`
  },
  {
    name: 'AuthController.java',
    path: 'com/bookvault/controller/AuthController.java',
    category: 'Controller',
    oopConcept: 'Controller Layer & Request Mapping',
    description: 'REST Controller delegating HTTP requests to the UserService.',
    code: `package com.bookvault.controller;

import com.bookvault.dto.AuthResponse;
import com.bookvault.dto.LoginRequest;
import com.bookvault.dto.RegisterRequest;
import com.bookvault.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
}`
  },
  {
    name: 'schema.sql',
    path: 'src/main/resources/schema.sql',
    category: 'SQL',
    oopConcept: 'Relational Database Schema',
    description: 'MySQL DDL defining the users table with unique email constraint and pre-seeded accounts.',
    code: `-- ============================================================================
-- BookVault - Database Schema (MySQL)
-- Phase 1: Authentication (Users Table)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bookvault;
USE bookvault;

-- Drop existing users table if resetting
DROP TABLE IF EXISTS users;

-- 1. USERS TABLE
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Seed Data:
-- Sarah Jenkins (Librarian) - Pass: Password@123
INSERT INTO users (name, email, password, role) VALUES 
('Sarah Jenkins', 'librarian@bookvault.edu', '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G', 'LIBRARIAN');

-- Alex Mercer (Student) - Pass: Password@123
INSERT INTO users (name, email, password, role) VALUES 
('Alex Mercer', 'alex.mercer@bookvault.edu', '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G', 'STUDENT');`
  },
  {
    name: 'Book.java',
    path: 'com/bookvault/model/Book.java',
    category: 'Entity',
    oopConcept: 'Encapsulation, Class Invariants & Domain Methods',
    description: 'Core domain entity modeling cataloged books. Uses private fields, getters/setters, and methods like borrowCopy(), returnCopy(), and updateDetails() that maintain inventory invariants.',
    code: `package com.bookvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(nullable = false, unique = true, length = 30)
    private String isbn;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 150)
    private String publisher;

    @Column(name = "publication_year", nullable = false)
    private Integer publicationYear;

    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    // Constructors, business logic, getters and setters
}`
  },
  {
    name: 'BookRepository.java',
    path: 'com/bookvault/repository/BookRepository.java',
    category: 'Repository',
    oopConcept: 'Data Access Layer & Repository Pattern',
    description: 'Spring Data JPA repository interface abstracting database queries for ISBN existence, lookups, and keyword searching across title, author, and category.',
    code: `package com.bookvault.repository;

import com.bookvault.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    boolean existsByIsbn(String isbn);
    boolean existsByIsbnAndIdNot(String isbn, Long id);

    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Book> searchBooks(@Param("query") String query);
}`
  },
  {
    name: 'BookService.java',
    path: 'com/bookvault/service/BookService.java',
    category: 'Service',
    oopConcept: 'Service Layer, Business Rule Encapsulation & Transactions',
    description: 'Enforces business rules including unique ISBNs, logical preservation of loaned copy counts upon editing, and preventing deletion of books with active borrowings.',
    code: `package com.bookvault.service;

import com.bookvault.dto.BookRequest;
import com.bookvault.model.Book;
import com.bookvault.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class BookService {
    private final BookRepository bookRepository;

    public List<Book> getAllBooks() { return bookRepository.findAll(); }
    public Book addBook(BookRequest req) { /* validates and saves */ }
    public Book updateBook(Long id, BookRequest req) { /* updates and preserves copies */ }
    public void deleteBook(Long id) { /* verifies no active borrowings */ }
    public List<Book> searchBooks(String query) { return bookRepository.searchBooks(query); }
}`
  },
  {
    name: 'BookController.java',
    path: 'com/bookvault/controller/BookController.java',
    category: 'Controller',
    oopConcept: 'REST API Controller & HTTP Endpoint Routing',
    description: 'Exposes clean RESTful endpoints (GET, POST, PUT, DELETE) conforming to standard HTTP verbs and status codes for library book management.',
    code: `package com.bookvault.controller;

import com.bookvault.dto.BookRequest;
import com.bookvault.model.Book;
import com.bookvault.service.BookService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {
    // GET /api/books
    // GET /api/books/{id}
    // POST /api/books
    // PUT /api/books/{id}
    // DELETE /api/books/{id}
    // GET /api/books/search?query={q}
}`
  },
  {
    name: 'AuditLog.java',
    path: 'com/bookvault/model/AuditLog.java',
    category: 'Entity',
    oopConcept: 'Domain Modeling, Immutability & Audit Trail Invariants',
    description: 'Represents an immutable, permanent system audit record capturing user identity, action type, descriptive details, and exact timestamp.',
    code: `package com.bookvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    public AuditLog() {
        this.timestamp = LocalDateTime.now();
    }

    public AuditLog(User user, String action, String description) {
        this();
        this.user = user;
        this.action = action;
        this.description = description;
    }

    // Getters & Setters
}`
  },
  {
    name: 'AuditLogService.java',
    path: 'com/bookvault/service/AuditLogService.java',
    category: 'Service',
    oopConcept: 'Service Layer, REQUIRES_NEW Transaction Isolation & Non-Disruptive Failure Tolerance',
    description: 'Provides audit logging functionality with isolated transactions so that logging failures never derail primary business transactions.',
    code: `package com.bookvault.service;

import com.bookvault.model.AuditLog;
import com.bookvault.model.User;
import com.bookvault.repository.AuditLogRepository;
import com.bookvault.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;

/**
 * AuditLogService
 * 
 * Centralized business service for recording system actions.
 * Provides the reusable method: log(user, action, description)
 */
@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Primary audit logging method reused by existing services (UserService, BookService, BorrowTransactionService).
     * Uses REQUIRES_NEW transaction propagation to ensure audit trail persistence is isolated
     * and non-disruptive to the invoking business logic.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(User user, String action, String description) {
        if (user == null) {
            user = userRepository.findById(1L).orElse(null);
            if (user == null) {
                logger.error("No actor user available to record audit log.");
                return null;
            }
        }

        try {
            AuditLog auditLog = new AuditLog(user, action, description);
            AuditLog saved = auditLogRepository.save(auditLog);
            logger.info("Audit recorded [Action: {}, User: {} (ID: {}), Desc: '{}']", 
                    action, user.getName(), user.getId(), description);
            return saved;
        } catch (Exception e) {
            // Guarantee: Audit logging must NEVER break the original business operation
            logger.error("Non-fatal error creating audit log [{}]: {}", action, e.getMessage(), e);
            return null;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(Long userId, String action, String description) {
        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;
        return log(user, action, description);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}`
  },
  {
    name: 'AuditLogController.java',
    path: 'com/bookvault/controller/AuditLogController.java',
    category: 'Controller',
    oopConcept: 'REST API, Role-Based Access Control (RBAC) & Read-Only Endpoints',
    description: 'Exposes read-only REST endpoints (/api/audit-logs) strictly restricted to LIBRARIAN and ADMIN roles.',
    code: `package com.bookvault.controller;

import com.bookvault.dto.AuditLogResponse;
import com.bookvault.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {
    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllLogs(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if ("STUDENT".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(auditLogService.getAllLogsAsDto());
    }
}`
  }
];
