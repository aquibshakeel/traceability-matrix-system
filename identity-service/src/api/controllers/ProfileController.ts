/**
 * Profile Controller (API Layer)
 * Handles HTTP requests for profile endpoints
 * Identity Service: Read-only operations (GET only)
 */
import { Request, Response } from 'express';
import { ProfileService } from '../../application/services/ProfileService';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
}
