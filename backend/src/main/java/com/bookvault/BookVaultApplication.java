package com.bookvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ============================================================================
 * BookVault - Library Management System
 * College OOP Project Entry Point
 * ============================================================================
 * Demonstrates:
 * - Clean Object-Oriented Architecture (Models, Services, Repositories, Controllers)
 * - Spring Boot bootstrapping
 */
@SpringBootApplication
public class BookVaultApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookVaultApplication.class, args);
        System.out.println("==========================================================");
        System.out.println("📚 BookVault Library Management System Started Successfully!");
        System.out.println("🌐 Web UI available at: http://localhost:8080");
        System.out.println("==========================================================");
    }
}
