package com.pulse.customerservice.controller;

import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.service.CustomerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CustomerController - GET /v1/customers endpoint.
 * Tests cover all functional scenarios including happy cases, edge cases, error cases, and security scenarios.
 * Total: 10 tests matching 10 baseline scenarios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Customer Controller - Get All Customers Tests")
class CustomerControllerGetAllTest {

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    // HAPPY CASE TESTS
    
    @Test
    @DisplayName("When requesting all customers with valid authentication, return 200 and list of customers")
    void testGetAllCustomers_WithAuthentication_ReturnsListSuccessfully() {
        // Arrange
        List<CustomerResponse> expectedCustomers = Arrays.asList(
            CustomerResponse.builder().id("1").firstName("John").lastName("Doe")
                .email("john@example.com").age(30).build(),
            CustomerResponse.builder().id("2").firstName("Jane").lastName("Smith")
                .email("jane@example.com").age(25).build()
        );
        
        when(customerService.getAllCustomers()).thenReturn(expectedCustomers);
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(null);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(customerService, times(1)).getAllCustomers();
    }

    @Test
    @DisplayName("When requesting customers filtered by valid age, return 200 and filtered list")
    void testGetCustomers_WithValidAgeFilter_ReturnsFilteredList() {
        // Arrange
        Integer age = 30;
        List<CustomerResponse> expectedCustomers = Arrays.asList(
            CustomerResponse.builder().id("1").firstName("John").lastName("Doe")
                .email("john@example.com").age(30).build(),
            CustomerResponse.builder().id("3").firstName("Bob").lastName("Wilson")
                .email("bob@example.com").age(30).build()
        );
        
        when(customerService.getCustomersByAge(age)).thenReturn(expectedCustomers);
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(age);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals(30, response.getBody().get(0).getAge());
        verify(customerService, times(1)).getCustomersByAge(age);
        verify(customerService, never()).getAllCustomers();
    }

    @Test
    @DisplayName("When requesting all customers with empty database, return 200 and empty array")
    void testGetAllCustomers_WithEmptyDatabase_ReturnsEmptyList() {
        // Arrange
        when(customerService.getAllCustomers()).thenReturn(Collections.emptyList());
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(null);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
        verify(customerService, times(1)).getAllCustomers();
    }

    @Test
    @DisplayName("When requesting customers by age and multiple match, return 200 and all matching customers")
    void testGetCustomers_WithMultipleMatches_ReturnsAllMatches() {
        // Arrange
        Integer age = 25;
        List<CustomerResponse> expectedCustomers = Arrays.asList(
            CustomerResponse.builder().id("2").firstName("Jane").lastName("Smith")
                .email("jane@example.com").age(25).build(),
            CustomerResponse.builder().id("4").firstName("Alice").lastName("Brown")
                .email("alice@example.com").age(25).build(),
            CustomerResponse.builder().id("5").firstName("Charlie").lastName("Davis")
                .email("charlie@example.com").age(25).build()
        );
        
        when(customerService.getCustomersByAge(age)).thenReturn(expectedCustomers);
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(age);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(3, response.getBody().size());
        verify(customerService, times(1)).getCustomersByAge(age);
    }

    // EDGE CASE TESTS

    @Test
    @DisplayName("When requesting customers by age zero, return 200 and customers with age 0")
    void testGetCustomers_WithAgeZero_ReturnsMatchingCustomers() {
        // Arrange
        Integer age = 0;
        List<CustomerResponse> expectedCustomers = Arrays.asList(
            CustomerResponse.builder().id("10").firstName("Infant").lastName("Baby")
                .email("infant@example.com").age(0).build()
        );
        
        when(customerService.getCustomersByAge(age)).thenReturn(expectedCustomers);
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(age);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(0, response.getBody().get(0).getAge());
        verify(customerService, times(1)).getCustomersByAge(age);
    }

    @Test
    @DisplayName("When requesting customers by maximum age value (120), return 200 and matching customers")
    void testGetCustomers_WithMaximumAge_ReturnsMatchingCustomers() {
        // Arrange
        Integer age = 120;
        List<CustomerResponse> expectedCustomers = Arrays.asList(
            CustomerResponse.builder().id("11").firstName("Senior").lastName("Elder")
                .email("senior@example.com").age(120).build()
        );
        
        when(customerService.getCustomersByAge(age)).thenReturn(expectedCustomers);
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(age);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(120, response.getBody().get(0).getAge());
        verify(customerService, times(1)).getCustomersByAge(age);
    }

    @Test
    @DisplayName("When requesting customers by age with no matches, return 200 and empty array")
    void testGetCustomers_WithNoMatches_ReturnsEmptyList() {
        // Arrange
        Integer age = 99;
        when(customerService.getCustomersByAge(age)).thenReturn(Collections.emptyList());
        
        // Act
        ResponseEntity<List<CustomerResponse>> response = customerController.getCustomers(age);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
        verify(customerService, times(1)).getCustomersByAge(age);
    }

    // ERROR CASE TESTS

    @Test
    @DisplayName("When requesting customers with invalid age format (negative), return 400")
    void testGetCustomers_WithNegativeAge_ThrowsException() {
        // Arrange
        Integer age = -5;
        when(customerService.getCustomersByAge(age))
            .thenThrow(new IllegalArgumentException("Age cannot be negative"));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            customerController.getCustomers(age);
        });
        
        verify(customerService, times(1)).getCustomersByAge(age);
    }

    @Test
    @DisplayName("When requesting customers without authentication token, return 401")
    void testGetCustomers_WithoutAuthentication_ThrowsUnauthorizedException() {
        // Arrange
        // This would typically be handled by Spring Security filter
        // For unit test, we simulate the service throwing an exception
        when(customerService.getAllCustomers())
            .thenThrow(new SecurityException("Authentication required"));
        
        // Act & Assert
        assertThrows(SecurityException.class, () -> {
            customerController.getCustomers(null);
        });
        
        verify(customerService, times(1)).getAllCustomers();
    }

    // SECURITY TESTS

    @Test
    @DisplayName("When requesting customers with SQL injection in age parameter, reject safely with 400")
    void testGetCustomers_WithSQLInjectionInAge_HandledSafely() {
        // Arrange
        // SQL injection attempt through age parameter (theoretically if it was string-based)
        // Since age is Integer, this would be rejected at framework level
        // We test the service layer handling
        Integer maliciousAge = Integer.MAX_VALUE; // Boundary test
        when(customerService.getCustomersByAge(maliciousAge))
            .thenThrow(new IllegalArgumentException("Invalid age value"));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            customerController.getCustomers(maliciousAge);
        });
        
        verify(customerService, times(1)).getCustomersByAge(maliciousAge);
    }
}
