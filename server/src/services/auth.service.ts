import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateRefreshToken, generateToken } from '../utils/jwt.util';

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

    return {
      user,
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

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    };
  }

  async getUserById(userId: string) {
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

    return user;
  }
}
