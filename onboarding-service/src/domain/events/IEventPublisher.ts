/**
 * Event Publisher Interface (Port)
 * Defines the contract for publishing domain events
 */
import { OnboardingEvent } from '../entities/User';

export interface IEventPublisher {
  /**
   * Publish an onboarding event
   * @param event The onboarding event to publish
   */
  publishOnboardingEvent(event: OnboardingEvent): Promise<void>;
}
