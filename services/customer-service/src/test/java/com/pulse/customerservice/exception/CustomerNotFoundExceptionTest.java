package com.pulse.customerservice.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerNotFoundExceptionTest {

    @Test
    void constructor_ShouldCreateExceptionWithMessage() {
        // Arrange
        String message = "Customer not found with ID: 123";

        // Act
        CustomerNotFoundException exception = new CustomerNotFoundException(message);

        // Assert
        assertThat(exception).isInstanceOf(RuntimeException.class);
        assertThat(exception.getMessage()).isEqualTo(message);
    }

    @Test
    void constructor_ShouldCreateExceptionWithNullMessage() {
        // Act
        CustomerNotFoundException exception = new CustomerNotFoundException(null);

        // Assert
        assertThat(exception.getMessage()).isNull();
    }

    @Test
    void constructor_ShouldCreateExceptionWithEmptyMessage() {
        // Act
        CustomerNotFoundException exception = new CustomerNotFoundException("");

        // Assert
        assertThat(exception.getMessage()).isEmpty();
    }
}
