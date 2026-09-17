import React, { useState, useEffect, useCallback } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AuthenticatedView } from './components/AuthenticatedView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthService } from './utils/authService';
import { AuthResponse } from './types';

type ViewType = 'login' | 'register' | 'student' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthResponse | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Synchronize view state with URL hash and authenticate access rights
  const syncRouteWithState = useCallback((user: AuthResponse | null) => {
    const hash = window.location.hash;

    if (hash === '#/admin') {
      if (!user) {
        // Not logged in: Redirect to login
        window.location.hash = '#/login';
        setCurrentView('login');
      } else if (!AuthService.isAdmin(user)) {
        // Logged in as student: Deny access and redirect to student portal
        window.location.hash = '#/student';
        setCurrentView('student');
        setAccessDeniedMessage('Access Denied: Student accounts are not authorized to access the Admin Dashboard.');
      } else {
        // Logged in as admin or librarian: Grant access
        setCurrentView('admin');
      }
    } else if (hash === '#/student') {
      if (!user) {
        window.location.hash = '#/login';
        setCurrentView('login');
      } else {
        setCurrentView('student');
      }
    } else if (hash === '#/register') {
      setCurrentView('register');
    } else {
      // Default / Login
      if (user) {
        if (AuthService.isAdmin(user)) {
          window.location.hash = '#/admin';
          setCurrentView('admin');
        } else {
          window.location.hash = '#/student';
          setCurrentView('student');
        }
      } else {
        setCurrentView('login');
      }
    }
  }, []);

  useEffect(() => {
    const existing = AuthService.getCurrentUser();
    setAuthenticatedUser(existing);
    syncRouteWithState(existing);

    const handleHashChange = () => {
      const current = AuthService.getCurrentUser();
      syncRouteWithState(current);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [syncRouteWithState]);

  const handleLoginSuccess = (user: AuthResponse) => {
    setAuthenticatedUser(user);
    setAccessDeniedMessage(null);
    if (AuthService.isAdmin(user)) {
      window.location.hash = '#/admin';
      setCurrentView('admin');
    } else {
      window.location.hash = '#/student';
      setCurrentView('student');
    }
  };

  const handleRegisterSuccess = (user: AuthResponse) => {
    setAuthenticatedUser(user);
    setAccessDeniedMessage(null);
    window.location.hash = '#/student';
    setCurrentView('student');
  };

  const handleLogout = () => {
    AuthService.logout();
    setAuthenticatedUser(null);
    setAccessDeniedMessage(null);
    window.location.hash = '#/login';
    setCurrentView('login');
  };

  const navigateToRegister = () => {
    window.location.hash = '#/register';
    setCurrentView('register');
  };

  const navigateToLogin = () => {
    window.location.hash = '#/login';
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <main>
        {currentView === 'login' && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onNavigateToRegister={navigateToRegister}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onSuccess={handleRegisterSuccess}
            onNavigateToLogin={navigateToLogin}
          />
        )}

        {currentView === 'student' && authenticatedUser && (
          <AuthenticatedView
            user={authenticatedUser}
            onLogout={handleLogout}
            accessDeniedMessage={accessDeniedMessage}
            onDismissAccessDenied={() => setAccessDeniedMessage(null)}
          />
        )}

        {currentView === 'admin' && authenticatedUser && AuthService.isAdmin(authenticatedUser) && (
          <AdminDashboard
            adminUser={authenticatedUser}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
