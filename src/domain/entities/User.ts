/**
 * User Domain Entity
 * Represents the core user model with validation rules
 */
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number; // Optional for backward compatibility
  location?: string; // Optional for backward compatibility
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  age?: number; // Optional demographic data
  location?: string; // Optional demographic data
}

export interface OnboardingEvent {
  userId: string;
  email: string;
  name: string;
  age?: number;
  location?: string;
  status: 'onboarded';
  timestamp: Date;
}

/**
 * Demographic data for Identity Service
 */
export interface DemographicData {
  userId: string;
  age?: number;
  location?: string;
}
