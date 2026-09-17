import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollText,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  BookOpen,
  ArrowLeftRight,
  LogIn,
  LogOut,
  UserPlus,
  PlusCircle,
  Edit3,
  Trash2,
  Calendar,
  Lock,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditLog, AuditAction, AuthResponse } from '../types';
import { AuditService } from '../utils/auditService';

interface AuditLogsProps {
  currentUser: AuthResponse;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Security Verification: Only ADMIN and LIBRARIAN are permitted to view audit logs
  const isAuthorized =
    currentUser.role === 'ADMIN' || currentUser.role === 'LIBRARIAN';

  const fetchLogs = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const data = await AuditService.getAllLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
      if (showRefreshSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [isAuthorized]);

  // Format date helper: "17 Sep 2026, 10:30 AM"
  const formatDateTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;

      const day = d.getDate();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12

      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  // Filtered logs based on search query and optional action category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction =
        selectedActionFilter === 'ALL' || log.action === selectedActionFilter;

      if (!matchesAction) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim().toLowerCase();
      return (
        log.id.toString().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query) ||
        log.userRole.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        formatDateTime(log.timestamp).toLowerCase().includes(query)
      );
    });
  }, [logs, searchQuery, selectedActionFilter]);

  // Metric counts for summary cards
  const metrics = useMemo(() => {
    const total = logs.length;
    const authEvents = logs.filter((l) =>
      ['LOGIN', 'LOGOUT', 'REGISTER'].includes(l.action)
    ).length;
    const catalogEvents = logs.filter((l) =>
      ['BOOK_ADDED', 'BOOK_UPDATED', 'BOOK_DELETED'].includes(l.action)
    ).length;
    const circulationEvents = logs.filter((l) =>
      ['BOOK_ISSUED', 'BOOK_RETURNED'].includes(l.action)
    ).length;

    return { total, authEvents, catalogEvents, circulationEvents };
  }, [logs]);

  // Action badge visual configuration
  const getActionBadge = (action: AuditAction | string) => {
    switch (action) {
      case 'LOGIN':
        return {
          label: 'LOGIN',
          icon: LogIn,
          className: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dotColor: 'bg-blue-500',
        };
      case 'LOGOUT':
        return {
          label: 'LOGOUT',
          icon: LogOut,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-400',
        };
      case 'REGISTER':
        return {
          label: 'REGISTER',
          icon: UserPlus,
          className: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dotColor: 'bg-purple-500',
        };
      case 'BOOK_ADDED':
        return {
          label: 'BOOK_ADDED',
          icon: PlusCircle,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dotColor: 'bg-emerald-500',
        };
      case 'BOOK_UPDATED':
        return {
          label: 'BOOK_UPDATED',
          icon: Edit3,
          className: 'bg-sky-50 text-sky-700 border-sky-200/80',
          dotColor: 'bg-sky-500',
        };
      case 'BOOK_DELETED':
        return {
          label: 'BOOK_DELETED',
          icon: Trash2,
          className: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dotColor: 'bg-rose-500',
        };
      case 'BOOK_ISSUED':
        return {
          label: 'BOOK_ISSUED',
          icon: ArrowLeftRight,
          className: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dotColor: 'bg-amber-500',
        };
      case 'BOOK_RETURNED':
        return {
          label: 'BOOK_RETURNED',
          icon: ShieldCheck,
          className: 'bg-teal-50 text-teal-700 border-teal-200/80',
          dotColor: 'bg-teal-500',
        };
      default:
        return {
          label: action,
          icon: ScrollText,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-400',
        };
    }
  };

  // Unauthorized student guard
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Audit logs are restricted to authenticated Librarians and System
          Administrators. Student accounts do not have permission to view system
          activity records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Audit Logs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Track important activities and changes made within the library system.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Read-Only Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Read-Only Audit Trail
          </span>

          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh logs"
            aria-label="Refresh audit logs"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logs
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ScrollText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {metrics.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">System actions logged</p>
        </div>

        {/* Authentication Events */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auth Activity
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {metrics.authEvents}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Logins, logouts & signups</p>
        </div>

        {/* Catalog Events */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Book Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {metrics.catalogEvents}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Add, edit & delete events</p>
        </div>

        {/* Circulation Events */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Issue & Return
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {metrics.circulationEvents}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Student circulation actions</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Real-time Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="audit-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by User, Action, or Description..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">
            Action:
          </span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'LOGIN', label: 'Login' },
            { id: 'LOGOUT', label: 'Logout' },
            { id: 'REGISTER', label: 'Register' },
            { id: 'BOOK_ADDED', label: 'Book Added' },
            { id: 'BOOK_UPDATED', label: 'Book Updated' },
            { id: 'BOOK_DELETED', label: 'Book Deleted' },
            { id: 'BOOK_ISSUED', label: 'Issued' },
            { id: 'BOOK_RETURNED', label: 'Returned' },
          ].map((pill) => {
            const isSelected = selectedActionFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedActionFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Activity History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredLogs.length} of {logs.length} logged events
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Automatic system timestamps</span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-16 text-center">
                  Log ID
                </th>
                <th scope="col" className="py-3 px-4 w-44">
                  Date & Time
                </th>
                <th scope="col" className="py-3 px-4 w-52">
                  User
                </th>
                <th scope="col" className="py-3 px-4 w-40">
                  Action
                </th>
                <th scope="col" className="py-3 px-4">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                        <ScrollText className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        No audit records found
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery || selectedActionFilter !== 'ALL'
                          ? 'No entries match your search criteria. Try modifying your filter.'
                          : 'No system activities have been logged yet.'}
                      </p>
                      {(searchQuery || selectedActionFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedActionFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const BadgeIcon = badge.icon;
                  const initialLetter = log.userName
                    ? log.userName.charAt(0).toUpperCase()
                    : 'U';

                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Log ID */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-500 text-xs">
                        #{log.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initialLetter}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {log.userName}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                                  log.userRole === 'ADMIN'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                    : log.userRole === 'LIBRARIAN'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {log.userRole}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {log.userEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}
                          />
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-700 font-normal leading-relaxed">
                        {log.description}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All system audit entries are immutable and created automatically on successful transaction completion.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            College OOP Library System · Audit Trail v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
