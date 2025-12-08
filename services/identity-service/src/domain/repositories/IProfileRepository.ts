/**
 * Profile Repository Interface (Port)
 * Defines contract for profile data persistence
 */
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '../entities/Profile';

export interface IProfileRepository {
  /**
   * Create a new profile
   */
  create(request: CreateProfileRequest): Promise<Profile>;

  /**
   * Find profile by ID
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Find profile by user ID
   */
  findByUserId(userId: string): Promise<Profile | null>;

  /**
   * Update profile
   */
  update(id: string, request: UpdateProfileRequest): Promise<Profile>;

  /**
   * Delete profile
   */
  delete(id: string): Promise<void>;

  /**
   * Ensure database indexes are created
   */
  ensureIndexes(): Promise<void>;
}
