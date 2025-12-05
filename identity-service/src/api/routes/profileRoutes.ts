/**
 * Profile Routes
 * Defines HTTP routes for profile endpoints
 */
import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';

export function createProfileRoutes(profileController: ProfileController): Router {
  const router = Router();

  router.post('/profile', profileController.createProfile);
  router.get('/profile/:id', profileController.getProfileById);
  router.get('/profile/user/:userId', profileController.getProfileByUserId);
  router.put('/profile/:id', profileController.updateProfile);
  router.delete('/profile/:id', profileController.deleteProfile);

  return router;
}
