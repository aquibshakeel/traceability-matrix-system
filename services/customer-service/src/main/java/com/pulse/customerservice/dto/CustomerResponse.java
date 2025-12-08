package com.pulse.customerservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for customer response.
 * Returned to clients when retrieving customer information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Customer response")
public class CustomerResponse {

    @Schema(description = "Customer unique identifier", example = "507f1f77bcf86cd799439011")
    private String id;

    @Schema(description = "Customer's first name", example = "John")
    private String firstName;

    @Schema(description = "Customer's last name", example = "Doe")
    private String lastName;

    @Schema(description = "Customer's age", example = "30")
    private Integer age;

    @Schema(description = "Customer's address", example = "123 Main St, New York, NY 10001")
    private String address;

    @Schema(description = "Timestamp when customer was created")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when customer was last updated")
    private LocalDateTime updatedAt;
}