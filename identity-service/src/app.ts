/**
 * Identity Service Application Bootstrap
 * Sets up Express app with dependency injection
 */
import express, { Application } from 'express';
import { MongoClient } from 'mongodb';
import { config } from './config/config';
import { MongoProfileRepository } from './infrastructure/database/MongoProfileRepository';
import { ProfileService } from './application/services/ProfileService';
import { ProfileController } from './api/controllers/ProfileController';
import { createProfileRoutes } from './api/routes/profileRoutes';

export async function createApp(): Promise<{ app: Application; mongoClient: MongoClient }> {
  const app = express();

  // Middleware
  app.use(express.json());

  // Connect to MongoDB
  const mongoClient = new MongoClient(config.mongodb.uri);
  await mongoClient.connect();
  console.log('✅ Connected to MongoDB (Identity Service)');

  // Initialize repositories
  const profileRepository = new MongoProfileRepository(mongoClient, config.mongodb.database);
  await profileRepository.ensureIndexes();

  // Initialize services
  const profileService = new ProfileService(profileRepository);

  // Initialize controllers
  const profileController = new ProfileController(profileService);

  // Setup routes
  app.use('/api', createProfileRoutes(profileController));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'identity-service' });
  });

  return { app, mongoClient };
}
