/**
 * ProfileService Unit Tests
 * Tests business logic for profile management
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

  describe('createProfile', () => {
    it('should create a profile with valid data', async () => {
      const request = {
        userId: 'user123',
        age: 25,
        location: 'New York'
      };

      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        location: 'New York',
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockProfile);

      const result = await profileService.createProfile(request);

      expect(result).toEqual(mockProfile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123');
      expect(mockRepository.create).toHaveBeenCalledWith(request);
    });

    it('should throw error when userId is missing', async () => {
      const request = {
        userId: '',
        age: 25
      };

      await expect(profileService.createProfile(request))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error when profile already exists for user', async () => {
      const request = {
        userId: 'user123',
        age: 25
      };

      const existingProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 30,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findByUserId.mockResolvedValue(existingProfile);

      await expect(profileService.createProfile(request))
        .rejects.toThrow('Profile already exists for this user');
    });

    it('should throw error when age is negative', async () => {
      const request = {
        userId: 'user123',
        age: -5
      };

      mockRepository.findByUserId.mockResolvedValue(null);

      await expect(profileService.createProfile(request))
        .rejects.toThrow('Age must be between 0 and 150');
    });

    it('should throw error when age is above 150', async () => {
      const request = {
        userId: 'user123',
        age: 200
      };

      mockRepository.findByUserId.mockResolvedValue(null);

      await expect(profileService.createProfile(request))
        .rejects.toThrow('Age must be between 0 and 150');
    });

    it('should accept age of 0', async () => {
      const request = {
        userId: 'user123',
        age: 0
      };

      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 0,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockProfile);

      const result = await profileService.createProfile(request);

      expect(result.age).toBe(0);
    });

    it('should accept age of 150', async () => {
      const request = {
        userId: 'user123',
        age: 150
      };

      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 150,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockProfile);

      const result = await profileService.createProfile(request);

      expect(result.age).toBe(150);
    });
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

  describe('updateProfile', () => {
    it('should update profile with valid data', async () => {
      const existingProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedProfile: Profile = {
        ...existingProfile,
        age: 30,
        location: 'San Francisco'
      };

      mockRepository.findById.mockResolvedValue(existingProfile);
      mockRepository.update.mockResolvedValue(updatedProfile);

      const result = await profileService.updateProfile('profile123', {
        age: 30,
        location: 'San Francisco'
      });

      expect(result).toEqual(updatedProfile);
      expect(mockRepository.update).toHaveBeenCalledWith('profile123', {
        age: 30,
        location: 'San Francisco'
      });
    });

    it('should throw error when profile not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(profileService.updateProfile('nonexistent', { age: 30 }))
        .rejects.toThrow('Profile not found');
    });

    it('should throw error when update age is invalid', async () => {
      const existingProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findById.mockResolvedValue(existingProfile);

      await expect(profileService.updateProfile('profile123', { age: 200 }))
        .rejects.toThrow('Age must be between 0 and 150');
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile when found', async () => {
      const mockProfile: Profile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findById.mockResolvedValue(mockProfile);
      mockRepository.delete.mockResolvedValue(undefined);

      await profileService.deleteProfile('profile123');

      expect(mockRepository.delete).toHaveBeenCalledWith('profile123');
    });

    it('should throw error when profile not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(profileService.deleteProfile('nonexistent'))
        .rejects.toThrow('Profile not found');
    });
  });
});
