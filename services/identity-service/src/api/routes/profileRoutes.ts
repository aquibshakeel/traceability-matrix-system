/**
 * Profile Routes
 * Defines HTTP routes for profile endpoints
 */
import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';

export function createProfileRoutes(profileController: ProfileController): Router {
  const router = Router();

  // GET endpoints only - identity service is read-only
  router.get('/profile/:id', profileController.getProfileById);
  router.get('/profile/user/:userId', profileController.getProfileByUserId);

  return router;
}
