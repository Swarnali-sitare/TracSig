import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as authService from '../services/authService';
import type { SignupBody, LoginBody } from '../types';

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refreshToken';
const REFRESH_COOKIE_HTTP_ONLY = process.env.REFRESH_COOKIE_HTTP_ONLY !== 'false';
const REFRESH_COOKIE_SECURE = process.env.REFRESH_COOKIE_SECURE === 'true';
const REFRESH_COOKIE_SAME_SITE = (process.env.REFRESH_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax';
const REFRESH_COOKIE_MAX_AGE_DAYS = parseInt(process.env.REFRESH_COOKIE_MAX_AGE_DAYS ?? '7', 10);
const COOKIE_MAX_AGE_MS = REFRESH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: REFRESH_COOKIE_HTTP_ONLY,
    secure: REFRESH_COOKIE_SECURE,
    sameSite: REFRESH_COOKIE_SAME_SITE,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/', httpOnly: true });
}

export async function signup(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as SignupBody;
    const user = await authService.signupUser(body);
    res.status(201).json({ message: 'Signup successful', user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const status = e.statusCode ?? 500;
    res.status(status).json({ message: e.message ?? 'Signup failed' });
  }
}

export async function login(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as LoginBody;
    const { accessToken, refreshToken, user } = await authService.loginUser(body);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const status = e.statusCode ?? 500;
    res.status(status).json({ message: e.message ?? 'Login failed' });
  }
}

export async function logout(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  clearRefreshCookie(res);
  res.status(200).json({ message: 'Logged out' });
}

export async function refresh(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }
    const { accessToken, user } = authService.refreshAccessToken(token);
    res.status(200).json({ accessToken, user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(401).json({ message: e.message ?? 'Refresh failed' });
  }
}

export async function me(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = authService.getMe(req.user.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.status(200).json({ user });
}
