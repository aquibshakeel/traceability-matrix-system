package com.pulse.customerservice.mapper;

import com.pulse.customerservice.dto.CustomerRequest;
import com.pulse.customerservice.dto.CustomerResponse;
import com.pulse.customerservice.model.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * Mapper interface for converting between Customer entities and DTOs.
 * MapStruct generates the implementation at compile time.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface CustomerMapper {

    /**
     * Convert CustomerRequest to Customer entity.
     *
     * @param request Customer request DTO
     * @return Customer entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Customer toEntity(CustomerRequest request);

    /**
     * Convert Customer entity to CustomerResponse.
     *
     * @param customer Customer entity
     * @return Customer response DTO
     */
    CustomerResponse toResponse(Customer customer);

    /**
     * Update existing Customer entity with data from CustomerRequest.
     *
     * @param request Customer request DTO
     * @param customer Existing customer entity to update
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CustomerRequest request, @MappingTarget Customer customer);
}