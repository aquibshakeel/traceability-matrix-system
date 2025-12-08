package com.pulse.customerservice.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerTest {

    @Test
    void builder_ShouldCreateCustomerWithAllFields() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();

        // Act
        Customer customer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Assert
        assertThat(customer.getId()).isEqualTo("1");
        assertThat(customer.getFirstName()).isEqualTo("John");
        assertThat(customer.getLastName()).isEqualTo("Doe");
        assertThat(customer.getAge()).isEqualTo(30);
        assertThat(customer.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
        assertThat(customer.getCreatedAt()).isEqualTo(now);
        assertThat(customer.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void settersAndGetters_ShouldWorkCorrectly() {
        // Arrange
        Customer customer = new Customer();
        LocalDateTime now = LocalDateTime.now();

        // Act
        customer.setId("1");
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setAge(30);
        customer.setAddress("123 Main St");
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);

        // Assert
        assertThat(customer.getId()).isEqualTo("1");
        assertThat(customer.getFirstName()).isEqualTo("John");
        assertThat(customer.getLastName()).isEqualTo("Doe");
        assertThat(customer.getAge()).isEqualTo(30);
        assertThat(customer.getAddress()).isEqualTo("123 Main St");
        assertThat(customer.getCreatedAt()).isEqualTo(now);
        assertThat(customer.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void equals_ShouldReturnTrue_WhenCustomersAreEqual() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        Customer customer1 = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Customer customer2 = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St")
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Act & Assert
        assertThat(customer1).isEqualTo(customer2);
        assertThat(customer1.hashCode()).isEqualTo(customer2.hashCode());
    }

    @Test
    void toString_ShouldReturnStringRepresentation() {
        // Arrange
        Customer customer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .build();

        // Act
        String result = customer.toString();

        // Assert
        assertThat(result).contains("John");
        assertThat(result).contains("Doe");
        assertThat(result).contains("30");
    }
}
