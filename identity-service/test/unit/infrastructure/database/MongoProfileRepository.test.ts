/**
 * MongoProfileRepository Unit Tests
 * Tests MongoDB data access layer
 */

import { MongoProfileRepository } from '../../../../src/infrastructure/database/MongoProfileRepository';
import { Collection, MongoClient, ObjectId } from 'mongodb';

describe('MongoProfileRepository', () => {
  let repository: MongoProfileRepository;
  let mockCollection: jest.Mocked<Collection>;
  let mockClient: jest.Mocked<MongoClient>;

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      createIndex: jest.fn(),
    } as any;

    const mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
    } as any;

    repository = new MongoProfileRepository(mockClient, 'test-db');
  });

  describe('create', () => {
    it('should create profile successfully', async () => {
      const request = {
        userId: 'user123',
        age: 25,
        location: 'NYC'
      };

      const insertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({
        insertedId,
        acknowledged: true
      } as any);

      const result = await repository.create(request);

      expect(result.userId).toBe('user123');
      expect(result.age).toBe(25);
      expect(result.location).toBe('NYC');
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findByUserId('user123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user123');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return null when user has no profile', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByUserId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update profile successfully', async () => {
      const profileId = new ObjectId();
      const updatedDoc = {
        _id: profileId,
        userId: 'user123',
        age: 30,
        location: 'SF',
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedDoc as any);

      const result = await repository.update(profileId.toString(), {
        age: 30,
        location: 'SF'
      });

      expect(result.age).toBe(30);
      expect(result.location).toBe('SF');
    });

    it('should throw error for invalid profile ID', async () => {
      await expect(repository.update('invalid-id', { age: 30 }))
        .rejects.toThrow('Invalid profile ID');
    });

    it('should throw error when profile not found', async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      await expect(repository.update(new ObjectId().toString(), { age: 30 }))
        .rejects.toThrow('Profile not found');
    });
  });

  describe('delete', () => {
    it('should delete profile successfully', async () => {
      const profileId = new ObjectId();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 } as any);

      await repository.delete(profileId.toString());

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: profileId
      });
    });

    it('should throw error for invalid ID', async () => {
      await expect(repository.delete('invalid-id'))
        .rejects.toThrow('Invalid profile ID');
    });
  });

  describe('ensureIndexes', () => {
    it('should create unique index on userId', async () => {
      mockCollection.createIndex.mockResolvedValue('userId_1');

      await repository.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { userId: 1 },
        { unique: true }
      );
    });
  });
});
