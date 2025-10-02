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

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({
          error: {
            message: 'Access token required',
            status: 401
          }
        });
        return;
      }

      const userId = req.user!.id;

      // Blacklist token and clear session
      await authService.logout(userId, token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          error: {
            message: 'Refresh token is required',
            status: 400
          }
        });
        return;
      }

      const result = await authService.refreshAccessToken(refreshToken);

      if (!result) {
        res.status(401).json({
          error: {
            message: 'Invalid or expired refresh token',
            status: 401
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          refreshToken: result.refreshToken,
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // Clear all user sessions
      await authService.clearAllUserSessions(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
