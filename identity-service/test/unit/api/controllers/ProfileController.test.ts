/**
 * ProfileController Unit Tests
 * Tests HTTP layer and request/response handling
 */

import { ProfileController } from '../../../../src/api/controllers/ProfileController';
import { ProfileService } from '../../../../src/application/services/ProfileService';
import { Request, Response } from 'express';

describe('ProfileController', () => {
  let controller: ProfileController;
  let mockService: jest.Mocked<ProfileService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      createProfile: jest.fn(),
      getProfileById: jest.fn(),
      getProfileByUserId: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
    } as any;

    controller = new ProfileController(mockService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('createProfile', () => {
    it('should return 201 when profile created successfully', async () => {
      mockReq = {
        body: { userId: 'user123', age: 25 }
      };

      const mockProfile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.createProfile.mockResolvedValue(mockProfile);

      await controller.createProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should return 400 for validation errors', async () => {
      mockReq = { body: { userId: '', age: 25 } };

      mockService.createProfile.mockRejectedValue(
        new Error('User ID is required')
      );

      await controller.createProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User ID is required'
      });
    });

    it('should return 409 for duplicate profile', async () => {
      mockReq = { body: { userId: 'user123', age: 25 } };

      mockService.createProfile.mockRejectedValue(
        new Error('Profile already exists for this user')
      );

      await controller.createProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 for unexpected errors', async () => {
      mockReq = { body: { userId: 'user123', age: 25 } };

      mockService.createProfile.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.createProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProfileById', () => {
    it('should return 200 with profile when found', async () => {
      mockReq = { params: { id: 'profile123' } };

      const mockProfile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.getProfileById.mockResolvedValue(mockProfile);

      await controller.getProfileById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should return 404 when profile not found', async () => {
      mockReq = { params: { id: 'nonexistent' } };

      mockService.getProfileById.mockRejectedValue(
        new Error('Profile not found')
      );

      await controller.getProfileById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getProfileByUserId', () => {
    it('should return 200 with profile when found', async () => {
      mockReq = { params: { userId: 'user123' } };

      const mockProfile = {
        id: 'profile123',
        userId: 'user123',
        age: 25,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.getProfileByUserId.mockResolvedValue(mockProfile);

      await controller.getProfileByUserId(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should return 404 when user has no profile', async () => {
      mockReq = { params: { userId: 'user999' } };

      mockService.getProfileByUserId.mockRejectedValue(
        new Error('Profile not found for user')
      );

      await controller.getProfileByUserId(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should return 200 when profile updated', async () => {
      mockReq = {
        params: { id: 'profile123' },
        body: { age: 30 }
      };

      const updatedProfile = {
        id: 'profile123',
        userId: 'user123',
        age: 30,
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.updateProfile.mockResolvedValue(updatedProfile);

      await controller.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedProfile);
    });

    it('should return 404 when profile not found', async () => {
      mockReq = {
        params: { id: 'nonexistent' },
        body: { age: 30 }
      };

      mockService.updateProfile.mockRejectedValue(
        new Error('Profile not found')
      );

      await controller.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid age', async () => {
      mockReq = {
        params: { id: 'profile123' },
        body: { age: 200 }
      };

      mockService.updateProfile.mockRejectedValue(
        new Error('Age must be between 0 and 150')
      );

      await controller.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteProfile', () => {
    it('should return 204 when profile deleted', async () => {
      mockReq = { params: { id: 'profile123' } };

      mockService.deleteProfile.mockResolvedValue(undefined);

      await controller.deleteProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 when profile not found', async () => {
      mockReq = { params: { id: 'nonexistent' } };

      mockService.deleteProfile.mockRejectedValue(
        new Error('Profile not found')
      );

      await controller.deleteProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
