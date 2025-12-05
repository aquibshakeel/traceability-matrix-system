/**
 * MongoDB User Repository Implementation (Adapter)
 * Implements IUserRepository using MongoDB
 */
import { Collection, Db, ObjectId } from 'mongodb';
import { User, CreateUserRequest } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface UserDocument {
  _id: ObjectId;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUserRepository implements IUserRepository {
  private collection: Collection<UserDocument>;

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
    this.ensureIndexes();
  }

  async create(request: CreateUserRequest): Promise<User> {
    const now = new Date();
    const document: Omit<UserDocument, '_id'> = {
      email: request.email,
      name: request.name,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(document as UserDocument);

    return this.mapToUser({
      _id: result.insertedId,
      ...document
    } as UserDocument);
  }

  async findById(id: string): Promise<User | null> {
    let objectId: ObjectId;
    
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const document = await this.collection.findOne({ _id: objectId });
    return document ? this.mapToUser(document) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await this.collection.findOne({ email });
    return document ? this.mapToUser(document) : null;
  }

  private mapToUser(document: UserDocument): User {
    return {
      id: document._id.toString(),
      email: document.email,
      name: document.name,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  private async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ email: 1 }, { unique: true });
  }
}
