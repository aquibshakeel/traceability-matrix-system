/**
 * User Service (Application Layer)
 * Orchestrates user onboarding use cases
 */
import { User, CreateUserRequest, OnboardingEvent } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IEventPublisher } from '../../domain/events/IEventPublisher';

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Create and onboard a new user
   * @param request User creation data
   * @returns Created user
   * @throws Error if user with email already exists
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    // Validate email format
    if (!this.isValidEmail(request.email)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.create(request);

    // Publish onboarding event with demographic data
    const event: OnboardingEvent = {
      userId: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      location: user.location,
      status: 'onboarded',
      timestamp: new Date()
    };

    await this.eventPublisher.publishOnboardingEvent(event);

    return user;
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User if found
   * @throws Error if user not found
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Validate email format
   * @param email Email to validate
   * @returns true if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
