/**
 * ProfileController Unit Tests
 * Tests HTTP layer and request/response handling
 * Identity Service: Read-only operations (GET only)
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
      getProfileById: jest.fn(),
      getProfileByUserId: jest.fn(),
    } as any;

    controller = new ProfileController(mockService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
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

    it('should return 400 for missing profile ID', async () => {
      mockReq = { params: { id: '' } };

      await controller.getProfileById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Profile ID is required'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockReq = { params: { id: 'profile123' } };

      mockService.getProfileById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.getProfileById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
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

    it('should return 400 for missing user ID', async () => {
      mockReq = { params: { userId: '' } };

      await controller.getProfileByUserId(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User ID is required'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockReq = { params: { userId: 'user123' } };

      mockService.getProfileByUserId.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.getProfileByUserId(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
