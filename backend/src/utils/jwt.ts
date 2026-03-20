import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'access-secret-placeholder';
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-placeholder';
const accessExpirySeconds = 15 * 60; // 15m
const refreshExpirySeconds = 7 * 24 * 60 * 60; // 7d

export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' as const },
    accessSecret,
    { expiresIn: accessExpirySeconds }
  );
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' as const },
    refreshSecret,
    { expiresIn: refreshExpirySeconds }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, accessSecret) as JwtPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, refreshSecret) as JwtPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}
