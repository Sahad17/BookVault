import { Book, BookInput } from '../types';
import { AuditService } from './auditService';

const BOOKS_STORAGE_KEY = 'bookvault_books_v1';

const DEFAULT_COVERS_BY_ISBN: Record<string, string> = {
  '978-0132350884': 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
  '978-0201633610': 'https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg',
  '978-0262033848': 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg',
  '978-0135957059': 'https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg',
  '978-0134685991': 'https://covers.openlibrary.org/b/isbn/9780134685991-M.jpg',
  '978-0136042594': 'https://covers.openlibrary.org/b/isbn/9780136042594-M.jpg',
};

const DEFAULT_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    totalCopies: 5,
    availableCopies: 4,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 2,
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    category: 'Software Engineering',
    publisher: 'Addison-Wesley',
    publicationYear: 1994,
    totalCopies: 4,
    availableCopies: 3,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg',
    createdAt: '2026-09-01T08:30:00Z',
  },
  {
    id: 3,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
    isbn: '978-0262033848',
    category: 'Algorithms',
    publisher: 'MIT Press',
    publicationYear: 2009,
    totalCopies: 6,
    availableCopies: 5,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg',
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 4,
    title: 'The Pragmatic Programmer: Your Journey To Mastery',
    author: 'David Thomas, Andrew Hunt',
    isbn: '978-0135957059',
    category: 'Software Engineering',
    publisher: 'Addison-Wesley',
    publicationYear: 2019,
    totalCopies: 3,
    availableCopies: 2,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 5,
    title: 'Effective Java',
    author: 'Joshua Bloch',
    isbn: '978-0134685991',
    category: 'Programming',
    publisher: 'Addison-Wesley',
    publicationYear: 2018,
    totalCopies: 5,
    availableCopies: 5,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780134685991-M.jpg',
    createdAt: '2026-09-02T11:30:00Z',
  },
  {
    id: 6,
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    isbn: '978-0136042594',
    category: 'Artificial Intelligence',
    publisher: 'Pearson',
    publicationYear: 2020,
    totalCopies: 4,
    availableCopies: 3,
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780136042594-M.jpg',
    createdAt: '2026-09-03T14:00:00Z',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getBooksFromStorage(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
      return DEFAULT_BOOKS;
    }
    const parsed: Book[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
      return DEFAULT_BOOKS;
    }
    // Ensure all books have covers populated if missing
    let updated = false;
    const mapped = parsed.map((b) => {
      if (!b.coverImageUrl && DEFAULT_COVERS_BY_ISBN[b.isbn]) {
        updated = true;
        return { ...b, coverImageUrl: DEFAULT_COVERS_BY_ISBN[b.isbn] };
      }
      return b;
    });
    if (updated) {
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(mapped));
    }
    return mapped;
  } catch {
    return DEFAULT_BOOKS;
  }
}

function saveBooksToStorage(books: Book[]) {
  try {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Failed to persist books to localStorage', err);
  }
}

