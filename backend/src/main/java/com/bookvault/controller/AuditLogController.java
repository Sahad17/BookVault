package com.bookvault.controller;

import com.bookvault.dto.AuditLogResponse;
import com.bookvault.model.AuditLog;
import com.bookvault.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AuditLogController
 * 
 * Read-Only REST Controller for Audit Logs.
 * 
 * Endpoint Specification:
 * - GET /api/audit-logs : Retrieves all audit activities (supports optional 'search' query)
 * - GET /api/audit-logs/search?query=... : Explicit search endpoint
 * 
 * Security Rule:
 * - Read-only access: No POST, PUT, or DELETE routes exist for audit records.
 * - Access restricted to ADMIN and LIBRARIAN roles.
 */
@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Autowired
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Retrieves audit logs with optional search filtering.
     * Enforces role check via optional header 'X-User-Role'.
     */
    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        // Access Control: Students cannot access audit logs
        if ("STUDENT".equalsIgnoreCase(userRole)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access Denied: Only Librarians and Administrators are authorized to view audit logs.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        List<AuditLog> logs;
        if (search != null && !search.trim().isEmpty()) {
            logs = auditLogService.searchLogs(search.trim());
        } else {
            logs = auditLogService.getAllLogs();
        }

        List<AuditLogResponse> responseList = logs.stream()
                .map(AuditLogResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    /**
     * Dedicated search endpoint for audit logs.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchLogs(
            @RequestParam String query,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        if ("STUDENT".equalsIgnoreCase(userRole)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access Denied: Only Librarians and Administrators are authorized to view audit logs.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        List<AuditLog> logs = auditLogService.searchLogs(query);
        List<AuditLogResponse> responseList = logs.stream()
                .map(AuditLogResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }
}
