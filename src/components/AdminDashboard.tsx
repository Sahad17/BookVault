import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  BookmarkCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ScrollText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthResponse } from '../types';
import { BooksManagement } from './BooksManagement';
import { IssueReturnManagement } from './IssueReturnManagement';
import { AuditLogs } from './AuditLogs';
import { BookService } from '../utils/bookService';
import { BorrowService } from '../utils/borrowService';

interface AdminDashboardProps {
  adminUser: AuthResponse;
  onLogout: () => void;
}

type TabType = 'dashboard' | 'books' | 'members' | 'borrowings' | 'audit';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [booksCount, setBooksCount] = useState<number>(6);
  const [borrowedBooksCount, setBorrowedBooksCount] = useState<number>(4);
  const [overdueBooksCount, setOverdueBooksCount] = useState<number>(1);

  const refreshCounts = () => {
    BookService.getAllBooks().then((books) => {
      setBooksCount(books.length);
      const borrowed = books.reduce(
        (acc, b) => acc + Math.max(0, b.totalCopies - b.availableCopies),
        0
      );
      setBorrowedBooksCount(borrowed);
    });

    BorrowService.getAllTransactions().then((txs) => {
      const overdue = txs.filter((t) => t.status === 'OVERDUE').length;
      setOverdueBooksCount(overdue);
    });
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'borrowings', label: 'Issue / Return', icon: ArrowLeftRight },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  ];

  const handleTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans antialiased">
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block">
              BookVault
            </span>
            <span className="text-[10px] text-slate-500 font-medium -mt-0.5 block">
              Admin Portal
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-20 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-out md:translate-x-0 h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="p-5 flex-1 flex flex-col min-h-0">
          {/* Logo & System Name */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base tracking-tight leading-none">
                  BookVault
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Admin Dashboard
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              {adminUser.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {adminUser.name || 'Admin'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {adminUser.email}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700 font-mono shrink-0">
              {adminUser.role}
            </span>
          </div>

          <button
            id="admin-logout-button"
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header Welcome Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Welcome back, Admin
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Here is the current status and key metrics for BookVault.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      System Active
                    </span>
                  </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Books */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total Books
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-slate-900">
                        {booksCount}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cataloged titles
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 2: Total Members */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total Members
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-slate-900">
                        348
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Registered students
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 3: Borrowed Books */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setActiveTab('borrowings')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Borrowed Books
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <BookmarkCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-slate-900">
                        {borrowedBooksCount}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Active student loans · Click to view
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 4: Overdue Books */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setActiveTab('borrowings')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Overdue Books
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-slate-900">
                        {overdueBooksCount}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Exceeded return dates · Click to view
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Below the cards: Simple & clean library information section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Library Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Operational schedule and facility parameters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-1">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>Operating Hours</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Monday – Friday: 8:00 AM – 8:00 PM
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Saturday: 9:00 AM – 4:00 PM
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-1">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Circulation Desk</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Central Wing, Floor 1
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Main issue & return counter
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-1">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Security & Roles</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Administrator Access Active
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Student roles restricted to portal
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Books Management View */}
            {activeTab === 'books' && (
              <motion.div
                key="books-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <BooksManagement
                  onBooksCountChange={(count, borrowed) => {
                    setBooksCount(count);
                    setBorrowedBooksCount(borrowed);
                  }}
                />
              </motion.div>
            )}

            {/* Members Placeholder */}
            {activeTab === 'members' && (
              <motion.div
                key="members-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center max-w-xl mx-auto my-12"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Members Directory
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Student member directory, card verification, and account privilege management are prepared for the next development phase.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

            {/* Issue / Return Section */}
            {activeTab === 'borrowings' && (
              <motion.div
                key="issue-return-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <IssueReturnManagement
                  onTransactionsChange={(active, overdue) => {
                    setOverdueBooksCount(overdue);
                    refreshCounts();
                  }}
                />
              </motion.div>
            )}

            {/* Audit Logs Section */}
            {activeTab === 'audit' && (
              <motion.div
                key="audit-logs-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <AuditLogs currentUser={adminUser} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
