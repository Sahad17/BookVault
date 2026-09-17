package com.bookvault.service;

import com.bookvault.exception.AlreadyReturnedException;
import com.bookvault.model.Book;
import com.bookvault.model.BorrowStatus;
import com.bookvault.model.BorrowTransaction;
import com.bookvault.model.User;
import com.bookvault.repository.BookRepository;
import com.bookvault.repository.BorrowTransactionRepository;
import com.bookvault.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * BorrowTransactionServiceTest
 * 
 * Unit tests validating:
 * 1. Overdue fine calculation logic: ₹5 per day for each day returnDate exceeds dueDate.
 * 2. On-time returns result in ₹0 fine.
 * 3. Correct assignment of fine to the returned BorrowTransaction object.
 * 4. Invariant protection against duplicate returns.
 */
@ExtendWith(MockitoExtension.class)
public class BorrowTransactionServiceTest {

    @Mock
    private BorrowTransactionRepository borrowTransactionRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private BorrowTransactionService borrowTransactionService;

    private User sampleStudent;
    private Book sampleBook;

    @BeforeEach
    void setUp() {
        sampleStudent = new User();
        sampleStudent.setId(10L);
        sampleStudent.setName("Alice Student");
        sampleStudent.setEmail("alice@college.edu");

        sampleBook = new Book();
        sampleBook.setId(20L);
        sampleBook.setTitle("Design Patterns");
        sampleBook.setTotalCopies(5);
        sampleBook.setAvailableCopies(4);
    }

    @Test
    @DisplayName("calculateFine should return 0.0 when returned on the exact due date")
    void testCalculateFine_OnDueDate() {
        LocalDate dueDate = LocalDate.of(2026, 9, 15);
        LocalDate returnDate = LocalDate.of(2026, 9, 15);

        double fine = borrowTransactionService.calculateFine(dueDate, returnDate);
        assertEquals(0.0, fine, 0.001, "Returning on the due date should incur ₹0 fine.");
    }

    @Test
    @DisplayName("calculateFine should return 0.0 when returned before the due date")
    void testCalculateFine_BeforeDueDate() {
        LocalDate dueDate = LocalDate.of(2026, 9, 15);
        LocalDate returnDate = LocalDate.of(2026, 9, 10);

        double fine = borrowTransactionService.calculateFine(dueDate, returnDate);
        assertEquals(0.0, fine, 0.001, "Returning early should incur ₹0 fine.");
    }

    @Test
    @DisplayName("calculateFine should return ₹5.00 for 1 day overdue")
    void testCalculateFine_OneDayOverdue() {
        LocalDate dueDate = LocalDate.of(2026, 9, 15);
        LocalDate returnDate = LocalDate.of(2026, 9, 16);

        double fine = borrowTransactionService.calculateFine(dueDate, returnDate);
        assertEquals(5.0, fine, 0.001, "1 day overdue at ₹5/day must equal ₹5.00.");
    }

    @Test
    @DisplayName("calculateFine should return ₹35.00 for 7 days overdue")
    void testCalculateFine_SevenDaysOverdue() {
        LocalDate dueDate = LocalDate.of(2026, 9, 10);
        LocalDate returnDate = LocalDate.of(2026, 9, 17);

        double fine = borrowTransactionService.calculateFine(dueDate, returnDate);
        assertEquals(35.0, fine, 0.001, "7 days overdue at ₹5/day must equal ₹35.00.");
    }

    @Test
    @DisplayName("calculateFine should return 0.0 when parameters are null")
    void testCalculateFine_NullParameters() {
        assertEquals(0.0, borrowTransactionService.calculateFine(null, LocalDate.now()));
        assertEquals(0.0, borrowTransactionService.calculateFine(LocalDate.now(), null));
    }

    @Test
    @DisplayName("returnBook should compute fine and persist it inside the transaction object")
    void testReturnBook_WithOverdueFine() {
        LocalDate issueDate = LocalDate.of(2026, 8, 1);
        LocalDate dueDate = LocalDate.of(2026, 8, 15);
        LocalDate returnDate = LocalDate.of(2026, 8, 25); // 10 days overdue -> ₹50 fine

        BorrowTransaction tx = new BorrowTransaction(sampleStudent, sampleBook, issueDate, dueDate);
        tx.setId(101L);
        tx.setStatus(BorrowStatus.ISSUED);

        when(borrowTransactionRepository.findById(101L)).thenReturn(Optional.of(tx));
        when(borrowTransactionRepository.save(any(BorrowTransaction.class))).thenAnswer(i -> i.getArgument(0));

        BorrowTransaction result = borrowTransactionService.returnBook(101L, returnDate);

        assertNotNull(result);
        assertEquals(BorrowStatus.RETURNED, result.getStatus());
        assertEquals(returnDate, result.getReturnDate());
        assertEquals(50.0, result.getFineAmount(), 0.001, "Fine must be 10 days × ₹5 = ₹50.00.");
        assertEquals(5, sampleBook.getAvailableCopies(), "Book inventory should be restored from 4 to 5.");

        verify(bookRepository).save(sampleBook);
        verify(borrowTransactionRepository).save(tx);
    }

    @Test
    @DisplayName("returnBook should assign ₹0 fine when returned on time")
    void testReturnBook_OnTime() {
        LocalDate issueDate = LocalDate.of(2026, 9, 1);
        LocalDate dueDate = LocalDate.of(2026, 9, 15);
        LocalDate returnDate = LocalDate.of(2026, 9, 14); // 1 day before due date -> ₹0 fine

        BorrowTransaction tx = new BorrowTransaction(sampleStudent, sampleBook, issueDate, dueDate);
        tx.setId(102L);

        when(borrowTransactionRepository.findById(102L)).thenReturn(Optional.of(tx));
        when(borrowTransactionRepository.save(any(BorrowTransaction.class))).thenAnswer(i -> i.getArgument(0));

        BorrowTransaction result = borrowTransactionService.returnBook(102L, returnDate);

        assertNotNull(result);
        assertEquals(BorrowStatus.RETURNED, result.getStatus());
        assertEquals(0.0, result.getFineAmount(), 0.001, "On-time return must have ₹0.00 fine.");
    }

    @Test
    @DisplayName("returnBook should throw AlreadyReturnedException if already completed")
    void testReturnBook_DuplicateReturnPrevented() {
        BorrowTransaction tx = new BorrowTransaction(sampleStudent, sampleBook, LocalDate.now().minusDays(20));
        tx.setId(103L);
        tx.setStatus(BorrowStatus.RETURNED);
        tx.setReturnDate(LocalDate.now().minusDays(5));

        when(borrowTransactionRepository.findById(103L)).thenReturn(Optional.of(tx));

        assertThrows(AlreadyReturnedException.class, () -> {
            borrowTransactionService.returnBook(103L, LocalDate.now());
        });

        verify(borrowTransactionRepository, never()).save(any());
        verify(bookRepository, never()).save(any());
    }
}
