package com.bookvault.dto;

import com.bookvault.model.BorrowStatus;
import com.bookvault.model.BorrowTransaction;
import java.time.LocalDate;

/**
 * BorrowTransactionResponse DTO
 * 
 * Provides a decoupled, serialized representation of transaction data for REST clients.
 */
public class BorrowTransactionResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private String bookCoverImageUrl;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private BorrowStatus status;
    private Double fineAmount;

    public BorrowTransactionResponse() {
    }

    public static BorrowTransactionResponse fromEntity(BorrowTransaction entity) {
        BorrowTransactionResponse dto = new BorrowTransactionResponse();
        dto.setId(entity.getId());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getName());
            dto.setStudentEmail(entity.getStudent().getEmail());
        }
        if (entity.getBook() != null) {
            dto.setBookId(entity.getBook().getId());
            dto.setBookTitle(entity.getBook().getTitle());
            dto.setBookAuthor(entity.getBook().getAuthor());
            dto.setBookIsbn(entity.getBook().getIsbn());
            dto.setBookCoverImageUrl(entity.getBook().getCoverImageUrl());
        }
        dto.setIssueDate(entity.getIssueDate());
        dto.setDueDate(entity.getDueDate());
        dto.setReturnDate(entity.getReturnDate());
        dto.setStatus(entity.getStatus());
        dto.setFineAmount(entity.getFineAmount());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }

    public String getBookAuthor() {
        return bookAuthor;
    }

    public void setBookAuthor(String bookAuthor) {
        this.bookAuthor = bookAuthor;
    }

    public String getBookIsbn() {
        return bookIsbn;
    }

    public void setBookIsbn(String bookIsbn) {
        this.bookIsbn = bookIsbn;
    }

    public String getBookCoverImageUrl() {
        return bookCoverImageUrl;
    }

    public void setBookCoverImageUrl(String bookCoverImageUrl) {
        this.bookCoverImageUrl = bookCoverImageUrl;
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
}
