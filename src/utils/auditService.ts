import { AuditLog, AuditAction, RoleType } from '../types';

const AUDIT_STORAGE_KEY = 'bookvault_audit_logs_v1';

// Initial seed audit logs matching MySQL schema.sql
const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userName: 'Administrator',
    userEmail: 'admin@gmail.com',
    userRole: 'ADMIN',
    action: 'LOGIN',
    description: 'Admin logged into the system',
    timestamp: '2026-09-17T10:30:00Z',
  },
  {
    id: 2,
    userId: 1,
    userName: 'Administrator',
    userEmail: 'admin@gmail.com',
    userRole: 'ADMIN',
    action: 'BOOK_ADDED',
    description: 'Added book "Java Programming" (ISBN: 978-0134685991)',
    timestamp: '2026-09-17T10:35:00Z',
  },
  {
    id: 3,
    userId: 1,
    userName: 'Administrator',
    userEmail: 'admin@gmail.com',
    userRole: 'ADMIN',
    action: 'BOOK_UPDATED',
    description: 'Updated copies for book "Clean Code: A Handbook of Agile Software Craftsmanship"',
    timestamp: '2026-09-17T10:42:00Z',
  },
  {
    id: 4,
    userId: 1,
    userName: 'Administrator',
    userEmail: 'admin@gmail.com',
    userRole: 'ADMIN',
    action: 'BOOK_ISSUED',
    description: 'Issued "Introduction to Algorithms" to student Alex Mercer (ID: 4)',
    timestamp: '2026-09-17T10:50:00Z',
  },
  {
    id: 5,
    userId: 1,
    userName: 'Administrator',
    userEmail: 'admin@gmail.com',
    userRole: 'ADMIN',
    action: 'BOOK_RETURNED',
    description: 'Returned "Clean Code: A Handbook of Agile Software Craftsmanship" from student Alex Mercer (ID: 4)',
    timestamp: '2026-09-17T11:15:00Z',
  },
];

function getStoredLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return [...DEFAULT_AUDIT_LOGS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_AUDIT_LOGS];
  }
}

function saveStoredLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to persist audit log:', error);
  }
}

export const AuditService = {
  /**
   * Retrieves all audit logs, sorted chronologically descending (newest first).
   * Supports optional client or server-side filtering.
   */
  async getAllLogs(searchQuery?: string): Promise<AuditLog[]> {
    // Try backend REST endpoint first if available
    try {
      const url = searchQuery && searchQuery.trim()
        ? `/api/audit-logs?search=${encodeURIComponent(searchQuery.trim())}`
        : '/api/audit-logs';
      const res = await fetch(url, {
        headers: {
          'X-User-Role': 'ADMIN',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend not running; fallback to local storage
    }

    const logs = getStoredLogs();

    // Sort descending by timestamp / id
    const sorted = [...logs].sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return timeDiff !== 0 ? timeDiff : b.id - a.id;
    });

    if (!searchQuery || !searchQuery.trim()) {
      return sorted;
    }

    const term = searchQuery.trim().toLowerCase();
    return sorted.filter((log) => {
      return (
        log.id.toString().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.userEmail.toLowerCase().includes(term) ||
        log.userRole.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term)
      );
    });
  },

  /**
   * Automatically records a successful system event in the audit trail.
   * Guaranteed to be non-disruptive: never throws an error that interrupts primary flows.
   */
  async recordLog(
    user: { id?: number; name?: string; email?: string; role?: RoleType } | null,
    action: AuditAction | string,
    description: string
  ): Promise<AuditLog | null> {
    try {
      const logs = getStoredLogs();
      const nextId = logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1;

      const newLog: AuditLog = {
        id: nextId,
        userId: user?.id || 1,
        userName: user?.name || 'Administrator',
        userEmail: user?.email || 'admin@bookvault.edu',
        userRole: user?.role || 'ADMIN',
        action,
        description,
        timestamp: new Date().toISOString(),
      };

      // Unshift to maintain newest first in local state
      logs.unshift(newLog);
      saveStoredLogs(logs);

      // Also fire background non-blocking notification to backend if available
      try {
        fetch('/api/audit-logs/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog),
        }).catch(() => {});
      } catch {
        // Ignore network failure
      }

      return newLog;
    } catch (err) {
      console.warn('Audit logging failed silently:', err);
      return null;
    }
  },
};
