/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DATABASE = 'onboarding-service-test';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_CLIENT_ID = 'onboarding-service-test';
process.env.KAFKA_TOPIC = 'user-onboarding-test';

// Increase test timeout for integration tests
jest.setTimeout(30000);
