package com.pulse.customerservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * MongoDB configuration.
 * Enables MongoDB repositories and auditing.
 */
@Configuration
@EnableMongoRepositories(basePackages = "com.pulse.customerservice.repository")
@EnableMongoAuditing
public class MongoConfig {
    // MongoDB configuration can be extended here if needed
    // For now, properties in application.yml are sufficient
}
