package com.bookvault.dto;

import jakarta.validation.constraints.NotNull;

/**
 * IssueBookRequest DTO
 * 
 * Data Transfer Object capturing essential inputs required to issue a book:
 * - studentId: ID of the borrowing member
 * - bookId: ID of the cataloged book
 */
public class IssueBookRequest {

    @NotNull(message = "Student ID is required.")
    private Long studentId;

    @NotNull(message = "Book ID is required.")
    private Long bookId;

    public IssueBookRequest() {
    }

    public IssueBookRequest(Long studentId, Long bookId) {
        this.studentId = studentId;
        this.bookId = bookId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }
}
