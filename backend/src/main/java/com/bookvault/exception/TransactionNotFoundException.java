package com.bookvault.exception;

/**
 * TransactionNotFoundException
 * 
 * Thrown when a borrowing transaction ID cannot be located in the database.
 */
public class TransactionNotFoundException extends RuntimeException {
    public TransactionNotFoundException(String message) {
        super(message);
    }
}
