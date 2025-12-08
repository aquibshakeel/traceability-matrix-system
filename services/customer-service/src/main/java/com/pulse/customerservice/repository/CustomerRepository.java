package com.pulse.customerservice.repository;

import com.pulse.customerservice.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Customer entity.
 * Provides CRUD operations and custom query methods.
 */
@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {

    /**
     * Find customer by first name and last name.
     *
     * @param firstName Customer's first name
     * @param lastName Customer's last name
     * @return Optional containing customer if found
     */
    Optional<Customer> findByFirstNameAndLastName(String firstName, String lastName);

    /**
     * Find all customers by age.
     *
     * @param age Customer's age
     * @return List of customers with specified age
     */
    List<Customer> findByAge(Integer age);

    /**
     * Check if customer exists by first name and last name.
     *
     * @param firstName Customer's first name
     * @param lastName Customer's last name
     * @return true if customer exists, false otherwise
     */
    boolean existsByFirstNameAndLastName(String firstName, String lastName);
}