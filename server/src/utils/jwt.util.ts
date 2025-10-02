import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
}

// Token expiry times in seconds
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 7 * 24 * 60 * 60, // 7 days
  REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );
};

// Hash token for storage (for blacklist and refresh token tracking)
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Decode token without verification (for getting expiry time)
export const decodeToken = (token: string): jwt.JwtPayload | null => {
  return jwt.decode(token) as jwt.JwtPayload | null;
};
