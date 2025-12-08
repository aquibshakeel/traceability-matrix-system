package com.pulse.customerservice.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void builder_ShouldCreateValidCustomerRequest() {
        // Act
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Assert
        assertThat(request.getFirstName()).isEqualTo("John");
        assertThat(request.getLastName()).isEqualTo("Doe");
        assertThat(request.getAge()).isEqualTo(30);
        assertThat(request.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
    }

    @Test
    void validation_ShouldPass_WhenAllFieldsAreValid() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).isEmpty();
    }

    @Test
    void validation_ShouldFail_WhenFirstNameIsBlank() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).isNotEmpty();
        assertThat(violations.stream()
                .anyMatch(v -> v.getMessage().contains("First name") || v.getMessage().contains("between 2 and 50")))
                .isTrue();
    }

    @Test
    void validation_ShouldFail_WhenFirstNameIsTooShort() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("J")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("between 2 and 50");
    }

    @Test
    void validation_ShouldFail_WhenAgeIsNull() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(null)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Age is required");
    }

    @Test
    void validation_ShouldFail_WhenAgeTooYoung() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(17)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("at least 18");
    }

    @Test
    void validation_ShouldFail_WhenAgeTooOld() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(121)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("less than 120");
    }

    @Test
    void validation_ShouldFail_WhenAddressIsTooShort() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("Short")
                .build();

        // Act
        Set<ConstraintViolation<CustomerRequest>> violations = validator.validate(request);

        // Assert
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("between 10 and 200");
    }

    @Test
    void settersAndGetters_ShouldWorkCorrectly() {
        // Arrange
        CustomerRequest request = new CustomerRequest();

        // Act
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setAge(30);
        request.setAddress("123 Main St, New York, NY 10001");

        // Assert
        assertThat(request.getFirstName()).isEqualTo("John");
        assertThat(request.getLastName()).isEqualTo("Doe");
        assertThat(request.getAge()).isEqualTo(30);
        assertThat(request.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
    }
}
