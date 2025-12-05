/**
 * UserService Unit Tests
 * Tests business logic in isolation using mocks
 */
import { UserService } from '../../../../src/application/services/UserService';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { IEventPublisher } from '../../../../src/domain/events/IEventPublisher';
import { User, CreateUserRequest } from '../../../../src/domain/entities/User';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn()
    };

    // Create mock event publisher
    mockPublisher = {
      publishOnboardingEvent: jest.fn()
    };

    // Create service with mocks
    userService = new UserService(mockRepository, mockPublisher);
  });

  describe('createUser', () => {
    const validRequest: CreateUserRequest = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const createdUser: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a user successfully', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);
      mockPublisher.publishOnboardingEvent.mockResolvedValue();

      const result = await userService.createUser(validRequest);

      expect(result).toEqual(createdUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(mockRepository.create).toHaveBeenCalledWith(validRequest);
    });

    it('should publish onboarding event after creating user', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);
      mockPublisher.publishOnboardingEvent.mockResolvedValue();

      await userService.createUser(validRequest);

      expect(mockPublisher.publishOnboardingEvent).toHaveBeenCalledWith({
        userId: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        status: 'onboarded',
        timestamp: expect.any(Date)
      });
    });

    it('should throw error if email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(createdUser);

      await expect(userService.createUser(validRequest))
        .rejects
        .toThrow('User with this email already exists');

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockPublisher.publishOnboardingEvent).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      const invalidRequest: CreateUserRequest = {
        email: 'notanemail',
        name: 'Test User'
      };

      await expect(userService.createUser(invalidRequest))
        .rejects
        .toThrow('Invalid email format');

      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should validate email format correctly', async () => {
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'missing@',
        'spaces in@email.com',
        'double@@domain.com'
      ];

      for (const email of invalidEmails) {
        await expect(userService.createUser({ email, name: 'Test' }))
          .rejects
          .toThrow('Invalid email format');
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'test123@test-domain.com'
      ];

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);
      mockPublisher.publishOnboardingEvent.mockResolvedValue();

      for (const email of validEmails) {
        await userService.createUser({ email, name: 'Test' });
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(validEmails.length);
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

    it('should return user when found', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);

      const result = await userService.getUserById('123');

      expect(result).toEqual(existingUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw error when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('999'))
        .rejects
        .toThrow('User not found');

      expect(mockRepository.findById).toHaveBeenCalledWith('999');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserById('123'))
        .rejects
        .toThrow('Database error');
    });
  });
});
