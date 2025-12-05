/**
 * MongoProfileRepository Unit Tests
 * Tests MongoDB data access layer
 * Identity Service: Read-only operations (GET only)
 */

import { MongoProfileRepository } from '../../../../src/infrastructure/database/MongoProfileRepository';
import { Collection, MongoClient, ObjectId } from 'mongodb';

describe('MongoProfileRepository', () => {
  let repository: MongoProfileRepository;
  let mockCollection: jest.Mocked<Collection>;
  let mockClient: jest.Mocked<MongoClient>;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
    } as any;

    const mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
    } as any;

    repository = new MongoProfileRepository(mockClient, 'test-db');
  });

  describe('findById', () => {
    it('should return profile when found', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        userId: 'user123',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findById(mockDoc._id.toString());

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user123');
      expect(result?.age).toBe(25);
    });

    it('should return null when profile not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById(new ObjectId().toString());

      expect(result).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return profile for valid userId', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        userId: 'user123',
        age: 25,
        location: 'NYC',
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findByUserId('user123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user123');
      expect(result?.age).toBe(25);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return null when user has no profile', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByUserId('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findByUserId('user123'))
        .rejects.toThrow('Database connection failed');
    });
  });
});
