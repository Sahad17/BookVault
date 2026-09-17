package com.bookvault.model;

/**
 * Role Enum
 * 
 * OOP Concept: Type Safety & Enumeration
 * - Enforces restricted set of user roles (STUDENT, LIBRARIAN)
 * - Prevents invalid strings and typos in authorization checks
 */
public enum Role {
    STUDENT,
    LIBRARIAN,
    ADMIN
}
