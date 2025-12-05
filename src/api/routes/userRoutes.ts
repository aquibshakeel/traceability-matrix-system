/**
 * User Routes
 * Defines HTTP routes for user operations
 */
import { Router } from 'express';
import { UserController } from '../controllers/UserController';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // POST /user - Create a new user
  router.post('/user', userController.createUser);

  // GET /user/:id - Get user by ID
  router.get('/user/:id', userController.getUserById);

  return router;
}
