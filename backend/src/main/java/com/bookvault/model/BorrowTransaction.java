package com.bookvault.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * BorrowTransaction Entity
 * 
 * OOP Principles Demonstrated:
 * 1. Encapsulation: State is protected by private attributes with public accessors and domain methods.
 * 2. Domain Logic: Business rules like fine calculation and return validation reside inside the entity.
 * 3. Association: References existing User (student) and Book entities via clean @ManyToOne relationships.
 */
@Entity
@Table(name = "borrow_transactions")
public class BorrowTransaction {

    public static final double DAILY_FINE_RATE = 5.0; // ₹5 per day overdue
    public static final int DEFAULT_LOAN_PERIOD_DAYS = 14; // Standard 14-day borrowing duration

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BorrowStatus status = BorrowStatus.ISSUED;

    @Column(name = "fine_amount", nullable = false)
    private Double fineAmount = 0.0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Default No-Arg Constructor (Mandatory for JPA)
    public BorrowTransaction() {
    }

    // Parameterized Constructor for creating a new issue record
    public BorrowTransaction(User student, Book book, LocalDate issueDate) {
        this.student = student;
        this.book = book;
        this.issueDate = issueDate;
        this.dueDate = issueDate.plusDays(DEFAULT_LOAN_PERIOD_DAYS);
        this.status = BorrowStatus.ISSUED;
        this.fineAmount = 0.0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Parameterized Constructor with explicit due date
    public BorrowTransaction(User student, Book book, LocalDate issueDate, LocalDate dueDate) {
        this.student = student;
        this.book = book;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.status = BorrowStatus.ISSUED;
        this.fineAmount = 0.0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // --- Domain Logic Methods (OOP Encapsulation) ---

    /**
     * Calculates the overdue fine based on return date (or current date if still unreturned).
     * Formula: Overdue Days × ₹5
     */
    public double calculateFine(LocalDate effectiveDate) {
        if (effectiveDate == null) {
            effectiveDate = LocalDate.now();
        }
        if (effectiveDate.isAfter(this.dueDate)) {
            long overdueDays = ChronoUnit.DAYS.between(this.dueDate, effectiveDate);
            return Math.max(0, overdueDays) * DAILY_FINE_RATE;
        }
        return 0.0;
    }

    /**
     * Checks if this loan is currently overdue.
     */
    public boolean isOverdue(LocalDate referenceDate) {
        if (this.status == BorrowStatus.RETURNED) {
            return false;
        }
        return referenceDate.isAfter(this.dueDate);
    }

    /**
     * Confirms the return of the borrowed book and applies any fine.
     */
    public void markAsReturned(LocalDate actualReturnDate) {
        if (this.status == BorrowStatus.RETURNED || this.returnDate != null) {
            throw new IllegalStateException("Transaction #" + this.id + " has already been returned.");
        }
        this.returnDate = actualReturnDate != null ? actualReturnDate : LocalDate.now();
        this.fineAmount = calculateFine(this.returnDate);
        this.status = BorrowStatus.RETURNED;
        this.updatedAt = LocalDateTime.now();
    }

    // --- Encapsulation: Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public BorrowStatus getStatus() {
        return status;
    }

    public void setStatus(BorrowStatus status) {
        this.status = status;
    }

    public Double getFineAmount() {
        return fineAmount;
    }

    public void setFineAmount(Double fineAmount) {
        this.fineAmount = fineAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
