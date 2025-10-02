import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: {
          message: 'User not found',
          status: 401
        }
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          message: 'Token expired',
          status: 401
        }
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          message: 'Invalid token',
          status: 401
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
};

export { AuthenticatedRequest };
