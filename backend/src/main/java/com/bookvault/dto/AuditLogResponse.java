package com.bookvault.dto;

import com.bookvault.model.AuditLog;
import java.time.LocalDateTime;

/**
 * AuditLogResponse DTO
 * 
 * Provides a clean serialized view of an audit log record for REST clients.
 */
public class AuditLogResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRole;
    private String action;
    private String description;
    private LocalDateTime timestamp;

    public AuditLogResponse() {
    }

    public static AuditLogResponse fromEntity(AuditLog entity) {
        AuditLogResponse dto = new AuditLogResponse();
        dto.setId(entity.getId());
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            dto.setUserName(entity.getUser().getName());
            dto.setUserEmail(entity.getUser().getEmail());
            dto.setUserRole(entity.getUser().getRole() != null ? entity.getUser().getRole().name() : "STUDENT");
        }
        dto.setAction(entity.getAction());
        dto.setDescription(entity.getDescription());
        dto.setTimestamp(entity.getTimestamp());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
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
