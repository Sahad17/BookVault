package com.bookvault.service;

import com.bookvault.model.AuditLog;
import com.bookvault.model.Role;
import com.bookvault.model.User;
import com.bookvault.repository.AuditLogRepository;
import com.bookvault.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private User sampleAdmin;

    @BeforeEach
    void setUp() {
        sampleAdmin = new User();
        sampleAdmin.setId(1L);
        sampleAdmin.setName("System Administrator");
        sampleAdmin.setEmail("admin@bookvault.edu");
        sampleAdmin.setRole(Role.ADMIN);
    }

    @Test
    @DisplayName("Should successfully record audit log with user and action")
    void testLogWithUser() {
        AuditLog mockLog = new AuditLog(sampleAdmin, "BOOK_ADDED", "Added book Test Book");
        mockLog.setId(101L);

        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(mockLog);

        AuditLog result = auditLogService.log(sampleAdmin, "BOOK_ADDED", "Added book Test Book");

        assertNotNull(result);
        assertEquals(101L, result.getId());
        assertEquals("BOOK_ADDED", result.getAction());
        assertEquals("Added book Test Book", result.getDescription());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should tolerate repository exception without throwing and return null")
    void testLogFailureTolerance() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB Connection Timeout"));

        AuditLog result = auditLogService.log(sampleAdmin, "LOGIN", "Admin login");

        // Asserts that the original business logic is not interrupted
        assertNull(result);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should log using user ID by resolving user from repository")
    void testLogWithUserId() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleAdmin));
        AuditLog mockLog = new AuditLog(sampleAdmin, "LOGOUT", "Admin logged out");
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(mockLog);

        AuditLog result = auditLogService.log(1L, "LOGOUT", "Admin logged out");

        assertNotNull(result);
        assertEquals("LOGOUT", result.getAction());
    }

    @Test
    @DisplayName("Should retrieve all logs sorted by timestamp descending")
    void testGetAllLogs() {
        AuditLog log1 = new AuditLog(sampleAdmin, "LOGIN", "Login 1", LocalDateTime.now());
        AuditLog log2 = new AuditLog(sampleAdmin, "BOOK_ADDED", "Added book", LocalDateTime.now().minusMinutes(5));

        when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log1, log2));

        List<AuditLog> logs = auditLogService.getAllLogs();
        assertEquals(2, logs.size());
        assertEquals("LOGIN", logs.get(0).getAction());
    }
}
