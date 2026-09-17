import { BorrowTransaction, BorrowStatus, IssueBookInput, Book } from '../types';
import { AuthService } from './authService';
import { BookService } from './bookService';
import { AuditService } from './auditService';

const BORROWINGS_STORAGE_KEY = 'bookvault_borrowings_v1';

// Format Date as YYYY-MM-DD helper
export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Add days to date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Calculate days difference between two YYYY-MM-DD strings (date2 - date1)
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Default seed transactions demonstrating college library operations
const DEFAULT_TRANSACTIONS: BorrowTransaction[] = [
  {
    id: 101,
    studentId: 4,
    studentName: 'Alex Mercer',
    studentEmail: 'alex.mercer@bookvault.edu',
    bookId: 1,
    bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    bookAuthor: 'Robert C. Martin',
    bookIsbn: '978-0132350884',
    bookCoverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
    issueDate: '2026-08-10',
    dueDate: '2026-08-24',
    returnDate: '2026-08-22',
    status: 'RETURNED',
    fineAmount: 0,
    createdAt: '2026-08-10T09:30:00Z',
    updatedAt: '2026-08-22T14:15:00Z',
  },
  {
    id: 102,
    studentId: 4,
    studentName: 'Alex Mercer',
    studentEmail: 'alex.mercer@bookvault.edu',
    bookId: 3,
    bookTitle: 'Introduction to Algorithms',
    bookAuthor: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
    bookIsbn: '978-0262033848',
    bookCoverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg',
    issueDate: '2026-09-08',
    dueDate: '2026-09-22',
    returnDate: null,
    status: 'ISSUED',
    fineAmount: 0,
    createdAt: '2026-09-08T10:00:00Z',
  },
  {
    id: 103,
    studentId: 5,
    studentName: 'Emily Watson',
    studentEmail: 'emily.watson@bookvault.edu',
    bookId: 4,
    bookTitle: 'The Pragmatic Programmer: Your Journey To Mastery',
    bookAuthor: 'David Thomas, Andrew Hunt',
    bookIsbn: '978-0135957059',
    bookCoverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg',
    issueDate: '2026-08-25',
    dueDate: '2026-09-08',
    returnDate: null,
    status: 'OVERDUE',
    fineAmount: 45, // 9 overdue days * ₹5
    createdAt: '2026-08-25T11:15:00Z',
  },
  {
    id: 104,
    studentId: 6,
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@bookvault.edu',
    bookId: 6,
    bookTitle: 'Artificial Intelligence: A Modern Approach',
    bookAuthor: 'Stuart Russell, Peter Norvig',
    bookIsbn: '978-0136042594',
    bookCoverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780136042594-M.jpg',
    issueDate: '2026-09-12',
    dueDate: '2026-09-26',
    returnDate: null,
    status: 'ISSUED',
    fineAmount: 0,
    createdAt: '2026-09-12T15:20:00Z',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getTransactionsFromStorage(): BorrowTransaction[] {
  try {
    const raw = localStorage.getItem(BORROWINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BORROWINGS_STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    const parsed: BorrowTransaction[] = JSON.parse(raw);

    // Refresh overdue statuses dynamically based on current date
    const todayStr = formatDateYMD(new Date());
    let modified = false;

    const refreshed = parsed.map((t) => {
      if (t.status === 'ISSUED') {
        const overdueDays = daysBetween(t.dueDate, todayStr);
        if (overdueDays > 0) {
          modified = true;
          return {
            ...t,
            status: 'OVERDUE' as BorrowStatus,
            fineAmount: overdueDays * 5,
          };
        }
      }
      return t;
    });

    if (modified) {
      localStorage.setItem(BORROWINGS_STORAGE_KEY, JSON.stringify(refreshed));
    }

    return refreshed;
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

function saveTransactionsToStorage(transactions: BorrowTransaction[]): void {
  try {
    localStorage.setItem(BORROWINGS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to persist borrow transactions to localStorage', err);
  }
}

export const BorrowService = {
  /**
   * Retrieves all borrowing transactions from storage.
   */
  async getAllTransactions(): Promise<BorrowTransaction[]> {
    await delay(150);

    // Attempt backend sync
    try {
      const response = await fetch('/api/borrowings');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          saveTransactionsToStorage(data);
          return data;
        }
      }
    } catch {
      // Offline fallback
    }

    return getTransactionsFromStorage().sort((a, b) => b.id - a.id);
  },

  /**
   * Retrieves a single transaction by ID.
   */
  async getTransactionById(id: number): Promise<BorrowTransaction> {
    await delay(100);

    const transactions = getTransactionsFromStorage();
    const found = transactions.find((t) => t.id === id);
    if (!found) {
      throw new Error(`Transaction with ID #${id} was not found.`);
    }
    return found;
  },

  /**
   * Looks up a student by ID.
   */
  async lookupStudent(studentId: number) {
    if (!studentId || isNaN(studentId)) return null;
    const user = AuthService.getUserById(studentId);
    if (!user) return null;
    return user;
  },

  /**
   * Looks up a book by ID.
   */
  async lookupBook(bookId: number): Promise<Book | null> {
    if (!bookId || isNaN(bookId)) return null;
    try {
      return await BookService.getBookById(bookId);
    } catch {
      return null;
    }
  },

  /**
   * Calculates live overdue days and fine for a transaction due date.
   * Fine Formula: Overdue Days × ₹5
   */
  calculateFine(dueDateStr: string, returnDateStr?: string): { overdueDays: number; fineAmount: number } {
    const returnDate = returnDateStr ? returnDateStr : formatDateYMD(new Date());
    const overdueDays = Math.max(0, daysBetween(dueDateStr, returnDate));
    const fineAmount = overdueDays * 5;
    return { overdueDays, fineAmount };
  },

  /**
   * Issues a book to a student.
   * 
   * Strict Business Logic Rules:
   * 1. Student ID must be valid and exist in system.
   * 2. Book ID must be valid and exist in catalog.
   * 3. Book must have available_copies > 0.
   * 4. Decreases book available_copies by 1.
   * 5. Sets issue_date to today and due_date to today + 14 days.
   * 6. Creates transaction with status 'ISSUED' and fine 0.
   */
  async issueBook(input: IssueBookInput): Promise<BorrowTransaction> {
    await delay(300);

    const { studentId, bookId } = input;

    if (!studentId || isNaN(Number(studentId))) {
      throw new Error('Please provide a valid numeric Student ID.');
    }
    if (!bookId || isNaN(Number(bookId))) {
      throw new Error('Please provide a valid numeric Book ID.');
    }

    // 1. Verify student exists
    const student = AuthService.getUserById(Number(studentId));
    if (!student) {
      throw new Error(`Student with ID #${studentId} does not exist in the system.`);
    }

    // 2. Verify book exists
    let book: Book;
    try {
      book = await BookService.getBookById(Number(bookId));
    } catch {
      throw new Error(`Book with ID #${bookId} was not found in the library catalog.`);
    }

    // 3. Verify available copies
    if (book.availableCopies <= 0) {
      throw new Error(`Cannot issue "${book.title}". There are currently 0 available copies remaining in the library.`);
    }

    // 4. Update book copies in storage
    const allBooks = await BookService.getAllBooks();
    const bookIndex = allBooks.findIndex((b) => b.id === book.id);
    if (bookIndex !== -1) {
      allBooks[bookIndex].availableCopies = Math.max(0, allBooks[bookIndex].availableCopies - 1);
      allBooks[bookIndex].updatedAt = new Date().toISOString();
      try {
        localStorage.setItem('bookvault_books_v1', JSON.stringify(allBooks));
      } catch (e) {
        console.error('Error saving updated book copies', e);
      }
    }

    // 5. Generate dates
    const today = new Date();
    const issueDateStr = formatDateYMD(today);
    const dueDateStr = formatDateYMD(addDays(today, 14)); // Standard 14-day borrowing period

    // 6. Generate new transaction ID
    const transactions = getTransactionsFromStorage();
    const maxId = transactions.reduce((max, t) => Math.max(max, t.id), 100);
    const newId = maxId + 1;

    const newTransaction: BorrowTransaction = {
      id: newId,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookIsbn: book.isbn,
      bookCoverImageUrl: book.coverImageUrl,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'ISSUED',
      fineAmount: 0,
      createdAt: new Date().toISOString(),
    };

    // Attempt backend sync
    try {
      await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          bookId: book.id,
        }),
      });
    } catch {
      // Offline fallback
    }

    transactions.unshift(newTransaction);
    saveTransactionsToStorage(transactions);

    // Automatic Audit Logging on success
    AuditService.recordLog(
      null,
      'BOOK_ISSUED',
      `Issued "${book.title}" to student ${student.name} (ID: ${student.id})`
    );

    return newTransaction;
  },

  /**
   * Processes the return of an issued book.
   * 
   * Strict Business Logic Rules:
   * 1. Transaction must exist.
   * 2. Prevent duplicate returns (cannot return a book that is already marked RETURNED).
   * 3. Increases book available_copies by 1.
   * 4. Calculates overdue days: if returned after due date, fine = overdueDays * ₹5. Else fine = ₹0.
   * 5. Sets return_date to today and status to 'RETURNED'.
   */
  async returnBook(transactionId: number): Promise<BorrowTransaction> {
    await delay(300);

    if (!transactionId || isNaN(Number(transactionId))) {
      throw new Error('Please provide a valid numeric Transaction ID.');
    }

    const transactions = getTransactionsFromStorage();
    const index = transactions.findIndex((t) => t.id === Number(transactionId));
    if (index === -1) {
      throw new Error(`Transaction with ID #${transactionId} does not exist in records.`);
    }

    const transaction = transactions[index];

    // Prevent double return
    if (transaction.status === 'RETURNED' || transaction.returnDate) {
      throw new Error(
        `Transaction #${transaction.id} has already been returned on ${transaction.returnDate}. Duplicate return processing is prevented.`
      );
    }

    // Calculate fine
    const todayStr = formatDateYMD(new Date());
    const { overdueDays, fineAmount } = this.calculateFine(transaction.dueDate, todayStr);

    // Increase available copies on Book
    try {
      const allBooks = await BookService.getAllBooks();
      const bookIndex = allBooks.findIndex((b) => b.id === transaction.bookId);
      if (bookIndex !== -1) {
        allBooks[bookIndex].availableCopies = Math.min(
          allBooks[bookIndex].totalCopies,
          allBooks[bookIndex].availableCopies + 1
        );
        allBooks[bookIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('bookvault_books_v1', JSON.stringify(allBooks));
      }
    } catch (e) {
      console.error('Error incrementing book copies on return', e);
    }

    const updatedTransaction: BorrowTransaction = {
      ...transaction,
      returnDate: todayStr,
      status: 'RETURNED',
      fineAmount,
      updatedAt: new Date().toISOString(),
    };

    // Attempt backend sync
    try {
      await fetch(`/api/borrowings/${transactionId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnDate: todayStr,
        }),
      });
    } catch {
      // Offline fallback
    }

    transactions[index] = updatedTransaction;
    saveTransactionsToStorage(transactions);

    // Automatic Audit Logging on success
    const fineNotice = fineAmount > 0 ? ` (Overdue fine assessed: ₹${fineAmount.toFixed(2)})` : ' (No fine)';
    AuditService.recordLog(
      null,
      'BOOK_RETURNED',
      `Returned "${transaction.bookTitle}" from student ${transaction.studentName} (ID: ${transaction.studentId})${fineNotice}`
    );

    return updatedTransaction;
  },

  /**
   * Searches transactions by student name, student ID, book title, or transaction ID.
   */
  async searchTransactions(query: string): Promise<BorrowTransaction[]> {
    const trimmed = query.trim().toLowerCase();
    const transactions = getTransactionsFromStorage();

    if (!trimmed) {
      return transactions.sort((a, b) => b.id - a.id);
    }

    return transactions
      .filter((t) => {
        const idMatch = t.id.toString().includes(trimmed);
        const studentIdMatch = t.studentId.toString().includes(trimmed);
        const studentNameMatch = t.studentName.toLowerCase().includes(trimmed);
        const bookTitleMatch = t.bookTitle.toLowerCase().includes(trimmed);
        const bookIdMatch = t.bookId.toString().includes(trimmed);
        const statusMatch = t.status.toLowerCase().includes(trimmed);

        return idMatch || studentIdMatch || studentNameMatch || bookTitleMatch || bookIdMatch || statusMatch;
      })
      .sort((a, b) => b.id - a.id);
  },

  /**
   * Resets transactions to seed defaults.
   */
  resetToDefaults(): void {
    localStorage.setItem(BORROWINGS_STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
  },
};
