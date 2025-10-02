import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { decodeToken, generateRefreshToken, generateToken, hashToken } from '../utils/jwt.util';
import { REDIS_KEYS, redisHelpers, TTL } from '../utils/redis';

const prisma = new PrismaClient();

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    });

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Cache user data in Redis for fast access
    await this.cacheUserData(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
    });

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    // Store user session
    await this.createUserSession(user.id, token);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || undefined,
      },
      token,
      refreshToken,
    };
  }

  async login(data: LoginInput): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Cache user data in Redis for fast access
    await this.cacheUserData(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
    });

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    // Store user session
    await this.createUserSession(user.id, token);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || undefined,
      },
      token,
      refreshToken,
    };
  }

  async getUserById(userId: string) {
    // Try to get from cache first
    const cachedUser = await this.getCachedUserData(userId);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        role: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        createdAt: true,
        updatedAt: true,
        skills: {
          select: {
            id: true,
            name: true,
            level: true,
          }
        },
        _count: {
          select: {
            posts: true,
            ownedProjects: true,
            sentConnections: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Cache the full user profile
    await this.cacheUserProfile(userId, user);

    return user;
  }

  // Get basic user data from cache (used in auth middleware)
  async getCachedUserData(userId: string) {
    const cacheKey = `${REDIS_KEYS.USER_DATA}${userId}`;
    return await redisHelpers.get<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }>(cacheKey);
  }

  // Cache basic user data for fast authentication
  async cacheUserData(userId: string, userData: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }) {
    const cacheKey = `${REDIS_KEYS.USER_DATA}${userId}`;
    await redisHelpers.setWithExpiry(cacheKey, userData, TTL.USER_DATA);
  }

  // Cache full user profile
  async cacheUserProfile(userId: string, userData: any) {
    const cacheKey = `${REDIS_KEYS.USER_CACHE}${userId}`;
    await redisHelpers.setWithExpiry(cacheKey, userData, TTL.USER_CACHE);
  }

  // Store user session with token
  async createUserSession(userId: string, token: string) {
    const sessionKey = `${REDIS_KEYS.USER_SESSION}${userId}`;
    const tokenHash = hashToken(token);

    await redisHelpers.setWithExpiry(
      sessionKey,
      { tokenHash, createdAt: new Date().toISOString() },
      TTL.USER_SESSION
    );
  }

  // Store refresh token
  async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const refreshKey = `${REDIS_KEYS.REFRESH_TOKEN}${tokenHash}`;

    await redisHelpers.setWithExpiry(
      refreshKey,
      { userId, createdAt: new Date().toISOString() },
      TTL.REFRESH_TOKEN
    );
  }

  // Verify refresh token and get user ID
  async verifyRefreshToken(refreshToken: string): Promise<string | null> {
    const tokenHash = hashToken(refreshToken);
    const refreshKey = `${REDIS_KEYS.REFRESH_TOKEN}${tokenHash}`;

    const data = await redisHelpers.get<{ userId: string }>(refreshKey);
    return data?.userId || null;
  }

  // Invalidate refresh token
  async invalidateRefreshToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const refreshKey = `${REDIS_KEYS.REFRESH_TOKEN}${tokenHash}`;
    await redisHelpers.delete(refreshKey);
  }

  // Logout: blacklist token and clear session
  async logout(userId: string, token: string) {
    const tokenHash = hashToken(token);
    const blacklistKey = `${REDIS_KEYS.TOKEN_BLACKLIST}${tokenHash}`;
    const sessionKey = `${REDIS_KEYS.USER_SESSION}${userId}`;

    // Get token expiry to set appropriate TTL for blacklist
    const decoded = decodeToken(token);
    const expiryTime = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : TTL.TOKEN_BLACKLIST;

    // Blacklist the token
    await redisHelpers.setWithExpiry(blacklistKey, { userId, loggedOutAt: new Date().toISOString() }, Math.max(expiryTime, 0));

    // Clear user session
    await redisHelpers.delete(sessionKey);
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    const blacklistKey = `${REDIS_KEYS.TOKEN_BLACKLIST}${tokenHash}`;
    return await redisHelpers.exists(blacklistKey);
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string } | null> {
    const userId = await this.verifyRefreshToken(refreshToken);

    if (!userId) {
      return null;
    }

    // Get user data (from cache or DB)
    const userData = await this.getCachedUserData(userId);
    let email: string;

    if (!userData) {
      // Fetch from database if not in cache
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, avatar: true }
      });

      if (!user) {
        return null;
      }

      email = user.email;

      // Cache for future use
      await this.cacheUserData(userId, {
        id: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar || undefined,
      });
    } else {
      email = userData.email;
    }

    // Generate new tokens
    const tokenPayload = { userId, email };
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Invalidate old refresh token
    await this.invalidateRefreshToken(refreshToken);

    // Store new refresh token
    await this.storeRefreshToken(userId, newRefreshToken);

    // Update user session
    await this.createUserSession(userId, newToken);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  // Clear all user sessions (useful for logout from all devices)
  async clearAllUserSessions(userId: string) {
    const sessionKey = `${REDIS_KEYS.USER_SESSION}${userId}`;
    const cacheKey = `${REDIS_KEYS.USER_DATA}${userId}`;
    const profileKey = `${REDIS_KEYS.USER_CACHE}${userId}`;

    await redisHelpers.delete(sessionKey, cacheKey, profileKey);
  }
}
