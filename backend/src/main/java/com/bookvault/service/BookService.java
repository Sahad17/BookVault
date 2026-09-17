package com.bookvault.service;

import com.bookvault.dto.BookRequest;
import com.bookvault.exception.BookNotFoundException;
import com.bookvault.exception.DuplicateIsbnException;
import com.bookvault.model.Book;
import com.bookvault.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BookService
 * 
 * OOP Concept: Service Layer & Business Logic Encapsulation
 * - Implements library rules: ISBN uniqueness, copy preservation, deletion checks.
 */
@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public BookService(BookRepository bookRepository, AuditLogService auditLogService) {
        this.bookRepository = bookRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book with ID " + id + " not found."));
    }

    public Book addBook(BookRequest request) {
        return addBook(request, null);
    }

    public Book addBook(BookRequest request, Long actorUserId) {
        String cleanIsbn = request.getIsbn().trim();
        if (bookRepository.existsByIsbn(cleanIsbn)) {
            throw new DuplicateIsbnException("A book with ISBN '" + cleanIsbn + "' already exists in the catalog.");
        }

        String coverUrl = request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()
                ? request.getCoverImageUrl().trim()
                : null;

        Book book = new Book(
                request.getTitle().trim(),
                request.getAuthor().trim(),
                cleanIsbn,
                request.getCategory().trim(),
                request.getPublisher().trim(),
                request.getPublicationYear(),
                request.getTotalCopies(),
                coverUrl
        );

        Book saved = bookRepository.save(book);

        // Audit Logging: Record successful book addition
        auditLogService.log(
            actorUserId != null ? actorUserId : 1L,
            "BOOK_ADDED",
            "Added book \"" + saved.getTitle() + "\" (ISBN: " + saved.getIsbn() + ", Copies: " + saved.getTotalCopies() + ")"
        );

        return saved;
    }

    public Book updateBook(Long id, BookRequest request) {
        return updateBook(id, request, null);
    }

    public Book updateBook(Long id, BookRequest request, Long actorUserId) {
        Book existingBook = getBookById(id);
        String cleanIsbn = request.getIsbn().trim();

        if (bookRepository.existsByIsbnAndIdNot(cleanIsbn, id)) {
            throw new DuplicateIsbnException("A book with ISBN '" + cleanIsbn + "' already exists in the catalog.");
        }

        String coverUrl = request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()
                ? request.getCoverImageUrl().trim()
                : null;

        existingBook.updateDetails(
                request.getTitle().trim(),
                request.getAuthor().trim(),
                cleanIsbn,
                request.getCategory().trim(),
                request.getPublisher().trim(),
                request.getPublicationYear(),
                request.getTotalCopies(),
                coverUrl
        );

        Book updated = bookRepository.save(existingBook);

        // Audit Logging: Record successful book update
        auditLogService.log(
            actorUserId != null ? actorUserId : 1L,
            "BOOK_UPDATED",
            "Updated details for book \"" + updated.getTitle() + "\" (ISBN: " + updated.getIsbn() + ")"
        );

        return updated;
    }

    public void deleteBook(Long id) {
        deleteBook(id, null);
    }

    public void deleteBook(Long id, Long actorUserId) {
        Book book = getBookById(id);
        int borrowedCount = book.getBorrowedCopiesCount();
        if (borrowedCount > 0) {
            throw new IllegalStateException(
                "Cannot delete '" + book.getTitle() + "' because " + borrowedCount + 
                " copies are currently on loan to members. All copies must be returned before deletion."
            );
        }
        String bookTitle = book.getTitle();
        String bookIsbn = book.getIsbn();

        bookRepository.delete(book);

        // Audit Logging: Record successful book deletion
        auditLogService.log(
            actorUserId != null ? actorUserId : 1L,
            "BOOK_DELETED",
            "Removed book \"" + bookTitle + "\" (ISBN: " + bookIsbn + ") from catalog"
        );
    }

    @Transactional(readOnly = true)
    public List<Book> searchBooks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.searchBooks(query.trim());
    }
}
