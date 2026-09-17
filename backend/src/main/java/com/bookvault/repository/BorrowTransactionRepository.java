package com.bookvault.repository;

import com.bookvault.model.BorrowStatus;
import com.bookvault.model.BorrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * BorrowTransactionRepository
 * 
 * OOP Concept: Data Access Abstraction (Spring Data JPA)
 * - Decouples domain logic from SQL query generation
 * - Provides search, status filtering, and entity relationship navigation
 */
@Repository
public interface BorrowTransactionRepository extends JpaRepository<BorrowTransaction, Long> {

    List<BorrowTransaction> findAllByOrderByIdDesc();

    List<BorrowTransaction> findByStudentIdOrderByIdDesc(Long studentId);

    List<BorrowTransaction> findByBookIdOrderByIdDesc(Long bookId);

    List<BorrowTransaction> findByStatusOrderByIdDesc(BorrowStatus status);

    @Query("SELECT t FROM BorrowTransaction t WHERE " +
           "LOWER(t.student.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "CAST(t.student.id AS string) LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(t.book.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "CAST(t.id AS string) LIKE CONCAT('%', :query, '%') " +
           "ORDER BY t.id DESC")
    List<BorrowTransaction> searchTransactions(@Param("query") String query);
}
