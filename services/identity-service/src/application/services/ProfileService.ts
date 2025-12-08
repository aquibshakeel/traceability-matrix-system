/**
 * Profile Service (Application Layer)
 * Orchestrates profile management use cases
 * Identity Service: Read-only operations (GET only)
 */
import { Profile } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

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
}
