/**
 * Application Configuration
 * Centralized configuration for the service
 */
export interface Config {
  port: number;
  mongodb: {
    uri: string;
    database: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    topic: string;
  };
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DATABASE || 'onboarding-service'
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'onboarding-service',
      topic: process.env.KAFKA_TOPIC || 'user-onboarding'
    }
  };
}
