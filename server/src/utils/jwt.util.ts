import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
}

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
