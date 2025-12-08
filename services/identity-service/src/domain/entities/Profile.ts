/**
 * Profile Domain Entity (Identity Service)
 * Stores demographic and extended profile attributes
 */
export interface Profile {
  id: string;
  userId: string; // Reference to user from Onboarding Service
  age?: number;
  location?: string;
  attributes: Record<string, any>; // Extensible profile attributes
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileRequest {
  userId: string;
  age?: number;
  location?: string;
  attributes?: Record<string, any>;
}

export interface UpdateProfileRequest {
  age?: number;
  location?: string;
  attributes?: Record<string, any>;
}
