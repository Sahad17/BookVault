package com.bookvault.repository;

import com.bookvault.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * AuditLogRepository
 * 
 * Data Access Layer for AuditLog entities using Spring Data JPA.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "LOWER(a.user.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.user.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "CAST(a.id AS string) LIKE CONCAT('%', :query, '%') " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> searchLogs(@Param("query") String query);
}
