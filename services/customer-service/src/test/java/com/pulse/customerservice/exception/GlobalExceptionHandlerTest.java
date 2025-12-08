package com.pulse.customerservice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Arrays;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleCustomerNotFoundException_ShouldReturnNotFoundResponse() {
        // Arrange
        CustomerNotFoundException exception = new CustomerNotFoundException("Customer not found with ID: 123");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                exceptionHandler.handleCustomerNotFoundException(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getError()).isEqualTo("Not Found");
        assertThat(response.getBody().getMessage()).isEqualTo("Customer not found with ID: 123");
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void handleValidationExceptions_ShouldReturnBadRequestWithValidationErrors() {
        // Arrange
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        
        FieldError fieldError1 = new FieldError("customerRequest", "firstName", "First name is required");
        FieldError fieldError2 = new FieldError("customerRequest", "age", "Age must be at least 18");
        
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(Arrays.asList(fieldError1, fieldError2));

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                exceptionHandler.handleValidationExceptions(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getError()).isEqualTo("Validation Failed");
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid input data");
        assertThat(response.getBody().getValidationErrors()).isNotNull();
        assertThat(response.getBody().getValidationErrors()).hasSize(2);
        assertThat(response.getBody().getValidationErrors().get("firstName")).isEqualTo("First name is required");
        assertThat(response.getBody().getValidationErrors().get("age")).isEqualTo("Age must be at least 18");
    }

    @Test
    void handleGenericException_ShouldReturnInternalServerErrorResponse() {
        // Arrange
        Exception exception = new RuntimeException("Unexpected error");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                exceptionHandler.handleGenericException(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(500);
        assertThat(response.getBody().getError()).isEqualTo("Internal Server Error");
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void errorResponse_ShouldBuildCorrectly() {
        // Act
        GlobalExceptionHandler.ErrorResponse errorResponse = GlobalExceptionHandler.ErrorResponse.builder()
                .status(404)
                .error("Test Error")
                .message("Test message")
                .validationErrors(Map.of("field", "error"))
                .build();

        // Assert
        assertThat(errorResponse.getStatus()).isEqualTo(404);
        assertThat(errorResponse.getError()).isEqualTo("Test Error");
        assertThat(errorResponse.getMessage()).isEqualTo("Test message");
        assertThat(errorResponse.getValidationErrors()).containsEntry("field", "error");
    }

    @Test
    void errorResponse_SettersAndGetters_ShouldWork() {
        // Arrange
        GlobalExceptionHandler.ErrorResponse errorResponse = new GlobalExceptionHandler.ErrorResponse();
        Map<String, String> validationErrors = Map.of("field1", "error1");

        // Act
        errorResponse.setStatus(400);
        errorResponse.setError("Bad Request");
        errorResponse.setMessage("Invalid input");
        errorResponse.setValidationErrors(validationErrors);
        errorResponse.setTimestamp(java.time.LocalDateTime.now());

        // Assert
        assertThat(errorResponse.getStatus()).isEqualTo(400);
        assertThat(errorResponse.getError()).isEqualTo("Bad Request");
        assertThat(errorResponse.getMessage()).isEqualTo("Invalid input");
        assertThat(errorResponse.getValidationErrors()).isEqualTo(validationErrors);
        assertThat(errorResponse.getTimestamp()).isNotNull();
    }

    @Test
    void errorResponse_ToString_ShouldContainFields() {
        // Arrange
        GlobalExceptionHandler.ErrorResponse errorResponse = GlobalExceptionHandler.ErrorResponse.builder()
                .status(404)
                .error("Not Found")
                .message("Resource not found")
                .build();

        // Act
        String result = errorResponse.toString();

        // Assert
        assertThat(result).contains("404");
        assertThat(result).contains("Not Found");
        assertThat(result).contains("Resource not found");
    }

    @Test
    void errorResponse_Equals_ShouldWork() {
        // Arrange
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        GlobalExceptionHandler.ErrorResponse errorResponse1 = GlobalExceptionHandler.ErrorResponse.builder()
                .timestamp(now)
                .status(404)
                .error("Not Found")
                .message("Resource not found")
                .build();

        GlobalExceptionHandler.ErrorResponse errorResponse2 = GlobalExceptionHandler.ErrorResponse.builder()
                .timestamp(now)
                .status(404)
                .error("Not Found")
                .message("Resource not found")
                .build();

        // Assert
        assertThat(errorResponse1).isEqualTo(errorResponse2);
        assertThat(errorResponse1.hashCode()).isEqualTo(errorResponse2.hashCode());
    }

    @Test
    void errorResponse_AllArgsConstructor_ShouldWork() {
        // Arrange
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        Map<String, String> validationErrors = Map.of("field", "error");

        // Act
        GlobalExceptionHandler.ErrorResponse errorResponse = new GlobalExceptionHandler.ErrorResponse(
                now, 400, "Bad Request", "Invalid input", validationErrors);

        // Assert
        assertThat(errorResponse.getTimestamp()).isEqualTo(now);
        assertThat(errorResponse.getStatus()).isEqualTo(400);
        assertThat(errorResponse.getError()).isEqualTo("Bad Request");
        assertThat(errorResponse.getMessage()).isEqualTo("Invalid input");
        assertThat(errorResponse.getValidationErrors()).isEqualTo(validationErrors);
    }
}
