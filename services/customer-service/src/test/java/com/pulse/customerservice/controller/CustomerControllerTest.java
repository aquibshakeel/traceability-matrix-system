package com.pulse.customerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.exception.CustomerNotFoundException;
import com.pulse.customerservice.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerController.class)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    private CustomerRequest customerRequest;
    private CustomerResponse customerResponse;

    @BeforeEach
    void setUp() {
        customerRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        customerResponse = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createCustomer_ShouldReturnCreated_WhenValidRequest() throws Exception {
        // Arrange
        when(customerService.createCustomer(any(CustomerRequest.class)))
                .thenReturn(customerResponse);

        // Act & Assert
        mockMvc.perform(post("/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.age").value(30))
                .andExpect(jsonPath("$.address").value("123 Main St, New York, NY 10001"));

        verify(customerService).createCustomer(any(CustomerRequest.class));
    }

    @Test
    void createCustomer_ShouldReturnBadRequest_WhenFirstNameIsBlank() throws Exception {
        // Arrange
        CustomerRequest invalidRequest = CustomerRequest.builder()
                .firstName("")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act & Assert
        mockMvc.perform(post("/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(customerService, never()).createCustomer(any());
    }

    @Test
    void createCustomer_ShouldReturnBadRequest_WhenAgeIsNull() throws Exception {
        // Arrange
        CustomerRequest invalidRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(null)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act & Assert
        mockMvc.perform(post("/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(customerService, never()).createCustomer(any());
    }

    @Test
    void createCustomer_ShouldReturnBadRequest_WhenAgeTooYoung() throws Exception {
        // Arrange
        CustomerRequest invalidRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(17)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act & Assert
        mockMvc.perform(post("/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(customerService, never()).createCustomer(any());
    }

    @Test
    void getCustomers_ShouldReturnAllCustomers_WhenNoAgeFilterProvided() throws Exception {
        // Arrange
        CustomerResponse customer2 = CustomerResponse.builder()
                .id("2")
                .firstName("Jane")
                .lastName("Smith")
                .age(25)
                .address("456 Oak Ave, Los Angeles, CA 90001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<CustomerResponse> customers = Arrays.asList(customerResponse, customer2);
        when(customerService.getAllCustomers()).thenReturn(customers);

        // Act & Assert
        mockMvc.perform(get("/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value("1"))
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[1].id").value("2"))
                .andExpect(jsonPath("$[1].firstName").value("Jane"));

        verify(customerService).getAllCustomers();
        verify(customerService, never()).getCustomersByAge(any());
    }

    @Test
    void getCustomers_ShouldReturnFilteredCustomers_WhenAgeFilterProvided() throws Exception {
        // Arrange
        List<CustomerResponse> customers = Arrays.asList(customerResponse);
        when(customerService.getCustomersByAge(30)).thenReturn(customers);

        // Act & Assert
        mockMvc.perform(get("/v1/customers")
                        .param("age", "30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].age").value(30));

        verify(customerService).getCustomersByAge(30);
        verify(customerService, never()).getAllCustomers();
    }

    @Test
    void getCustomerById_ShouldReturnCustomer_WhenCustomerExists() throws Exception {
        // Arrange
        when(customerService.getCustomerById("1")).thenReturn(customerResponse);

        // Act & Assert
        mockMvc.perform(get("/v1/customers/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"));

        verify(customerService).getCustomerById("1");
    }

    @Test
    void getCustomerById_ShouldReturnNotFound_WhenCustomerDoesNotExist() throws Exception {
        // Arrange
        when(customerService.getCustomerById("999"))
                .thenThrow(new CustomerNotFoundException("Customer not found with ID: 999"));

        // Act & Assert
        mockMvc.perform(get("/v1/customers/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(customerService).getCustomerById("999");
    }

    @Test
    void updateCustomer_ShouldReturnUpdatedCustomer_WhenValidRequest() throws Exception {
        // Arrange
        CustomerRequest updateRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Updated")
                .age(31)
                .address("789 New St, Boston, MA 02101")
                .build();

        CustomerResponse updatedResponse = CustomerResponse.builder()
                .id("1")
                .firstName("John")
                .lastName("Updated")
                .age(31)
                .address("789 New St, Boston, MA 02101")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(customerService.updateCustomer(eq("1"), any(CustomerRequest.class)))
                .thenReturn(updatedResponse);

        // Act & Assert
        mockMvc.perform(put("/v1/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.lastName").value("Updated"))
                .andExpect(jsonPath("$.age").value(31));

        verify(customerService).updateCustomer(eq("1"), any(CustomerRequest.class));
    }

    @Test
    void updateCustomer_ShouldReturnNotFound_WhenCustomerDoesNotExist() throws Exception {
        // Arrange
        when(customerService.updateCustomer(eq("999"), any(CustomerRequest.class)))
                .thenThrow(new CustomerNotFoundException("Customer not found with ID: 999"));

        // Act & Assert
        mockMvc.perform(put("/v1/customers/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerRequest)))
                .andExpect(status().isNotFound());

        verify(customerService).updateCustomer(eq("999"), any(CustomerRequest.class));
    }

    @Test
    void updateCustomer_ShouldReturnBadRequest_WhenInvalidData() throws Exception {
        // Arrange
        CustomerRequest invalidRequest = CustomerRequest.builder()
                .firstName("J") // Too short
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act & Assert
        mockMvc.perform(put("/v1/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(customerService, never()).updateCustomer(any(), any());
    }

    @Test
    void deleteCustomer_ShouldReturnNoContent_WhenCustomerExists() throws Exception {
        // Arrange
        doNothing().when(customerService).deleteCustomer("1");

        // Act & Assert
        mockMvc.perform(delete("/v1/customers/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(customerService).deleteCustomer("1");
    }

    @Test
    void deleteCustomer_ShouldReturnNotFound_WhenCustomerDoesNotExist() throws Exception {
        // Arrange
        doThrow(new CustomerNotFoundException("Customer not found with ID: 999"))
                .when(customerService).deleteCustomer("999");

        // Act & Assert
        mockMvc.perform(delete("/v1/customers/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(customerService).deleteCustomer("999");
    }
}
