package com.bookvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Book Entity
 * 
 * OOP Principles Demonstrated:
 * 1. Encapsulation: Private state attributes protected by public accessors and business validators.
 * 2. Domain Logic: Methods for managing inventory (e.g., borrowing and returning copies).
 * 3. Class Invariant Protection: Ensures availableCopies never exceeds totalCopies or drops below 0.
 */
@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(nullable = false, unique = true, length = 30)
    private String isbn;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 150)
    private String publisher;

    @Column(name = "publication_year", nullable = false)
    private Integer publicationYear;

    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Default No-Arg Constructor (Mandatory for JPA)
    public Book() {
    }

    // Parameterized Constructor for Book creation
    public Book(String title, String author, String isbn, String category,
                String publisher, Integer publicationYear, Integer totalCopies) {
        this(title, author, isbn, category, publisher, publicationYear, totalCopies, null);
    }

    public Book(String title, String author, String isbn, String category,
                String publisher, Integer publicationYear, Integer totalCopies, String coverImageUrl) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.totalCopies = totalCopies;
        this.availableCopies = totalCopies; // When added, available copies equals total copies
        this.coverImageUrl = coverImageUrl;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // --- Business Logic Methods (OOP Domain Encapsulation) ---

    public boolean isAvailable() {
        return this.availableCopies != null && this.availableCopies > 0;
    }

    public int getBorrowedCopiesCount() {
        if (this.totalCopies == null || this.availableCopies == null) return 0;
        return Math.max(0, this.totalCopies - this.availableCopies);
    }

    public void borrowCopy() {
        if (!isAvailable()) {
            throw new IllegalStateException("No available copies of '" + this.title + "' to borrow.");
        }
        this.availableCopies--;
        this.updatedAt = LocalDateTime.now();
    }

    public void returnCopy() {
        if (this.availableCopies >= this.totalCopies) {
            throw new IllegalStateException("All copies of '" + this.title + "' are already in the library.");
        }
        this.availableCopies++;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateDetails(String title, String author, String isbn, String category,
                              String publisher, Integer publicationYear, Integer newTotalCopies) {
        updateDetails(title, author, isbn, category, publisher, publicationYear, newTotalCopies, this.coverImageUrl);
    }

    public void updateDetails(String title, String author, String isbn, String category,
                              String publisher, Integer publicationYear, Integer newTotalCopies, String coverImageUrl) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.coverImageUrl = coverImageUrl;

        // Logical copy adjustment preserving loaned count
        if (newTotalCopies != null && !newTotalCopies.equals(this.totalCopies)) {
            int currentlyBorrowed = getBorrowedCopiesCount();
            if (newTotalCopies < currentlyBorrowed) {
                throw new IllegalArgumentException(
                    "Total copies cannot be less than currently borrowed copies (" + currentlyBorrowed + " on loan)."
                );
            }
            this.totalCopies = newTotalCopies;
            this.availableCopies = newTotalCopies - currentlyBorrowed;
        }
        this.updatedAt = LocalDateTime.now();
    }

    // --- Getters & Setters (Strict Encapsulation) ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getAvailableCopies() {
        return availableCopies;
    }

    public void setAvailableCopies(Integer availableCopies) {
        this.availableCopies = availableCopies;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
