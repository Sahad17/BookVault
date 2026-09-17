-- ============================================================================
-- BookVault - Database Schema (MySQL)
-- Phase 1: Authentication (Users Table)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bookvault;
USE bookvault;

-- Drop existing users table if resetting
DROP TABLE IF EXISTS users;

-- 1. USERS TABLE
-- Encapsulates user identity, credentials, and role (STUDENT by default)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast authentication lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- SEED DATA (Pre-configured for Testing & Demonstration)
-- Passwords hashed with BCrypt:
-- 'Password@123' -> $2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G
-- ============================================================================

-- Predefined Administrator Account
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@gmail.com', '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G', 'ADMIN');

-- Librarian Account (Admin credentials handled separately from public registration)
INSERT INTO users (name, email, password, role) VALUES 
('Sarah Jenkins', 'librarian@bookvault.edu', '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G', 'LIBRARIAN');

-- Sample Student Account
INSERT INTO users (name, email, password, role) VALUES 
('Alex Mercer', 'alex.mercer@bookvault.edu', '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G', 'STUDENT');

-- ============================================================================
-- Phase 2: Books Management (Books Table)
-- ============================================================================

-- Drop existing books table if resetting
DROP TABLE IF EXISTS books;

-- 2. BOOKS TABLE
-- Represents cataloged library books with inventory tracking
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150) NOT NULL,
    isbn VARCHAR(30) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    publisher VARCHAR(150) NOT NULL,
    publication_year INT NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_total_copies CHECK (total_copies > 0),
    CONSTRAINT chk_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Indexes for fast searching on title, author, and category
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_category ON books(category);

-- ============================================================================
-- SEED DATA (Books Inventory)
-- ============================================================================
INSERT INTO books (title, author, isbn, category, publisher, publication_year, total_copies, available_copies, cover_image_url) VALUES
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '978-0132350884', 'Computer Science', 'Prentice Hall', 2008, 5, 4, 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg'),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '978-0201633610', 'Software Engineering', 'Addison-Wesley', 1994, 4, 3, 'https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg'),
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest', '978-0262033848', 'Algorithms', 'MIT Press', 2009, 6, 5, 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg'),
('The Pragmatic Programmer: Your Journey To Mastery', 'David Thomas, Andrew Hunt', '978-0135957059', 'Software Engineering', 'Addison-Wesley', 2019, 3, 2, 'https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg'),
('Effective Java', 'Joshua Bloch', '978-0134685991', 'Programming', 'Addison-Wesley', 2018, 5, 5, 'https://covers.openlibrary.org/b/isbn/9780134685991-M.jpg'),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', '978-0136042594', 'Artificial Intelligence', 'Pearson', 2020, 4, 3, 'https://covers.openlibrary.org/b/isbn/9780136042594-M.jpg');

-- ============================================================================
-- Phase 3: Issue & Return (Borrowing Transactions Table)
-- ============================================================================

-- Drop existing borrow_transactions table if resetting
DROP TABLE IF EXISTS borrow_transactions;

-- 3. BORROW_TRANSACTIONS TABLE
-- Encapsulates borrowing events, loan due dates, return confirmations, and overdue fines
CREATE TABLE borrow_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    CONSTRAINT chk_borrow_status CHECK (status IN ('ISSUED', 'RETURNED', 'OVERDUE'))
);

-- Indexes for performance on member lookups, book lookups, and status filtering
CREATE INDEX idx_borrow_student ON borrow_transactions(student_id);
CREATE INDEX idx_borrow_book ON borrow_transactions(book_id);
CREATE INDEX idx_borrow_status ON borrow_transactions(status);

-- ============================================================================
-- SEED DATA (Borrowing Transactions)
-- ============================================================================
INSERT INTO borrow_transactions (id, student_id, book_id, issue_date, due_date, return_date, status, fine_amount) VALUES
(101, 4, 1, '2026-08-10', '2026-08-24', '2026-08-22', 'RETURNED', 0.00),
(102, 4, 3, '2026-09-08', '2026-09-22', NULL, 'ISSUED', 0.00),
(103, 4, 4, '2026-08-25', '2026-09-08', NULL, 'OVERDUE', 45.00),
(104, 4, 6, '2026-09-12', '2026-09-26', NULL, 'ISSUED', 0.00);

-- ============================================================================
-- Phase 4: Audit Logging (Audit Logs Table)
-- ============================================================================

-- Drop existing audit_logs table if resetting
DROP TABLE IF EXISTS audit_logs;

-- 4. AUDIT_LOGS TABLE
-- Encapsulates system audit events performed by authenticated users
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for performance on user lookups, chronological sorting, and action filters
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================================
-- SEED DATA (Audit Logs)
-- ============================================================================
INSERT INTO audit_logs (id, user_id, action, description, timestamp) VALUES
(1, 1, 'LOGIN', 'Admin logged into the system', '2026-09-17 10:30:00'),
(2, 1, 'BOOK_ADDED', 'Added book "Java Programming" (ISBN: 978-0134685991)', '2026-09-17 10:35:00'),
(3, 1, 'BOOK_UPDATED', 'Updated copies for book "Clean Code: A Handbook of Agile Software Craftsmanship"', '2026-09-17 10:42:00'),
(4, 1, 'BOOK_ISSUED', 'Issued "Introduction to Algorithms" to student Alex Mercer (ID: 4)', '2026-09-17 10:50:00'),
(5, 1, 'BOOK_RETURNED', 'Returned "Clean Code: A Handbook of Agile Software Craftsmanship" from student Alex Mercer (ID: 4)', '2026-09-17 11:15:00');


