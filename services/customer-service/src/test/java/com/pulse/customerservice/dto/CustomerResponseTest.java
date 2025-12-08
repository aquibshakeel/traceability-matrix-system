package com.pulse.customerservice.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerResponseTest {

    @Test
    void builder_ShouldCreateValidCustomerResponse() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();

        // Act
        CustomerResponse response = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Assert
        assertThat(response.getId()).isEqualTo("1");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");
        assertThat(response.getAge()).isEqualTo(30);
        assertThat(response.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
        assertThat(response.getCreatedAt()).isEqualTo(now);
        assertThat(response.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void settersAndGetters_ShouldWorkCorrectly() {
        // Arrange
        CustomerResponse response = new CustomerResponse();
        LocalDateTime now = LocalDateTime.now();

        // Act
        response.setId("1");
        response.setFirstName("John");
        response.setLastName("Doe");
        response.setAge(30);
        response.setAddress("123 Main St, New York, NY 10001");
        response.setCreatedAt(now);
        response.setUpdatedAt(now);

        // Assert
        assertThat(response.getId()).isEqualTo("1");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");
        assertThat(response.getAge()).isEqualTo(30);
        assertThat(response.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
        assertThat(response.getCreatedAt()).isEqualTo(now);
        assertThat(response.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void equals_ShouldReturnTrue_WhenResponsesAreEqual() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        CustomerResponse response1 = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St")
                .createdAt(now)
                .updatedAt(now)
                .build();

        CustomerResponse response2 = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St")
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Act & Assert
        assertThat(response1).isEqualTo(response2);
        assertThat(response1.hashCode()).isEqualTo(response2.hashCode());
    }

    @Test
    void toString_ShouldReturnStringRepresentation() {
        // Arrange
        CustomerResponse response = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .build();

        // Act
        String result = response.toString();

        // Assert
        assertThat(result).contains("John");
        assertThat(result).contains("Doe");
        assertThat(result).contains("30");
    }
}
