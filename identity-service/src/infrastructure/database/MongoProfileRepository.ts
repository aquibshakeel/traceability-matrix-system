/**
 * MongoDB Profile Repository (Adapter)
 * Implements IProfileRepository for MongoDB
 */
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';

export class MongoProfileRepository implements IProfileRepository {
  private collection: Collection;

  constructor(client: MongoClient, databaseName: string) {
    const db = client.db(databaseName);
    this.collection = db.collection('profiles');
  }

  async create(request: CreateProfileRequest): Promise<Profile> {
    const now = new Date();
    const doc = {
      userId: request.userId,
      age: request.age,
      location: request.location,
      attributes: request.attributes || {},
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(doc);
    
    return {
      id: result.insertedId.toString(),
      userId: doc.userId,
      age: doc.age,
      location: doc.location,
      attributes: doc.attributes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  async findById(id: string): Promise<Profile | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    
    if (!doc) {
      return null;
    }

    return {
      id: doc._id.toString(),
      userId: doc.userId,
      age: doc.age,
      location: doc.location,
      attributes: doc.attributes || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const doc = await this.collection.findOne({ userId });
    
    if (!doc) {
      return null;
    }

    return {
      id: doc._id.toString(),
      userId: doc.userId,
      age: doc.age,
      location: doc.location,
      attributes: doc.attributes || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  async update(id: string, request: UpdateProfileRequest): Promise<Profile> {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid profile ID');
    }

    const updateDoc: any = {
      updatedAt: new Date()
    };

    if (request.age !== undefined) {
      updateDoc.age = request.age;
    }
    if (request.location !== undefined) {
      updateDoc.location = request.location;
    }
    if (request.attributes !== undefined) {
      updateDoc.attributes = request.attributes;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Profile not found');
    }

    return {
      id: result._id.toString(),
      userId: result.userId,
      age: result.age,
      location: result.location,
      attributes: result.attributes || {},
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid profile ID');
    }

    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async ensureIndexes(): Promise<void> {
    // Create unique index on userId
    await this.collection.createIndex({ userId: 1 }, { unique: true });
  }
}
