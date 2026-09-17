package com.bookvault.service;

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
 * Centralized business service for recording and retrieving audit activities.
 * 
 * OOP Principles & Design Rules:
 * 1. Single Responsibility: Exclusively responsible for system audit trail maintenance.
 * 2. Non-Disruptive Failure Tolerance: Catches and logs any persistence anomalies so
 *    that logging failures never roll back or abort successful core business transactions.
 * 3. Polymorphic Overloads: Supports logging directly with a User entity, a user ID,
 *    or a user email.
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
     * Records an audit log entry for a known User entity.
     * Uses REQUIRES_NEW propagation to isolate audit persistence from caller rollback semantics.
     * 
     * @param user the authenticated actor who performed the action
     * @param action the standard action identifier (e.g., LOGIN, BOOK_ADDED)
     * @param description contextual explanation of the event
     * @return the saved AuditLog, or null if logging failed gracefully
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(User user, String action, String description) {
        if (user == null) {
            logger.warn("Attempted to record audit log '{}' without an authenticated user. Fallback to system admin.", action);
            user = userRepository.findById(1L).orElse(null);
            if (user == null) {
                logger.error("No default system user available to record audit log.");
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

    /**
     * Overload: Records an audit log by User ID.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(Long userId, String action, String description) {
        try {
            User user = null;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            }
            return log(user, action, description);
        } catch (Exception e) {
            logger.error("Failed to resolve user ID {} for audit log: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Overload: Records an audit log by user email.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(String userEmail, String action, String description) {
        try {
            User user = null;
            if (userEmail != null) {
                user = userRepository.findByEmail(userEmail.trim().toLowerCase()).orElse(null);
            }
            return log(user, action, description);
        } catch (Exception e) {
            logger.error("Failed to resolve user email '{}' for audit log: {}", userEmail, e.getMessage());
            return null;
        }
    }

    /**
     * Retrieves all audit logs in reverse chronological order (newest first).
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        try {
            return auditLogRepository.findAllByOrderByTimestampDesc();
        } catch (Exception e) {
            logger.error("Error retrieving audit logs: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Searches audit logs by user name, email, action, description, or log ID.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> searchLogs(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllLogs();
        }
        try {
            return auditLogRepository.searchLogs(query.trim());
        } catch (Exception e) {
            logger.error("Error searching audit logs with query '{}': {}", query, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}
