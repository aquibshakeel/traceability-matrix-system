package com.pulse.customerservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Customer entity representing a customer in the system.
 * Stored in MongoDB collection 'customers'.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "customers")
public class Customer {

    @Id
    private String id;

    private String firstName;

    private String lastName;

    private Integer age;

    private String address;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}