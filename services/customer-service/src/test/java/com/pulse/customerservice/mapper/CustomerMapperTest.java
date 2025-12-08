package com.pulse.customerservice.mapper;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.model.Customer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerMapperTest {

    private CustomerMapper customerMapper;

    @BeforeEach
    void setUp() {
        customerMapper = Mappers.getMapper(CustomerMapper.class);
    }

    @Test
    void toEntity_ShouldMapRequestToEntity() {
        // Arrange
        CustomerRequest request = CustomerRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .build();

        // Act
        Customer customer = customerMapper.toEntity(request);

        // Assert
        assertThat(customer).isNotNull();
        assertThat(customer.getFirstName()).isEqualTo("John");
        assertThat(customer.getLastName()).isEqualTo("Doe");
        assertThat(customer.getAge()).isEqualTo(30);
        assertThat(customer.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
        assertThat(customer.getId()).isNull(); // Should be ignored
        assertThat(customer.getCreatedAt()).isNull(); // Should be ignored
        assertThat(customer.getUpdatedAt()).isNull(); // Should be ignored
    }

    @Test
    void toResponse_ShouldMapEntityToResponse() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        Customer customer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Act
        CustomerResponse response = customerMapper.toResponse(customer);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("1");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");
        assertThat(response.getAge()).isEqualTo(30);
        assertThat(response.getAddress()).isEqualTo("123 Main St, New York, NY 10001");
        assertThat(response.getCreatedAt()).isEqualTo(now);
        assertThat(response.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void updateEntity_ShouldUpdateExistingEntity() {
        // Arrange
        LocalDateTime createdTime = LocalDateTime.now().minusDays(5);
        LocalDateTime updatedTime = LocalDateTime.now().minusDays(1);
        
        Customer existingCustomer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(createdTime)
                .updatedAt(updatedTime)
                .build();

        CustomerRequest updateRequest = CustomerRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .age(25)
                .address("456 Oak Ave, Los Angeles, CA 90001")
                .build();

        // Act
        customerMapper.updateEntity(updateRequest, existingCustomer);

        // Assert
        assertThat(existingCustomer.getId()).isEqualTo("1"); // Should not change
        assertThat(existingCustomer.getFirstName()).isEqualTo("Jane");
        assertThat(existingCustomer.getLastName()).isEqualTo("Smith");
        assertThat(existingCustomer.getAge()).isEqualTo(25);
        assertThat(existingCustomer.getAddress()).isEqualTo("456 Oak Ave, Los Angeles, CA 90001");
        assertThat(existingCustomer.getCreatedAt()).isEqualTo(createdTime); // Should not change
        assertThat(existingCustomer.getUpdatedAt()).isEqualTo(updatedTime); // Should not change (updated by service)
    }

    @Test
    void toEntity_ShouldHandleNullRequest() {
        // Act
        Customer customer = customerMapper.toEntity(null);

        // Assert
        assertThat(customer).isNull();
    }

    @Test
    void toResponse_ShouldHandleNullEntity() {
        // Act
        CustomerResponse response = customerMapper.toResponse(null);

        // Assert
        assertThat(response).isNull();
    }

    @Test
    void updateEntity_ShouldIgnoreNullValues() {
        // Arrange
        Customer existingCustomer = Customer.builder()
                .id("1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .address("123 Main St, New York, NY 10001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create a request with some null values
        CustomerRequest partialUpdate = CustomerRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .age(25)
                .address("456 Oak Ave, Los Angeles, CA 90001")
                .build();

        // Act
        customerMapper.updateEntity(partialUpdate, existingCustomer);

        // Assert
        assertThat(existingCustomer.getFirstName()).isEqualTo("Jane");
        assertThat(existingCustomer.getLastName()).isEqualTo("Smith");
        assertThat(existingCustomer.getAge()).isEqualTo(25);
        assertThat(existingCustomer.getAddress()).isEqualTo("456 Oak Ave, Los Angeles, CA 90001");
    }
}
