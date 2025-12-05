/**
 * ProfileService Unit Tests
 * Tests business logic for profile management
 * Identity Service: Read-only operations (GET only)
 */

import { ProfileService } from '../../../../src/application/services/ProfileService';
import { IProfileRepository } from '../../../../src/domain/repositories/IProfileRepository';
import { Profile } from '../../../../src/domain/entities/Profile';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockRepository: jest.Mocked<IProfileRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      ensureIndexes: jest.fn(),
    };

    profileService = new ProfileService(mockRepository);
  });

  describe('getProfileById', () => {
    it('should return profile when found', async () => {
      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findById.mockResolvedValue(mockProfile);

      const result = await profileService.getProfileById('profile123');

      expect(result).toEqual(mockProfile);
      expect(mockRepository.findById).toHaveBeenCalledWith('profile123');
    });

    it('should throw error when profile not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(profileService.getProfileById('nonexistent'))
        .rejects.toThrow('Profile not found');
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile when found', async () => {
      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findByUserId.mockResolvedValue(mockProfile);

      const result = await profileService.getProfileByUserId('user123');

      expect(result).toEqual(mockProfile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123');
    });

    it('should throw error when profile not found for user', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      await expect(profileService.getProfileByUserId('nonexistent'))
        .rejects.toThrow('Profile not found for user');
    });
  });
});
