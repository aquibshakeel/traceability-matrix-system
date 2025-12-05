/**
 * Application Bootstrap
 * Sets up Express app with dependency injection
 */
import express, { Express } from 'express';
import { MongoClient, Db } from 'mongodb';
import { Kafka } from 'kafkajs';
import { Config } from './config/config';
import { MongoUserRepository } from './infrastructure/database/MongoUserRepository';
import { KafkaEventPublisher } from './infrastructure/messaging/KafkaEventPublisher';
import { UserService } from './application/services/UserService';
import { UserController } from './api/controllers/UserController';
import { createUserRoutes } from './api/routes/userRoutes';

export class Application {
  private app: Express;
  private mongoClient?: MongoClient;
  private eventPublisher?: KafkaEventPublisher;

  constructor(private readonly config: Config) {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  async initialize(): Promise<void> {
    // Connect to MongoDB
    this.mongoClient = new MongoClient(this.config.mongodb.uri);
    await this.mongoClient.connect();
    const db: Db = this.mongoClient.db(this.config.mongodb.database);

    // Connect to Kafka
    const kafka = new Kafka({
      clientId: this.config.kafka.clientId,
      brokers: this.config.kafka.brokers
    });
    this.eventPublisher = new KafkaEventPublisher(kafka, this.config.kafka.topic);
    await this.eventPublisher.connect();

    // Setup dependency injection
    const userRepository = new MongoUserRepository(db);
    const userService = new UserService(userRepository, this.eventPublisher);
    const userController = new UserController(userService);

    // Setup routes
    const userRoutes = createUserRoutes(userController);
    this.app.use('/api', userRoutes);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy' });
    });
  }

  async start(): Promise<void> {
    this.app.listen(this.config.port, () => {
      console.log(`Server running on port ${this.config.port}`);
    });
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down gracefully...');
    
    if (this.eventPublisher) {
      await this.eventPublisher.disconnect();
    }
    
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    
    console.log('Shutdown complete');
  }

  getExpressApp(): Express {
    return this.app;
  }
}
