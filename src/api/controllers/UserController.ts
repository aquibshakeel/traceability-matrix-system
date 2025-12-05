/**
 * User Controller (API Layer)
 * Handles HTTP requests for user operations
 */
import { Request, Response } from 'express';
import { UserService } from '../../application/services/UserService';
import { CreateUserRequest } from '../../domain/entities/User';

export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /user - Create a new user
   */
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CreateUserRequest = {
        email: req.body.email,
        name: req.body.name
      };

      // Validate required fields
      if (!request.email || !request.name) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email and name are required'
        });
        return;
      }

      const user = await this.userService.createUser(request);

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid email')) {
          res.status(400).json({
            error: 'Bad Request',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  };

  /**
   * GET /user/:id - Get user by ID
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'User ID is required'
        });
        return;
      }

      const user = await this.userService.getUserById(id);

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  };
}
