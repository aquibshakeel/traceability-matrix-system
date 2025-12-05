/**
 * Profile Service (Application Layer)
 * Orchestrates profile management use cases
 */
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Create a new profile
   * @param request Profile creation data
   * @returns Created profile
   * @throws Error if profile for user already exists
   */
  async createProfile(request: CreateProfileRequest): Promise<Profile> {
    // Validate user ID is provided
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Check if profile already exists for this user
    const existingProfile = await this.profileRepository.findByUserId(request.userId);
    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }

    // Validate age if provided
    if (request.age !== undefined && request.age !== null) {
      if (request.age < 0 || request.age > 150) {
        throw new Error('Age must be between 0 and 150');
      }
    }

    // Create profile
    const profile = await this.profileRepository.create(request);
    return profile;
  }

  /**
   * Get profile by ID
   * @param id Profile ID
   * @returns Profile if found
   * @throws Error if profile not found
   */
  async getProfileById(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findById(id);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  /**
   * Get profile by user ID
   * @param userId User ID from Onboarding Service
   * @returns Profile if found
   * @throws Error if profile not found
   */
  async getProfileByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new Error('Profile not found for user');
    }

    return profile;
  }

  /**
   * Update profile
   * @param id Profile ID
   * @param request Update data
   * @returns Updated profile
   * @throws Error if profile not found or validation fails
   */
  async updateProfile(id: string, request: UpdateProfileRequest): Promise<Profile> {
    // Validate profile exists
    const existingProfile = await this.profileRepository.findById(id);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Validate age if provided
    if (request.age !== undefined && request.age !== null) {
      if (request.age < 0 || request.age > 150) {
        throw new Error('Age must be between 0 and 150');
      }
    }

    // Update profile
    const updatedProfile = await this.profileRepository.update(id, request);
    return updatedProfile;
  }

  /**
   * Delete profile
   * @param id Profile ID
   * @throws Error if profile not found
   */
  async deleteProfile(id: string): Promise<void> {
    // Validate profile exists
    const existingProfile = await this.profileRepository.findById(id);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    await this.profileRepository.delete(id);
  }
}
