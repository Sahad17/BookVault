import JSZip from 'jszip';
import { JAVA_AUTH_SOURCES } from '../data/javaSources';

export async function downloadPhase1JavaZip() {
  const zip = new JSZip();

  // Root Maven POM
  zip.file(
    'pom.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
        <relativePath/>
    </parent>
    <groupId>com.bookvault</groupId>
    <artifactId>bookvault</artifactId>
    <version>1.0.0</version>
    <name>bookvault</name>
    <description>BookVault - Library Management System (Phase 1: Authentication)</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  );

  // Application Properties
  zip.file(
    'src/main/resources/application.properties',
    `spring.application.name=bookvault
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/bookvault?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql`
  );

  // Add all Java source files and schema
  for (const item of JAVA_AUTH_SOURCES) {
    if (item.category === 'SQL') {
      zip.file(`src/main/resources/${item.name}`, item.code);
    } else {
      zip.file(`src/main/java/${item.path}`, item.code);
    }
  }

  // Application entry point
  zip.file(
    'src/main/java/com/bookvault/BookVaultApplication.java',
    `package com.bookvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookVaultApplication {
    public static void main(String[] args) {
        SpringApplication.run(BookVaultApplication.class, args);
        System.out.println("BookVault Authentication Service Running on http://localhost:8080");
    }
}`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'bookvault-phase1-auth-backend.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
