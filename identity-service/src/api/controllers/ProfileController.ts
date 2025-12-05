/**
 * Profile Controller (API Layer)
 * Handles HTTP requests for profile endpoints
 */
import { Request, Response } from 'express';
import { ProfileService } from '../../application/services/ProfileService';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Create profile
   * POST /api/profile
   */
  createProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, age, location, attributes } = req.body;

      // Validate required fields
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const profile = await this.profileService.createProfile({
        userId,
        age,
        location,
        attributes
      });

      res.status(201).json(profile);
    } catch (error: any) {
      if (error.message === 'Profile already exists for this user') {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('Age must be')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  /**
   * Get profile by ID
   * GET /api/profile/:id
   */
  getProfileById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Profile ID is required' });
        return;
      }

      const profile = await this.profileService.getProfileById(id);
      res.status(200).json(profile);
    } catch (error: any) {
      if (error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  /**
   * Get profile by user ID
   * GET /api/profile/user/:userId
   */
  getProfileByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const profile = await this.profileService.getProfileByUserId(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      if (error.message === 'Profile not found for user') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  /**
   * Update profile
   * PUT /api/profile/:id
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { age, location, attributes } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Profile ID is required' });
        return;
      }

      const profile = await this.profileService.updateProfile(id, {
        age,
        location,
        attributes
      });

      res.status(200).json(profile);
    } catch (error: any) {
      if (error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Age must be')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  /**
   * Delete profile
   * DELETE /api/profile/:id
   */
  deleteProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Profile ID is required' });
        return;
      }

      await this.profileService.deleteProfile(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}
