/**
 * MongoUserRepository Unit Tests
 * Tests MongoDB adapter with mocked MongoDB client
 */
import { MongoUserRepository } from '../../../../src/infrastructure/database/MongoUserRepository';
import { CreateUserRequest } from '../../../../src/domain/entities/User';
import { Collection, Db, ObjectId, InsertOneResult } from 'mongodb';

describe('MongoUserRepository', () => {
  let repository: MongoUserRepository;
  let mockCollection: jest.Mocked<Collection>;
  let mockDb: jest.Mocked<Db>;

  beforeEach(() => {
    // Mock collection
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      createIndex: jest.fn()
    } as any;

    // Mock database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    } as any;

    // Create repository
    repository = new MongoUserRepository(mockDb);
  });

  describe('create', () => {
    const request: CreateUserRequest = {
      email: 'test@example.com',
      name: 'Test User'
    };

    it('should create a user and return with ID', async () => {
      const mockObjectId = new ObjectId();
      const mockResult: InsertOneResult = {
        insertedId: mockObjectId,
        acknowledged: true
      };

      mockCollection.insertOne.mockResolvedValue(mockResult);

      const user = await repository.create(request);

      expect(user).toMatchObject({
        id: mockObjectId.toString(),
        email: request.email,
        name: request.name
      });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const mockObjectId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockObjectId,
        acknowledged: true
      });

      const beforeCreate = new Date();
      const user = await repository.create(request);
      const afterCreate = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(user.updatedAt).toEqual(user.createdAt);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockObjectId = new ObjectId();
      const mockDoc = {
        _id: mockObjectId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const user = await repository.findById(mockObjectId.toString());

      expect(user).not.toBeNull();
      expect(user!.id).toBe(mockObjectId.toString());
      expect(user!.email).toBe(mockDoc.email);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: mockObjectId });
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const user = await repository.findById(new ObjectId().toString());

      expect(user).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      const user = await repository.findById('invalid-id');

      expect(user).toBeNull();
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockObjectId = new ObjectId();
      const mockDoc = {
        _id: mockObjectId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const user = await repository.findByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when email not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const user = await repository.findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });
  });

  describe('ensureIndexes', () => {
    it('should create unique index on email field', () => {
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { email: 1 },
        { unique: true }
      );
    });
  });
});
