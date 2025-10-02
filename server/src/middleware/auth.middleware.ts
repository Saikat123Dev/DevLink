import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { hashToken } from '../utils/jwt.util';
import { REDIS_KEYS, redisHelpers } from '../utils/redis';

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

    // Check if token is blacklisted (logout)
    const tokenHash = hashToken(token);
    const blacklistKey = `${REDIS_KEYS.TOKEN_BLACKLIST}${tokenHash}`;
    const isBlacklisted = await redisHelpers.exists(blacklistKey);

    if (isBlacklisted) {
      res.status(401).json({
        error: {
          message: 'Token has been revoked',
          status: 401
        }
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Try to get user from Redis cache first (SUPER FAST)
    const userCacheKey = `${REDIS_KEYS.USER_DATA}${decoded.userId}`;
    let user = await redisHelpers.get<{
      id: string;
      email: string;
      name: string;
      avatar?: string;
    }>(userCacheKey);

    // If not in cache, fetch from database and cache it
    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        }
      });

      if (!dbUser) {
        res.status(401).json({
          error: {
            message: 'User not found',
            status: 401
          }
        });
        return;
      }

      // Cache user data for future requests (1 hour TTL)
      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar || undefined,
      };

      await redisHelpers.setWithExpiry(userCacheKey, user, 60 * 60); // 1 hour
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

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
