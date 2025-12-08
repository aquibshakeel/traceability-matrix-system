package com.pulse.customerservice.service;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;

import java.util.List;

/**
 * Service interface for Customer operations.
 * Defines the contract for customer-related business logic.
 */
public interface CustomerService {

    /**
     * Create a new customer.
     *
     * @param request Customer creation request
     * @return Created customer response
     */
    CustomerResponse createCustomer(CustomerRequest request);

    /**
     * Get all customers.
     *
     * @return List of all customers
     */
    List<CustomerResponse> getAllCustomers();

    /**
     * Get customer by ID.
     *
     * @param id Customer ID
     * @return Customer response
     */
    CustomerResponse getCustomerById(String id);

    /**
     * Get customers by age (optional query parameter).
     *
     * @param age Customer age
     * @return List of customers with specified age
     */
    List<CustomerResponse> getCustomersByAge(Integer age);

    /**
     * Update customer.
     *
     * @param id Customer ID
     * @param request Customer update request
     * @return Updated customer response
     */
    CustomerResponse updateCustomer(String id, CustomerRequest request);

    /**
     * Delete customer.
     *
     * @param id Customer ID
     */
    void deleteCustomer(String id);
}
