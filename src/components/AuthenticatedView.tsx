import React from 'react';
import { BookMarked, LogOut, CheckCircle2, Mail, User } from 'lucide-react';
import { AuthResponse } from '../types';

interface AuthenticatedViewProps {
  user: AuthResponse;
  onLogout: () => void;
  accessDeniedMessage?: string | null;
  onDismissAccessDenied?: () => void;
}

export const AuthenticatedView: React.FC<AuthenticatedViewProps> = ({
  user,
  onLogout,
  accessDeniedMessage,
  onDismissAccessDenied,
}) => {
  const isStudent = user.role === 'STUDENT';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-sm mb-3">
          <BookMarked className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          BookVault
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Library Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-5">
          {/* Access Denied Warning (if redirected from /admin) */}
          {accessDeniedMessage && (
            <div
              id="admin-access-denied-alert"
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <div className="flex-1">
                <span className="font-semibold block">Access Restricted</span>
                <span>{accessDeniedMessage}</span>
              </div>
              {onDismissAccessDenied && (
                <button
                  type="button"
                  onClick={onDismissAccessDenied}
                  className="text-amber-700 hover:text-amber-900 font-bold ml-1 text-sm leading-none"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Welcome Alert */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-emerald-950">
                Successfully Signed In
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Welcome back to your BookVault account.
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{user.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">Account Role</span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                  isStudent
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="pt-2">
            <button
              id="logout-button"
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
