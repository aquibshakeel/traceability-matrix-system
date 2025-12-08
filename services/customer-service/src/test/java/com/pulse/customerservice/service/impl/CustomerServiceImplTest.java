package com.pulse.customerservice.service.impl;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.exception.CustomerNotFoundException;
import com.pulse.customerservice.mapper.CustomerMapper;
import com.pulse.customerservice.model.Customer;
import com.pulse.customerservice.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerMapper customerMapper;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private CustomerRequest customerRequest;
    private Customer customer;
    private CustomerResponse customerResponse;

    @BeforeEach
    void setUp() {
        customerRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        customer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
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
    void createCustomer_ShouldReturnCustomerResponse_WhenValidRequest() {
        // Arrange
        when(customerMapper.toEntity(customerRequest)).thenReturn(customer);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        when(customerMapper.toResponse(customer)).thenReturn(customerResponse);

        // Act
        CustomerResponse result = customerService.createCustomer(customerRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getAge()).isEqualTo(30);

        verify(customerMapper).toEntity(customerRequest);
        verify(customerRepository).save(any(Customer.class));
        verify(customerMapper).toResponse(customer);
    }

    @Test
    void getAllCustomers_ShouldReturnListOfCustomers_WhenCustomersExist() {
        // Arrange
        Customer customer2 = Customer.builder()
                .id("2")
                .firstName("Jane")
                .lastName("Smith")
                .age(25)
                .address("456 Oak Ave, Los Angeles, CA 90001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<Customer> customers = Arrays.asList(customer, customer2);
        when(customerRepository.findAll()).thenReturn(customers);
        when(customerMapper.toResponse(any(Customer.class)))
                .thenReturn(customerResponse)
                .thenReturn(CustomerResponse.builder()
                        .id("2")
                        .firstName("Jane")
                        .lastName("Smith")
                        .age(25)
                        .address("456 Oak Ave, Los Angeles, CA 90001")
                        .build());

        // Act
        List<CustomerResponse> result = customerService.getAllCustomers();

        // Assert
        assertThat(result).hasSize(2);
        verify(customerRepository).findAll();
        verify(customerMapper, times(2)).toResponse(any(Customer.class));
    }

    @Test
    void getAllCustomers_ShouldReturnEmptyList_WhenNoCustomersExist() {
        // Arrange
        when(customerRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<CustomerResponse> result = customerService.getAllCustomers();

        // Assert
        assertThat(result).isEmpty();
        verify(customerRepository).findAll();
    }

    @Test
    void getCustomerById_ShouldReturnCustomerResponse_WhenCustomerExists() {
        // Arrange
        when(customerRepository.findById("1")).thenReturn(Optional.of(customer));
        when(customerMapper.toResponse(customer)).thenReturn(customerResponse);

        // Act
        CustomerResponse result = customerService.getCustomerById("1");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("1");
        assertThat(result.getFirstName()).isEqualTo("John");

        verify(customerRepository).findById("1");
        verify(customerMapper).toResponse(customer);
    }

    @Test
    void getCustomerById_ShouldThrowException_WhenCustomerNotFound() {
        // Arrange
        when(customerRepository.findById("999")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> customerService.getCustomerById("999"))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found with ID: 999");

        verify(customerRepository).findById("999");
        verify(customerMapper, never()).toResponse(any());
    }

    @Test
    void getCustomersByAge_ShouldReturnListOfCustomers_WhenCustomersWithAgeExist() {
        // Arrange
        List<Customer> customers = Arrays.asList(customer);
        when(customerRepository.findByAge(30)).thenReturn(customers);
        when(customerMapper.toResponse(customer)).thenReturn(customerResponse);

        // Act
        List<CustomerResponse> result = customerService.getCustomersByAge(30);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAge()).isEqualTo(30);

        verify(customerRepository).findByAge(30);
        verify(customerMapper).toResponse(customer);
    }

    @Test
    void getCustomersByAge_ShouldReturnEmptyList_WhenNoCustomersWithAgeExist() {
        // Arrange
        when(customerRepository.findByAge(99)).thenReturn(Arrays.asList());

        // Act
        List<CustomerResponse> result = customerService.getCustomersByAge(99);

        // Assert
        assertThat(result).isEmpty();
        verify(customerRepository).findByAge(99);
    }

    @Test
    void updateCustomer_ShouldReturnUpdatedCustomerResponse_WhenCustomerExists() {
        // Arrange
        CustomerRequest updateRequest = CustomerRequest.builder()
                .firstName("John")
                .lastName("Updated")
                .age(31)
                .address("789 New St, Boston, MA 02101")
                .build();

        when(customerRepository.findById("1")).thenReturn(Optional.of(customer));
        doNothing().when(customerMapper).updateEntity(updateRequest, customer);
        when(customerRepository.save(customer)).thenReturn(customer);
        when(customerMapper.toResponse(customer)).thenReturn(customerResponse);

        // Act
        CustomerResponse result = customerService.updateCustomer("1", updateRequest);

        // Assert
        assertThat(result).isNotNull();
        verify(customerRepository).findById("1");
        verify(customerMapper).updateEntity(updateRequest, customer);
        verify(customerRepository).save(customer);
        verify(customerMapper).toResponse(customer);
    }

    @Test
    void updateCustomer_ShouldThrowException_WhenCustomerNotFound() {
        // Arrange
        when(customerRepository.findById("999")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> customerService.updateCustomer("999", customerRequest))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found with ID: 999");

        verify(customerRepository).findById("999");
        verify(customerMapper, never()).updateEntity(any(), any());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void deleteCustomer_ShouldDeleteCustomer_WhenCustomerExists() {
        // Arrange
        when(customerRepository.existsById("1")).thenReturn(true);
        doNothing().when(customerRepository).deleteById("1");

        // Act
        customerService.deleteCustomer("1");

        // Assert
        verify(customerRepository).existsById("1");
        verify(customerRepository).deleteById("1");
    }

    @Test
    void deleteCustomer_ShouldThrowException_WhenCustomerNotFound() {
        // Arrange
        when(customerRepository.existsById("999")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> customerService.deleteCustomer("999"))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found with ID: 999");

        verify(customerRepository).existsById("999");
        verify(customerRepository, never()).deleteById(anyString());
    }
}
