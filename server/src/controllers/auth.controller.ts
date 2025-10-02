import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuthService, LoginInput, RegisterInput } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password }: RegisterInput = req.body;

      const result = await authService.register({ name, email, password });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists with this email') {
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

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginInput = req.body;

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        message: 'Login successful'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid email or password') {
        res.status(401).json({
          error: {
            message: error.message,
            status: 401
          }
        });
        return;
      }
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // In a more complex implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for refresh token logic
      // For now, just return a placeholder
      res.status(501).json({
        error: {
          message: 'Refresh token not implemented yet',
          status: 501
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
