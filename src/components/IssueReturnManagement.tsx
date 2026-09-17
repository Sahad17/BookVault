import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  BookMarked,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  X,
  UserCheck,
  AlertTriangle,
  Loader2,
  Calendar,
  IndianRupee,
  BookOpen,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BorrowTransaction, BorrowStatus, IssueBookInput, Book, User } from '../types';
import { BorrowService, formatDateYMD, addDays } from '../utils/borrowService';
import { AuthService } from '../utils/authService';
import { BookService } from '../utils/bookService';

interface IssueReturnManagementProps {
  onTransactionsChange?: (activeCount: number, overdueCount: number) => void;
}

type FilterStatus = 'ALL' | 'ISSUED' | 'OVERDUE' | 'RETURNED';

export const IssueReturnManagement: React.FC<IssueReturnManagementProps> = ({
  onTransactionsChange,
}) => {
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Success & Error Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available students and books for easy dropdown / verification
  const [registeredStudents, setRegisteredStudents] = useState<Omit<User, 'password'>[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);

  // Issue Book Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [issueStudentId, setIssueStudentId] = useState<string>('');
  const [issueBookId, setIssueBookId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Omit<User, 'password'> | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [issueModalError, setIssueModalError] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState<boolean>(false);

  // Return Book Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnTransactionId, setReturnTransactionId] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<BorrowTransaction | null>(null);
  const [returnModalError, setReturnModalError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState<boolean>(false);

  // Load all transactions and auxiliary data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txList, booksList] = await Promise.all([
        BorrowService.getAllTransactions(),
        BookService.getAllBooks(),
      ]);
      setTransactions(txList);
      setAvailableBooks(booksList);
      setRegisteredStudents(AuthService.getAllStudents());

      if (onTransactionsChange) {
        const active = txList.filter((t) => t.status === 'ISSUED').length;
        const overdue = txList.filter((t) => t.status === 'OVERDUE').length;
        onTransactionsChange(active, overdue);
      }
    } catch (err) {
      console.error('Error loading transaction data', err);
      setErrorMessage('Failed to load transaction records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update student preview when issueStudentId changes
  useEffect(() => {
    const num = parseInt(issueStudentId.trim(), 10);
    if (!isNaN(num) && num > 0) {
      const student = AuthService.getUserById(num);
      setSelectedStudent(student);
    } else {
      setSelectedStudent(null);
    }
  }, [issueStudentId]);

  // Update book preview when issueBookId changes
  useEffect(() => {
    const num = parseInt(issueBookId.trim(), 10);
    if (!isNaN(num) && num > 0) {
      const book = availableBooks.find((b) => b.id === num) || null;
      setSelectedBook(book);
    } else {
      setSelectedBook(null);
    }
  }, [issueBookId, availableBooks]);

  // Update transaction preview when returnTransactionId changes
  useEffect(() => {
    const num = parseInt(returnTransactionId.trim(), 10);
    if (!isNaN(num) && num > 0) {
      const tx = transactions.find((t) => t.id === num) || null;
      setSelectedTransaction(tx);
    } else {
      setSelectedTransaction(null);
    }
  }, [returnTransactionId, transactions]);

  // Handle open Issue modal
  const handleOpenIssueModal = () => {
    setIssueStudentId('');
    setIssueBookId('');
    setSelectedStudent(null);
    setSelectedBook(null);
    setIssueModalError(null);
    setIsIssueModalOpen(true);
  };

  // Handle open Return modal (optional prefill transaction)
  const handleOpenReturnModal = (tx?: BorrowTransaction) => {
    if (tx) {
      setReturnTransactionId(tx.id.toString());
      setSelectedTransaction(tx);
    } else {
      setReturnTransactionId('');
      setSelectedTransaction(null);
    }
    setReturnModalError(null);
    setIsReturnModalOpen(true);
  };

  // Submit Issue Book
  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueModalError(null);

    const sId = parseInt(issueStudentId.trim(), 10);
    const bId = parseInt(issueBookId.trim(), 10);

    if (isNaN(sId) || sId <= 0) {
      setIssueModalError('Please enter a valid numeric Student ID.');
      return;
    }
    if (isNaN(bId) || bId <= 0) {
      setIssueModalError('Please enter a valid numeric Book ID.');
      return;
    }
    if (!selectedStudent) {
      setIssueModalError(`Student with ID #${sId} does not exist in the system.`);
      return;
    }
    if (!selectedBook) {
      setIssueModalError(`Book with ID #${bId} was not found in the catalog.`);
      return;
    }
    if (selectedBook.availableCopies <= 0) {
      setIssueModalError(`Cannot issue "${selectedBook.title}". No copies are currently available.`);
      return;
    }

    setIsIssuing(true);
    try {
      const input: IssueBookInput = { studentId: sId, bookId: bId };
      const newTx = await BorrowService.issueBook(input);

      setIsIssueModalOpen(false);
      setSuccessMessage(
        `Book successfully issued to ${newTx.studentName}! Due date: ${newTx.dueDate} (Transaction #${newTx.id})`
      );
      await loadData();
    } catch (err: any) {
      setIssueModalError(err.message || 'Failed to issue book.');
    } finally {
      setIsIssuing(false);
    }
  };

  // Submit Return Book
  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnModalError(null);

    const tId = parseInt(returnTransactionId.trim(), 10);
    if (isNaN(tId) || tId <= 0) {
      setReturnModalError('Please enter a valid Transaction ID.');
      return;
    }
    if (!selectedTransaction) {
      setReturnModalError(`Transaction #${tId} does not exist in the records.`);
      return;
    }
    if (selectedTransaction.status === 'RETURNED' || selectedTransaction.returnDate) {
      setReturnModalError(
        `Transaction #${selectedTransaction.id} has already been returned on ${selectedTransaction.returnDate}. Duplicate return is not allowed.`
      );
      return;
    }

    setIsReturning(true);
    try {
      const returnedTx = await BorrowService.returnBook(tId);
      setIsReturnModalOpen(false);
      setSuccessMessage(
        `Book "${returnedTx.bookTitle}" returned successfully! Fine charged: ₹${returnedTx.fineAmount}.`
      );
      await loadData();
    } catch (err: any) {
      setReturnModalError(err.message || 'Failed to process return.');
    } finally {
      setIsReturning(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.studentId.toString().includes(q) ||
          t.bookTitle.toLowerCase().includes(q) ||
          t.id.toString().includes(q)
      );
    }

    return list;
  }, [transactions, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = transactions.length;
    const issued = transactions.filter((t) => t.status === 'ISSUED').length;
    const overdue = transactions.filter((t) => t.status === 'OVERDUE').length;
    const returned = transactions.filter((t) => t.status === 'RETURNED').length;
    const totalFines = transactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);

    return { total, issued, overdue, returned, totalFines };
  }, [transactions]);

  // Helper to compute return fine preview
  const returnFinePreview = useMemo(() => {
    if (!selectedTransaction) return null;
    const todayStr = formatDateYMD(new Date());
    return BorrowService.calculateFine(selectedTransaction.dueDate, todayStr);
  }, [selectedTransaction]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Action Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Issue / Return
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage book issues and returns for library members.
          </p>
        </div>

        {/* Two Clear Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="issue-book-btn"
            type="button"
            onClick={handleOpenIssueModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <BookMarked className="w-4 h-4" />
            <span>Issue Book</span>
          </button>

          <button
            id="return-book-btn"
            type="button"
            onClick={() => handleOpenReturnModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return Book</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3 text-emerald-900 text-xs sm:text-sm shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-rose-900 text-xs sm:text-sm shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Records
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">All borrowing logs</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">
            {stats.issued}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Books currently with students</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Loans
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            {stats.overdue}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Exceeded 14-day limit</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Fines Accrued
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            ₹{stats.totalFines}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Rate: ₹5 per overdue day</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="transaction-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, ID, book, or transaction..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ISSUED', 'OVERDUE', 'RETURNED'] as FilterStatus[]).map((tab) => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                {tab === 'ISSUED' && ` (${stats.issued})`}
                {tab === 'OVERDUE' && ` (${stats.overdue})`}
                {tab === 'RETURNED' && ` (${stats.returned})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            <p className="text-xs sm:text-sm">Loading transaction records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Transactions Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? `No transactions matched "${searchQuery}". Try adjusting your search query.`
                : 'No borrowing transactions recorded under this filter.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-4">TRX ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Book</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Fine</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isReturned = tx.status === 'RETURNED';
                  const isOverdue = tx.status === 'OVERDUE';
                  const isIssued = tx.status === 'ISSUED';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Transaction ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        #{tx.id}
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {tx.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                            ID #{tx.studentId}
                          </span>
                        </div>
                      </td>

                      {/* Book Info */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate leading-tight" title={tx.bookTitle}>
                          {tx.bookTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tx.bookAuthor} · <span className="font-mono">Book #{tx.bookId}</span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-mono text-xs">
                        {tx.issueDate}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            isOverdue
                              ? 'text-rose-600 font-semibold'
                              : 'text-slate-700'
                          }
                        >
                          {tx.dueDate}
                        </span>
                      </td>

                      {/* Return Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                        {tx.returnDate ? (
                          <span className="text-emerald-700 font-medium">
                            {tx.returnDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isIssued && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            Issued
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Overdue
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Returned
                          </span>
                        )}
                      </td>

                      {/* Fine Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.fineAmount > 0 ? (
                          <span className="font-bold text-rose-600 font-mono">
                            ₹{tx.fineAmount}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">₹0</span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isReturned ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReturnModal(tx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. ISSUE BOOK MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isIssuing && setIsIssueModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      Issue Book to Member
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard loan period: 14 days
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isIssuing && setIsIssueModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConfirmIssue} className="p-6 space-y-5">
                {issueModalError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{issueModalError}</span>
                  </div>
                )}

                {/* Student ID Input */}
                <div>
                  <label
                    htmlFor="issue-student-id"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="issue-student-id"
                      type="number"
                      min="1"
                      value={issueStudentId}
                      onChange={(e) => setIssueStudentId(e.target.value)}
                      placeholder="e.g. 4"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                      required
                    />
                    {/* Quick selector helper */}
                    {registeredStudents.length > 0 && (
                      <select
                        onChange={(e) => setIssueStudentId(e.target.value)}
                        value={issueStudentId}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-[140px] truncate"
                      >
                        <option value="">Quick Select...</option>
                        {registeredStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            #{s.id} {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Student Live Info Box */}
                {selectedStudent ? (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {selectedStudent.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: #{selectedStudent.id} · {selectedStudent.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Verified Member
                    </span>
                  </div>
                ) : issueStudentId ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Student with ID #{issueStudentId} not found in database.</span>
                  </div>
                ) : null}

                {/* Book ID Input */}
                <div>
                  <label
                    htmlFor="issue-book-id"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Book ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="issue-book-id"
                      type="number"
                      min="1"
                      value={issueBookId}
                      onChange={(e) => setIssueBookId(e.target.value)}
                      placeholder="e.g. 1"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                      required
                    />
                    {/* Quick selector helper */}
                    {availableBooks.length > 0 && (
                      <select
                        onChange={(e) => setIssueBookId(e.target.value)}
                        value={issueBookId}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-[150px] truncate"
                      >
                        <option value="">Quick Select...</option>
                        {availableBooks.map((b) => (
                          <option key={b.id} value={b.id}>
                            #{b.id} {b.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Book Live Info Box */}
                {selectedBook ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {selectedBook.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Author: {selectedBook.author}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 font-mono ${
                          selectedBook.availableCopies > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedBook.availableCopies} / {selectedBook.totalCopies} Available
                      </span>
                    </div>

                    {selectedBook.availableCopies <= 0 && (
                      <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No available copies in inventory. Issuing is locked.</span>
                      </div>
                    )}
                  </div>
                ) : issueBookId ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Book with ID #{issueBookId} not found in catalog.</span>
                  </div>
                ) : null}

                {/* Issue Dates Calculation Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-mono text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Issue Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatDateYMD(new Date())}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Calculated Due Date (14 Days)
                    </span>
                    <span className="font-semibold text-indigo-600">
                      {formatDateYMD(addDays(new Date(), 14))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    disabled={isIssuing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-issue-btn"
                    type="submit"
                    disabled={
                      isIssuing ||
                      !selectedStudent ||
                      !selectedBook ||
                      selectedBook.availableCopies <= 0
                    }
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-colors cursor-pointer"
                  >
                    {isIssuing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Issuing Book...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Issue</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 6. RETURN BOOK MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isReturning && setIsReturnModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      Confirm Book Return
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Process returned copies and calculate overdue fines
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isReturning && setIsReturnModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConfirmReturn} className="p-6 space-y-5">
                {returnModalError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{returnModalError}</span>
                  </div>
                )}

                {/* Transaction ID Input */}
                <div>
                  <label
                    htmlFor="return-transaction-id"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Borrowing / Transaction ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="return-transaction-id"
                      type="number"
                      min="1"
                      value={returnTransactionId}
                      onChange={(e) => setReturnTransactionId(e.target.value)}
                      placeholder="e.g. 102"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      required
                    />
                    {/* Active transactions quick select */}
                    <select
                      onChange={(e) => setReturnTransactionId(e.target.value)}
                      value={returnTransactionId}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-[150px] truncate"
                    >
                      <option value="">Active Loans...</option>
                      {transactions
                        .filter((t) => t.status !== 'RETURNED')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            #{t.id} - {t.studentName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Transaction Details Card */}
                {selectedTransaction ? (
                  <div className="space-y-3">
                    {/* Information Grid */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                        <span className="text-xs text-slate-500">Transaction ID</span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          #{selectedTransaction.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                        <span className="text-xs text-slate-500">Student</span>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">
                            {selectedTransaction.studentName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: #{selectedTransaction.studentId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                        <span className="text-xs text-slate-500">Book Title</span>
                        <div className="text-right max-w-[220px]">
                          <span className="text-xs font-bold text-slate-900 truncate block" title={selectedTransaction.bookTitle}>
                            {selectedTransaction.bookTitle}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Book ID: #{selectedTransaction.bookId}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">
                            Issue Date
                          </span>
                          <span className="block font-mono text-slate-700 font-medium">
                            {selectedTransaction.issueDate}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-medium">
                            Due Date
                          </span>
                          <span className="block font-mono text-slate-700 font-medium">
                            {selectedTransaction.dueDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                        <span className="text-xs text-slate-500">Current Status</span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            selectedTransaction.status === 'RETURNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : selectedTransaction.status === 'OVERDUE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>

                    {/* Fine Calculation Box */}
                    {selectedTransaction.status === 'RETURNED' ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>
                          Already returned on {selectedTransaction.returnDate}. Duplicate returns are prohibited.
                        </span>
                      </div>
                    ) : returnFinePreview && (
                      <div
                        className={`p-4 rounded-xl border ${
                          returnFinePreview.overdueDays > 0
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-emerald-50/70 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {returnFinePreview.overdueDays > 0
                                ? 'Overdue Fine Applicable'
                                : 'On-Time Return'}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {returnFinePreview.overdueDays > 0
                                ? `${returnFinePreview.overdueDays} overdue days × ₹5 per day`
                                : 'Returned on or before due date'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold font-mono text-slate-900">
                              ₹{returnFinePreview.fineAmount}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : returnTransactionId ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Transaction #{returnTransactionId} not found.</span>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    disabled={isReturning}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-return-btn"
                    type="submit"
                    disabled={
                      isReturning ||
                      !selectedTransaction ||
                      selectedTransaction.status === 'RETURNED'
                    }
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-colors cursor-pointer"
                  >
                    {isReturning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Return...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Return</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
