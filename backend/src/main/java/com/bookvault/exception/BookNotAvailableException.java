package com.bookvault.exception;

/**
 * BookNotAvailableException
 * 
 * Thrown when attempting to issue a book whose available copies count is 0.
 */
public class BookNotAvailableException extends RuntimeException {
    public BookNotAvailableException(String message) {
        super(message);
    }
}
