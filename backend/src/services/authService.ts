import bcrypt from 'bcrypt';
import { findUserByEmail, findUserById, createUser } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateId } from '../utils/id';
import type { User, UserRole, AuthTokens, SignupBody, LoginBody } from '../types';

const VALID_ROLES: UserRole[] = ['Teacher', 'Student', 'Admin'];

function validateSignupBody(body: SignupBody): void {
  if (!body.name?.trim()) throw Object.assign(new Error('Name is required'), { statusCode: 400 });
  if (!body.email?.trim()) throw Object.assign(new Error('Email is required'), { statusCode: 400 });
  if (!body.password) throw Object.assign(new Error('Password is required'), { statusCode: 400 });
  if (body.password.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });
  if (!VALID_ROLES.includes(body.role)) throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
}

const SALT_ROUNDS = 10;

function toUser(model: { id: string; name: string; email: string; role: UserRole; createdAt: Date }): User {
  return {
    id: model.id,
    name: model.name,
    email: model.email,
    role: model.role,
    createdAt: model.createdAt,
  };
}

export async function signupUser(body: SignupBody): Promise<User> {
  validateSignupBody(body);
  const existing = findUserByEmail(body.email);
  if (existing) {
    const error = new Error('Email already registered');
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }
  const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
  const id = generateId();
  const user = createUser(id, body.name, body.email, passwordHash, body.role);
  return toUser(user);
}

export interface LoginResult extends AuthTokens {
  refreshToken: string;
}

export async function loginUser(body: LoginBody): Promise<LoginResult> {
  const user = findUserByEmail(body.email);
  if (!user) {
    const error = new Error('Invalid email or password');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid email or password');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  return {
    accessToken,
    refreshToken,
    user: toUser(user),
  };
}

export function getMe(userId: string): User | null {
  const user = findUserById(userId);
  return user ? toUser(user) : null;
}

export function refreshAccessToken(refreshToken: string): { accessToken: string; user: User } {
  const payload = verifyRefreshToken(refreshToken);
  const user = findUserById(payload.userId);
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  return { accessToken, user: toUser(user) };
}
