package com.bookvault.service;

import com.bookvault.dto.IssueBookRequest;
import com.bookvault.exception.AlreadyReturnedException;
import com.bookvault.exception.BookNotAvailableException;
import com.bookvault.exception.BookNotFoundException;
import com.bookvault.exception.TransactionNotFoundException;
import com.bookvault.exception.UserNotFoundException;
import com.bookvault.model.Book;
import com.bookvault.model.BorrowStatus;
import com.bookvault.model.BorrowTransaction;
import com.bookvault.model.User;
import com.bookvault.repository.BookRepository;
import com.bookvault.repository.BorrowTransactionRepository;
import com.bookvault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * BorrowTransactionService
 * 
 * OOP Principles & Business Logic:
 * 1. Encapsulated Fine Calculation:
 *    - Rate: ₹5 per day for each day the return date exceeds the agreed due date.
 *    - If returnDate is on or before dueDate: Fine = ₹0.00.
 *    - Invariant: Fine is strictly non-negative and persists inside the transaction entity.
 * 2. Inventory Coordination:
 *    - Safely balances catalog quantities upon issue (decrement) and return (increment).
 * 3. Invariant Protection:
 *    - Guards against duplicate book returns and invalid transactions.
 */
@Service
@Transactional
public class BorrowTransactionService {

    /** Daily overdue penalty rate in Indian Rupees (₹5 per day). */
    public static final double DAILY_FINE_RATE = 5.0;

    private final BorrowTransactionRepository borrowTransactionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public BorrowTransactionService(
            BorrowTransactionRepository borrowTransactionRepository,
            BookRepository bookRepository,
            UserRepository userRepository,
            AuditLogService auditLogService) {
        this.borrowTransactionRepository = borrowTransactionRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Calculates the overdue fine for a book loan based on its due date and return date.
     * 
     * Fine Calculation Specification:
     * - If returnDate > dueDate: Fine = (days overdue) * ₹5.00
     * - If returnDate <= dueDate: Fine = ₹0.00
     * - If either date is null: Fine = ₹0.00
     * 
     * @param dueDate the scheduled deadline for returning the book
     * @param returnDate the actual date on which the book is returned
     * @return the calculated fine in Rupees (₹)
     */
    public double calculateFine(LocalDate dueDate, LocalDate returnDate) {
        if (dueDate == null || returnDate == null) {
            return 0.0;
        }

        if (returnDate.isAfter(dueDate)) {
            long overdueDays = ChronoUnit.DAYS.between(dueDate, returnDate);
            return (double) overdueDays * DAILY_FINE_RATE;
        }

        return 0.0;
    }

    /**
     * Helper overload to calculate fine directly from a BorrowTransaction and target return date.
     * 
     * @param transaction the borrowing transaction containing the due date
     * @param returnDate the date the book is returned
     * @return the calculated fine amount (₹)
     */
    public double calculateFine(BorrowTransaction transaction, LocalDate returnDate) {
        if (transaction == null || transaction.getDueDate() == null) {
            return 0.0;
        }
        return calculateFine(transaction.getDueDate(), returnDate);
    }

    /**
     * Retrieves all transactions in reverse chronological order.
     */
    @Transactional(readOnly = true)
    public List<BorrowTransaction> getAllTransactions() {
        return borrowTransactionRepository.findAllByOrderByIdDesc();
    }

    /**
     * Retrieves a single transaction by ID.
     */
    @Transactional(readOnly = true)
    public BorrowTransaction getTransactionById(Long id) {
        return borrowTransactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Borrow transaction with ID #" + id + " not found."));
    }

    /**
     * Issues a book to a registered student member.
     * 
     * Invariant Guarantees:
     * - Student and book must exist.
     * - Book must have available copies > 0.
     * - Decrements available copies on Book entity.
     * - Sets loan period to 14 days and initializes fine to ₹0.00.
     */
    public BorrowTransaction issueBook(IssueBookRequest request) {
        if (request.getStudentId() == null) {
            throw new IllegalArgumentException("Student ID cannot be null.");
        }
        if (request.getBookId() == null) {
            throw new IllegalArgumentException("Book ID cannot be null.");
        }

        // 1. Verify student exists
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new UserNotFoundException("Student member with ID #" + request.getStudentId() + " not found."));

        // 2. Verify book exists
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new BookNotFoundException("Book with ID #" + request.getBookId() + " not found in catalog."));

