export type RoleType = 'STUDENT' | 'LIBRARIAN' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: RoleType;
  createdAt?: string;
}

export interface AuthResponse {
  id: number;
  name: string;
  email: string;
  role: RoleType;
  message: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publicationYear: number;
  totalCopies: number;
  availableCopies: number;
  coverImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publicationYear: number;
  totalCopies: number;
  coverImageUrl?: string;
}

export type BorrowStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

export interface BorrowTransaction {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail?: string;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn?: string;
  bookCoverImageUrl?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  returnDate?: string | null;
  status: BorrowStatus;
  fineAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueBookInput {
  studentId: number;
  bookId: number;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'BOOK_ADDED'
  | 'BOOK_UPDATED'
  | 'BOOK_DELETED'
  | 'BOOK_ISSUED'
  | 'BOOK_RETURNED';

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: RoleType;
  action: AuditAction | string;
  description: string;
  timestamp: string; // ISO 8601 string
}

export interface JavaSourceFile {
  name: string;
  path: string;
  category: 'Entity' | 'Enum' | 'Repository' | 'Service' | 'Controller' | 'DTO' | 'SQL';
  oopConcept: string;
  description: string;
  code: string;
}
