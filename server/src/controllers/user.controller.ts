import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: { user },
        message: 'User retrieved successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          error: {
            message: error.message,
            status: 404
          }
        });
        return;
      }
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;

      // Users can only update their own profile
      if (userId !== currentUserId) {
        res.status(403).json({
          error: {
            message: 'You can only update your own profile',
            status: 403
          }
        });
        return;
      }

      const user = await userService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async addSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;

      // Users can only add skills to their own profile
      if (userId !== currentUserId) {
        res.status(403).json({
          error: {
            message: 'You can only add skills to your own profile',
            status: 403
          }
        });
        return;
      }

      const skill = await userService.addSkill(userId, req.body);

      res.status(201).json({
        success: true,
        data: { skill },
        message: 'Skill added successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'You already have this skill') {
        res.status(409).json({
          error: {
            message: error.message,
            status: 409
          }
        });
        return;
      }
      next(error);
    }
  }

  async removeSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, skillId } = req.params;
      const currentUserId = req.user!.id;

      // Users can only remove skills from their own profile
      if (userId !== currentUserId) {
        res.status(403).json({
          error: {
            message: 'You can only remove skills from your own profile',
            status: 403
          }
        });
        return;
      }

      const result = await userService.removeSkill(userId, skillId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Skill removed successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Skill not found') {
        res.status(404).json({
          error: {
            message: error.message,
            status: 404
          }
        });
        return;
      }
      next(error);
    }
  }

  async getUserPosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const posts = await userService.getUserPosts(userId);

      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query } = req.query;
      const currentUserId = req.user?.id;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: {
            message: 'Search query is required',
            status: 400
          }
        });
        return;
      }

      const users = await userService.searchUsers(query, currentUserId);

      res.status(200).json({
        success: true,
        data: { users },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
