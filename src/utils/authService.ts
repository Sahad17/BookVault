import { User, RoleType, AuthResponse } from '../types';
import { AuditService } from './auditService';

const USERS_STORAGE_KEY = 'bookvault_users_v1';
const CURRENT_USER_KEY = 'bookvault_current_user_v1';

// Seed users mirroring the MySQL schema.sql
const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Administrator',
    email: 'admin@gmail.com',
    // Stored as a hashed representation ($2a$10$... BCrypt format)
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'ADMIN',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Administrator',
    email: 'sahadsalim234@gmail.com',
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'ADMIN',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 3,
    name: 'Sarah Jenkins',
    email: 'librarian@bookvault.edu',
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'LIBRARIAN',
    createdAt: '2026-09-01T08:30:00Z',
  },
  {
    id: 4,
    name: 'Alex Mercer',
    email: 'alex.mercer@bookvault.edu',
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'STUDENT',
    createdAt: '2026-09-02T10:15:00Z',
  },
  {
    id: 5,
    name: 'Emily Watson',
    email: 'emily.watson@bookvault.edu',
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'STUDENT',
    createdAt: '2026-09-03T11:20:00Z',
  },
  {
    id: 6,
    name: 'Rohan Sharma',
    email: 'rohan.sharma@bookvault.edu',
    password: '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G',
    role: 'STUDENT',
    createdAt: '2026-09-04T09:45:00Z',
  },
];

// Helper to simulate one-way password hashing (BCrypt simulation)
async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + '_bookvault_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `$2a$10$bv${hashHex.substring(0, 30)}`;
}

// Helper to verify password
async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  // Allow default seeded accounts with standard demo passwords
  if (storedHash === '$2a$10$wN9P34H2H8dZ9aTqLdY3quO8C5cZtGv6c3aVd1y3zE3yD4r5e6m7G') {
    const validPredefined = ['admin123', 'Admin123', 'Password@123', 'Admin@123', 'admin', 'password'];
    if (validPredefined.includes(plainText)) {
      return true;
    }
  }
  const computed = await hashPassword(plainText);
  return computed === storedHash;
}

function getUsersFromStorage(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure all predefined default accounts exist
    let modified = false;
    for (const defaultUser of DEFAULT_USERS) {
      if (!parsed.some((u) => u.email.toLowerCase() === defaultUser.email.toLowerCase())) {
        parsed.push(defaultUser);
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveUsersToStorage(users: User[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage', err);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

export const AuthService = {
  /**
   * Registers a new user.
   * STRICT BUSINESS RULES:
   * - Must validate non-empty fields
   * - Must validate email format
   * - Must validate password match
   * - Must validate password min length (6 chars)
   * - Must prevent duplicate email
   * - New users are ALWAYS registered as STUDENT by default.
   */
  async register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    // Simulate realistic network round-trip for authentication API
    await delay(500);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Non-empty check
    if (!trimmedName) {
      throw new Error('Full Name is required.');
    }
    if (!trimmedEmail) {
      throw new Error('Email address is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    if (!confirmPassword) {
      throw new Error('Please confirm your password.');
    }

    // 2. Email format check
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address (e.g. student@college.edu).');
    }

    // 3. Password match check
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match. Please verify and retype.');
    }

    // 4. Password length check
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    // 5. Duplicate email check
    const users = getUsersFromStorage();
    const emailExists = users.some((u) => u.email.toLowerCase() === trimmedEmail);
    if (emailExists) {
      throw new Error(`An account with the email "${trimmedEmail}" already exists.`);
    }

    // 6. Secure password hashing
    const hashedPassword = await hashPassword(password);

    // 7. Domain instantiation (Role is strictly STUDENT for public registration)
    const newUser: User = {
      id: Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      role: 'STUDENT', // Non-negotiable default role
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsersToStorage(users);

    const response: AuthResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      message: 'Account created successfully as Student.',
    };

    // Automatic Audit Logging on success
    AuditService.recordLog(
      response,
      'REGISTER',
      `New student account registered: ${newUser.name} (${newUser.email})`
    );

    return response;
  },

  /**
   * Authenticates an existing user by email and password.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Simulate realistic network round-trip for authentication API
    await delay(500);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      throw new Error('Email address is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    const users = getUsersFromStorage();
    const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!user || !user.password) {
      throw new Error('Invalid email or password. Please try again.');
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password. Please try again.');
    }

    const authResponse: AuthResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Login successful.',
    };

    // Save session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authResponse));

    // Automatic Audit Logging on success
    AuditService.recordLog(
      authResponse,
      'LOGIN',
      `${user.name} (${user.role}) logged into the system`
    );

    return authResponse;
  },

  getCurrentUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      // Automatic Audit Logging on logout
      AuditService.recordLog(
        user,
        'LOGOUT',
        `${user.name} logged out of the system`
      );
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  isEmailRegistered(email: string): boolean {
    const trimmed = email.trim().toLowerCase();
    const users = getUsersFromStorage();
    return users.some((u) => u.email.toLowerCase() === trimmed);
  },

  getAllRegisteredUsers(): Omit<User, 'password'>[] {
    const users = getUsersFromStorage();
    return users.map(({ id, name, email, role, createdAt }) => ({
      id,
      name,
      email,
      role,
      createdAt,
    }));
  },

  getAllStudents(): Omit<User, 'password'>[] {
    const users = getUsersFromStorage();
    return users
      .filter((u) => u.role === 'STUDENT')
      .map(({ id, name, email, role, createdAt }) => ({
        id,
        name,
        email,
        role,
        createdAt,
      }));
  },

  getUserById(id: number): Omit<User, 'password'> | null {
    const users = getUsersFromStorage();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  },

  isAdmin(user?: AuthResponse | User | null): boolean {
    const target = user || this.getCurrentUser();
    if (!target) return false;
    return target.role === 'ADMIN' || target.role === 'LIBRARIAN';
  },

  resetToDefaultSeedUsers(): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};
