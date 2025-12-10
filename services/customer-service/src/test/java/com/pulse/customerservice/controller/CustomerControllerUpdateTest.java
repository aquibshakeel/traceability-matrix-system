package com.pulse.customerservice.controller;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
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
 * Unit tests for CustomerController - PUT /v1/customers/{id} endpoint.
 * Demonstrates PARTIAL COVERAGE scenarios:
 * - 2 scenarios FULLY_COVERED
 * - 2 scenarios PARTIALLY_COVERED  
 * - 1 scenario NOT_COVERED
 * Total: 3 unit tests for 5 baseline scenarios = 60% coverage
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Customer Controller - Update Customer Tests (Partial Coverage)")
class CustomerControllerUpdateTest {

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    // ====== FULLY COVERED SCENARIO 1 ======
    @Test
    @DisplayName("When customer is updated with valid data, return 200 and updated data")
    void testUpdateCustomer_WithValidData_Returns200() {
        // Arrange
        String customerId = "123";
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .age(30)
                .build();
        
        CustomerResponse expectedResponse = CustomerResponse.builder()
                .id(customerId)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .age(30)
                .build();
        
        when(customerService.updateCustomer(customerId, request)).thenReturn(expectedResponse);
        
        // Act
        ResponseEntity<CustomerResponse> response = customerController.updateCustomer(customerId, request);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("John", response.getBody().getFirstName());
        assertEquals("john.doe@example.com", response.getBody().getEmail());
        verify(customerService, times(1)).updateCustomer(customerId, request);
    }

    // ====== PARTIALLY COVERED SCENARIO 2 ======
    // This test exists but only checks basic update, doesn't verify "only provided fields" are updated
    // Missing: verification that unp rovided fields remain unchanged
    @Test
    @DisplayName("Update customer with partial data")
    void testUpdateCustomer_WithPartialData_UpdatesSuccessfully() {
        // Arrange
        String customerId = "456";
        CustomerRequest partialRequest = CustomerRequest.builder()
                .email("newemail@example.com")
                // Note: Only email is being updated, other fields should remain unchanged
                .build();
        
        CustomerResponse response = CustomerResponse.builder()
                .id(customerId)
                .email("newemail@example.com")
                .build();
        
        when(customerService.updateCustomer(customerId, partialRequest)).thenReturn(response);
        
        // Act
        ResponseEntity<CustomerResponse> result = customerController.updateCustomer(customerId, partialRequest);
        
        // Assert
        assertEquals(HttpStatus.OK, result.getStatusCode());
        // ❌ PARTIAL: This test doesn't verify that other fields (firstName, lastName, age) remained unchanged
        // ❌ PARTIAL: Missing assertion to check only email was updated
        // ❌ PARTIAL: Should fetch original customer and compare
        verify(customerService, times(1)).updateCustomer(customerId, partialRequest);
    }

    // ====== PARTIALLY COVERED SCENARIO 3 ======
    // This test exists but only checks 200 status, doesn't verify "without changes" behavior
    // Missing: verification that no actual changes were persisted
    @Test
    @DisplayName("Update customer with same data")
    void testUpdateCustomer_WithSameData_Returns200() {
        // Arrange
        String customerId = "789";
        CustomerRequest sameDataRequest = CustomerRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@example.com")
                .age(25)
                .build();
        
        CustomerResponse response = CustomerResponse.builder()
                .id(customerId)
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@example.com")
                .age(25)
                .build();
        
        when(customerService.updateCustomer(customerId, sameDataRequest)).thenReturn(response);
        
        // Act
        ResponseEntity<CustomerResponse> result = customerController.updateCustomer(customerId, sameDataRequest);
        
        // Assert
        assertEquals(HttpStatus.OK, result.getStatusCode());
        // ❌ PARTIAL: This test doesn't verify that no database write occurred
        // ❌ PARTIAL: Should check that service detects "same data" and skips update
        // ❌ PARTIAL: Missing assertion on "no changes" behavior
    }

    // ====== FULLY COVERED SCENARIO 4 ======
    @Test
    @DisplayName("When updating non-existent customer, return 404")
    void testUpdateCustomer_WithNonExistentId_ThrowsNotFoundException() {
        // Arrange
        String nonExistentId = "999";
        CustomerRequest request = CustomerRequest.builder()
                .firstName("Test")
                .email("test@example.com")
                .build();
        
        when(customerService.updateCustomer(nonExistentId, request))
                .thenThrow(new CustomerNotFoundException(nonExistentId));
        
        // Act & Assert
        assertThrows(CustomerNotFoundException.class, () -> {
            customerController.updateCustomer(nonExistentId, request);
        });
        
        verify(customerService, times(1)).updateCustomer(nonExistentId, request);
    }

    // ====== NOT COVERED SCENARIO 5 ======
    // Scenario: "When updating with duplicate email, return 409"
    // ❌ NO TEST EXISTS FOR THIS SCENARIO
    // This will be flagged as NOT_COVERED in the analysis
}