        // 3. Verify available copies
        if (!book.isAvailable()) {
            throw new BookNotAvailableException("Cannot issue '" + book.getTitle() + "'. There are 0 available copies remaining.");
        }

        // 4. Update book inventory (Encapsulated OOP method on Book entity)
        book.borrowCopy();
        bookRepository.save(book);

        // 5. Create transaction with initial fine of ₹0.00
        BorrowTransaction transaction = new BorrowTransaction(student, book, LocalDate.now());
        transaction.setFineAmount(0.0);
        BorrowTransaction saved = borrowTransactionRepository.save(transaction);

        // Audit Logging: Record successful book issue
        auditLogService.log(
            student,
            "BOOK_ISSUED",
            "Issued \"" + book.getTitle() + "\" to student " + student.getName() + " (ID: " + student.getId() + ")"
        );

        return saved;
    }

    /**
     * Processes the return of an issued book with a specified return date.
     * Computes the fine of ₹5 per day if the return date exceeds the due date,
     * updates inventory, and returns the transaction object containing the calculated fine.
     * 
     * @param transactionId ID of the transaction to return
     * @param returnDate actual date of return (if null, current date is used)
     * @return the updated BorrowTransaction with computed fine amount and RETURNED status
     */
    public BorrowTransaction returnBook(Long transactionId, LocalDate returnDate) {
        BorrowTransaction transaction = getTransactionById(transactionId);

        // Invariant: Prevent duplicate return
        if (transaction.getStatus() == BorrowStatus.RETURNED || transaction.getReturnDate() != null) {
            throw new AlreadyReturnedException(
                "Transaction #" + transactionId + " was already returned on " + transaction.getReturnDate() + 
                ". Duplicate return processing is strictly prohibited."
            );
        }

        LocalDate actualReturnDate = (returnDate != null) ? returnDate : LocalDate.now();

        // 1. Restore book available inventory
        Book book = transaction.getBook();
        if (book != null) {
            book.returnCopy();
            bookRepository.save(book);
        }

        // 2. Compute fine using the service's fine calculation logic (₹5 per day overdue)
        double fine = calculateFine(transaction.getDueDate(), actualReturnDate);

        // 3. Update transaction object with return details and calculated fine
        transaction.setReturnDate(actualReturnDate);
        transaction.setFineAmount(fine);
        transaction.setStatus(BorrowStatus.RETURNED);

        // 4. Persist and return the transaction object
        BorrowTransaction saved = borrowTransactionRepository.save(transaction);

        // Audit Logging: Record successful book return
        String fineDesc = (fine > 0) ? String.format(" (Overdue fine assessed: ₹%.2f)", fine) : " (No fine)";
        auditLogService.log(
            transaction.getStudent(),
            "BOOK_RETURNED",
            "Returned \"" + (book != null ? book.getTitle() : "Book") + "\" from student " + 
            (transaction.getStudent() != null ? transaction.getStudent().getName() : "Member") + 
            (transaction.getStudent() != null ? " (ID: " + transaction.getStudent().getId() + ")" : "") + fineDesc
        );

        return saved;
    }

    /**
     * Processes the return of an issued book using the current date.
     * 
     * @param transactionId ID of the transaction to return
     * @return the updated BorrowTransaction with computed fine amount
     */
    public BorrowTransaction returnBook(Long transactionId) {
        return returnBook(transactionId, LocalDate.now());
    }

    /**
     * Searches transactions by student name, student ID, book title, or transaction ID.
     */
    @Transactional(readOnly = true)
    public List<BorrowTransaction> searchTransactions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllTransactions();
        }
        return borrowTransactionRepository.searchTransactions(query.trim());
    }
}
