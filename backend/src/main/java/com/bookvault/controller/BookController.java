package com.bookvault.controller;

import com.bookvault.dto.BookRequest;
import com.bookvault.exception.BookNotFoundException;
import com.bookvault.exception.DuplicateIsbnException;
import com.bookvault.model.Book;
import com.bookvault.service.BookService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * BookController
 * 
 * REST Controller providing full CRUD endpoints for library books:
 * - GET    /api/books        : Retrieve all cataloged books
 * - GET    /api/books/{id}   : Retrieve single book details
 * - POST   /api/books        : Add a new book to the library
 * - PUT    /api/books/{id}   : Update existing book information
 * - DELETE /api/books/{id}   : Delete a book from the library
 * - GET    /api/books/search : Search books by title, author, or ISBN
 */
@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookService bookService;

    @Autowired
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks(@RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(bookService.searchBooks(search.trim()));
        }
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookById(@PathVariable Long id) {
        try {
            Book book = bookService.getBookById(id);
            return ResponseEntity.ok(book);
        } catch (BookNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addBook(@Valid @RequestBody BookRequest request) {
        try {
            Book created = bookService.addBook(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (DuplicateIsbnException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(createErrorMap(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Failed to create book: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
        try {
            Book updated = bookService.updateBook(id, request);
            return ResponseEntity.ok(updated);
        } catch (BookNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        } catch (DuplicateIsbnException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(createErrorMap(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Failed to update book: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Book successfully removed from catalog.");
            return ResponseEntity.ok(response);
        } catch (BookNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Failed to delete book: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String query) {
        return ResponseEntity.ok(bookService.searchBooks(query));
    }

    private Map<String, String> createErrorMap(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
