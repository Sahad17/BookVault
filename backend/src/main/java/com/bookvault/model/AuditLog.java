package com.bookvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AuditLog Entity
 * 
 * OOP Principles Demonstrated:
 * 1. Encapsulation: All properties are private and accessed via public getters and setters.
 * 2. Immutable Timestamps: Backend generates the audit timestamp upon creation.
 *    Client is strictly prevented from altering historical audit records.
 * 3. Relationship Mapping: ManyToOne association with the User entity representing the actor.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Default No-Arg Constructor (Mandatory for JPA)
    public AuditLog() {
    }

    // Parameterized Constructor for automatic timestamping
    public AuditLog(User user, String action, String description) {
        this.user = user;
        this.action = action;
        this.description = description;
        this.timestamp = LocalDateTime.now();
    }

    // Parameterized Constructor with explicit timestamp (useful for testing & historical seed records)
    public AuditLog(User user, String action, String description, LocalDateTime timestamp) {
        this.user = user;
        this.action = action;
        this.description = description;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    // --- Encapsulation: Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
