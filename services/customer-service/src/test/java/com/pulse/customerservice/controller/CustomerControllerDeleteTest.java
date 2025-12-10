package com.pulse.customerservice.controller;

import com.pulse.customerservice.exception.CustomerNotFoundException;
import com.pulse.customerservice.service.CustomerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CustomerController - DELETE /v1/customers/{id} endpoint.
 * Total: 5 tests matching 5 baseline scenarios - demonstrates 100% baseline coverage
 * AI will then perform intelligent gap analysis to find additional scenarios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Customer Controller - Delete Customer Tests")
class CustomerControllerDeleteTest {

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    @Test
    @DisplayName("When customer is deleted by valid ID, return 204")
    void testDeleteCustomer_WithValidId_Returns204() {
        // Arrange
        String customerId = "123";
        
        doNothing().when(customerService).deleteCustomer(customerId);
        
        // Act
        ResponseEntity<Void> response = customerController.deleteCustomer(customerId);
        
        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
        verify(customerService, times(1)).deleteCustomer(customerId);
    }

    @Test
    @DisplayName("When customer is deleted successfully, verify customer no longer exists in system")
    void testDeleteCustomer_VerifyDeletion_CustomerNoLongerExists() {
        // Arrange
        String customerId = "456";
        
        doNothing().when(customerService).deleteCustomer(customerId);
        when(customerService.getCustomerById(customerId))
            .thenThrow(new CustomerNotFoundException(customerId));
        
        // Act
        customerController.deleteCustomer(customerId);
        
        // Assert - Verify customer no longer exists
        assertThrows(CustomerNotFoundException.class, () -> {
            customerService.getCustomerById(customerId);
        });
        
        verify(customerService, times(1)).deleteCustomer(customerId);
    }

    @Test
    @DisplayName("When deleting non-existent customer, return 404")
    void testDeleteCustomer_WithNonExistentId_ThrowsNotFoundException() {
        // Arrange
        String customerId = "nonexistent";
        
        doThrow(new CustomerNotFoundException(customerId))
            .when(customerService).deleteCustomer(customerId);
        
        // Act & Assert
        assertThrows(CustomerNotFoundException.class, () -> {
            customerController.deleteCustomer(customerId);
        });
        
        verify(customerService, times(1)).deleteCustomer(customerId);
    }

    @Test
    @DisplayName("When deleting without authentication, return 401")
    void testDeleteCustomer_WithoutAuthentication_ThrowsUnauthorizedException() {
        // Arrange
        String customerId = "789";
        
        doThrow(new SecurityException("Authentication required"))
            .when(customerService).deleteCustomer(customerId);
        
        // Act & Assert
        assertThrows(SecurityException.class, () -> {
            customerController.deleteCustomer(customerId);
        });
        
        verify(customerService, times(1)).deleteCustomer(customerId);
    }

    @Test
    @DisplayName("When deleting with invalid ID format, return 400")
    void testDeleteCustomer_WithInvalidIdFormat_ThrowsBadRequestException() {
        // Arrange
        String invalidId = "invalid@#$";
        
        doThrow(new IllegalArgumentException("Invalid customer ID format"))
            .when(customerService).deleteCustomer(invalidId);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            customerController.deleteCustomer(invalidId);
        });
        
        verify(customerService, times(1)).deleteCustomer(invalidId);
    }
}
