package com.bookvault.exception;

/**
 * UserNotFoundException
 * 
 * Thrown when a user/student cannot be located by ID.
 */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
