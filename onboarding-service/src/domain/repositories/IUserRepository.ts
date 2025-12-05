/**
 * User Repository Interface (Port)
 * Defines the contract for user persistence operations
 */
import { User, CreateUserRequest } from '../entities/User';

export interface IUserRepository {
  /**
   * Create a new user
   * @param request User creation data
   * @returns Created user with generated ID
   */
  create(request: CreateUserRequest): Promise<User>;

  /**
   * Find a user by ID
   * @param id User ID
   * @returns User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email
   * @param email User email
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;
}
