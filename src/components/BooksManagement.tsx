import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bookmark,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, BookInput } from '../types';
import { BookService } from '../utils/bookService';
import { BookCard } from './BookCard';
import { BookCover } from './BookCover';

interface BooksManagementProps {
  onBooksCountChange?: (count: number, borrowedCount: number) => void;
}

type ViewMode = 'cards' | 'table';
type AvailabilityFilter = 'all' | 'available' | 'checked-out';

const INITIAL_FORM_STATE: BookInput = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  publisher: '',
  publicationYear: new Date().getFullYear(),
  totalCopies: 1,
  coverImageUrl: '',
};

export const BooksManagement: React.FC<BooksManagementProps> = ({
  onBooksCountChange,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookInput>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation State
  const [deleteBookTarget, setDeleteBookTarget] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Success Notification State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load books from service
  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await BookService.getAllBooks();
      setBooks(data);
      if (onBooksCountChange) {
        const borrowed = data.reduce(
          (acc, b) => acc + Math.max(0, b.totalCopies - b.availableCopies),
          0
        );
        onBooksCountChange(data.length, borrowed);
      }
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Filtered books based on Search Query & Availability Filter
  const filteredBooks = useMemo(() => {
    let result = books;

    if (availabilityFilter === 'available') {
      result = result.filter((b) => b.availableCopies > 0);
    } else if (availabilityFilter === 'checked-out') {
      result = result.filter((b) => b.availableCopies === 0);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return result;

    return result.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
    );
  }, [books, searchQuery, availabilityFilter]);

  // Total available and checked-out stats
  const stats = useMemo(() => {
    const availableCount = books.filter((b) => b.availableCopies > 0).length;
    const checkedOutCount = books.filter((b) => b.availableCopies === 0).length;
    return {
      total: books.length,
      available: availableCount,
      checkedOut: checkedOutCount,
    };
  }, [books]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      publicationYear: book.publicationYear,
      totalCopies: book.totalCopies,
      coverImageUrl: book.coverImageUrl || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Close Form Modal
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingBook(null);
    setFormError(null);
  };

  // Save Book (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingBook) {
        // Edit existing book
        const updated = await BookService.updateBook(editingBook.id, formData);
        setBooks((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
        showSuccess(`Book "${updated.title}" successfully updated.`);
      } else {
        // Add new book
        const created = await BookService.addBook(formData);
        setBooks((prev) => [created, ...prev]);
        showSuccess(`Book "${created.title}" successfully added to library.`);
      }

      setIsModalOpen(false);
      setEditingBook(null);

      // Trigger counter update
      const updatedList = await BookService.getAllBooks();
      if (onBooksCountChange) {
        const borrowed = updatedList.reduce(
          (acc, b) => acc + Math.max(0, b.totalCopies - b.availableCopies),
          0
        );
        onBooksCountChange(updatedList.length, borrowed);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred while saving the book.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteConfirm = (book: Book) => {
    setDeleteBookTarget(book);
    setDeleteError(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteBookTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await BookService.deleteBook(deleteBookTarget.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteBookTarget.id));
      showSuccess(`Book "${deleteBookTarget.title}" deleted.`);
      setDeleteBookTarget(null);

      // Trigger counter update
      const updatedList = await BookService.getAllBooks();
      if (onBooksCountChange) {
        const borrowed = updatedList.reduce(
          (acc, b) => acc + Math.max(0, b.totalCopies - b.availableCopies),
          0
        );
        onBooksCountChange(updatedList.length, borrowed);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('An unexpected error occurred while deleting the book.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Books
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage the books and check availability status across your library.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle (Cards vs Table) */}
          <div
            id="view-mode-toggle"
            className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200"
          >
            <button
              id="view-mode-cards"
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              id="view-mode-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Simple Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="books-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Book Button */}
          <button
            id="add-book-button"
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Availability Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          id="filter-all-books"
          type="button"
          onClick={() => setAvailabilityFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            availabilityFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Books ({stats.total})
        </button>
        <button
          id="filter-available-books"
          type="button"
          onClick={() => setAvailabilityFilter('available')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            availabilityFilter === 'available'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Available ({stats.available})</span>
        </button>
        <button
          id="filter-checked-out-books"
          type="button"
          onClick={() => setAvailabilityFilter('checked-out')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            availabilityFilter === 'checked-out'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Checked Out ({stats.checkedOut})</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs sm:text-sm text-emerald-800"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold p-1 leading-none cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area: Loading / Empty / Cards Grid / Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-400 shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin mb-2.5 text-indigo-600" />
          <span className="text-xs font-medium text-slate-600">
            Loading library books...
          </span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            {searchQuery || availabilityFilter !== 'all'
              ? 'No books match your criteria'
              : 'No books in library'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No titles, authors, or ISBNs match "${searchQuery}".`
              : availabilityFilter !== 'all'
              ? `No books currently classified as ${
                  availabilityFilter === 'available'
                    ? 'Available'
                    : 'Checked Out'
                }.`
              : 'Get started by clicking the "Add Book" button above.'}
          </p>
          {(searchQuery || availabilityFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAvailabilityFilter('all');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ))}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16">ID</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Book & Cover</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Author</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Category</th>
                  <th className="py-3.5 px-4 min-w-[120px]">ISBN</th>
                  <th className="py-3.5 px-4 text-center w-28">Total</th>
                  <th className="py-3.5 px-4 text-center min-w-[160px]">
                    Availability Status
                  </th>
                  <th className="py-3.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        #{book.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          {/* Book Cover Thumbnail */}
                          <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                            <BookCover
                              title={book.title}
                              coverUrl={book.coverImageUrl}
                              isbn={book.isbn}
                              category={book.category}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {book.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                              {book.publisher} ({book.publicationYear})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {book.author}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {book.isbn}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                        {book.totalCopies}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {/* Table 'Availability' Status Badge */}
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {isAvailable ? 'Available' : 'Checked Out'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {book.availableCopies} of {book.totalCopies} copies
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            id={`edit-table-book-${book.id}`}
                            type="button"
                            onClick={() => handleOpenEditModal(book)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Book"
                            aria-label={`Edit ${book.title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-table-book-${book.id}`}
                            type="button"
                            onClick={() => handleOpenDeleteConfirm(book)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Book"
                            aria-label={`Delete ${book.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT BOOK MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBook ? 'Edit Book' : 'Add New Book'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleFormSubmit}
                className="p-5 space-y-4 overflow-y-auto flex-1"
              >
                {/* Error Banner */}
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Book Title */}
                <div>
                  <label
                    htmlFor="book-title"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="book-title"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Clean Code"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Author & ISBN (Two Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-author"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Author <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-author"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      placeholder="e.g. Robert C. Martin"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="book-isbn"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      ISBN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-isbn"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                      placeholder="e.g. 978-0132350884"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60 font-mono"
                    />
                  </div>
                </div>

                {/* Category & Publisher (Two Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-category"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-category"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="book-publisher"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Publisher <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-publisher"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.publisher}
                      onChange={(e) =>
                        setFormData({ ...formData, publisher: e.target.value })
                      }
                      placeholder="e.g. Prentice Hall"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Publication Year & Total Copies (Two Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-year"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Publication Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-year"
                      type="number"
                      required
                      min={1000}
                      max={new Date().getFullYear() + 1}
                      disabled={isSubmitting}
                      value={formData.publicationYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publicationYear: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="book-total-copies"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Total Copies <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="book-total-copies"
                      type="number"
                      required
                      min={1}
                      disabled={isSubmitting}
                      value={formData.totalCopies}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalCopies: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {editingBook
                        ? `Currently ${Math.max(
                            0,
                            editingBook.totalCopies - editingBook.availableCopies
                          )} copy on loan`
                        : 'Available copies will automatically match total copies'}
                    </span>
                  </div>
                </div>

                {/* Cover Image Section */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="book-cover-url"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Book Cover Image <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    {formData.isbn && (
                      <button
                        type="button"
                        onClick={() => {
                          const clean = formData.isbn.replace(/[^0-9X]/gi, '');
                          if (clean) {
                            setFormData({
                              ...formData,
                              coverImageUrl: `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`,
                            });
                          }
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Fetch from ISBN</span>
                      </button>
                    )}
                  </div>

                  {/* Clean spacious layout with proper book cover preview */}
                  <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Dedicated Book Cover Preview */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-20 h-28 sm:w-22 sm:h-32 rounded-xl border border-slate-300/80 overflow-hidden bg-white shadow-sm shrink-0 flex items-center justify-center">
                        <BookCover
                          title={formData.title || 'Cover Preview'}
                          coverUrl={formData.coverImageUrl}
                          isbn={formData.isbn}
                          category={formData.category}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {formData.coverImageUrl ? 'Live Preview' : 'Default Cover'}
                      </span>
                    </div>

                    {/* URL Input & Helper text */}
                    <div className="flex-1 w-full space-y-2 min-w-0 pt-0.5">
                      <div>
                        <input
                          id="book-cover-url"
                          type="url"
                          disabled={isSubmitting}
                          value={formData.coverImageUrl || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              coverImageUrl: e.target.value,
                            })
                          }
                          placeholder="Paste image URL (e.g., https://...)"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-60"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cover updates automatically</span>
                        {formData.coverImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, coverImageUrl: '' })
                            }
                            className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer hover:underline"
                          >
                            Remove custom URL
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Tip: Provide a direct image URL or click "Fetch from ISBN" above to load verified artwork.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="book-form-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingBook ? 'Save Changes' : 'Add Book'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteBookTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteBookTarget(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Book
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete this book?
                </p>
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-semibold text-slate-900 truncate">
                    {deleteBookTarget.title}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    by {deleteBookTarget.author} &bull; ISBN:{' '}
                    {deleteBookTarget.isbn}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteBookTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-book-button"
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
