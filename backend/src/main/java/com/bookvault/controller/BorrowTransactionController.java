package com.bookvault.controller;

import com.bookvault.dto.BorrowTransactionResponse;
import com.bookvault.dto.IssueBookRequest;
import com.bookvault.exception.*;
import com.bookvault.model.BorrowTransaction;
import com.bookvault.service.BorrowTransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * BorrowTransactionController
 * 
 * REST Controller providing issue and return operations:
 * - GET    /api/borrowings            : Retrieve all transactions
 * - GET    /api/borrowings/{id}       : Retrieve single transaction details
 * - POST   /api/borrowings            : Issue a book to a student
 * - PUT    /api/borrowings/{id}/return: Process return of a book
 * - GET    /api/borrowings/search     : Search transactions by student, book, or ID
 */
@RestController
@RequestMapping("/api/borrowings")
@CrossOrigin(origins = "*")
public class BorrowTransactionController {

    private final BorrowTransactionService borrowTransactionService;

    @Autowired
    public BorrowTransactionController(BorrowTransactionService borrowTransactionService) {
        this.borrowTransactionService = borrowTransactionService;
    }

    @GetMapping
    public ResponseEntity<List<BorrowTransactionResponse>> getAllTransactions(
            @RequestParam(required = false) String search) {
        List<BorrowTransaction> list;
        if (search != null && !search.trim().isEmpty()) {
            list = borrowTransactionService.searchTransactions(search.trim());
        } else {
            list = borrowTransactionService.getAllTransactions();
        }
        List<BorrowTransactionResponse> dtoList = list.stream()
                .map(BorrowTransactionResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionById(@PathVariable Long id) {
        try {
            BorrowTransaction transaction = borrowTransactionService.getTransactionById(id);
            return ResponseEntity.ok(BorrowTransactionResponse.fromEntity(transaction));
        } catch (TransactionNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> issueBook(@Valid @RequestBody IssueBookRequest request) {
        try {
            BorrowTransaction transaction = borrowTransactionService.issueBook(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(BorrowTransactionResponse.fromEntity(transaction));
        } catch (UserNotFoundException | BookNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        } catch (BookNotAvailableException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorMap(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Failed to issue book: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnBook(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate returnDate) {
        try {
            BorrowTransaction transaction = (returnDate != null)
                    ? borrowTransactionService.returnBook(id, returnDate)
                    : borrowTransactionService.returnBook(id);
            return ResponseEntity.ok(BorrowTransactionResponse.fromEntity(transaction));
        } catch (TransactionNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap(e.getMessage()));
        } catch (AlreadyReturnedException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(createErrorMap(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorMap(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Failed to process return: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<BorrowTransactionResponse>> searchTransactions(@RequestParam String query) {
        List<BorrowTransaction> results = borrowTransactionService.searchTransactions(query);
        List<BorrowTransactionResponse> dtoList = results.stream()
                .map(BorrowTransactionResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    private Map<String, String> createErrorMap(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
