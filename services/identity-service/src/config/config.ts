/**
 * Configuration
 * Environment-based configuration for Identity Service
 */
export const config = {
  port: process.env.IDENTITY_PORT || 3001,
  mongodb: {
    uri: process.env.IDENTITY_MONGODB_URI || 'mongodb://mongodb-identity:27017',
    database: process.env.IDENTITY_MONGODB_DATABASE || 'identity-service'
  }
};
