package com.pulse.customerservice.controller;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Customer operations.
 * Handles HTTP requests for customer-related endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Management", description = "APIs for managing customers")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @Operation(
        summary = "Create a new customer",
        description = "Creates a new customer with the provided information"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Customer created successfully",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        )
    })
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CustomerRequest request) {
        log.info("POST /v1/customers - Creating customer: {} {}",
                request.getFirstName(), request.getLastName());

        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(
        summary = "Get all customers or filter by age",
        description = "Retrieves all customers or filters by age if age parameter is provided"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customers retrieved successfully",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        )
    })
    public ResponseEntity<List<CustomerResponse>> getCustomers(
            @Parameter(description = "Filter customers by age (optional)")
            @RequestParam(required = false) Integer age) {

        if (age != null) {
            log.info("GET /v1/customers?age={} - Fetching customers by age", age);
            List<CustomerResponse> customers = customerService.getCustomersByAge(age);
            return ResponseEntity.ok(customers);
        }

        log.info("GET /v1/customers - Fetching all customers");
        List<CustomerResponse> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get customer by ID",
        description = "Retrieves a specific customer by their ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customer found",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        )
    })
    public ResponseEntity<CustomerResponse> getCustomerById(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String id) {
        log.info("GET /v1/customers/{} - Fetching customer by ID", id);

        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update customer",
        description = "Updates an existing customer's information"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customer updated successfully",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        )
    })
    public ResponseEntity<CustomerResponse> updateCustomer(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String id,
            @Valid @RequestBody CustomerRequest request) {
        log.info("PUT /v1/customers/{} - Updating customer", id);

        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete customer",
        description = "Deletes a customer by their ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Customer deleted successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        )
    })
    public ResponseEntity<Void> deleteCustomer(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String id) {
        log.info("DELETE /v1/customers/{} - Deleting customer", id);

        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
// test
// debug test
