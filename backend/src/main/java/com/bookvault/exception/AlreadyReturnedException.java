package com.bookvault.exception;

/**
 * AlreadyReturnedException
 * 
 * Thrown when attempting to return a book on a transaction that has already been completed.
 */
public class AlreadyReturnedException extends RuntimeException {
    public AlreadyReturnedException(String message) {
        super(message);
    }
}
