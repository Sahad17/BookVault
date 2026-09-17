package com.bookvault.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * BookRequest DTO
 * 
 * Encapsulates incoming payload for Add and Edit book operations.
 */
public class BookRequest {

    @NotBlank(message = "Book title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(max = 150, message = "Author cannot exceed 150 characters")
    private String author;

    @NotBlank(message = "ISBN is required")
    @Size(max = 30, message = "ISBN cannot exceed 30 characters")
    private String isbn;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    @NotBlank(message = "Publisher is required")
    @Size(max = 150, message = "Publisher cannot exceed 150 characters")
    private String publisher;

    @NotNull(message = "Publication year is required")
    @Min(value = 1000, message = "Publication year must be valid")
    private Integer publicationYear;

    @NotNull(message = "Total copies is required")
    @Min(value = 1, message = "Total copies must be at least 1")
    private Integer totalCopies;

    @Size(max = 500, message = "Cover image URL cannot exceed 500 characters")
    private String coverImageUrl;

    public BookRequest() {
    }

    public BookRequest(String title, String author, String isbn, String category,
                       String publisher, Integer publicationYear, Integer totalCopies) {
        this(title, author, isbn, category, publisher, publicationYear, totalCopies, null);
    }

    public BookRequest(String title, String author, String isbn, String category,
                       String publisher, Integer publicationYear, Integer totalCopies, String coverImageUrl) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.totalCopies = totalCopies;
        this.coverImageUrl = coverImageUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    public Integer getPublicationYear() {
        return publicationYear;
    }

    public void setPublicationYear(Integer publicationYear) {
        this.publicationYear = publicationYear;
    }

    public Integer getTotalCopies() {
        return totalCopies;
    }

    public void setTotalCopies(Integer totalCopies) {
        this.totalCopies = totalCopies;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
}
