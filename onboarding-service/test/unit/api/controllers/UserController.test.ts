/**
 * UserController Unit Tests
 * Tests HTTP request handling with mocked UserService
 */
import { UserController } from '../../../../src/api/controllers/UserController';
import { UserService } from '../../../../src/application/services/UserService';
import { User } from '../../../../src/domain/entities/User';
import { Request, Response } from 'express';

describe('UserController', () => {
  let controller: UserController;
  let mockService: jest.Mocked<UserService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Mock UserService
    mockService = {
      createUser: jest.fn(),
      getUserById: jest.fn()
    } as any;

    // Create controller
    controller = new UserController(mockService);

    // Mock Express Request
    mockReq = {
      body: {},
      params: {}
    };

    // Mock Express Response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createUser', () => {
    const validUser: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create user successfully with 201 status', async () => {
      mockReq.body = { email: 'test@example.com', name: 'Test User' };
      mockService.createUser.mockResolvedValue(validUser);

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: validUser.id,
        email: validUser.email,
        name: validUser.name,
        createdAt: validUser.createdAt,
        updatedAt: validUser.updatedAt
      });
    });

    it('should return 400 for missing email', async () => {
      mockReq.body = { name: 'Test User' };

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Email and name are required'
      });
      expect(mockService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for missing name', async () => {
      mockReq.body = { email: 'test@example.com' };

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Email and name are required'
      });
      expect(mockService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      mockReq.body = { email: 'invalid', name: 'Test User' };
      mockService.createUser.mockRejectedValue(new Error('Invalid email format'));

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    });

    it('should return 409 for duplicate email', async () => {
      mockReq.body = { email: 'test@example.com', name: 'Test User' };
      mockService.createUser.mockRejectedValue(new Error('User with this email already exists'));

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockReq.body = { email: 'test@example.com', name: 'Test User' };
      mockService.createUser.mockRejectedValue(new Error('Database connection failed'));

      await controller.createUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  });

  describe('getUserById', () => {
    const existingUser: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user with 200 status', async () => {
      mockReq.params = { id: '123' };
      mockService.getUserById.mockResolvedValue(existingUser);

      await controller.getUserById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt
      });
      expect(mockService.getUserById).toHaveBeenCalledWith('123');
    });

    it('should return 400 for missing id', async () => {
      mockReq.params = {};

      await controller.getUserById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'User ID is required'
      });
      expect(mockService.getUserById).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockReq.params = { id: '999' };
      mockService.getUserById.mockRejectedValue(new Error('User not found'));

      await controller.getUserById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'User not found'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockReq.params = { id: '123' };
      mockService.getUserById.mockRejectedValue(new Error('Database error'));

      await controller.getUserById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  });
});