export const BookService = {
  /**
   * Retrieves all books.
   */
  async getAllBooks(): Promise<Book[]> {
    await delay(250);
    try {
      // Attempt backend API call first
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveBooksToStorage(data);
          return data;
        }
      }
    } catch {
      // Fallback to local storage mirroring
    }
    return getBooksFromStorage();
  },

  /**
   * Retrieves a single book by ID.
   */
  async getBookById(id: number): Promise<Book | null> {
    await delay(150);
    const books = getBooksFromStorage();
    return books.find((b) => b.id === id) || null;
  },

  /**
   * Adds a new book to the library catalog.
   * Rule: available_copies automatically equals total_copies.
   */
  async addBook(input: BookInput): Promise<Book> {
    await delay(350);

    const title = input.title.trim();
    const author = input.author.trim();
    const isbn = input.isbn.trim();
    const category = input.category.trim();
    const publisher = input.publisher.trim();
    const publicationYear = Number(input.publicationYear);
    const totalCopies = Number(input.totalCopies);

    // Validation
    if (!title || !author || !isbn || !category || !publisher) {
      throw new Error('All fields are required. Please fill in all information.');
    }

    if (isNaN(publicationYear) || publicationYear < 1000 || publicationYear > new Date().getFullYear() + 1) {
      throw new Error('Please enter a valid publication year.');
    }

    if (isNaN(totalCopies) || totalCopies <= 0) {
      throw new Error('Total copies must be at least 1.');
    }

    const books = getBooksFromStorage();

    // Check duplicate ISBN
    const duplicate = books.some((b) => b.isbn.toLowerCase() === isbn.toLowerCase());
    if (duplicate) {
      throw new Error(`A book with ISBN '${isbn}' already exists in the catalog.`);
    }

    const cleanIsbnDigits = isbn.replace(/[^0-9X]/gi, '');
    const coverImageUrl =
      input.coverImageUrl && input.coverImageUrl.trim()
        ? input.coverImageUrl.trim()
        : cleanIsbnDigits
        ? `https://covers.openlibrary.org/b/isbn/${cleanIsbnDigits}-M.jpg`
        : undefined;

    const newId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
    const newBook: Book = {
      id: newId,
      title,
      author,
      isbn,
      category,
      publisher,
      publicationYear,
      totalCopies,
      availableCopies: totalCopies, // Available copies initialized to total copies
      coverImageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attempt backend sync
    try {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          isbn,
          category,
          publisher,
          publicationYear,
          totalCopies,
          coverImageUrl,
        }),
      });
    } catch {
      // Offline / client fallback
    }

    books.unshift(newBook);
    saveBooksToStorage(books);

    // Automatic Audit Logging on success
    AuditService.recordLog(
      null,
      'BOOK_ADDED',
      `Added book "${newBook.title}" (ISBN: ${newBook.isbn}, Copies: ${newBook.totalCopies})`
    );

    return newBook;
  },

  /**
   * Updates an existing book.
   * Preserves borrowed copies count logically.
   */
  async updateBook(id: number, input: BookInput): Promise<Book> {
    await delay(350);

    const title = input.title.trim();
    const author = input.author.trim();
    const isbn = input.isbn.trim();
    const category = input.category.trim();
    const publisher = input.publisher.trim();
    const publicationYear = Number(input.publicationYear);
    const totalCopies = Number(input.totalCopies);

    // Validation
    if (!title || !author || !isbn || !category || !publisher) {
      throw new Error('All fields are required. Please fill in all information.');
    }

    if (isNaN(publicationYear) || publicationYear < 1000 || publicationYear > new Date().getFullYear() + 1) {
      throw new Error('Please enter a valid publication year.');
    }

    if (isNaN(totalCopies) || totalCopies <= 0) {
      throw new Error('Total copies must be at least 1.');
    }

    const books = getBooksFromStorage();
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error('Book not found in library catalog.');
    }

    const existingBook = books[index];

    // Check duplicate ISBN excluding self
    const duplicate = books.some(
      (b) => b.id !== id && b.isbn.toLowerCase() === isbn.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Another book with ISBN '${isbn}' already exists in the catalog.`);
    }

    // Calculate borrowed copies
    const currentlyBorrowed = Math.max(0, existingBook.totalCopies - existingBook.availableCopies);

    if (totalCopies < currentlyBorrowed) {
      throw new Error(
        `Total copies cannot be less than currently borrowed copies (${currentlyBorrowed} currently on loan).`
      );
    }

    // Calculate updated available copies logically
    const newAvailableCopies = totalCopies - currentlyBorrowed;

    const cleanIsbnDigits = isbn.replace(/[^0-9X]/gi, '');
    const coverImageUrl =
      input.coverImageUrl !== undefined
        ? input.coverImageUrl.trim()
        : existingBook.coverImageUrl ||
          (cleanIsbnDigits ? `https://covers.openlibrary.org/b/isbn/${cleanIsbnDigits}-M.jpg` : undefined);

    const updatedBook: Book = {
      ...existingBook,
      title,
      author,
      isbn,
      category,
      publisher,
      publicationYear,
      totalCopies,
      availableCopies: newAvailableCopies,
      coverImageUrl,
      updatedAt: new Date().toISOString(),
    };

    // Attempt backend sync
    try {
      await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          isbn,
          category,
          publisher,
          publicationYear,
          totalCopies,
          coverImageUrl,
        }),
      });
    } catch {
      // Offline / client fallback
    }

    books[index] = updatedBook;
    saveBooksToStorage(books);

    // Automatic Audit Logging on success
    AuditService.recordLog(
      null,
      'BOOK_UPDATED',
      `Updated details for book "${updatedBook.title}" (ISBN: ${updatedBook.isbn})`
    );

    return updatedBook;
  },

  /**
   * Deletes a book from the library catalog.
   * If book has active borrowing records (availableCopies < totalCopies), prevent deletion.
   */
  async deleteBook(id: number): Promise<{ success: boolean; message?: string }> {
    await delay(300);

    const books = getBooksFromStorage();
    const targetBook = books.find((b) => b.id === id);
    if (!targetBook) {
      throw new Error('Book not found in catalog.');
    }

    const borrowedCount = Math.max(0, targetBook.totalCopies - targetBook.availableCopies);
    if (borrowedCount > 0) {
      throw new Error(
        `Cannot delete "${targetBook.title}" because ${borrowedCount} ${
          borrowedCount === 1 ? 'copy is' : 'copies are'
        } currently borrowed by members. Please ensure all copies are returned before deleting.`
      );
    }

    // Attempt backend sync
    try {
      await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Offline / client fallback
    }

    const filtered = books.filter((b) => b.id !== id);
    saveBooksToStorage(filtered);

    // Automatic Audit Logging on success
    AuditService.recordLog(
      null,
      'BOOK_DELETED',
      `Removed book "${targetBook.title}" (ISBN: ${targetBook.isbn}) from catalog`
    );

    return { success: true, message: 'Book successfully deleted from library.' };
  },

  /**
   * Searches books by title, author, or ISBN.
   */
  async searchBooks(query: string): Promise<Book[]> {
    const trimmed = query.trim().toLowerCase();
    const books = getBooksFromStorage();
    if (!trimmed) {
      return books;
    }
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(trimmed) ||
        b.author.toLowerCase().includes(trimmed) ||
        b.isbn.toLowerCase().includes(trimmed) ||
        b.category.toLowerCase().includes(trimmed)
    );
  },

  /**
   * Reset books to defaults if needed.
   */
  resetToDefaults(): void {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
  },
};
