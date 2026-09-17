package com.bookvault.model;

/**
 * BorrowStatus Enum
 * 
 * OOP Concept: Type Safety & Enumeration
 * - Enforces the lifecycle states of a library transaction:
 *   1. ISSUED: Active loan within due date
 *   2. RETURNED: Completed loan with book safely back in inventory
 *   3. OVERDUE: Loan past the 14-day grace period incurring daily fines
 */
public enum BorrowStatus {
    ISSUED,
    RETURNED,
    OVERDUE
}
